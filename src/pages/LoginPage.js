import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, sendPasswordResetEmail, sendEmailVerification, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Box, Button, TextField, Typography, InputAdornment, IconButton, Paper, Link, Snackbar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';
import { Visibility, VisibilityOff, Google, VpnKeyRounded } from '@mui/icons-material';

const [BACKGROUND_URL, LOGO_URL, PRIMARY_COLOR, DARK_BG, CARD_BG] = ["/assets/background.png", "/assets/logo.png", "#EA7C69", "#1F1D2B", "#252836"];

// Error Mapping
const AUTH_ERRORS = {
  'auth/invalid-email': "Invalid email address format.",
  'auth/user-disabled': "This account has been disabled.",
  'auth/user-not-found': "Account not found. Please sign up.",
  'auth/wrong-password': "Incorrect password. Please try again.",
  'auth/email-already-in-use': "Email is already registered.",
  'auth/weak-password': "Password is too weak.",
  'auth/missing-password': "Please enter your password."
};

const inputStyle = {
  '& .MuiOutlinedInput-root': { borderRadius: '50px', bgcolor: 'rgba(255, 255, 255, 0.03)', color: 'white', height: '45px', transition: 'all 0.1s ease', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)', borderWidth: '1px' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.6)' }, '&.Mui-focused fieldset': { borderColor: PRIMARY_COLOR, borderWidth: '2px' } },
  '& .MuiInputBase-input': { paddingLeft: '24px', fontSize: '0.9rem', color: '#E0E0E0' }
};

const InputLabel = ({ text }) => <Typography variant="body2" sx={{ color: '#E0E6E9', mb: 0.5, ml: 2, textAlign: 'left', fontSize: '0.8rem' }}>{text}</Typography>;

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', username: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState({ pass: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  
  // Forgot Password Modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const navigate = useNavigate();
  const showToast = (msg, sev = 'error') => setToast({ open: true, message: msg, severity: sev });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAuth = async () => {
    if (!form.email.trim() || !form.password) return showToast("Please enter email and password.");
    if (!isLogin) {
        if (!form.username.trim() || form.username.length < 5 || form.username.length > 20) return showToast("Username must be 5-20 characters.");
        if (form.password.length < 8 || form.password.length > 15) return showToast("Password must be 8-15 characters.");
        if (form.password !== form.confirmPassword) return showToast("Passwords do not match.");
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { user } = await signInWithEmailAndPassword(auth, form.email, form.password);
        if (!user.emailVerified) { await signOut(auth); showToast("Please verify your email first.", "warning"); }
        else { showToast("Login successful!", "success"); setTimeout(() => navigate('/'), 1000); }
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(user, { displayName: form.username, photoURL: "" });
        await sendEmailVerification(user); await signOut(auth);
        showToast("Registration successful! Check email to verify.", "success");
        setIsLogin(true); setForm(p => ({ ...p, password: "", confirmPassword: "" }));
      }
    } catch (err) { showToast(AUTH_ERRORS[err.code] || "An unexpected error occurred.", "error"); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try { await signInWithPopup(auth, googleProvider); showToast("Google login successful!", "success"); setTimeout(() => navigate('/'), 1000); }
    catch (err) { showToast(AUTH_ERRORS[err.code] || "Error logging in.", "error"); }
    finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!resetEmail.trim()) return showToast("Enter email first.", "warning");
    try { await sendPasswordResetEmail(auth, resetEmail); setForgotOpen(false); showToast("Reset link sent!", "success"); setResetEmail(""); }
    catch (err) { showToast(AUTH_ERRORS[err.code] || "Error sending link.", "error"); }
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', bgcolor: DARK_BG, background: `linear-gradient(rgba(31, 29, 43, 0.5), rgba(31, 29, 43, 0.5)), url(${BACKGROUND_URL})`, backgroundSize: '1000px', backgroundAttachment: 'fixed', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      
      {/* Toggle Switch */}
      <Box sx={{ position: 'absolute', top: 40, right: 40, width: '280px', height: '54px', bgcolor: '#000', borderRadius: '50px', p: '5px', display: 'flex', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 8px 20px rgba(0,0,0,0.6)', zIndex: 10 }}>
        <Box sx={{ position: 'absolute', top: '5px', left: '5px', bottom: '5px', width: 'calc(50% - 5px)', borderRadius: '50px', bgcolor: PRIMARY_COLOR, transition: 'all 0.3s ease-in-out', transform: isLogin ? 'translateX(0)' : 'translateX(calc(100%))', zIndex: 1 }} />
        {['Login', 'Signup'].map((label, i) => (
            <Button key={label} disableRipple onClick={() => { setIsLogin(i === 0); setToast(p => ({...p, open: false})); }} sx={{ flex: 1, borderRadius: '50px', zIndex: 2, color: (i===0) === isLogin ? 'white' : '#B0B0B0', textTransform: 'none', fontWeight: 'bold', fontSize: '1rem', '&:hover': { bgcolor: 'transparent' } }}>{label}</Button>
        ))}
      </Box>

      {/* Form Card */}
      <Paper elevation={0} sx={{ p: 5, pt: 7, width: '90%', maxWidth: 420, bgcolor: CARD_BG, borderRadius: '24px', textAlign: 'center', color: 'white', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', position: 'relative', mt: 5 }}>
        <Box sx={{ position: 'absolute', top: -45, left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}>
          <Box sx={{ width: 90, height: 90, bgcolor: CARD_BG, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${PRIMARY_COLOR}`, boxShadow: '0 10px 20px rgba(0,0,0,0.3)', overflow: 'hidden' }}><img src={LOGO_URL} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Box>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 1, fontSize: '1.2rem' }}>{isLogin ? "Welcome Back" : "Create New Account"}</Typography>

        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {!isLogin && <Box><InputLabel text="Username:" /><TextField fullWidth placeholder="Your Name" name="username" value={form.username} onChange={handleChange} sx={inputStyle} /></Box>}
          
          <Box><InputLabel text="Email:" /><TextField fullWidth placeholder="you@mail.com" name="email" value={form.email} onChange={handleChange} sx={inputStyle} /></Box>
          
          <Box><InputLabel text="Password:" /><TextField fullWidth type={showPass.pass ? 'text' : 'password'} placeholder="Password" name="password" value={form.password} onChange={handleChange} InputProps={{ endAdornment: (<InputAdornment position="end" sx={{ mr: 0.5 }}><IconButton disableRipple onClick={() => setShowPass(p => ({...p, pass: !p.pass}))} sx={{ color: '#888' }}>{showPass.pass ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small"/>}</IconButton></InputAdornment>) }} sx={inputStyle} /></Box>

          {!isLogin && <Box><InputLabel text="Re-enter password:" /><TextField fullWidth type={showPass.confirm ? 'text' : 'password'} placeholder="Confirm Password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} InputProps={{ endAdornment: (<InputAdornment position="end" sx={{ mr: 0.5 }}><IconButton disableRipple onClick={() => setShowPass(p => ({...p, confirm: !p.confirm}))} sx={{ color: '#888' }}>{showPass.confirm ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small"/>}</IconButton></InputAdornment>) }} sx={inputStyle} /></Box>}

          {isLogin && <Box sx={{ textAlign: 'left', mt: -0.5, ml: 2 }}><Link component="button" onClick={(e) => { e.preventDefault(); setResetEmail(form.email); setForgotOpen(true); }} underline="hover" sx={{ color: '#ABBBC2', fontSize: '0.75rem', fontStyle: 'italic' }}>forgot password?</Link></Box>}

          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.8 }}>
            <Button variant="contained" fullWidth onClick={handleAuth} disabled={loading} sx={{ bgcolor: PRIMARY_COLOR, color: 'white', fontWeight: 'bold', borderRadius: '50px', textTransform: 'none', py: 1.2, fontSize: '1.05rem', '&:hover': { bgcolor: '#ff684dff' } }}>{loading ? <CircularProgress size={24} color="inherit" /> : "Confirm"}</Button>
            <Button variant="outlined" fullWidth startIcon={<Google />} onClick={handleGoogle} disabled={loading} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', borderRadius: '50px', textTransform: 'none', bgcolor: 'rgba(255,255,255,0.02)', py: 1.2, fontSize: '1rem', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}>Using Google Account</Button>
          </Box>
        </Box>
      </Paper>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(p => ({...p, open: false}))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert severity={toast.severity} sx={{ width: '100%', borderRadius: 3, fontWeight: 'bold' }}>{toast.message}</Alert></Snackbar>

      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} PaperProps={{ sx: { bgcolor: '#252836', color: 'white', borderRadius: 3, minWidth: 300, border: '1px solid rgba(255,255,255,0.1)' } }}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><VpnKeyRounded sx={{ color: PRIMARY_COLOR }} /> Reset Password</DialogTitle>
          <DialogContent>
              <DialogContentText sx={{ color: '#ABBBC2', mb: 2, fontSize: '0.9rem' }}>Enter your email address to receive a reset link.</DialogContentText>
              <TextField autoFocus label="Email Address" type="email" fullWidth variant="outlined" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: PRIMARY_COLOR } }, '& .MuiInputLabel-root': { color: '#ABBBC2' }, '& .MuiInputLabel-root.Mui-focused': { color: PRIMARY_COLOR } }} />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}><Button onClick={() => setForgotOpen(false)} sx={{ color: '#ABBBC2' }}>Cancel</Button><Button onClick={handleForgot} variant="contained" sx={{ bgcolor: PRIMARY_COLOR, fontWeight: 'bold', '&:hover': { bgcolor: '#FF8A75' } }}>Send Link</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default LoginPage;

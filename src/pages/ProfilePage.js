import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase';
import { updateProfile } from 'firebase/auth'; 
import { 
  Box, Typography, Avatar, Button, CircularProgress, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton 
} from '@mui/material';
import { Edit, CalendarMonth, CameraAlt, SaveRounded, Close } from '@mui/icons-material';
import FoodCard from '../components/FoodCard';

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api";

function ProfilePage() {
  const { uid } = useParams();
  const [currentUser, navigate] = [auth.currentUser, useNavigate()];

  // Data State
  const [data, setData] = useState({ profile: null, blogs: [], loading: true });
  const [editForm, setEditForm] = useState({ open: false, name: "", avatarUrl: "", file: null, updating: false });

  const isMyProfile = currentUser && currentUser.uid === uid;

  // Fetch User Data & Blogs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get(`${API_URL}/users/${uid}`);
        const blogRes = await axios.get(`${API_URL}/foods/author/${userRes.data.display_name}`);
        
        setData({ profile: userRes.data, blogs: blogRes.data, loading: false });
        setEditForm(prev => ({ ...prev, name: userRes.data.display_name, avatarUrl: userRes.data.photo_url }));
        
        // Update Browser Tab Title
        document.title = `${userRes.data.display_name} - Profile`; 

      } catch (error) {
        console.error("Profile Load Error:", error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchData();
  }, [uid]);

  // Handle Image Selection for Avatar
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setEditForm(prev => ({ ...prev, file: file, avatarUrl: URL.createObjectURL(file) }));
  };

  // Submit Profile Changes
  const handleSave = async () => {
    // Basic validation for empty name
    if (!editForm.name.trim()) return alert("Name cannot be empty.");

    setEditForm(prev => ({ ...prev, updating: true }));
    try {
        let finalUrl = editForm.avatarUrl;
        
        // Upload new avatar if selected
        if (editForm.file) {
            const fd = new FormData();
            fd.append("file", editForm.file);
            finalUrl = (await axios.post(`${API_URL}/upload-avatar`, fd)).data.url;
        }

        // Update Backend (MySQL)
        await axios.put(`${API_URL}/users/${uid}`, { display_name: editForm.name, photo_url: finalUrl });

        // Update Firebase (for immediate session update)
        if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: editForm.name, photoURL: finalUrl });

        alert("Profile updated successfully!");
        window.location.reload(); 
    } catch (e) { alert("Update failed: " + e.message); } 
    finally { setEditForm(prev => ({ ...prev, updating: false })); }
  };

  if (data.loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: '#EA7C69' }} /></Box>;
  if (!data.profile) return <Typography sx={{ color: 'white', textAlign: 'center', mt: 10 }}>User not found.</Typography>;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 5, px: { xs: 2, md: 4 } }}>
      
      {/* Header Info Section */}
      <Box sx={{ 
        bgcolor: '#1F1D2B', borderRadius: 4, p: { xs: 3, md: 4 }, mb: 4, 
        border: '1px solid rgba(255,255,255,0.05)', 
        display: 'flex', flexDirection: { xs: 'column', md: 'row' }, 
        alignItems: 'center', gap: 4 
      }}>
          <Avatar 
            src={data.profile.photo_url} 
            sx={{ width: 150, height: 150, border: '4px solid #EA7C69', fontSize: '3rem', bgcolor: '#252836' }}
          >
            {data.profile.display_name?.charAt(0).toUpperCase()}
          </Avatar>
          
          <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left' }, width: '100%', overflow: 'hidden' }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 'bold', color: 'white', mb: 1,
                  // Ensure long names don't break layout
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}
              >
                {data.profile.display_name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' }, color: '#ABBBC2', mb: 2 }}>
                  <CalendarMonth fontSize="small" /><Typography>Joined: {new Date(data.profile.created_at).toLocaleDateString()}</Typography>
              </Box>
              {isMyProfile && (
                <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditForm(p => ({ ...p, open: true }))} sx={{ color: '#EA7C69', borderColor: '#EA7C69', borderRadius: 2, fontWeight: 'bold', '&:hover': { bgcolor: 'rgba(234,124,105,0.1)', borderColor: '#EA7C69' } }}>
                  Edit Profile
                </Button>
              )}
          </Box>
          
          <Box sx={{ textAlign: 'center', px: 3, py: 2, bgcolor: '#252836', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="h4" sx={{ color: '#EA7C69', fontWeight: 'bold' }}>{data.blogs.length}</Typography>
              <Typography variant="body2" sx={{ color: '#ABBBC2' }}>Blogs Posted</Typography>
          </Box>
      </Box>

      {/* User's Blogs Grid - Fixed Layout */}
      <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 3, borderLeft: '4px solid #EA7C69', pl: 2 }}>
        {isMyProfile ? "My Culinary Journey" : `${data.profile.display_name}'s Blogs`}
      </Typography>
      
      {data.blogs.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 5, color: '#ABBBC2', fontStyle: 'italic' }}>No blogs found for this user.</Box>
      ) : (
          // Use CSS Grid exactly like HomePage for uniformity
          <Box sx={{ 
            display: 'grid', 
            gap: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
            gridTemplateColumns: { 
              xs: 'repeat(2, 1fr)', 
              sm: 'repeat(2, 1fr)', 
              md: 'repeat(3, 1fr)', 
              lg: 'repeat(4, 1fr)' 
            },
            width: '100%'
          }}>
            {data.blogs.map(food => (
               <Box key={food.id} sx={{ width: '100%', display: 'flex' }}>
                  <FoodCard food={food} />
               </Box>
            ))}
          </Box>
      )}

      {/* Edit Profile Modal */}
      <Dialog open={editForm.open} onClose={() => setEditForm(p => ({ ...p, open: false }))} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: '#252836', color: 'white', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' } }}>
          <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
            Edit Profile
            <IconButton onClick={() => setEditForm(p => ({ ...p, open: false }))} sx={{ color: '#ABBBC2' }}><Close /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ mt: 2, textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                  <Avatar src={editForm.avatarUrl} sx={{ width: 100, height: 100, border: '2px solid #EA7C69' }} />
                  <IconButton component="label" sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: '#EA7C69', color: 'white', '&:hover': { bgcolor: '#d96552' } }}>
                    <CameraAlt fontSize="small" />
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                  </IconButton>
              </Box>
              <TextField 
                fullWidth 
                label="Display Name" 
                variant="outlined" 
                value={editForm.name} 
                onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                // Limit input to 15 chars
                inputProps={{ maxLength: 15 }}
                helperText={`${editForm.name.length}/15 characters`}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: '#EA7C69' } }, 
                  '& .MuiInputLabel-root': { color: '#ABBBC2' }, 
                  '& .MuiInputLabel-root.Mui-focused': { color: '#EA7C69' },
                  '& .MuiFormHelperText-root': { color: '#ABBBC2' }
                }} 
              />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Button onClick={() => setEditForm(p => ({ ...p, open: false }))} sx={{ color: '#ABBBC2' }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={editForm.updating} startIcon={editForm.updating ? <CircularProgress size={20} color="inherit" /> : <SaveRounded />} sx={{ bgcolor: '#EA7C69', fontWeight: 'bold', '&:hover': { bgcolor: '#d96552' } }}>
              Save Changes
            </Button>
          </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProfilePage;
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase';
import { 
    Container, Typography, Box, Button, CircularProgress, Chip, Avatar, 
    Divider, Paper, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Menu, MenuItem, Pagination, Tooltip
} from '@mui/material';
import { AccessTime, SendRounded, MoreVert, Edit, DeleteOutline, Reply } from '@mui/icons-material';

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api";
const COMMENTS_PER_PAGE = 10;

// Style for dark themed input
const inputStyle = { '& .MuiOutlinedInput-root': { color: 'white', bgcolor: '#1F1D2B', borderRadius: '18px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.35)' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: '#EA7C69' } }, '& input::placeholder': { color: '#ABBBC2' } };

function DetailPage() {
  const { dishName } = useParams();
  const [currentUser, navigate, location] = [auth.currentUser, useNavigate(), useLocation()];

  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blogSections, setBlogSections] = useState([]);

  // Comment & Interaction State
  const [comments, setComments] = useState([]);
  const [interact, setInteract] = useState({ newComment: "", isSending: false, page: 1, activeReplyId: null, replyText: "" });
  
  // Modals & Menu
  const [modals, setModals] = useState({ editOpen: false, deleteOpen: false, editContent: "" });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [actionItem, setActionItem] = useState(null);

  // Fetch Dish Details and initial comments
  useEffect(() => {
    const fetchDishDetail = async () => {
      try {
        const res = await axios.get(`${API_URL}/foods/${dishName}`);
        if (res.data.region === 'Forum') return navigate(`/forum/${res.data.slug}${location.search}`);

        setDish(res.data);
        // Safely parse JSON content or fallback to string
        try {
          const parsed = JSON.parse(res.data.introduction);
          setBlogSections(Array.isArray(parsed) ? parsed : [{ title: "Introduction", content: res.data.introduction }]);
        } catch { setBlogSections([{ title: "Introduction", content: res.data.introduction }]); }
        
        fetchComments(res.data.slug);
        setLoading(false);
      } catch (e) { console.error(e); setLoading(false); }
    };
    fetchDishDetail();
  }, [dishName, navigate, location.search]);

  const fetchComments = async (slug) => {
      try { setComments((await axios.get(`${API_URL}/comments/${slug}`)).data.reverse()); } catch (e) { console.error(e); }
  };

  // Logic to highlight specific comment from URL query (?highlight=ID)
  // Uses polling to wait for element to render in DOM
  useEffect(() => {
    const hId = new URLSearchParams(location.search).get('highlight');
    if (hId && comments.length) {
        const idx = comments.findIndex(c => c.id.toString() === hId);
        if (idx !== -1) setInteract(p => ({ ...p, page: Math.ceil((idx + 1) / COMMENTS_PER_PAGE) }));
        
        let attempts = 0;
        const interval = setInterval(() => {
            const el = document.getElementById(`comment-${hId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.transition = 'all 0.5s ease'; el.style.backgroundColor = 'rgba(234, 124, 105, 0.3)'; el.style.border = '1px solid #EA7C69';
                setTimeout(() => { el.style.backgroundColor = '#252836'; el.style.border = '1px solid rgba(255,255,255,0.02)'; }, 3000);
                clearInterval(interval);
            }
            if (++attempts >= 20) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
    }
  }, [comments, location.search, interact.page]);

  // Comment Actions
  const submitComment = async (parentId = null) => {
    const content = parentId ? interact.replyText : interact.newComment;
    if (!content.trim() || !currentUser) return;
    
    setInteract(p => ({ ...p, isSending: true }));
    try {
      await axios.post(`${API_URL}/comments`, { food_slug: dish.slug, user_uid: currentUser.uid, content, parent_id: parentId });
      fetchComments(dish.slug);
      if (parentId) setInteract(p => ({ ...p, replyText: "", activeReplyId: null }));
      else setInteract(p => ({ ...p, newComment: "", page: 1 }));
    } catch (e) { console.error(e); } finally { setInteract(p => ({ ...p, isSending: false })); }
  };

  const handleMenu = (e, item) => { setMenuAnchor(e.currentTarget); setActionItem(item); };
  
  const handleAction = async (type) => {
    setMenuAnchor(null);
    if (type === 'delete') setModals(p => ({ ...p, deleteOpen: true }));
    if (type === 'edit') setModals(p => ({ ...p, editOpen: true, editContent: actionItem.content }));
  };

  const confirmAction = async (type) => {
    try {
        if (type === 'delete') await axios.delete(`${API_URL}/comments/${actionItem.id}`);
        if (type === 'edit') await axios.put(`${API_URL}/comments/${actionItem.id}`, { content: modals.editContent });
        fetchComments(dish.slug);
    } catch(e) {}
    setModals({ editOpen: false, deleteOpen: false, editContent: "" });
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: '#EA7C69' }} /></Box>;
  if (!dish) return <Typography variant="h4" color="error">Dish not found!</Typography>;

  const currentComments = comments.slice((interact.page - 1) * COMMENTS_PER_PAGE, interact.page * COMMENTS_PER_PAGE);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 1, md: 2 } }}>
      <Button component={RouterLink} to="/home" sx={{ mb: 2, color: '#EA7C69', fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>← Back to all dishes</Button>
      
      <Typography variant="h2" sx={{ fontWeight: 'bold', color: 'white', mb: 2, fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>{dish.name}</Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, mb: 3, color: '#ABBBC2', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={dish.author_photo} sx={{ width: { xs: 20, md: 24 }, height: { xs: 20, md: 24 }, bgcolor: '#EA7C69', fontSize: '0.8rem', cursor: dish.author_uid ? 'pointer' : 'default' }} onClick={() => dish.author_uid && navigate(`/profile/${dish.author_uid}`)}>{dish.author ? dish.author[0].toUpperCase() : "A"}</Avatar>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#EA7C69', cursor: dish.author_uid ? 'pointer' : 'default', fontSize: { xs: '0.8rem', md: '0.875rem' }, '&:hover': dish.author_uid ? { textDecoration: 'underline' } : {} }} onClick={() => dish.author_uid && navigate(`/profile/${dish.author_uid}`)}>{dish.author || "admin"}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AccessTime sx={{ fontSize: { xs: 16, md: 18 } }} /><Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>{dish.createdAt ? new Date(dish.createdAt).toLocaleDateString('en-GB') : "Unknown"}</Typography></Box>
      </Box>

      {dish.imageUrl && (<Box sx={{ width: '100%', height: { xs: '200px', sm: '300px', md: '400px' }, borderRadius: 4, overflow: 'hidden', mb: 4, border: '1px solid rgba(255,255,255,0.1)' }}><img src={dish.imageUrl} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Box>)}

      <Box sx={{ mb: 4, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {dish.type?.map((tag, i) => <Chip key={i} label={tag} sx={{ bgcolor: 'rgba(234, 124, 105, 0.2)', color: '#EA7C69', fontWeight: 'bold', fontSize: { xs: '0.75rem', md: '0.8125rem' } }} />)}
        {dish.region && <Chip label={dish.region} variant="outlined" sx={{ color: '#ABBBC2', borderColor: '#393C49', fontSize: { xs: '0.75rem', md: '0.8125rem' } }} />}
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 4 }} />

      {/* Render Blog Sections (HTML or Text) */}
      {blogSections.map((sec, i) => (
        <Box sx={{ mb: 4 }} key={i}>
          {sec.title && <Typography variant="h5" gutterBottom sx={{ color: '#EA7C69', fontWeight: 'bold', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>{sec.title}</Typography>}
          {/<[a-z][\s\S]*>/i.test(sec.content) ? <Box sx={{ color: '#E0E6E9', fontSize: { xs: '0.95rem', md: '1.05rem' }, lineHeight: 1.8, '& img': { maxWidth: '100%', borderRadius: 2, my: 2 } }} dangerouslySetInnerHTML={{ __html: sec.content }} /> : <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: '#E0E6E9', fontSize: { xs: '0.95rem', md: '1.05rem' }, textAlign: 'justify' }}>{sec.content}</Typography>}
        </Box>
      ))}
      
      <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }}><Chip label="Discussion" sx={{ bgcolor: '#252836', color: '#ABBBC2' }} /></Divider>
      
      <Box>
         {/* Comment Input */}
         <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, mb: 4, borderRadius: 3, bgcolor: '#1F1D2B', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Avatar src={currentUser?.photoURL} sx={{ width: 36, height: 36, mt: 0.5 }} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <TextField fullWidth multiline maxRows={4} placeholder="Write a comment..." variant="outlined" value={interact.newComment} onChange={(e) => setInteract(p => ({ ...p, newComment: e.target.value }))} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }} sx={{ ...inputStyle, '& .MuiOutlinedInput-root': { ...inputStyle['& .MuiOutlinedInput-root'], padding: '10px 14px', minHeight: '40px' } }} />
                </Box>
                <IconButton onClick={() => submitComment()} disabled={interact.isSending} sx={{ width: 40, height: 40, mt: 0.2, bgcolor: '#EA7C69', color: 'white', borderRadius: '12px', '&:hover': { bgcolor: '#d96552' } }}><SendRounded sx={{ fontSize: 20, ml: 0.5 }} /></IconButton>
            </Box>
        </Paper>

        {/* Comment List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {currentComments.map((cmt) => {
                const isMine = currentUser && (cmt.user_uid === currentUser.uid);
                const parent = comments.find(c => c.id === cmt.parent_id);
                return (
                    <React.Fragment key={cmt.id}>
                        <Paper id={`comment-${cmt.id}`} elevation={0} sx={{ p: 1, borderRadius: 3, bgcolor: '#252836', border: '1px solid rgba(255,255,255,0.02)', mb: 0.5, transition: 'all 0.1s', '&:hover': { border: '1px solid rgba(255,255,255,0.1)' } }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <Avatar src={cmt.user.photo_url} onClick={() => navigate(`/profile/${cmt.user_uid}`)} sx={{ width: 36, height: 36, mt: 0.5, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.35)' }}>{cmt.user.display_name[0]}</Avatar>
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="subtitle2" onClick={() => navigate(`/profile/${cmt.user_uid}`)} sx={{ color: 'white', fontWeight: 700, cursor: 'pointer', '&:hover': { color: '#EA7C69' } }}>{cmt.user.display_name}</Typography>
                                            <Typography variant="caption" sx={{ color: '#808191', fontSize: '0.7rem', mt: 0.2 }}>{new Date(cmt.created_at).toLocaleString()}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0 }}>
                                            <Tooltip title="Reply"><IconButton size="small" onClick={() => setInteract(p => ({ ...p, activeReplyId: p.activeReplyId === cmt.id ? null : cmt.id, replyText: "" }))} sx={{ color: '#808191', '&:hover': { color: '#EA7C69', bgcolor: 'rgba(234,124,105,0.1)' } }}><Reply fontSize="small" /></IconButton></Tooltip>
                                            {isMine && <IconButton size="small" onClick={(e) => handleMenu(e, cmt)} sx={{ color: '#808191', '&:hover': { color: 'white' } }}><MoreVert fontSize="small" /></IconButton>}
                                        </Box>
                                    </Box>
                                    {parent && (<Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', p: 1, borderRadius: 2, mb: 1, mt: 0.5, borderLeft: '3px solid #EA7C69' }}><Typography variant="caption" sx={{ color: '#fefefeff', fontWeight: 'bold', display: 'block', mb: 0.3 }}>Replying to {parent.user.display_name}:</Typography><Typography variant="body2" sx={{ color: '#ABBBC2', fontStyle: 'italic', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{parent.content}</Typography></Box>)}
                                    <Typography variant="body2" sx={{ color: '#E0E6E9', lineHeight: 1.5, fontSize: '0.95rem', wordBreak: 'break-all', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{cmt.content}</Typography>
                                </Box>
                            </Box>
                        </Paper>
                        
                        {/* Reply Input Box */}
                        {interact.activeReplyId === cmt.id && (
                            <Box sx={{ ml: { xs: 2, md: 6 }, mt: 1, mb: 2, display: 'flex', gap: 1.5 }}>
                                <Avatar src={currentUser?.photoURL} sx={{ width: 32, height: 32 }} />
                                <TextField fullWidth size="small" multiline maxRows={2} autoFocus placeholder={`Reply to ${cmt.user.display_name}...`} value={interact.replyText} onChange={(e) => setInteract(p => ({ ...p, replyText: e.target.value }))} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(cmt.id); } }} sx={{ ...inputStyle, flexGrow: 1 }} />
                                <IconButton onClick={() => submitComment(cmt.id)} disabled={interact.isSending} sx={{ width: 40, height: 40, bgcolor: '#EA7C69', color: 'white', '&:hover': { bgcolor: '#d96552' }, borderRadius: '12px' }}><SendRounded fontSize="small" /></IconButton>
                            </Box>
                        )}
                    </React.Fragment>
                );
            })}
        </Box>
        {Math.ceil(comments.length / COMMENTS_PER_PAGE) > 1 && (<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><Pagination count={Math.ceil(comments.length / COMMENTS_PER_PAGE)} page={interact.page} onChange={(e, v) => setInteract(p => ({ ...p, page: v }))} shape="rounded" sx={{ '& .MuiPaginationItem-root': { color: '#ABBBC2' }, '& .Mui-selected': { bgcolor: '#EA7C69', color: 'white' } }} /></Box>)}
      </Box>

      {/* Menus and Modals */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} PaperProps={{ sx: { bgcolor: '#252836', color: 'white', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <MenuItem onClick={() => handleAction('edit')}><Edit fontSize="small" sx={{ mr: 1 }} /> Edit</MenuItem>
        <MenuItem onClick={() => handleAction('delete')} sx={{ color: '#ff4d4d' }}><DeleteOutline fontSize="small" sx={{ mr: 1 }} /> Delete</MenuItem>
      </Menu>
      
      <Dialog open={modals.editOpen} onClose={() => setModals(p => ({ ...p, editOpen: false }))} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: '#252836', color: 'white' } }}><DialogTitle>Edit Comment</DialogTitle><DialogContent><TextField fullWidth multiline rows={3} value={modals.editContent} onChange={(e) => setModals(p => ({ ...p, editContent: e.target.value }))} sx={{ ...inputStyle, mt: 2 }} /></DialogContent><DialogActions><Button onClick={() => setModals(p => ({ ...p, editOpen: false }))} sx={{ color: '#ABBBC2' }}>Cancel</Button><Button variant="contained" onClick={() => confirmAction('edit')} sx={{ bgcolor: '#EA7C69' }}>Save</Button></DialogActions></Dialog>
      <Dialog open={modals.deleteOpen} onClose={() => setModals(p => ({ ...p, deleteOpen: false }))} PaperProps={{ sx: { bgcolor: '#252836', color: 'white' } }}><DialogTitle>Confirm Delete</DialogTitle><DialogContent><Typography sx={{color: '#ABBBC2'}}>Are you sure you want to delete this comment?</Typography></DialogContent><DialogActions><Button onClick={() => setModals(p => ({ ...p, deleteOpen: false }))} sx={{ color: '#ABBBC2' }}>Cancel</Button><Button onClick={() => confirmAction('delete')} variant="contained" color="error">Delete</Button></DialogActions></Dialog>
      <Box sx={{ height: '100px' }} /> 
    </Container>
  );
}

export default DetailPage;
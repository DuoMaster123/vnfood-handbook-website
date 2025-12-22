import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardMedia,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, Select, MenuItem, InputLabel, CircularProgress,
  Chip, OutlinedInput, Toolbar, Menu, Tooltip, Avatar, Divider, InputAdornment, Paper, Pagination
} from '@mui/material';
import {
  AddCircleOutline, Close, Image as ImageIcon, YouTube, LocationOn, SearchRounded,
  SendRounded, ChatBubbleOutline, FormatBold, FormatItalic, FormatUnderlined,
  FormatColorText, FormatClear, Add, Remove, Edit, DeleteOutline, MoreVert, Reply, ArrowBackRounded
} from '@mui/icons-material';
import axios from 'axios';
import { auth } from '../firebase';
import { Editor, EditorProvider } from 'react-simple-wysiwyg';

// CONFIGURATION 
const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api";
const REGIONS = ["North", "Central", "South"];
const TAGS_OPTIONS = ['Hot Dishes', 'Cold Dishes', 'Soup', 'Side Dishes'];
const COMMENTS_PER_PAGE = 10;
const FORUMS_PER_PAGE = 10;

const TEXT_COLORS = [
  { name: "Default (White)", value: "#FFFFFF" }, { name: "Pink (Brand)", value: "#EA7C69" },
  { name: "Red", value: "#FF0000" }, { name: "Orange", value: "#f56a14ff" },
  { name: "Yellow", value: "#FFFF00" }, { name: "Green", value: "#008000" },
  { name: "Blue", value: "#ADD8E6" }, { name: "Purple", value: "#800080" },
  { name: "Gray", value: "#808080" }, { name: "Black", value: "#000000" },
];

// UTILS & STYLES 
const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

const rgbToHex = (rgb) => {
  if (!rgb || rgb === 'inherit' || rgb === 'transparent') return '';
  if (rgb.startsWith('#')) return rgb.toUpperCase();
  const v = rgb.match(/\d+/g);
  return v ? "#" + ((1 << 24) + (parseInt(v[0]) << 16) + (parseInt(v[1]) << 8) + parseInt(v[2])).toString(16).slice(1).toUpperCase() : '';
};

// Custom styles for inputs to match dark theme
const commentInputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '18px', backgroundColor: '#1F1D2B', color: 'white',
    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.35)', transition: 'all 0.2s' },
    '&:hover fieldset': { borderColor: 'white' },
    '&.Mui-focused fieldset': { borderColor: '#EA7C69', borderWidth: '2px' },
    '& input::placeholder': { color: '#ABBBC2', opacity: 1 }
  }
};

const transparentInputStyle = {
  '& .MuiOutlinedInput-root': {
    color: 'white', backgroundColor: 'transparent', borderRadius: '12px',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&:hover fieldset': { borderColor: 'white' },
    '&.Mui-focused fieldset': { borderColor: '#EA7C69' },
  },
  '& .MuiInputLabel-root': { color: '#ABBBC2' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#EA7C69' },
  '& .MuiSelect-icon': { color: 'white' }, mb: 2
};

const searchInputStyle = { 
  ...transparentInputStyle, 
  '& .MuiOutlinedInput-root': { 
    backgroundColor: '#1F1D2B', color: 'white', 
    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.35)' }, 
    '&:hover fieldset': { borderColor: 'white' }, 
    '&.Mui-focused fieldset': { borderColor: '#EA7C69', borderWidth: '2px' } 
  }, 
  '& input': { color: 'white' }, 
  '& input::placeholder': { color: '#ABBBC2', opacity: 1 } 
};

// CUSTOM EDITOR TOOLBAR 
const CustomToolbar = React.memo(() => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [formats, setFormats] = useState({ bold: false, italic: false, underline: false, color: '#FFFFFF', fontSize: 3 });
  const savedRange = useRef(null);

  const saveSelection = () => { const sel = window.getSelection(); if (sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0); };
  const restoreSelection = () => { const sel = window.getSelection(); sel.removeAllRanges(); if (savedRange.current) sel.addRange(savedRange.current); };

  const exec = (cmd, val = null) => { document.execCommand(cmd, false, val); checkActiveFormats(); };

  const checkActiveFormats = useCallback(() => {
    const sel = window.getSelection();
    if (!sel.rangeCount || (document.querySelector('.rsw-editor') && !document.querySelector('.rsw-editor').contains(sel.anchorNode))) return;
    setFormats({
      bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'), color: rgbToHex(document.queryCommandValue('foreColor')) || '#FFFFFF',
      fontSize: parseInt(document.queryCommandValue('fontSize')) || 3
    });
  }, []);

  useEffect(() => { document.addEventListener('selectionchange', checkActiveFormats); return () => document.removeEventListener('selectionchange', checkActiveFormats); }, [checkActiveFormats]);

  const getBtnStyle = (isActive) => ({
    color: isActive ? '#1F1D2B' : '#ABBBC2', bgcolor: isActive ? '#EA7C69' : 'transparent', borderRadius: '4px',
    border: isActive ? '1px solid #EA7C69' : '1px solid transparent', transition: 'all 0.1s', mx: 0.2, flexShrink: 0,
    '&:hover': { color: isActive ? '#1F1D2B' : '#EA7C69', bgcolor: isActive ? '#EA7C69' : 'rgba(255,255,255,0.05)', border: '1px solid #EA7C69' },
  });

  const handleFontSize = (e, delta) => { e.preventDefault(); let s = formats.fontSize + delta; exec('fontSize', s < 1 ? 1 : (s > 7 ? 7 : s)); };
  const handleColorSelect = (val) => { setAnchorEl(null); setTimeout(() => { restoreSelection(); if (val) exec('foreColor', val); }, 0); };

  const handleReset = (e) => {
    e.preventDefault();
    if (document.queryCommandState('bold')) document.execCommand('bold', false, null);
    if (document.queryCommandState('italic')) document.execCommand('italic', false, null);
    if (document.queryCommandState('underline')) document.execCommand('underline', false, null);
    document.execCommand('removeFormat', false, null);
    document.execCommand('fontSize', false, '3');
    document.execCommand('foreColor', false, '#FFFFFF');
    checkActiveFormats();
  };

  return (
    <Toolbar variant="dense" sx={{ 
      bgcolor: '#2D303E', borderBottom: '1px solid rgba(255,255,255,0.1)', minHeight: '48px !important', gap: 0.5, px: 1,
      overflowX: 'auto', '&::-webkit-scrollbar': { height: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#555', borderRadius: '4px' }, '&::-webkit-scrollbar-track': { background: 'transparent' }
    }}>
      <Box sx={{ display: 'flex', bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 1, p: 0.3, flexShrink: 0 }}>
        {[{ cmd: 'bold', icon: <FormatBold fontSize="small" />, key: formats.bold, title: "Bold" }, { cmd: 'italic', icon: <FormatItalic fontSize="small" />, key: formats.italic, title: "Italic" }, { cmd: 'underline', icon: <FormatUnderlined fontSize="small" />, key: formats.underline, title: "Underline" }].map(b => (
          <Tooltip key={b.cmd} title={b.title}><IconButton onMouseDown={(e) => { e.preventDefault(); exec(b.cmd); }} size="small" sx={getBtnStyle(b.key)}>{b.icon}</IconButton></Tooltip>
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255, 255, 255, 0.35)', borderRadius: 1, px: 0.5, mx: 1, flexShrink: 0 }}>
        <Tooltip title="Decrease Size"><IconButton size="small" onMouseDown={(e) => handleFontSize(e, -1)} sx={getBtnStyle(false)}><Remove fontSize="small" /></IconButton></Tooltip>
        <Typography sx={{ color: '#ABBBC2', width: '30px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', userSelect: 'none' }}>{formats.fontSize}</Typography>
        <Tooltip title="Increase Size"><IconButton size="small" onMouseDown={(e) => handleFontSize(e, 1)} sx={getBtnStyle(false)}><Add fontSize="small" /></IconButton></Tooltip>
      </Box>
      <Tooltip title="Text Color"><IconButton onMouseDown={(e) => { e.preventDefault(); saveSelection(); setAnchorEl(e.currentTarget); }} size="small" sx={{ ...getBtnStyle(false), border: '1px solid rgba(255,255,255,0.35)' }}><FormatColorText fontSize="small" sx={{ color: formats.color }} /></IconButton></Tooltip>
      <Box sx={{ flexGrow: 1, minWidth: '10px' }} />
      <Tooltip title="Reset Formatting"><IconButton onMouseDown={handleReset} size="small" sx={{ color: '#d9534f', borderRadius: 1, flexShrink: 0, '&:hover': { bgcolor: 'rgba(217, 83, 79, 0.1)', color: '#ff6b6b' } }}><FormatClear fontSize="small" /></IconButton></Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => handleColorSelect(null)} PaperProps={{ sx: { bgcolor: '#252836', border: '1px solid #393C49', mt: 1 } }}>
        <Grid container sx={{ width: 200, p: 1 }} spacing={1}>
          {TEXT_COLORS.map((c) => (<Grid item xs={2.4} key={c.name} sx={{ display: 'flex', justifyContent: 'center' }}><Box onClick={() => handleColorSelect(c.value)} sx={{ width: 24, height: 24, borderRadius: '4px', cursor: 'pointer', bgcolor: c.value, border: '1px solid rgba(255,255,255,0.2)', '&:hover': { transform: 'scale(1.2)', borderColor: 'white', zIndex: 10 } }} title={c.name} /></Grid>))}
        </Grid>
      </Menu>
    </Toolbar>
  );
});

// MAIN COMPONENT 
function BlogPage() {
  const [currentUser, navigate, location, { slug }] = [auth.currentUser, useNavigate(), useLocation(), useParams()];

  // Data Loading State
  const [data, setData] = useState({ blogs: [], forums: [], loading: true });
  const [viewMode, setViewMode] = useState('blog'); // 'blog' or 'forum_detail'
  
  // Forum & Comment State
  const [selectedForum, setSelectedForum] = useState(null);
  const [forumPage, setForumPage] = useState(1);
  const [comments, setComments] = useState([]);
  const [interact, setInteract] = useState({ newComment: "", isSending: false, searchTerm: "", page: 1, activeReplyId: null, replyText: "" });

  // Modal & Form State
  const [modals, setModals] = useState({ open: false, type: 'blog', editComment: false, editContent: "", deleteConfirm: false, uploading: false });
  const [menu, setMenu] = useState({ anchor: null, item: null, type: '' });
  const [form, setForm] = useState({ title: "", content: "", region: "North", city: "", youtubeLink: "", tags: [], imageFile: null, previewImg: null, isEdit: false, slug: null });

  // Fetch all data on mount
  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/foods`);
      const all = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setData({
        blogs: all.filter(i => i.region !== 'Forum' && i.author !== 'admin' && (i.author === currentUser?.displayName || i.author === currentUser?.email.split('@')[0])),
        forums: all.filter(i => i.region === 'Forum'),
        loading: false
      });
    } catch (err) { console.error(err); setData(d => ({ ...d, loading: false })); }
  };

  useEffect(() => { fetchData(); }, [currentUser]);

  // Handle URL slug to switch between Blog List and Forum Detail view
  useEffect(() => {
    let isMounted = true;
    if (slug && data.forums.length) {
      const found = data.forums.find(f => f.slug === slug);
      if (found) {
        if (isMounted) {
          setSelectedForum(found);
          setViewMode('forum_detail');
          axios.get(`${API_URL}/comments/${found.slug}`).then(res => { if (isMounted) setComments(res.data.reverse()); }).catch(err => console.error(err));
        }
      }
    } else if (!slug) {
      if (isMounted) { setViewMode('blog'); setSelectedForum(null); }
    }
    return () => { isMounted = false; };
  }, [slug, data.forums]);

  const fetchComments = useCallback(async () => {
    if (!selectedForum) return;
    try { setComments((await axios.get(`${API_URL}/comments/${selectedForum.slug}`)).data.reverse()); } catch (err) { console.error(err); }
  }, [selectedForum]);

  // Highlight comment from URL parameter
  useEffect(() => {
    const hId = new URLSearchParams(location.search).get('highlight');
    if (hId && viewMode === 'forum_detail' && comments.length) {
      const idx = comments.findIndex(c => c.id.toString() === hId);
      if (idx !== -1) {
        const targetPage = Math.ceil((idx + 1) / COMMENTS_PER_PAGE);
        if (interact.page !== targetPage) setInteract(p => ({ ...p, page: targetPage }));
        setTimeout(() => {
          const el = document.getElementById(`comment-${hId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.transition = 'all 0.5s ease'; el.style.backgroundColor = 'rgba(234, 124, 105, 0.3)';
            setTimeout(() => { el.style.backgroundColor = '#252836'; }, 3000);
          }
        }, 300);
      }
    }
  }, [comments, location.search, viewMode, interact.page]);

  // Comment Actions
  const handleSendComment = async (parentId = null) => {
    const content = parentId ? interact.replyText : interact.newComment;
    if (!content.trim() || !currentUser) return;
    setInteract(p => ({ ...p, isSending: true }));
    try { 
      await axios.post(`${API_URL}/comments`, { food_slug: selectedForum.slug, user_uid: currentUser.uid, content, parent_id: parentId }); 
      fetchComments(); 
      setInteract(p => ({ ...p, newComment: "", replyText: "", activeReplyId: null })); 
    } catch (err) { console.error(err); } finally { setInteract(p => ({ ...p, isSending: false })); }
  };

  const handleMenu = (e, item, type) => { e.stopPropagation(); setMenu({ anchor: e.currentTarget, item, type }); };
  const handleEditClick = () => {
    setMenu(p => ({ ...p, anchor: null }));
    if (menu.type === 'comment') setModals(p => ({ ...p, editComment: true, editContent: menu.item.content }));
    else handleOpenModal(menu.type, menu.item);
  };

  // CRUD Actions
  const handleAction = async (action) => {
    if (action === 'delete') {
      try {
        if (menu.type === 'comment') { await axios.delete(`${API_URL}/comments/${menu.item.id}`); fetchComments(); }
        else { await axios.delete(`${API_URL}/foods/${menu.item.slug}`); fetchData(); if (selectedForum?.slug === menu.item.slug) navigate('/blog'); }
      } catch { alert("Failed to delete."); }
      setModals(p => ({ ...p, deleteConfirm: false }));
    } else if (action === 'saveComment') {
      try { await axios.put(`${API_URL}/comments/${menu.item.id}`, { content: modals.editContent }); setModals(p => ({ ...p, editComment: false })); fetchComments(); } catch { alert("Error updating comment"); }
    }
  };

  const handleOpenModal = (type, item = null) => {
    setModals(p => ({ ...p, type, open: true }));
    if (item) {
      setForm({
        isEdit: true, slug: item.slug, title: item.name, 
        content: (() => { try { return JSON.parse(item.introduction)[0]?.content || ""; } catch { return item.introduction; } })(),
        region: item.region || "North", city: item.city || "", tags: item.type || [], youtubeLink: item.recipe || "", previewImg: item.imageUrl, imageFile: null
      });
    } else {
      setForm({ isEdit: false, slug: null, title: "", content: "", region: "North", city: "", youtubeLink: "", tags: [], imageFile: null, previewImg: null });
    }
  };

  const handleSaveData = async () => {
    const { title, content, city, tags, imageFile, previewImg, youtubeLink, region, slug, isEdit } = form;
    if (!title.trim() || !content.replace(/<[^>]*>/g, '').trim()) return alert("Please check Title and Content.");
    setModals(p => ({ ...p, uploading: true }));
    try {
      let imageUrl = previewImg || "";
      if (imageFile && modals.type === 'blog') {
        const fd = new FormData(); fd.append("file", imageFile);
        imageUrl = (await axios.post(`${API_URL}/upload-blog-image`, fd)).data.url;
      }
      let vid = youtubeLink;
      if (youtubeLink && modals.type === 'blog') { if (youtubeLink.includes("v=")) vid = youtubeLink.split("v=")[1].split("&")[0]; else if (youtubeLink.includes("youtu.be/")) vid = youtubeLink.split("youtu.be/")[1]; }

      let finalSlug = slug || (title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-') + "-" + Date.now());
      const payload = {
        name: title, introduction: JSON.stringify([{ title: (modals.type === 'forum' ? "Content" : "Story"), content }]),
        image_url: imageUrl || "", region: modals.type === 'forum' ? 'Forum' : region, city: modals.type === 'forum' ? 'General' : city,
        type: modals.type === 'forum' ? ['Discussion'] : tags, recipe: vid, author: currentUser.displayName || currentUser.email.split('@')[0], slug: finalSlug
      };

      if (isEdit) await axios.put(`${API_URL}/foods/${slug}`, payload); else await axios.post(`${API_URL}/foods/create`, payload);
      setModals(p => ({ ...p, open: false })); fetchData();
      if (viewMode === 'forum_detail' && selectedForum?.slug === slug) setSelectedForum({ ...selectedForum, ...payload });
    } catch (e) { alert("Error: " + e.message); } finally { setModals(p => ({ ...p, uploading: false })); }
  };

  const handleEditorKeyDown = (e) => {
    if (e.ctrlKey && (e.key === ']' || e.key === '[')) {
      e.preventDefault(); const cur = parseInt(document.queryCommandValue('fontSize')) || 3;
      document.execCommand('fontSize', false, e.key === ']' ? Math.min(cur + 1, 7) : Math.max(cur - 1, 1));
    }
  };

  const currentComments = comments.slice((interact.page - 1) * COMMENTS_PER_PAGE, interact.page * COMMENTS_PER_PAGE);
  const filteredForums = data.forums.filter(f => removeAccents(f.name).includes(removeAccents(interact.searchTerm)));
  const currentForums = filteredForums.slice((forumPage - 1) * FORUMS_PER_PAGE, forumPage * FORUMS_PER_PAGE);

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: { xs: 3, lg: 6 }, height: { xs: 'auto', lg: 'calc(100vh - 100px)' }, overflow: { xs: 'visible', lg: 'hidden' } }}>

      {/*  LEFT SIDEBAR (FORUM LIST)  */}
      <Box sx={{ width: { xs: '100%', lg: 'calc(25% + 6px)' }, minWidth: { lg: 286 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#1F1D2B', p: { xs: 2, md: 2 }, borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.15)', maxHeight: { xs: '600px', lg: 'none' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>Community Forum</Typography>
          <Button variant="contained" startIcon={<AddCircleOutline />} onClick={() => handleOpenModal('forum')} sx={{ bgcolor: '#EA7C69', borderRadius: 2, fontWeight: 'bold', fontSize: '0.8rem', py: 0.8, px: 2, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#d96552' } }}>New Topic</Button>
        </Box>
        <TextField placeholder="Search topics..." variant="outlined" size="small" fullWidth value={interact.searchTerm} onChange={(e) => { setInteract(p => ({ ...p, searchTerm: e.target.value })); setForumPage(1); }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: '#ABBBC2' }} /></InputAdornment> }} sx={searchInputStyle} />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#393C49', borderRadius: '4px' } }}>
          {data.loading ? <CircularProgress sx={{ color: '#EA7C69', mx: 'auto', display: 'block' }} /> : (currentForums.map((post) => (
            // [MOD] Reduced padding on mobile for Forum Items
            <Card key={post.id} onClick={() => navigate(`/forum/${post.slug}`)} sx={{ mb: 1.5, p: { xs: 1, md: 1.5 }, cursor: 'pointer', borderRadius: 2, bgcolor: selectedForum?.id === post.id && viewMode === 'forum_detail' ? 'rgba(234, 124, 105, 0.1)' : '#252836', border: selectedForum?.id === post.id && viewMode === 'forum_detail' ? '1px solid #EA7C69' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(234, 124, 105, 0.05)' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ width: '85%' }}>
                  <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1.3, mb: 0.5 }}>{post.name}</Typography>
                  <Typography variant="caption" sx={{ color: '#d1d1d1ff', lineHeight: 1.2, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ color: '#EA7C69', fontWeight: 'bold' }}>By: {post.author}</span>{" • " + new Date(post.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                {((currentUser && post.author === currentUser.displayName) || post.author === currentUser?.email.split('@')[0]) && <IconButton size="small" onClick={(e) => handleMenu(e, post, 'forum')} sx={{ color: '#ABBBC2', p: 0.5, mt: -0.5, mr: -0.5 }}><MoreVert fontSize="small" /></IconButton>}
              </Box>
            </Card>
          )))}
        </Box>
        {Math.ceil(filteredForums.length / FORUMS_PER_PAGE) > 1 && (<Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}><Pagination count={Math.ceil(filteredForums.length / FORUMS_PER_PAGE)} page={forumPage} onChange={(e, v) => setForumPage(v)} size="small" shape="rounded" sx={{ '& .MuiPaginationItem-root': { color: '#ABBBC2' }, '& .Mui-selected': { bgcolor: '#EA7C69', color: 'white' } }} /></Box>)}
      </Box>

      {/*  RIGHT CONTENT AREA  */}
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {viewMode === 'blog' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 2, mt: -2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>Your Blogs</Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#393C49', borderRadius: '4px' } }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2, md: 2.5, lg: 3 }, width: '100%' }}>
                <Card onClick={() => handleOpenModal('blog')} sx={{ width: '100%', bgcolor: 'transparent', border: '2px dashed #EA7C69', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.3s', aspectRatio: '3/4', '&:hover': { bgcolor: 'rgba(234, 124, 105, 0.1)', transform: 'translateY(-5px)' } }}>
                  <AddCircleOutline sx={{ fontSize: { xs: 40, sm: 50, md: 60 }, mb: { xs: 1, sm: 2 }, color: '#EA7C69' }} /><Typography variant="h6" sx={{ color: '#EA7C69', fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '1rem', md: '1.25rem' }, textAlign: 'center', px: 1 }}>Write New Blog</Typography>
                </Card>
                {data.blogs.map((blog) => (
                  <Card key={blog.id} sx={{ width: '100%', bgcolor: '#1F1D2B', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', transition: 'all 0.3s', aspectRatio: '3/4', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', borderColor: '#EA7C69' } }}>
                    <CardMedia component="img" image={blog.imageUrl} alt={blog.name} sx={{ objectFit: 'cover', width: '100%', height: '45%', flexShrink: 0 }} />
                    <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
                      <Box><Chip label={blog.region} size="small" sx={{ bgcolor: 'rgba(234,124,105,0.2)', color: '#EA7C69', fontSize: { xs: '0.65rem', sm: '0.7rem' }, fontWeight: 'bold', mb: 1, height: { xs: 20, sm: 24 } }} /><Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{blog.name}</Typography></Box>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button variant="outlined" fullWidth startIcon={<Edit sx={{ fontSize: { xs: 16, sm: 20 } }} />} onClick={() => handleOpenModal('blog', blog)} sx={{ color: '#EA7C69', borderColor: '#EA7C69', flexGrow: 1, fontSize: { xs: '0.7rem', sm: '0.8rem' }, py: { xs: 0.4, sm: 0.5 }, minWidth: 0 }}>Edit</Button>
                        <IconButton onClick={() => { setMenu({ anchor: null, item: blog, type: 'blog' }); setModals(p => ({ ...p, deleteConfirm: true })); }} sx={{ color: '#ABBBC2', border: '1px solid #393C49', borderRadius: 1, p: { xs: 0.4, sm: 0.5 }, minWidth: { xs: 32, sm: 36 }, width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 } }}><DeleteOutline sx={{ fontSize: { xs: 18, sm: 20 } }} /></IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          selectedForum ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 2, mt: -2 }}>
                <Button onClick={() => { navigate('/blog'); setViewMode('blog'); setSelectedForum(null); setComments([]); setInteract(p => ({ ...p, activeReplyId: null })); }} startIcon={<ArrowBackRounded />} sx={{ color: '#EA7C69', border: '1px solid rgba(234,124,105,0.3)', borderRadius: 2, px: 2 }}>Back</Button>
                <Typography variant="h6" sx={{ color: '#EA7C69', fontWeight: 'bold', flexGrow: 1, ml: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedForum.name}</Typography>
                {((currentUser && selectedForum.author === currentUser.displayName) || selectedForum.author === currentUser?.email.split('@')[0]) && <IconButton onClick={(e) => handleMenu(e, selectedForum, 'forum')} sx={{ color: '#ABBBC2' }}><MoreVert /></IconButton>}
              </Box>
              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, pt: 1, bgcolor: '#181621', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#252836', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar src={selectedForum.author_photo} sx={{ width: 48, height: 48, bgcolor: '#EA7C69', fontWeight: 'bold', cursor: selectedForum.author_uid ? 'pointer' : 'default', border: '2px solid rgba(255,255,255,0.1)' }} onClick={() => selectedForum.author_uid && navigate(`/profile/${selectedForum.author_uid}`)}>{selectedForum.author ? selectedForum.author[0].toUpperCase() : "A"}</Avatar>
                    <Box><Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', cursor: selectedForum.author_uid ? 'pointer' : 'default', '&:hover': selectedForum.author_uid ? { color: '#EA7C69', textDecoration: 'underline' } : {} }} onClick={() => selectedForum.author_uid && navigate(`/profile/${selectedForum.author_uid}`)}>{selectedForum.author}</Typography><Typography variant="caption" sx={{ color: '#EA7C69' }}>Thread Starter • {new Date(selectedForum.createdAt).toLocaleString()}</Typography></Box>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
                  <Typography component="div" variant="body1" sx={{ color: '#E0E6E9', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{(() => { try { return <div dangerouslySetInnerHTML={{ __html: JSON.parse(selectedForum.introduction)[0]?.content || selectedForum.introduction }} />; } catch { return selectedForum.introduction; } })()}</Typography>
                </Paper>

                {/*  COMMENT INPUT AREA  */}
                {/* [MOD] Reduced padding (p: 1.5) and gap (gap: 1) for better mobile space */}
                <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, mb: 4, borderRadius: 3, bgcolor: '#1F1D2B', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Box sx={{ display: 'flex', gap: { xs: 1, md: 1.5 }, alignItems: 'flex-start' }}>
                    <Avatar src={currentUser?.photoURL} sx={{ width: 36, height: 36, mt: 0.5 }} />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <TextField fullWidth multiline maxRows={4} placeholder="Write a comment..." variant="outlined" value={interact.newComment} onChange={(e) => setInteract(p => ({ ...p, newComment: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }} sx={{ ...commentInputStyle, '& .MuiOutlinedInput-root': { ...commentInputStyle['& .MuiOutlinedInput-root'], padding: '10px 14px', minHeight: '40px' } }} />
                    </Box>
                    {/* [MOD] Reduced button size on mobile (40->36px) to give more room to input */}
                    <IconButton onClick={() => handleSendComment()} disabled={interact.isSending} sx={{ width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 }, mt: 0.2, bgcolor: '#EA7C69', color: 'white', borderRadius: '12px', '&:hover': { bgcolor: '#d96552' } }}>
                      {interact.isSending ? <CircularProgress size={20} color="inherit" /> : <SendRounded sx={{ fontSize: 20, ml: 0.5 }} />}
                    </IconButton>
                  </Box>
                </Paper>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {currentComments.map((cmt) => (
                    <React.Fragment key={cmt.id}>
                      {/* [MOD] Reduced padding on mobile for Comments */}
                      <Paper id={`comment-${cmt.id}`} elevation={0} sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 3, bgcolor: '#252836', border: '1px solid rgba(255,255,255,0.02)', mb: 1.5, transition: 'all 0.1s', '&:hover': { border: '1px solid rgba(255,255,255,0.1)' } }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                          <Avatar src={cmt.user.photo_url} onClick={() => navigate(`/profile/${cmt.user_uid}`)} sx={{ width: 36, height: 36, cursor: 'pointer', mt: 0.5, border: '1px solid rgba(255,255,255,0.1)' }}>{cmt.user.display_name[0]}</Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="subtitle2" onClick={() => navigate(`/profile/${cmt.user_uid}`)} sx={{ color: 'white', fontWeight: 700, cursor: 'pointer', '&:hover': { color: '#EA7C69' } }}>{cmt.user.display_name}</Typography>
                                  {cmt.user.display_name === selectedForum.author && (<Chip label="Author" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#EA7C69', color: 'white', fontWeight: 'bold' }} />)}
                                </Box>
                                <Typography variant="caption" sx={{ color: '#808191', fontSize: '0.7rem', mt: 0.2 }}>{new Date(cmt.created_at).toLocaleString()}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0 }}>
                                <Tooltip title="Reply"><IconButton size="small" onClick={() => setInteract(p => ({ ...p, activeReplyId: p.activeReplyId === cmt.id ? null : cmt.id, replyText: "" }))} sx={{ color: '#808191', '&:hover': { color: '#EA7C69', bgcolor: 'rgba(234,124,105,0.1)' } }}><Reply fontSize="small" /></IconButton></Tooltip>
                                {((currentUser && cmt.user_uid === currentUser.uid) || (cmt.user.display_name === (currentUser?.displayName || currentUser?.email.split('@')[0]))) && <IconButton size="small" onClick={(e) => handleMenu(e, cmt, 'comment')} sx={{ color: '#808191', '&:hover': { color: 'white' } }}><MoreVert fontSize="small" /></IconButton>}
                              </Box>
                            </Box>
                            {comments.find(c => c.id === cmt.parent_id) && <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', p: 1, borderRadius: 2, mb: 1, mt: 0.5, borderLeft: '3px solid #EA7C69' }}><Typography variant="caption" sx={{ color: '#fbf6f6ff', fontWeight: 'bold', display: 'block', mb: 0.3 }}>Replying to {comments.find(c => c.id === cmt.parent_id).user.display_name}:</Typography><Typography variant="body2" sx={{ color: '#ABBBC2', fontStyle: 'italic', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{comments.find(c => c.id === cmt.parent_id).content}</Typography></Box>}
                            <Typography variant="body2" sx={{ color: '#E0E6E9', lineHeight: 1.5, fontSize: '0.95rem', wordBreak: 'break-all', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{cmt.content}</Typography>
                          </Box>
                        </Box>
                      </Paper>
                      {interact.activeReplyId === cmt.id && (<Box sx={{ ml: 1, mt: 1, mb: 2, display: 'flex', gap: 2 }}><Avatar src={currentUser?.photoURL} sx={{ width: 32, height: 32 }} /><TextField fullWidth size="small" multiline maxRows={2} autoFocus placeholder={`Reply to ${cmt.user.display_name}...`} value={interact.replyText} onChange={(e) => setInteract(p => ({ ...p, replyText: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(cmt.id); } }} sx={{ ...commentInputStyle, flexGrow: 1 }} /><IconButton onClick={() => handleSendComment(cmt.id)} disabled={interact.isSending} sx={{ width: 40, height: 40, bgcolor: '#EA7C69', color: 'white', '&:hover': { bgcolor: '#d96552' } }}><SendRounded fontSize="small" /></IconButton></Box>)}
                    </React.Fragment>
                  ))}
                </Box>
                {Math.ceil(comments.length / COMMENTS_PER_PAGE) > 1 && (<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><Pagination count={Math.ceil(comments.length / COMMENTS_PER_PAGE)} page={interact.page} onChange={(e, v) => setInteract(p => ({ ...p, page: v }))} shape="rounded" sx={{ '& .MuiPaginationItem-root': { color: '#ABBBC2' }, '& .Mui-selected': { bgcolor: '#EA7C69', color: 'white' } }} /></Box>)}
              </Box>
            </Box>
          ) : <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ABBBC2' }}><ChatBubbleOutline sx={{ fontSize: 80, mb: 2, opacity: 0.2 }} /><Typography variant="h6">Select a topic to start discussing</Typography></Box>
        )}
      </Box>

      {/*  POPUPS & MENUS  */}
      <Menu anchorEl={menu.anchor} open={Boolean(menu.anchor)} onClose={() => setMenu(p => ({ ...p, anchor: null }))} PaperProps={{ sx: { bgcolor: '#252836', color: 'white', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <MenuItem onClick={handleEditClick}><Edit fontSize="small" sx={{ mr: 1 }} /> Edit</MenuItem>
        <MenuItem onClick={() => { setMenu(p => ({ ...p, anchor: null })); setModals(p => ({ ...p, deleteConfirm: true })); }} sx={{ color: '#ff4d4d' }}><DeleteOutline fontSize="small" sx={{ mr: 1 }} /> Delete</MenuItem>
      </Menu>

      <Dialog open={modals.editComment} onClose={() => setModals(p => ({ ...p, editComment: false }))} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: '#252836', color: 'white' } }}>
        <DialogTitle>Edit Comment</DialogTitle>
        <DialogContent><TextField fullWidth multiline rows={3} value={modals.editContent} onChange={(e) => setModals(p => ({ ...p, editContent: e.target.value }))} sx={{ ...transparentInputStyle, mt: 2 }} /></DialogContent>
        <DialogActions><Button onClick={() => setModals(p => ({ ...p, editComment: false }))} sx={{ color: '#ABBBC2' }}>Cancel</Button><Button variant="contained" onClick={() => handleAction('saveComment')} sx={{ bgcolor: '#EA7C69' }}>Save</Button></DialogActions>
      </Dialog>

      <Dialog open={modals.open} onClose={() => setModals(p => ({ ...p, open: false }))} fullWidth maxWidth="md" PaperProps={{ sx: { bgcolor: '#252836', color: 'white', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="h6" fontWeight="bold">{modals.type === 'blog' ? (form.isEdit ? "Edit Blog" : "Create New Blog") : "Create New Topic"}</Typography><IconButton onClick={() => setModals(p => ({ ...p, open: false }))} sx={{ color: '#ABBBC2' }}><Close /></IconButton></DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <TextField fullWidth label={modals.type === 'blog' ? "Dish Name (Title)" : "Topic Title"} variant="outlined" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} sx={{ ...transparentInputStyle, mt: 2 }} />
          <Typography variant="body2" sx={{ color: '#ABBBC2', mb: 1 }}>{modals.type === 'blog' ? "Description & Story:" : "Content:"}</Typography>
          <Box sx={{ bgcolor: '#1F1D2B', borderRadius: 1, overflow: 'hidden', mb: 3, border: '1px solid rgba(255,255,255,0.2)', '& .rsw-editor': { minHeight: '200px', color: 'white', padding: '15px', fontSize: '1rem', outline: 'none' } }} onKeyDown={handleEditorKeyDown}>
            <EditorProvider><CustomToolbar /><Editor value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Start typing..." /></EditorProvider>
          </Box>
          {modals.type === 'blog' && (
            <>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}><Button variant="outlined" component="label" fullWidth startIcon={<ImageIcon />} sx={{ height: '56px', color: form.imageFile ? '#EA7C69' : '#ABBBC2', borderColor: form.imageFile ? '#EA7C69' : '#393C49', borderStyle: 'dashed', '&:hover': { borderColor: '#EA7C69', bgcolor: 'rgba(234,124,105,0.05)' } }}>{form.imageFile ? "Change Image" : (form.previewImg ? "Change Cover" : "Upload Cover")}<input type="file" hidden onChange={(e) => { if (e.target.files[0]) { setForm(p => ({ ...p, imageFile: e.target.files[0], previewImg: URL.createObjectURL(e.target.files[0]) })); } }} accept="image/*" /></Button>{form.previewImg && (<Box sx={{ mt: 1, borderRadius: 2, overflow: 'hidden', height: 100, width: '100%' }}><img src={form.previewImg} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Box>)}</Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="YouTube Link" placeholder="https://youtube.com/..." value={form.youtubeLink} onChange={(e) => setForm(p => ({ ...p, youtubeLink: e.target.value }))} sx={transparentInputStyle} InputProps={{ endAdornment: <YouTube sx={{ color: 'red' }} /> }} /></Grid>
              </Grid>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={4}><FormControl fullWidth sx={transparentInputStyle}><InputLabel sx={{ color: '#ABBBC2', bgcolor: 'transparent', px: 0.5 }}>Region</InputLabel><Select value={form.region} onChange={(e) => setForm(p => ({ ...p, region: e.target.value }))} label="Region" sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '& .MuiSelect-select': { color: 'white' } }} MenuProps={{ PaperProps: { sx: { bgcolor: '#252836', color: 'white' } } }}>{REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={12} md={8}><TextField fullWidth label="City" value={form.city} onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} sx={{ ...transparentInputStyle, '& .MuiInputLabel-root': { color: 'white !important', bgcolor: 'transparent', px: 0.5 }, '& .MuiInputLabel-root.Mui-focused': { color: '#EA7C69 !important' } }} InputProps={{ endAdornment: <LocationOn sx={{ color: '#EA7C69' }} /> }} /></Grid>
                <Grid item xs={12}><FormControl fullWidth sx={transparentInputStyle}><InputLabel id="tags-label" shrink sx={{ color: '#ABBBC2', bgcolor: '#252836', px: 0.5 }}>Add Tags</InputLabel><Select labelId="tags-label" multiple displayEmpty value={form.tags} onChange={(e) => setForm(p => ({ ...p, tags: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value }))} input={<OutlinedInput label="Add Tags" />} renderValue={(sel) => sel.length === 0 ? <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>Select tags...</Typography> : <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{sel.map((v) => (<Chip key={v} label={v} onDelete={() => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== v) }))} onMouseDown={(e) => e.stopPropagation()} sx={{ bgcolor: '#EA7C69', color: 'white', fontWeight: 'bold', height: 24, '& .MuiChip-deleteIcon': { color: 'white', fontSize: 16 } }} />))}</Box>} sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#EA7C69' } }} MenuProps={{ PaperProps: { sx: { maxHeight: 200, bgcolor: '#252836', color: 'white' } } }}>{TAGS_OPTIONS.map((name) => (<MenuItem key={name} value={name}>{name}</MenuItem>))}</Select></FormControl></Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}><Button onClick={() => setModals(p => ({ ...p, open: false }))} sx={{ color: '#ABBBC2', mr: 1 }}>Cancel</Button><Button variant="contained" onClick={handleSaveData} disabled={modals.uploading} sx={{ bgcolor: '#EA7C69', fontWeight: 'bold', px: 4, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#d96552' } }}>{modals.uploading ? <CircularProgress size={24} color="inherit" /> : "Post"}</Button></DialogActions>
      </Dialog>

      <Dialog open={modals.deleteConfirm} onClose={() => setModals(p => ({ ...p, deleteConfirm: false }))} PaperProps={{ sx: { bgcolor: '#252836', color: 'white', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Delete</DialogTitle>
        <DialogContent><Typography sx={{ color: '#ABBBC2' }}>Are you sure you want to delete this?</Typography></DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}><Button onClick={() => setModals(p => ({ ...p, deleteConfirm: false }))} sx={{ color: '#ABBBC2' }}>Cancel</Button><Button onClick={() => handleAction('delete')} variant="contained" color="error" sx={{ fontWeight: 'bold' }}>Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default BlogPage;
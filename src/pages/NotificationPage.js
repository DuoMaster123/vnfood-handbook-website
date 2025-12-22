import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase';
import { 
  Box, Typography, Paper, Avatar, IconButton, Tooltip, 
  ButtonBase, Button, Pagination 
} from '@mui/material';
import { Circle, DeleteOutline, DoneAll, DeleteSweep } from '@mui/icons-material';

// API Configuration
const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api";
const ITEMS_PER_PAGE = 10;

function NotificationPage() {
  // State Management
  const [notifs, setNotifs] = useState([]);
  const [page, setPage] = useState(1);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  // Fetch notifications for the current user
  const fetchNotifs = async () => {
    if (!currentUser) return;
    try { 
      const res = await axios.get(`${API_URL}/notifications/${currentUser.uid}`);
      setNotifs(res.data); 
    } catch (e) { console.error("Fetch error:", e); }
  };

  useEffect(() => { fetchNotifs(); }, [currentUser]);

  // Mark notification as read and navigate
  const handleRead = async (notif) => {
    try {
        if (!notif.is_read) await axios.put(`${API_URL}/notifications/${notif.id}/read`);
        navigate(notif.link); 
    } catch (e) { console.error(e); }
  };

  // Delete a single notification
  const handleDelete = async (e, id) => {
      e.stopPropagation(); // Prevent triggering the read action
      if (!window.confirm("Delete this notification?")) return;
      try { 
        await axios.delete(`${API_URL}/notifications/${id}`); 
        setNotifs(prev => prev.filter(n => n.id !== id)); 
        
        // Go back a page if current page becomes empty
        const remainingOnPage = notifs.length - 1 - (page - 1) * ITEMS_PER_PAGE;
        if (remainingOnPage <= 0 && page > 1) setPage(p => p - 1);
      } catch (e) { console.error(e); }
  };

  // Bulk Actions
  const handleMarkAllRead = async () => {
    if (!notifs.some(n => !n.is_read)) return;
    try { await axios.put(`${API_URL}/notifications/read-all/${currentUser.uid}`); fetchNotifs(); } 
    catch (e) { console.error(e); }
  };

  const handleDeleteAll = async () => {
    if (!notifs.length || !window.confirm("Delete ALL notifications?")) return;
    try { await axios.delete(`${API_URL}/notifications/delete-all/${currentUser.uid}`); setNotifs([]); setPage(1); } 
    catch (e) { console.error(e); }
  };

  // Pagination Logic
  const totalPages = Math.ceil(notifs.length / ITEMS_PER_PAGE);
  const currentNotifs = notifs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      
      {/* Header Area with Bulk Actions */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>Notifications</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Mark all as read">
            <Button onClick={handleMarkAllRead} startIcon={<DoneAll />} size="small" sx={{ color: '#ABBBC2', textTransform: 'none', '&:hover': { color: '#EA7C69', bgcolor: 'rgba(234, 124, 105, 0.1)' } }}>Mark all read</Button>
          </Tooltip>
          <Tooltip title="Delete all">
            <Button onClick={handleDeleteAll} startIcon={<DeleteSweep />} size="small" sx={{ color: '#ABBBC2', textTransform: 'none', '&:hover': { color: '#ff4d4d', bgcolor: 'rgba(255, 77, 77, 0.1)' } }}>Delete all</Button>
          </Tooltip>
        </Box>
      </Box>
      
      {notifs.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 10, color: '#ABBBC2' }}><Typography variant="h6">No notifications yet.</Typography></Box>
      ) : (
          <>
            {/* List of Notifications */}
            {currentNotifs.map(notif => {
                const sender = notif.sender || {};
                const hasSender = sender.display_name && sender.display_name !== "System";
                const displayName = hasSender ? sender.display_name : "System";
                // Remove sender name from content to avoid duplication if backend sends it
                const content = hasSender ? notif.content.replace(displayName, "").trim() : notif.content;

                return (
                  <ButtonBase key={notif.id} onClick={() => handleRead(notif)} sx={{ width: "100%", textAlign: "left", borderRadius: 3, display: "block", mb: 2 }}>
                    <Paper sx={{ 
                      p: 2, borderRadius: 3, 
                      bgcolor: notif.is_read ? '#2D303E' : 'rgba(234, 124, 105, 0.25)', 
                      border: notif.is_read ? '1px solid rgba(255,255,255,0.1)' : '1px solid #EA7C69', 
                      display: 'flex', alignItems: 'center', gap: 2, position: 'relative', 
                      transition: 'all 0.2s', '&:hover': { bgcolor: notif.is_read ? '#1F1D2B' : 'rgba(234, 124, 105, 0.1)', transform: 'translateX(5px)' } 
                    }}>
                      {/* Unread Indicator Dot */}
                      {!notif.is_read && <Circle sx={{ color: '#EA7C69', fontSize: 10, position: 'absolute', top: 15, left: 10 }} />}
                      
                      {/* Sender Avatar (Clickable) */}
                      <Tooltip title={hasSender ? `View ${displayName}` : ""}>
                        <Avatar 
                          src={hasSender ? sender.photo_url : ""} 
                          onClick={(e) => { if(hasSender) { e.stopPropagation(); navigate(`/profile/${sender.uid}`); }}} 
                          sx={{ 
                            width: 50, height: 50, border: hasSender ? '2px solid #EA7C69' : 'none', 
                            bgcolor: hasSender ? '#252836' : '#393C49', cursor: hasSender ? 'pointer' : 'default', 
                            transition: '0.2s', '&:hover': hasSender ? { transform: 'scale(1.1)' } : {} 
                          }}
                        >
                          {displayName[0]}
                        </Avatar>
                      </Tooltip>

                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: notif.is_read ? 'normal' : 'bold', lineHeight: 1.4 }}>
                          {hasSender ? <><span style={{ color: '#EA7C69', fontWeight: 'bold' }}>{displayName}</span> {content}</> : notif.content}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ABBBC2', mt: 0.5, display: 'block' }}>{new Date(notif.created_at).toLocaleString()}</Typography>
                      </Box>

                      <Tooltip title="Delete">
                        <IconButton onClick={(e) => handleDelete(e, notif.id)} sx={{ color: '#ABBBC2', '&:hover': { color: '#ff4d4d', bgcolor: 'rgba(255, 77, 77, 0.1)' } }}>
                          <DeleteOutline />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  </ButtonBase>
                );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                <Pagination 
                  count={totalPages} page={page} onChange={handlePageChange} shape="rounded" 
                  sx={{ '& .MuiPaginationItem-root': { color: '#ABBBC2' }, '& .Mui-selected': { bgcolor: '#EA7C69 !important', color: 'white', fontWeight: 'bold' } }} 
                />
              </Box>
            )}
          </>
      )}
    </Box>
  );
}

export default NotificationPage;
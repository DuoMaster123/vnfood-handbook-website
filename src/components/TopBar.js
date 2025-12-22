import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Avatar, Menu, MenuItem } from '@mui/material';
import { AdminPanelSettingsRounded, MenuRounded, PersonRounded, LogoutRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import axios from 'axios';
import { auth } from '../firebase';

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api";
const LOGO_URL = "/assets/logo.png";

function TopBar({ title = "Home" }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mysqlUser, setMysqlUser] = useState({ displayName: "", photoUrl: "" });
  const currentUser = auth.currentUser;

  // Format current date (e.g., "Monday, Dec 21, 2025")
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  // Fetch user data and check Admin privileges
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const res = await axios.get(`${API_URL}/users/${currentUser.uid}`);
          if (res.data.role === 'admin') setIsAdmin(true);
          setMysqlUser({ displayName: res.data.display_name, photoUrl: res.data.photo_url });
        } catch (error) { console.error(error); }
      }
    };
    fetchUserData();
  }, [currentUser]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try { 
      await signOut(auth); 
      window.location.href = "/"; 
    } catch (error) { 
      console.error("Logout Error:", error); 
    }
  };

  return (
    <Box sx={{ 
      mb: { xs: 1.5, md: 3 }, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      gap: 2,
      pb: { xs: 1.5, md: 0 },
      borderBottom: { xs: '1px solid rgba(255,255,255,0.05)', md: 'none' } // Divider on mobile only
    }}>
      
      {/* Left Section: Logo & Page Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
        {/* Mobile Logo: Shown only on small screens */}
        <Box sx={{ 
          display: { xs: 'flex', md: 'none' },
          width: 40, height: 40, borderRadius: '12px',
          overflow: 'hidden', border: '2px solid #EA7C69',
          flexShrink: 0, bgcolor: '#1F1D2B',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(234, 124, 105, 0.3)'
        }}>
          <img src={LOGO_URL} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>

        {/* Page Title & Date */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, color: 'white', mb: 0,
              fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.125rem' },
              lineHeight: 1.2, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.5px'
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#ABBBC2', fontWeight: 400,
              display: { xs: 'none', sm: 'block' }, // Hide date on very small mobile
              fontSize: '0.85rem', mt: 0.3
            }}
          >
            {today}
          </Typography>
        </Box>
      </Box>

      {/* Right Section: Admin & Mobile Menu */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        
        {/* Desktop Admin Button */}
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AdminPanelSettingsRounded sx={{ fontSize: { xs: 18, md: 22 }, stroke: '#EA7C69', strokeWidth: 0.6 }} />}
            onClick={() => navigate('/admin')}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              bgcolor: '#2A2E37', color: '#EA7C69', 
              border: '1px solid rgba(234, 124, 105, 0.5)',
              fontWeight: 'bold', textTransform: 'none', 
              borderRadius: '12px', 
              px: { sm: 1.5, md: 2.2 }, py: { sm: 0.8, md: 1.1 },
              fontSize: { sm: '0.875rem', md: '1rem' },
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)', 
              '&:hover': { 
                bgcolor: '#EA7C69', color: '#fff', 
                borderColor: '#EA7C69', boxShadow: '0 4px 10px rgba(234, 124, 105, 0.25)' 
              }
            }}
          >
            Admin
          </Button>
        )}

        {/* Mobile Menu Trigger (Hamburger/Avatar) */}
        <IconButton
          onClick={handleMenuOpen}
          sx={{
            display: { xs: 'flex', md: 'none' }, // Mobile only
            color: '#EA7C69',
            border: '1px solid rgba(234, 124, 105, 0.3)',
            borderRadius: '12px',
            width: 40, height: 40
          }}
        >
          {mysqlUser.photoUrl ? (
            <Avatar src={mysqlUser.photoUrl} sx={{ width: 32, height: 32 }} />
          ) : (
            <MenuRounded />
          )}
        </IconButton>

        {/* Dropdown Menu (Responsive) */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{ sx: { bgcolor: '#1F1D2B', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', mt: 1 } }}
        >
          <MenuItem onClick={() => { navigate(`/profile/${currentUser?.uid}`); handleMenuClose(); }}>
            <PersonRounded sx={{ mr: 1, color: '#EA7C69' }} /> Profile
          </MenuItem>
          
          {/* Admin Link for Mobile */}
          {isAdmin && (
            <MenuItem onClick={() => { navigate('/admin'); handleMenuClose(); }}>
              <AdminPanelSettingsRounded sx={{ mr: 1, color: '#EA7C69' }} /> Admin Panel
            </MenuItem>
          )}
          
          <MenuItem onClick={handleLogout}>
            <LogoutRounded sx={{ mr: 1, color: '#EA7C69' }} /> Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}

export default TopBar;
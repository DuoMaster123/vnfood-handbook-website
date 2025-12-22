import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Box, IconButton, Avatar, Tooltip, Badge } from '@mui/material';
import { HomeRounded, CameraAltRounded, SportsEsportsRounded, DescriptionRounded, NotificationsRounded, LogoutRounded } from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';

const LOGO_URL = "/assets/logo.png";
const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api";
const SIDEBAR_WIDTH = 80;

// STYLES & ANIMATIONS 
// Moved outside component to prevent re-creation on every render
const glassStyle = {
  background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.08))',
  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '28px',
};

const sidebarVariants = {
  open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 25, staggerChildren: 0.05, delayChildren: 0.05 } },
  closed: { x: -100, opacity: 0, transition: { type: "tween", duration: 0.25, ease: "easeInOut", staggerChildren: 0.03, staggerDirection: -1 } }
};

const itemVariants = { 
  open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }, 
  closed: { x: -20, opacity: 0 } 
};

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const { unreadCount } = useData();
  const currentUser = auth.currentUser;
  const [mysqlUser, setMysqlUser] = useState({ displayName: "", photoUrl: "" });

  const menuItems = [
    { path: '/home', icon: <HomeRounded />, label: 'Home' },
    { path: '/recognize', icon: <CameraAltRounded />, label: 'AI Camera' },
    { path: '/minigame', icon: <SportsEsportsRounded />, label: 'Mini Game' },
    { path: '/blog', icon: <DescriptionRounded />, label: 'Blog' },
    { path: '/notifications', icon: <Badge badgeContent={unreadCount} color="error"><NotificationsRounded /></Badge>, label: 'Notifications' },
  ];

  // Fetch user profile from MySQL backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const res = await axios.get(`${API_URL}/users/${currentUser.uid}`);
          setMysqlUser({ displayName: res.data.display_name, photoUrl: res.data.photo_url });
        } catch (error) { console.error("Error fetching sidebar user data:", error); }
      }
    };
    fetchUserData();
  }, [currentUser]);

  const handleLogout = async () => {
    try { 
      await signOut(auth); 
      window.location.href = "/"; 
    } catch (error) { console.error("Logout Error:", error); }
  };

  return (
    // Desktop Sidebar Container (Fixed position)
    <Box sx={{ 
      position: 'sticky', top: 0, height: '100vh', width: SIDEBAR_WIDTH, 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      zIndex: 1200, pt: '3vh', ml: '2px' 
    }}>
      
      {/* Logo / Toggle Button */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Box onClick={() => setIsOpen(!isOpen)} sx={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', border: '2px solid #EA7C69', mb: 3, cursor: 'pointer', bgcolor: '#1F1D2B' }}>
          <img src={LOGO_URL} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
      </motion.div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial="closed" animate="open" exit="closed" variants={sidebarVariants} style={{ width: '100%' }}>
            <Box sx={{ ...glassStyle, width: '100%', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', justifyContent: 'space-between' }}>

              {/* Navigation Items */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, alignItems: 'center', width: '100%' }}>
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path || 
                                   (item.path === '/blog' && location.pathname.startsWith('/forum/')) || 
                                   (item.path === '/home' && location.pathname.startsWith('/dish/'));
                  
                  return (
                    <motion.div key={item.path} variants={itemVariants} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <Box sx={{ position: 'relative', width: 48, height: 48, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {/* Active Indicator Background */}
                        {isActive && <motion.div layoutId="active-pill" style={{ position: 'absolute', inset: 0, borderRadius: '16px', backgroundColor: '#EA7C69' }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                        
                        <Tooltip title={item.label} placement="right" arrow>
                          <IconButton onClick={() => navigate(item.path)} disableRipple sx={{ zIndex: 1, width: 48, height: 48, color: isActive ? '#ffffff' : '#EA7C69', transition: 'color 0.2s', '&:hover': { color: isActive ? '#ffffff' : '#FF9F8E' }, boxShadow: 'none', backdropFilter: 'none' }}>
                            {React.cloneElement(item.icon, { sx: { fontSize: 24 } })}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </motion.div>
                  );
                })}
              </Box>

              {/* User Actions (Profile & Logout) */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                <motion.div variants={itemVariants}>
                  <Tooltip title={mysqlUser.displayName || "Profile"}>
                    <Box onClick={() => currentUser && navigate(`/profile/${currentUser.uid}`)} sx={{ p: 0.3, border: '2px solid #EA7C69', borderRadius: '50%', cursor: 'pointer' }}>
                      <Avatar src={mysqlUser.photoUrl} sx={{ width: 40, height: 40, bgcolor: '#252836' }}>{mysqlUser.displayName ? mysqlUser.displayName.charAt(0).toUpperCase() : "U"}</Avatar>
                    </Box>
                  </Tooltip>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <Tooltip title="Logout">
                    <IconButton onClick={handleLogout} sx={{ color: '#EA7C69', width: 44, height: 44, borderRadius: '12px', border: '1px solid rgba(234, 124, 105, 0.2)', '&:hover': { bgcolor: '#EA7C69', color: '#fff' }, boxShadow: 'none', backdropFilter: 'none' }}>
                      <LogoutRounded sx={{ fontSize: 22, transform: 'rotate(180deg)' }} />
                    </IconButton>
                  </Tooltip>
                </motion.div>
              </Box>

            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

export default Sidebar;
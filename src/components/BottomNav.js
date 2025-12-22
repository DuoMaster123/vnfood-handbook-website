import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Badge } from '@mui/material';
import { HomeRounded, CameraAltRounded, SportsEsportsRounded, DescriptionRounded, NotificationsRounded } from '@mui/icons-material';
import { useData } from '../context/DataContext';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useData();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide navigation bar on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const menuItems = [
    { path: '/home', icon: <HomeRounded />, label: 'Home' },
    { path: '/recognize', icon: <CameraAltRounded />, label: 'Camera' },
    { path: '/minigame', icon: <SportsEsportsRounded />, label: 'Games' },
    { path: '/blog', icon: <DescriptionRounded />, label: 'Blog' },
    { path: '/notifications', icon: <NotificationsRounded />, label: 'Alerts', badge: unreadCount },
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '56px',
        bgcolor: 'rgba(31, 29, 43, 0.98)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: { xs: 'flex', md: 'none' },
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 1300,
        px: 1,
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {menuItems.map((item) => {
        // Determine active state including nested routes
        const isActive = 
          location.pathname === item.path || 
          (item.path === '/blog' && location.pathname.startsWith('/forum/')) ||
          (item.path === '/home' && location.pathname.startsWith('/dish/'));

        return (
          <Box
            key={item.path}
            onClick={() => navigate(item.path)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '40px',
              cursor: 'pointer',
              borderRadius: '12px',
              bgcolor: isActive ? '#EA7C69' : 'transparent', 
              color: isActive ? '#ffffff' : '#808191', 
              transition: 'all 0.15s ease-out',
              '&:active': { transform: 'scale(0.95)' }
            }}
          >
            {item.badge ? (
              <Badge 
                badgeContent={item.badge} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6rem', height: '16px', minWidth: '16px', px: 0.5,
                    border: '2px solid #1F1D2B', top: 2, right: 2
                  }
                }}
              >
                {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
              </Badge>
            ) : (
              React.cloneElement(item.icon, { sx: { fontSize: 20 } })
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default BottomNav;
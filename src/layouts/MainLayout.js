import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { Box } from '@mui/material';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import RightSidebar from '../components/RightSidebar';
import BottomNav from '../components/BottomNav';
import Chatbot from '../components/Chatbot';
import Footer from '../components/Footer'; 

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api";

function MainLayout({ children, title }) {
  const location = useLocation();
  const { dishName } = useParams(); 
  const [currentDish, setCurrentDish] = useState(null); 

  const isDetailPage = location.pathname.startsWith('/dish/');

  // Fetch dish details when navigating to a specific dish page
  useEffect(() => {
    const fetchDishForSidebar = async () => {
      if (isDetailPage && dishName) {
        try {
          const response = await axios.get(`${API_URL}/foods/${dishName}`);
          setCurrentDish(response.data);
        } catch (error) { setCurrentDish(null); }
      } else {
        setCurrentDish(null);
      }
    };
    fetchDishForSidebar();
  }, [isDetailPage, dishName]);

  // Handle Browser Tab Title (Document Title) globally
  useEffect(() => {
    const baseTitle = "VN Food Handbook";
    if (isDetailPage && currentDish) {
      document.title = `${currentDish.name} - ${baseTitle}`;
    } else if (title) {
      document.title = `${title} - ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [title, isDetailPage, currentDish]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#252836' }}>
      
      {/* Main Container with Responsive Direction */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        flexGrow: 1, 
        position: 'relative' 
      }}>
        
        {/* Desktop Sidebar */}
        <Box sx={{ 
          width: { xs: 0, md: '120px' }, 
          flexShrink: 0, 
          display: { xs: 'none', md: 'flex' },
          justifyContent: 'flex-start', 
          pl: { md: 2 }, 
          boxSizing: 'border-box' 
        }}>
           <Sidebar />
        </Box>

        {/* Center Content Area */}
        <Box sx={{ 
          flexGrow: 1, 
          padding: { xs: '12px 16px', sm: 3, md: 4 },
          paddingBottom: { xs: '80px', md: 4 }, // Extra padding for mobile bottom nav
          color: 'white', 
          transition: 'all 0.3s ease', 
          width: '100%', 
          minHeight: '80vh',
          maxWidth: '100%',
          overflowX: 'hidden'
        }}>
          <TopBar title={title} />
          {children}
          
          {/* Mobile Right Sidebar (Shown below content) */}
          {isDetailPage && currentDish && (
            <Box sx={{ display: { xs: 'block', lg: 'none' }, mt: 4 }}>
              <RightSidebar dish={currentDish} />
            </Box>
          )}
        </Box>
        
        {/* Desktop Right Sidebar (Sticky) */}
        {isDetailPage && currentDish && (
          <Box sx={{ 
            width: '400px', 
            flexShrink: 0, 
            position: 'sticky', 
            top: 0, 
            height: '100vh', 
            zIndex: 1000, 
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            display: { xs: 'none', lg: 'block' }
          }}>
            <RightSidebar dish={currentDish} />
          </Box>
        )}

      </Box>

      <Footer />
      <Chatbot />
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </Box>
  );
}

export default MainLayout;
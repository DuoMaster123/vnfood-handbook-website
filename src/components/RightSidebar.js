import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'; 
import '@google/model-viewer'; 

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000");

function RightSidebar({ dish }) {
  const [activeTab, setActiveTab] = useState('Map'); 

  // Process dish name
  const shortName = dish.name ? dish.name.split(/[–-]/)[0].trim() : "Dish";
  
  // Resolve location string based on city or region
  const location = (dish.city && dish.city.trim() !== "" && dish.city !== "General") 
    ? `${dish.city}, Vietnam` 
    : (dish.region ? `${dish.region}, Vietnam` : "Vietnam");
  
  // Search query optimized for restaurants density
  const query = encodeURIComponent(`${shortName} restaurants in ${location}`);
  
  // Map sources with adjusted zoom level to 12
  const mapSrc = `https://www.google.com/maps?q=${query}&output=embed&z=12`;
  const googleMapLink = `https://www.google.com/maps/search/${query}`;
  
  // Asset paths
  const modelSrc = `${API_URL}/static/models/${dish.slug}.glb`;
  
  // Reference logic for videos
  const recipeData = dish.recipe || "";
  const isVideoId = recipeData.length > 0 && recipeData.length < 20 && !recipeData.includes('http');
  const searchLink = `https://www.youtube.com/results?search_query=cách+làm+${encodeURIComponent(shortName)}`;

  // Component styling for tabs
  const getButtonStyle = (tabName) => {
    const isActive = activeTab === tabName;
    return {
      bgcolor: isActive ? '#EA7C69' : 'rgba(255, 255, 255, 0.05)',
      color: isActive ? 'white' : '#EA7C69',
      borderColor: '#EA7C69', borderRadius: '8px !important',
      border: '1px solid #EA7C69', fontWeight: 'bold', fontSize: '0.75rem',
      textTransform: 'none', px: 2, py: 0.5,
      '&:hover': { bgcolor: isActive ? '#d96552' : 'rgba(234, 124, 105, 0.1)', borderColor: '#EA7C69' }
    };
  };

  return (
    <Box sx={{ 
      width: '100%', bgcolor: '#1F1D2B', p: { xs: 2, md: 3 }, 
      height: { xs: 'auto', lg: '100%' }, 
      borderLeft: { xs: 'none', lg: '1px solid rgba(255,255,255,0.1)' }, 
      borderTop: { xs: '1px solid rgba(255,255,255,0.1)', lg: 'none' }, 
      overflowY: 'auto', display: 'flex', flexDirection: 'column',
      borderRadius: { xs: 3, lg: 0 }, mt: { xs: 3, lg: 0 } 
    }}>
      
      {/* Information Header */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: 'white', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
        Dish name: {shortName}
      </Typography>

      {/* Tab Navigation */}
      <Box sx={{ display: 'flex', gap: { xs: 1, md: 1.5 }, mb: 3, mt: 2, flexWrap: 'wrap' }}>
        <Button sx={getButtonStyle('Map')} onClick={() => setActiveTab('Map')}>Map</Button>
        <Button sx={getButtonStyle('3D Model')} onClick={() => setActiveTab('3D Model')}>3D Model</Button>
        <Button sx={getButtonStyle('Reference')} onClick={() => setActiveTab('Reference')}>Reference</Button>
      </Box>

      <Typography variant="h6" sx={{ mb: 2, color: 'white', fontSize: '1rem' }}>
        Famous in: <span style={{color: '#EA7C69', fontWeight: 'bold'}}>{location}</span>
      </Typography>

      {/* Dynamic Content Display */}
      {activeTab === 'Map' && (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ borderRadius: 3, overflow: 'hidden', height: '400px', bgcolor: '#2D303E', mb: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
             <iframe 
               title="Google Map" 
               width="100%" 
               height="100%" 
               style={{ border: 0, display: 'block' }} 
               loading="lazy" 
               allowFullScreen 
               src={mapSrc}
             ></iframe>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            variant="contained" fullWidth
            sx={{ mt: 2, bgcolor: '#EA7C69', color: 'white', fontWeight: 'bold', borderRadius: 2, py: 1.5, textTransform: 'none', fontSize: '1rem', '&:hover': { bgcolor: '#d96552' } }}
            onClick={() => window.open(googleMapLink, '_blank')}
          >
            Open in Google Maps
          </Button>
        </Box>
      )}

      {activeTab === '3D Model' && (
        <Box sx={{ bgcolor: '#2D303E', borderRadius: 4, p: 2, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1, minHeight: '300px', width: '100%', mb: 2 }}>
            <model-viewer 
              src={modelSrc} 
              alt={`3D model of ${dish.name}`} 
              auto-rotate 
              camera-controls 
              ar 
              ar-modes="webxr scene-viewer quick-look" 
              shadow-intensity="1" 
              style={{ width: '100%', height: '100%', display: 'block', minHeight: '400px' }}
            ></model-viewer>
          </Box>
          <Typography variant="caption" sx={{color: '#ABBBC2', display: 'block', py: 1}}>Interactive 3D View. (Open on mobile to view in AR)</Typography>
        </Box>
      )}

      {activeTab === 'Reference' && (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>Video Tutorial</Typography>
          {isVideoId ? (
            <Box sx={{ borderRadius: 4, overflow: 'hidden', mb: 3, height: '220px', bgcolor: 'black', border: '1px solid rgba(255,255,255,0.1)' }}>
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${recipeData}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ display: 'block' }}></iframe>
            </Box>
          ) : (
            <Box onClick={() => window.open(searchLink, '_blank')} sx={{ borderRadius: 4, mb: 3, height: '220px', bgcolor: '#252836', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { bgcolor: '#2D303E', borderColor: '#EA7C69' } }}>
              <PlayCircleOutlineIcon sx={{ fontSize: 60, color: '#EA7C69', mb: 1 }} />
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>Search on YouTube</Typography>
              <Typography variant="caption" sx={{ color: '#ABBBC2' }}>(Video not added yet)</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default RightSidebar;
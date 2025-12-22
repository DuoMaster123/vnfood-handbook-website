import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardMedia } from '@mui/material';

function FoodCard({ food }) {
  const navigate = useNavigate();

  // Determine author name (fallback to default if missing)
  const displayAuthor = food.author || "galaxy123";
  
  // Format creation date (handle both Firestore timestamp and ISO string)
  const dateObj = food.createdAt?.seconds 
    ? new Date(food.createdAt.seconds * 1000) 
    : new Date(food.createdAt || Date.now());
  const displayDate = dateObj.toLocaleDateString('en-GB');

  // Cache Busting Strategy: Append timestamp to force refresh updated images
  const imageUrl = food.imageUrl && !food.imageUrl.startsWith("http") 
    ? `${food.imageUrl}?t=${new Date().getTime()}` 
    : (food.imageUrl || "/assets/placeholder.png");

  return (
    <Card 
      onClick={() => navigate(`/dish/${food.slug}`)}
      sx={{
        width: '100%',
        height: '100%',
        margin: '0 auto',
        backgroundColor: '#1F1D2B',
        borderRadius: { xs: '14px', sm: '16px' },
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        // Hover effects: Lift card and zoom image
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 28px rgba(234, 124, 105, 0.25)',
          border: '1px solid rgba(234, 124, 105, 0.3)',
          '& .food-image': {
            transform: 'scale(1.08)',
          }
        },
        '&:active': {
          transform: 'translateY(-2px) scale(0.98)',
        }
      }}
    >
      {/* Image Wrapper - Maintains Aspect Ratio */}
      <Box sx={{ 
        width: '100%', 
        paddingTop: { xs: '100%', sm: '75%' }, // 1:1 on Mobile, 4:3 on Desktop
        overflow: 'hidden', 
        bgcolor: '#252836',
        position: 'relative',
        flexShrink: 0
      }}>
        <CardMedia
          component="img"
          image={imageUrl}
          alt={food.name}
          className="food-image"
          sx={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%', 
            objectFit: 'cover',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          // Fallback if image fails to load
          onError={(e) => { e.target.onerror = null; e.target.src = "/assets/placeholder.png"; }}
        />
        
        {/* Gradient Overlay for better depth */}
        <Box sx={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '50%',
          background: 'linear-gradient(to top, rgba(31,29,43,0.7), transparent)',
          pointerEvents: 'none'
        }} />
      </Box>
      
      {/* Card Content */}
      <Box sx={{ 
        p: { xs: 1.2, sm: 2 },
        display: 'flex', 
        flexDirection: 'column',
        gap: { xs: 0.8, sm: 1.5 },
        flexGrow: 1,
        justifyContent: 'space-between'
      }}>
        {/* Title - Limit to 2 lines */}
        <Typography variant="h6" sx={{ 
          color: 'white', 
          fontWeight: 700, 
          fontSize: { xs: '0.85rem', sm: '0.95rem' }, 
          lineHeight: 1.25, 
          display: '-webkit-box', 
          overflow: 'hidden', 
          WebkitBoxOrient: 'vertical', 
          WebkitLineClamp: 2,
          height: { xs: '2.5em', sm: '2.6em' },
          letterSpacing: '-0.3px'
        }}>
          {food.name}
        </Typography>

        {/* Footer: Author & Date */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 0.5,
          pt: { xs: 0.5, sm: 1 },
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Author Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1 }}>
            <Box sx={{ width: { xs: 4, sm: 5 }, height: { xs: 4, sm: 5 }, borderRadius: '50%', bgcolor: '#EA7C69', flexShrink: 0 }} />
            <Typography variant="body2" sx={{ 
              color: '#EA7C69', 
              fontSize: { xs: '0.7rem', sm: '0.8rem' }, 
              fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {displayAuthor}
            </Typography>
          </Box>
          
          {/* Creation Date */}
          <Typography variant="caption" sx={{ color: '#ABBBC2', fontSize: { xs: '0.65rem', sm: '0.72rem' }, fontWeight: 500, flexShrink: 0 }}>
            {displayDate}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

export default FoodCard;
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';

const BACKGROUND_URL = "/assets/background.png";
const LOGO_URL = "/assets/logo.png";

function LandingPage() {
  return (
    <Box sx={{
      minHeight: '100vh', width: '100%',
      bgcolor: '#1F1D2B',
      backgroundImage: `linear-gradient(rgba(31, 29, 43, 0.3), rgba(31, 29, 43, 0.75)), url(${BACKGROUND_URL})`,
      backgroundRepeat: 'repeat', backgroundSize: '1200px', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', textAlign: 'center', p: 2
    }}>
      <Container maxWidth="sm">
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <img src={LOGO_URL} alt="App Logo" style={{ width: '120px', height: '120px', objectFit: 'contain', border: '3px solid #EA7C69', borderRadius: '50%' }} />
        </Box>

        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Viet Nam Food Handbook
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4, color: '#ABBBC2', fontSize: '1.1rem' }}>
          Experience unique dishes from all regions of Vietnam. Log in or create an account to start your culinary journey.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button 
            component={RouterLink} to="/login" variant="contained" 
            sx={{ bgcolor: '#EA7C69', color: 'white', fontWeight: 'bold', px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1.1rem', '&:hover': { bgcolor: '#d96552' } }}
          >
            Login or Signup
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default LandingPage;
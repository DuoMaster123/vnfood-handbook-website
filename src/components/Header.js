import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import FoodBankIcon from '@mui/icons-material/FoodBank';

function Header() {
  return (
    // main navigation bar at the top
    <AppBar position="static" sx={{ mb: 4 }}> 
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <FoodBankIcon sx={{ mr: 1 }} />
          
          {/* app branding and home link */}
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}
          >
            VN Food Handbook
          </Typography>

          <Button color="inherit" component={RouterLink} to="/">
            Home
          </Button>
          
          <Button color="inherit" component={RouterLink} to="/recognize">
            AI Recognition
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Header;
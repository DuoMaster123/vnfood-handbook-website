import React, { useState } from 'react';
import { Box, Typography, Card, CardActionArea, Grid } from '@mui/material';
import ExtensionIcon from '@mui/icons-material/Extension';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';

// Game Components
import PuzzleGame from '../components/games/PuzzleGame';
import HangmanGame from '../components/games/HangmanGame';
import FoodMemoryGame from '../components/games/FoodMemoryGame';

// Game Configuration
const GAMES = [
  { id: 'puzzle', title: 'Food Puzzle', description: 'Piece together delicious Vietnamese dishes.', icon: <ExtensionIcon sx={{ fontSize: 60, color: '#EA7C69' }} /> },
  { id: 'hangman', title: 'Food Hangman', description: 'Guess the dish before the stickman is hanged.', icon: <SpellcheckIcon sx={{ fontSize: 60, color: '#EA7C69' }} /> },
  { id: 'memory', title: 'Food Memory', description: 'Flip cards and match all pairs. Test your speed!', icon: <FlipCameraAndroidIcon sx={{ fontSize: 60, color: '#EA7C69' }} /> }
];

function MiniGamePage() {
  const [selectedGame, setSelectedGame] = useState(null);

  // Render active game
  if (selectedGame === 'puzzle') return <PuzzleGame onBack={() => setSelectedGame(null)} />;
  if (selectedGame === 'hangman') return <HangmanGame onBack={() => setSelectedGame(null)} />;
  if (selectedGame === 'memory') return <FoodMemoryGame onBack={() => setSelectedGame(null)} />;

  // Render Menu
  return (
    <Box sx={{ minHeight: '80vh', p: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'white' }}>Mini Games Center</Typography>
      <Typography variant="body1" sx={{ color: '#ABBBC2', mb: 5 }}>Relax and learn about Vietnamese cuisine through fun games.</Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Grid container spacing={4} sx={{ maxWidth: '1200px', justifyContent: 'center' }}>
          {GAMES.map((game) => (
            <Grid item xs={12} sm={6} md={4} key={game.id} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card sx={{ bgcolor: "#252836", borderRadius: 4, border: "1px solid rgba(255, 255, 255, 0.5)", height: 280, width: '100%', maxWidth: 380, transition: "all 0.3s ease", display: "flex", alignItems: "center", justifyContent: "center", "&:hover": { transform: "translateY(-6px)", borderColor: "#EA7C69", boxShadow: "0 12px 30px rgba(234,124,105,0.18)" } }}>
                <CardActionArea onClick={() => setSelectedGame(game.id)} sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", p: 3, textAlign: "center" }}>
                  <Box sx={{ width: 90, height: 90, borderRadius: "50%", mb: 2, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, rgba(234,124,105,0.25), rgba(234,124,105,0.1))", border: "2px solid rgba(234,124,105,0.4)" }}>
                    {game.icon}
                  </Box>
                  <Typography variant="h6" sx={{ color: "white", fontWeight: "bold", mb: 1 }}>{game.title}</Typography>
                  <Typography variant="body2" sx={{ color: "#ABBBC2", px: 1, lineHeight: 1.4 }}>{game.description}</Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

export default MiniGamePage;
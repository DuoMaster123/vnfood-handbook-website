import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogActions, DialogContent,
  CircularProgress, Paper, IconButton
} from '@mui/material';
import { EmojiEvents, Timer, Favorite, Close, PlayArrowRounded, ArrowBackRounded } from '@mui/icons-material';
import Confetti from 'react-confetti';
import foodData from '../../data/foodData';

// CONFIGURATION 
const TIME_LIMIT = 60;
const MAX_LIVES = 15;
const TOTAL_PAIRS = 8;

function FoodMemoryGame({ onBack }) {
  // Game State
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]); // Currently flipped pair
  const [matchedCards, setMatchedCards] = useState([]); // IDs of solved cards
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [lives, setLives] = useState(MAX_LIVES);
  const [gameState, setGameState] = useState('intro'); // 'intro', 'playing', 'won', 'lost'
  const [disableClick, setDisableClick] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const timerRef = useRef(null);

  // Helper: Use placeholder if image missing
  const getImageUrl = (food) => food.imageUrl || "/assets/placeholder.png";

  // Game Timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { endGame('lost'); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, timeLeft]);

  // Handle Game End
  const endGame = (status) => {
    clearInterval(timerRef.current);
    setGameState(status);
    setOpenDialog(true);
  };

  // Setup/Reset Game (Simulate loading for better UX)
  const setupGameData = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const validFoods = foodData.filter(f => f.slug);
        
        // Ensure enough items for pairs
        let pool = validFoods;
        while (pool.length < TOTAL_PAIRS) pool = [...pool, ...validFoods];
        
        // Select random subset and duplicate for pairs
        const selected = pool.sort(() => 0.5 - Math.random()).slice(0, TOTAL_PAIRS);
        const deck = selected.flatMap(item => [item, item])
          .sort(() => 0.5 - Math.random())
          .map((food, index) => ({
            ...food,
            uniqueId: index,
            imageSrc: getImageUrl(food)
          }));
          
        // Reset state
        setCards(deck);
        setFlippedCards([]); 
        setMatchedCards([]);
        setTimeLeft(TIME_LIMIT); 
        setLives(MAX_LIVES);
        setDisableClick(false); 
        setGameState('playing'); 
        setOpenDialog(false);
      } catch (error) {
        console.error("Setup Error:", error);
      } finally {
        setLoading(false);
      }
    }, 150); 
  };

  // Card Click Handler
  const handleCardClick = (card) => {
    if (gameState !== 'playing' || disableClick) return;
    // Ignore clicks on already matched or flipped cards
    if (matchedCards.includes(card.uniqueId) || flippedCards.some(c => c.uniqueId === card.uniqueId)) return;
    
    const newFlipped = [...flippedCards, card];
    setFlippedCards(newFlipped);

    // If 2 cards flipped, check match
    if (newFlipped.length === 2) {
      setDisableClick(true); // Prevent further clicks
      checkForMatch(newFlipped);
    }
  };

  // Logic to check if 2 cards match
  const checkForMatch = ([card1, card2]) => {
    if (card1.slug === card2.slug) {
      // Match found
      const newMatched = [...matchedCards, card1.uniqueId, card2.uniqueId];
      setMatchedCards(newMatched);
      setFlippedCards([]);
      setDisableClick(false);
      if (newMatched.length === cards.length) endGame('won');
    } else {
      // No match -> Deduct life and flip back after delay
      if (lives > 1) {
        setLives(prev => prev - 1);
        setTimeout(() => { 
          setFlippedCards([]); 
          setDisableClick(false); 
        }, 800);
      } else { 
        setLives(0); 
        endGame('lost'); 
      }
    }
  };

  // Check if a card should be visible (Front face)
  const isCardFlipped = (card) => 
    gameState === 'lost' || 
    gameState === 'won' || 
    flippedCards.some(c => c.uniqueId === card.uniqueId) || 
    matchedCards.includes(card.uniqueId);

  // RENDER

  if (loading) return <Box sx={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress sx={{ color: '#EA7C69' }} /></Box>;

  // Intro Screen
  if (gameState === 'intro') {
    return (
      <Box sx={{ textAlign: 'center', p: 4, maxWidth: 600, mx: 'auto', mt: { xs: 5, md: 10 } }}>
        <Paper sx={{ p: { xs: 3, sm: 5 }, bgcolor: '#252836', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#EA7C69', mb: 2, fontSize: { xs: '2.2rem', sm: '3rem' } }}>Food Memory 🧠</Typography>
          <Typography variant="body1" sx={{ color: '#ABBBC2', mb: 4 }}>Match all pairs before time runs out!</Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button startIcon={<ArrowBackRounded />} onClick={onBack} sx={{ color: '#ABBBC2', borderColor: '#ABBBC2', px: 3 }} variant="outlined">Exit</Button>
            <Button variant="contained" startIcon={<PlayArrowRounded />} onClick={setupGameData} sx={{ bgcolor: '#EA7C69', fontWeight: 'bold', px: 5, borderRadius: 2 }}>Start</Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Main Game Screen
  return (
    <Box sx={{ textAlign: 'center', p: { xs: 1, sm: 2 }, maxWidth: '950px', mx: 'auto', pb: { xs: 12, md: 4 } }}>
      
      {gameState === 'won' && <Confetti numberOfPieces={300} recycle={false} />}

      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ color: '#ABBBC2' }}><ArrowBackRounded /></IconButton>
        <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 3 }, bgcolor: '#252836', px: 2, py: 1, borderRadius: 4, border: '1px solid #393C49' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: timeLeft < 10 ? '#FF4D4D' : '#EA7C69' }}>
            <Timer /><Typography variant="h5" fontWeight="bold">{timeLeft}s</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#FF4D4D' }}>
            <Favorite /><Typography variant="h5" fontWeight="bold">{lives}</Typography>
          </Box>
        </Box>
        <Button variant="outlined" onClick={setupGameData} sx={{ color: '#EA7C69', borderColor: '#EA7C69', fontWeight:'bold', minWidth: 'auto', px: 2 }}>RESET</Button>
      </Box>

      {/* Card Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: { xs: 1.2, sm: 1.5 }, maxWidth: '100%', mx: 'auto' }}>
        {cards.map(card => (
          <Box 
            key={card.uniqueId} 
            onClick={() => handleCardClick(card)} 
            sx={{ 
              position: 'relative', width: '100%', 
              paddingTop: { xs: '160%', sm: '100%', md: '55%' }, // Aspect Ratio
              cursor: 'pointer', perspective: '1000px' 
            }}
          >
            {/* 3D Flip Effect Container */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, transition: 'transform 0.5s', transformStyle: 'preserve-3d', transform: isCardFlipped(card) ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              
              {/* Back Face (Hidden) */}
              <Box sx={{
                position: 'absolute', width: '100%', height: '100%', bgcolor: '#252836', borderRadius: 2, border: '2px solid #393C49',
                display: 'flex', alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden',
                '&:hover': { borderColor: '#EA7C69' }
              }}>
                <Typography variant="h4" sx={{ color: '#393C49', fontWeight: 'bold' }}>?</Typography>
              </Box>
              
              {/* Front Face (Visible when flipped) */}
              <Box sx={{
                position: 'absolute', width: '100%', height: '100%', bgcolor: '#1F1D2B', borderRadius: 2, overflow: 'hidden',
                border: matchedCards.includes(card.uniqueId) ? '3px solid #4CAF50' : '2px solid #EA7C69',
                transform: 'rotateY(180deg)', backfaceVisibility: 'hidden'
              }}>
                <img src={card.imageSrc} alt="food" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Result Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="xs" 
        fullWidth 
        PaperProps={{ sx: { bgcolor: '#252836', color: 'white', textAlign: 'center', p: 2, borderRadius: 3, border: '1px solid #393C49' } }}
      >
        <IconButton onClick={() => setOpenDialog(false)} sx={{ position: 'absolute', right: 8, top: 8, color: '#ABBBC2' }}><Close /></IconButton>
        <DialogTitle sx={{ pb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
          {gameState === 'won' ? 
            <><EmojiEvents sx={{ fontSize: 80, color: '#4CAF50', mb: 2 }} /><Typography variant="h4" fontWeight="bold" sx={{ color: '#4CAF50' }}>VICTORY!</Typography></> : 
            <><Close sx={{ fontSize: 80, color: '#FF4D4D', mb: 2 }} /><Typography variant="h4" fontWeight="bold" sx={{ color: '#FF4D4D' }}>GAME OVER</Typography></>
          }
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#ABBBC2', mb: 2 }}>
            {gameState === 'won' ? "Excellent! You matched all dishes." : "Don't give up, try again!"}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={onBack} sx={{ color: '#ABBBC2', mr: 2 }}>Exit</Button>
          <Button variant="contained" onClick={setupGameData} sx={{ bgcolor: '#EA7C69', fontWeight: 'bold', px: 4, borderRadius: 2 }}>Play Again</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FoodMemoryGame;
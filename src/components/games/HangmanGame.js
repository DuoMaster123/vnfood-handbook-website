import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { ArrowBackRounded, RefreshRounded, TipsAndUpdatesRounded } from '@mui/icons-material';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import foodData from '../../data/foodData';

// CONSTANTS 
const MAX_WRONG = 4;
const KEYBOARD = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function HangmanGame({ onBack }) {
  // Game State
  const [gameState, setGameState] = useState({
    targetWord: "",      // English/Uppercased name to guess
    vietnameseName: "",  // Display name for hint
    guessedLetters: new Set(),
    wrongCount: 0,
    status: 'playing',   // 'playing', 'won', 'lost'
    hintUsed: false
  });
  
  // UI State
  const [repeatedError, setRepeatedError] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Init
  useEffect(() => {
    startNewGame();
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Setup new round
  const startNewGame = () => {
    const randomFood = foodData[Math.floor(Math.random() * foodData.length)];
    // Split name (e.g., "Pho - Beef Noodle") to get English part if available
    const parts = randomFood.name.split(/[–-]/);
    const vnName = parts[0].trim();
    const enName = (parts[1] || vnName).trim().toUpperCase();

    setGameState({
      targetWord: enName,
      vietnameseName: vnName,
      guessedLetters: new Set(),
      wrongCount: 0,
      status: 'playing',
      hintUsed: false
    });
    setRepeatedError(false);
  };

  // Handle letter guess
  const handleGuess = useCallback((letter) => {
    setGameState(prev => {
      if (prev.status !== 'playing') return prev;

      // Handle repeated guess
      if (prev.guessedLetters.has(letter)) {
        setRepeatedError(true);
        setTimeout(() => setRepeatedError(false), 1000);
        // Penalty for repeated guess? (Logic kept from original: Yes, increases wrongCount)
        const newWrong = prev.wrongCount + 1;
        return {
          ...prev,
          wrongCount: newWrong,
          status: newWrong >= MAX_WRONG ? 'lost' : prev.status
        };
      }

      const newGuessed = new Set(prev.guessedLetters).add(letter);
      const isCorrect = prev.targetWord.includes(letter);

      if (!isCorrect) {
        // Incorrect guess
        const newWrong = prev.wrongCount + 1;
        return {
          ...prev,
          guessedLetters: newGuessed,
          wrongCount: newWrong,
          status: newWrong >= MAX_WRONG ? 'lost' : prev.status
        };
      } else {
        // Correct guess -> Check win condition
        const isWon = prev.targetWord.split('').every(char => !/[A-Z]/.test(char) || newGuessed.has(char));
        return {
          ...prev,
          guessedLetters: newGuessed,
          status: isWon ? 'won' : prev.status
        };
      }
    });
  }, []);

  // Hint Logic: Reveal 1 random letter
  const useHint = () => {
    const { targetWord, guessedLetters, status, hintUsed } = gameState;
    if (hintUsed || status !== 'playing') return;
    
    const unguessed = targetWord.split('').filter(char => /[A-Z]/.test(char) && !guessedLetters.has(char));
    if (unguessed.length > 0) {
      const randomChar = unguessed[Math.floor(Math.random() * unguessed.length)];
      handleGuess(randomChar);
      setGameState(prev => ({ ...prev, hintUsed: true }));
    }
  };

  // Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const char = e.key.toUpperCase();
      if (KEYBOARD.includes(char)) handleGuess(char);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGuess]);

  // Render SVG Drawing based on wrongCount
  const renderHangmanSVG = () => {
    const { status, wrongCount } = gameState;
    const strokeColor = "#EA7C69";
    const dangerColor = "#d96552";

    return (
      <Box
        component="svg"
        viewBox="0 0 300 280"
        sx={{
          width: { xs: '180px', sm: '260px' },
          height: { xs: '160px', sm: '240px' },
          overflow: 'visible'
        }}
      >
        {/* Draw Structure (Gallows) */}
        {status !== 'won' && (
          <g stroke="#ABBBC2" strokeWidth="4" fill="none" strokeLinecap="round">
            <path d="M20 270 L100 270 M60 270 L60 20 M60 20 L160 20 M160 20 L160 50" />
          </g>
        )}

        {/* Draw Winner (Happy Stickman) */}
        {status === 'won' ? (
          <g transform="translate(100, 80)">
            <circle cx="50" cy="30" r="25" stroke="#4CAF50" strokeWidth="4" fill="none" />
            <path d="M35 28 L42 20 L49 28 M55 28 L62 20 L69 28" stroke="#4CAF50" strokeWidth="3" fill="none" strokeLinejoin="round" />
            <path d="M35 40 Q52 55 69 40" stroke="#4CAF50" strokeWidth="3" fill="none" />
            <line x1="52" y1="55" x2="52" y2="120" stroke="#4CAF50" strokeWidth="4" />
            <path d="M52 70 L12 30 M52 70 L92 30 M52 120 L22 170 M52 120 L82 170" stroke="#4CAF50" strokeWidth="4" />
          </g>
        ) : (
          /* Draw Hangman Parts */
          <g>
            {/* Head */}
            {wrongCount >= 1 && (
              <g>
                <circle cx="160" cy="80" r="20" stroke={strokeColor} strokeWidth="4" fill="none" />
                {/* Sad Face (Only on last life) */}
                {wrongCount >= 4 && (
                  <g stroke={dangerColor} strokeWidth="3">
                    <path d="M152 75 L158 81 M158 75 L152 81 M162 75 L168 81 M168 75 L162 81" />
                    <path d="M155 90 Q160 100 165 90" fill={dangerColor} stroke="none" />
                  </g>
                )}
              </g>
            )}
            {/* Body */}
            {wrongCount >= 2 && <line x1="160" y1="100" x2="160" y2="170" stroke={strokeColor} strokeWidth="4" />}
            {/* Arms */}
            {wrongCount >= 3 && <path d="M160 120 L130 160 M160 120 L190 160" stroke={strokeColor} strokeWidth="4" />}
            {/* Legs */}
            {wrongCount >= 4 && <path d="M160 170 L140 220 M160 170 L180 220" stroke={dangerColor} strokeWidth="4" />}
          </g>
        )}
      </Box>
    );
  };

  // RENDER 
  return (
    <Box sx={{ minHeight: 'calc(100vh - 120px)', pb: { xs: 4, sm: 8 }, display: 'flex', flexDirection: 'column' }}>

      {/* Confetti Animation */}
      {gameState.status === 'won' && (
        <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={400} />
      )}

      {/* Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconButton onClick={onBack} sx={{ color: '#ABBBC2', mr: 1 }}><ArrowBackRounded /></IconButton>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', fontSize: { xs: '1rem', sm: '1.25rem' } }}>Food Hangman</Typography>
          <Typography variant="caption" sx={{ color: gameState.wrongCount >= 3 ? '#d96552' : '#ABBBC2' }}>
            Lives: <b style={{ fontSize: '1rem' }}>{MAX_WRONG - gameState.wrongCount}</b>
          </Typography>
        </Box>
      </Box>

      {/* Game Center */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          transform: 'scale(1)',
          transformOrigin: 'top center'
        }}
      >
        {/* Visual: SVG Hangman */}
        <motion.div animate={{ scale: gameState.status === 'won' ? 1.1 : 1, rotate: gameState.status === 'lost' ? 5 : 0 }} transition={{ type: 'spring', bounce: 0.5 }}>
          {renderHangmanSVG()}
        </motion.div>

        {/* Controls: Hint & Reset */}
        <Box sx={{ display: 'flex', gap: 2, mt: -1 }}>
          <Button
            variant="contained"
            startIcon={<TipsAndUpdatesRounded />}
            onClick={useHint}
            disabled={gameState.hintUsed || gameState.status !== 'playing'}
            sx={{
              bgcolor: gameState.hintUsed ? 'rgba(255,255,255,0.1)' : '#FFD700',
              color: gameState.hintUsed ? '#555' : '#1F1D2B',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#FFC107' },
              py: 0.5, px: 2 
            }}
          >
            {gameState.hintUsed ? "Used" : "Hint"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshRounded />}
            onClick={startNewGame}
            sx={{ color: '#EA7C69', borderColor: '#EA7C69', py: 0.5, px: 2 }}
          >
            Reset
          </Button>
        </Box>

        {/* Floating Error Message */}
        <AnimatePresence>
          {repeatedError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: '30%', zIndex: 10 }}>
              <Typography sx={{ bgcolor: '#d96552', color: 'white', px: 2, py: 0.5, borderRadius: 4, fontWeight: 'bold', fontSize: '0.8rem' }}>
                Already Guessed!
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Word Display Area */}
        <Box sx={{ textAlign: 'center', minHeight: { xs: '60px', sm: '80px' } }}>
          <Typography variant="body1" sx={{ color: '#ABBBC2', mb: 0.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>What is this dish?</Typography>
          <Typography variant="h6" sx={{ color: '#EA7C69', fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>"{gameState.vietnameseName}"</Typography>

          {gameState.status === 'won' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 'bold', mt: 1 }}>VICTORY!</Typography>
            </motion.div>
          )}

          {gameState.status === 'lost' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Typography variant="h4" sx={{ color: '#d96552', fontWeight: 'bold', mt: 1 }}>GAME OVER</Typography>
              <Typography sx={{ color: 'white', mt: 0.5 }}>Answer: <b>{gameState.targetWord}</b></Typography>
            </motion.div>
          )}
        </Box>

        {/* Letter Boxes */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 1 }, justifyContent: 'center', px: 1 }}>
          {gameState.targetWord.split('').map((char, index) => {
            const isGuessed = gameState.guessedLetters.has(char);
            const isSpace = !/[A-Z]/.test(char);
            const showChar = isGuessed || isSpace || gameState.status === 'lost';
            const isMissing = gameState.status === 'lost' && !isGuessed && !isSpace;

            return (
              <Box key={index} sx={{
                minWidth: { xs: 20, sm: 30 },
                height: { xs: 32, sm: 45 },
                px: 0.5,
                borderBottom: isSpace ? 'none' : `2px solid ${isMissing ? '#d96552' : 'white'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: { xs: '1.1rem', sm: '1.5rem' },
                fontWeight: 'bold',
                color: isMissing ? '#d96552' : 'white'
              }}>
                {showChar ? char : ''}
              </Box>
            );
          })}
        </Box>

        {/* Virtual Keyboard */}
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
          <AnimatePresence mode='wait'>
            {gameState.status === 'playing' ? (
              <Box
                component={motion.div}
                key="keyboard"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                sx={{
                  display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 0.8 }, justifyContent: 'center', maxWidth: { xs: 360, sm: 700 }
                }}
              >
                {KEYBOARD.map((char) => {
                  const isSelected = gameState.guessedLetters.has(char);
                  return (
                    <Button
                      key={char}
                      variant={isSelected ? "contained" : "outlined"}
                      onClick={() => handleGuess(char)}
                      sx={{
                        minWidth: { xs: 38, sm: 42 }, width: { xs: 38, sm: 42 }, height: { xs: 42, sm: 42 },
                        m: 0.25, p: 0, fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1rem' },
                        borderColor: '#393C49', color: 'white',
                        bgcolor: isSelected ? '#252836' : 'transparent', opacity: isSelected ? 0.5 : 1,
                        '&:hover': { borderColor: '#EA7C69', color: '#EA7C69' }
                      }}
                    >
                      {char}
                    </Button>
                  );
                })}
              </Box>
            ) : (
              // End Game Action Buttons
              <motion.div key="actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: 10 }}>
                <Button
                  variant="outlined"
                  onClick={onBack}
                  sx={{
                    color: 'white', borderColor: 'white',
                    px: { xs: 2, sm: 4 }, py: { xs: 1, sm: 1.5 },
                    borderRadius: 3, fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                >
                  Back to Menu
                </Button>

                <Button
                  variant="contained"
                  onClick={startNewGame}
                  color={gameState.status === 'won' ? 'success' : 'error'}
                  sx={{
                    px: { xs: 3, sm: 5 }, py: { xs: 1, sm: 1.5 },
                    fontWeight: 'bold', fontSize: { xs: '0.9rem', sm: '1.1rem' }, borderRadius: 3
                  }}
                >
                  {gameState.status === 'won' ? 'Next Word' : 'Try Again'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

      </Box>
    </Box>
  );
}

export default HangmanGame;
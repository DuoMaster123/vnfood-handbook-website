import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, IconButton, Paper, Modal, Fade, Backdrop } from '@mui/material';
import { ArrowBackRounded, RefreshRounded, EmojiEventsRounded, CloseRounded } from '@mui/icons-material';
import Confetti from 'react-confetti';
import foodData from '../../data/foodData';

//  CONSTANTS 
const COLS = 4;
const ROWS = 3;
const TOTAL_PIECES = COLS * ROWS; // 12 pieces total

// Get backend URL (Support local network IP for mobile testing)
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Calculate puzzle piece size based on screen width
const getPieceSizes = () => {
  const width = window.innerWidth;
  if (width < 360) return { pieceWidth: 65, pieceHeight: 65, gap: 4, spacing: 1 };
  if (width < 480) return { pieceWidth: 70, pieceHeight: 70, gap: 4, spacing: 1.5 };
  if (width < 768) return { pieceWidth: 80, pieceHeight: 80, gap: 5, spacing: 2 };
  return { pieceWidth: 100, pieceHeight: 100, gap: 8, spacing: 6 }; // Desktop
};

function PuzzleGame({ onBack }) {
  // Game State
  const [board, setBoard] = useState(Array(TOTAL_PIECES).fill(null));
  const [leftBank, setLeftBank] = useState([]);
  const [rightBank, setRightBank] = useState([]);
  const [bottomBank, setBottomBank] = useState([]);
  const [isSolved, setIsSolved] = useState(false);
  const [image, setImage] = useState(null);
  
  // Interaction State (Drag & Drop)
  const [draggedItem, setDraggedItem] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null); // For tap-to-move on mobile
  
  // UI State
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [sizes, setSizes] = useState(getPieceSizes());

  // Init game and listen for resize
  useEffect(() => {
    startNewGame();
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      setSizes(getPieceSizes());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Setup a new game session
  const startNewGame = () => {
    const randomFood = foodData[Math.floor(Math.random() * foodData.length)];
    // Ensure image URL points to the correct backend IP
    const imgUrl = `${BASE_URL}/static/food_images/${randomFood.slug}.jpg?t=${new Date().getTime()}`;
    
    setImage({ url: imgUrl, name: randomFood.name });
    setIsSolved(false);
    setBoard(Array(TOTAL_PIECES).fill(null));

    // Create 12 pieces and shuffle them
    let allPieces = Array.from({ length: TOTAL_PIECES }, (_, i) => ({ id: i }));
    allPieces.sort(() => Math.random() - 0.5);

    // Distribute pieces to side banks
    setLeftBank(allPieces.slice(0, 4));
    setRightBank(allPieces.slice(4, 8));
    setBottomBank(allPieces.slice(8, 12));
  };

  //  DRAG & DROP LOGIC 

  const handleDragStart = (e, item, source) => {
    setDraggedItem({ item, source });
    e.dataTransfer.effectAllowed = "move";
  };

  // Remove piece from its previous location (Bank or Board)
  const removeFromSource = (source, item) => {
    const filterFn = (p) => p.id !== item.id;
    if (source.type === 'left') setLeftBank(prev => prev.filter(filterFn));
    else if (source.type === 'right') setRightBank(prev => prev.filter(filterFn));
    else if (source.type === 'bottom') setBottomBank(prev => prev.filter(filterFn));
    else if (source.type === 'board') setBoard(prev => { const n = [...prev]; n[source.index] = null; return n; });
  };

  // Handle dropping a piece onto a specific board slot
  const handleDropToBoard = (e, targetIndex) => {
    e.preventDefault();
    if (!draggedItem) return;
    const { item, source } = draggedItem;
    const existing = board[targetIndex]; // Check if slot is occupied

    removeFromSource(source, item);

    // If slot occupied, move existing piece back to bottom bank (or swap)
    if (existing) {
      if (source.type === 'board') setBoard(prev => { const n = [...prev]; n[source.index] = existing; return n; });
      else setBottomBank(prev => [...prev, existing]);
    }

    // Place new piece
    setBoard(prev => {
      const newBoard = [...prev];
      newBoard[targetIndex] = item;
      // Check win condition
      if (newBoard.every((p, i) => p && p.id === i)) setIsSolved(true);
      return newBoard;
    });
    setDraggedItem(null);
  };

  //  CLICK & TAP LOGIC (MOBILE) 

  const handlePieceClick = (piece, source) => {
    if (isSolved) return;
    // Toggle selection
    if (selectedPiece && selectedPiece.item.id === piece.id) {
      setSelectedPiece(null);
    } else {
      setSelectedPiece({ item: piece, source });
    }
  };

  const handleBoardClick = (targetIndex) => {
    if (isSolved || !selectedPiece) return;
    
    const { item, source } = selectedPiece;
    const existing = board[targetIndex];

    removeFromSource(source, item);

    if (existing) {
      if (source.type === 'board') setBoard(prev => { const n = [...prev]; n[source.index] = existing; return n; });
      else setBottomBank(prev => [...prev, existing]);
    }

    setBoard(prev => {
      const newBoard = [...prev];
      newBoard[targetIndex] = item;
      if (newBoard.every((p, i) => p && p.id === i)) setIsSolved(true);
      return newBoard;
    });
    
    setSelectedPiece(null);
  };

  // Render individual puzzle piece with background position logic
  const renderPiece = (piece, source) => {
    if (!piece) return null;
    const col = piece.id % COLS;
    const row = Math.floor(piece.id / COLS);
    const isSelected = selectedPiece && selectedPiece.item.id === piece.id;
    
    return (
      <Box
        draggable={!isSolved}
        onDragStart={(e) => handleDragStart(e, piece, source)}
        onClick={() => handlePieceClick(piece, source)}
        sx={{
          width: '100%', height: '100%',
          backgroundImage: `url(${image.url})`,
          backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
          // Calculate which part of the image to show
          backgroundPosition: `${(col * 100) / (COLS - 1)}% ${(row * 100) / (ROWS - 1)}%`,
          backgroundRepeat: 'no-repeat',
          borderRadius: 1,
          cursor: isSolved ? 'default' : 'pointer',
          // Visual feedback for selection
          boxShadow: isSelected ? '0 0 0 3px #FFD700, 0 4px 12px rgba(255,215,0,0.5)' : '0 2px 8px rgba(0,0,0,0.5)',
          border: isSelected ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.3)',
          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 0.2s ease',
          '&:active': { transform: 'scale(0.95)' }
        }}
      />
    );
  };

  if (!image) return null;

  const { pieceWidth, pieceHeight, gap, spacing } = sizes;
  const isMobile = window.innerWidth < 768;

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', overflow: 'auto', pb: { xs: 12, md: 6 }, bgcolor: '#1A1D2B' }}>
      
      {/* Celebration Effect */}
      {isSolved && <Confetti width={windowSize.width} height={windowSize.height} recycle={true} numberOfPieces={200} />}

      {/* Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: { xs: 1.5, sm: 2, md: 2 }, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <IconButton onClick={onBack} sx={{ color: '#ABBBC2', mr: { xs: 1, md: 2 } }}><ArrowBackRounded /></IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white', fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>Food Puzzle</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" startIcon={<RefreshRounded />} onClick={startNewGame} sx={{ color: '#EA7C69', borderColor: '#EA7C69', fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1.5, sm: 2 }, '&:hover': { bgcolor: 'rgba(234,124,105,0.1)', borderColor: '#EA7C69' } }}>New Game</Button>
      </Box>

      {/* Game Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: { xs: 1, sm: 2, md: 3 }, gap: { xs: 2, md: 3 } }}>
        
        {/*  MOBILE LAYOUT  */}
        {isMobile && (
          <>
            {/* Top Piece Bank */}
            <Paper sx={{ bgcolor: '#1F1D2B', border: '2px dashed #393C49', borderRadius: 3, p: 1.5, display: 'grid', gridTemplateColumns: `repeat(4, ${pieceWidth}px)`, gap: `${gap}px`, justifyContent: 'center', width: 'fit-content', maxWidth: '100%' }}>
              {[...leftBank, ...rightBank].slice(0, 4).map((p) => (<Box key={p.id} sx={{ width: pieceWidth, height: pieceHeight }}>{renderPiece(p, { type: leftBank.includes(p) ? 'left' : 'right' })}</Box>))}
            </Paper>

            {/* Main Puzzle Board */}
            <Box sx={{ width: (COLS * pieceWidth) + (COLS * 2), height: (ROWS * pieceHeight) + (ROWS * 2), bgcolor: '#252836', borderRadius: 3, p: 1, border: isSolved ? '3px solid #4CAF50' : '3px solid #EA7C69', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: '2px' }}>
              {board.map((piece, i) => (<Box key={i} onDrop={(e) => handleDropToBoard(e, i)} onDragOver={(e) => e.preventDefault()} onClick={() => handleBoardClick(i)} sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: selectedPiece && !isSolved ? 'pointer' : 'default', transition: 'background 0.2s', '&:active': { bgcolor: selectedPiece && !isSolved ? 'rgba(234,124,105,0.15)' : 'rgba(255,255,255,0.03)' } }}>{renderPiece(piece, { type: 'board', index: i })}</Box>))}
            </Box>

            {/* Bottom Piece Bank */}
            <Paper sx={{ bgcolor: '#1F1D2B', border: '2px dashed #393C49', borderRadius: 3, p: 1.5, display: 'grid', gridTemplateColumns: `repeat(4, ${pieceWidth}px)`, gap: `${gap}px`, justifyContent: 'center', width: 'fit-content', maxWidth: '100%', minHeight: pieceHeight + 24 }}>
              {[...leftBank, ...rightBank].slice(4).concat(bottomBank).map((p) => (<Box key={p.id} sx={{ width: pieceWidth, height: pieceHeight }}>{renderPiece(p, { type: bottomBank.includes(p) ? 'bottom' : (leftBank.includes(p) ? 'left' : 'right') })}</Box>))}
            </Paper>
          </>
        )}

        {/*  DESKTOP LAYOUT  */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: spacing, alignItems: 'center' }}>
            {/* Left Bank */}
            <Paper sx={{ width: pieceWidth + 24, height: (pieceHeight * 4) + (gap * 3) + 24, bgcolor: '#1F1D2B', border: '2px dashed #393C49', borderRadius: 3, display: 'grid', gap: `${gap}px`, p: 1.5, alignContent: 'center', justifyContent: 'center' }}>
              {leftBank.map((p) => <Box key={p.id} sx={{ width: pieceWidth, height: pieceHeight }}>{renderPiece(p, { type: 'left' })}</Box>)}
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
              {/* Main Board */}
              <Box sx={{ width: (COLS * pieceWidth) + (COLS * 2), height: (ROWS * pieceHeight) + (ROWS * 2), bgcolor: '#252836', borderRadius: 3, p: 1, border: isSolved ? '3px solid #4CAF50' : '3px solid #EA7C69', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: '2px' }}>
                {board.map((piece, i) => (<Box key={i} onDrop={(e) => handleDropToBoard(e, i)} onDragOver={(e) => e.preventDefault()} onClick={() => handleBoardClick(i)} sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: selectedPiece && !isSolved ? 'pointer' : 'default', '&:hover': { bgcolor: selectedPiece && !isSolved ? 'rgba(234,124,105,0.1)' : 'rgba(255,255,255,0.03)' } }}>{renderPiece(piece, { type: 'board', index: i })}</Box>))}
              </Box>

              {/* Bottom Bank */}
              <Paper sx={{ width: (pieceWidth * 4) + (gap * 3) + 24, height: pieceHeight + 24, bgcolor: '#1F1D2B', border: '2px dashed #393C49', borderRadius: 3, display: 'flex', gap: `${gap}px`, p: 1.5, alignItems: 'center', justifyContent: 'center' }}>
                {bottomBank.map((p) => <Box key={p.id} sx={{ width: pieceWidth, height: pieceHeight }}>{renderPiece(p, { type: 'bottom' })}</Box>)}
                {bottomBank.length === 0 && <Typography variant="caption" sx={{ color: '#393C49' }}>Drop here</Typography>}
              </Paper>
            </Box>

            {/* Right Bank */}
            <Paper sx={{ width: pieceWidth + 24, height: (pieceHeight * 4) + (gap * 3) + 24, bgcolor: '#1F1D2B', border: '2px dashed #393C49', borderRadius: 3, display: 'grid', gap: `${gap}px`, p: 1.5, alignContent: 'center', justifyContent: 'center' }}>
              {rightBank.map((p) => <Box key={p.id} sx={{ width: pieceWidth, height: pieceHeight }}>{renderPiece(p, { type: 'right' })}</Box>)}
            </Paper>
          </Box>
        )}
      </Box>

      {/* Victory Modal */}
      <Modal open={isSolved} onClose={() => setIsSolved(false)} closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 500, sx: { bgcolor: 'rgba(0,0,0,0.8)' } } }}>
        <Fade in={isSolved}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: 'calc(100% - 32px)', sm: 400 }, maxWidth: 400, bgcolor: '#252836', borderRadius: 4, border: '1px solid rgba(76, 175, 80, 0.5)', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', p: { xs: 3, sm: 4 }, textAlign: 'center', color: 'white', outline: 'none' }}>
            <IconButton onClick={() => setIsSolved(false)} sx={{ position: 'absolute', top: 8, right: 8, color: '#ABBBC2' }}><CloseRounded /></IconButton>
            <EmojiEventsRounded sx={{ fontSize: { xs: 60, sm: 80 }, color: '#FFD700', mb: 2, filter: 'drop-shadow(0 0 10px gold)' }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50', mb: 1, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Excellent!</Typography>
            <Typography sx={{ mb: 4, color: '#ABBBC2', fontSize: { xs: '0.9rem', sm: '1rem' } }}>You completed the <b>{image.name}</b> puzzle!</Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button variant="outlined" onClick={onBack} sx={{ color: 'white', borderColor: 'white' }}>Menu</Button>
              <Button variant="contained" color="success" onClick={startNewGame}>Next Puzzle</Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}

export default PuzzleGame;
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Paper, TextField, Typography, Avatar, CircularProgress, Tooltip, Fade } from '@mui/material';
import { SmartToyRounded, SendRounded, CloseRounded, RestaurantMenuRounded, CancelRounded } from '@mui/icons-material';
import { sendMessageToGemini } from '../services/geminiService';

// STYLES CONFIGURATION 
// Move lengthy styles outside to keep component logic clean
const STYLES = {
  container: { position: 'fixed', bottom: { xs: 80, md: 37 }, right: { xs: 16, md: 28 }, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  window: { width: { xs: 'calc(100vw - 32px)', sm: 330 }, height: { xs: '49vh', sm: 500 }, maxWidth: 330, bgcolor: '#1F1D2B', borderRadius: 4, border: '1px solid rgba(255,255,255,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', mb: 1.5, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
  header: { p: { xs: 1.5, sm: 2 }, bgcolor: '#EA7C69', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  msgArea: { flexGrow: 1, p: { xs: 1.5, sm: 2 }, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 },
  inputArea: { p: { xs: 1.5, sm: 2 }, borderTop: '1px solid rgba(255,255,255,0.1)', bgcolor: '#252836', display: 'flex', gap: 1 },
  textField: { '& .MuiOutlinedInput-root': { color: 'white', bgcolor: '#1F1D2B', borderRadius: 2, fontSize: '0.9rem', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: '#EA7C69' }, '&.Mui-focused fieldset': { borderColor: '#EA7C69' }, '& input': { padding: '8.5px 14px' } }, '& input::placeholder': { color: '#ABBBC2', fontSize: '0.85rem' } },
  launcher: { width: { xs: 58, md: 77 }, height: { xs: 58, md: 75 }, bgcolor: '#EA7C69', border: '2px solid rgba(255, 255, 255, 0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(234, 124, 105, 0.04)', '&:hover': { transform: 'scale(1.1)', bgcolor: '#d96552' }, '&:active': { transform: 'scale(0.95)' } },
  killSwitch: { position: 'absolute', top: { xs: -6, md: -5 }, right: { xs: -6, md: -5 }, bgcolor: '#252836', color: '#ABBBC2', border: '1px solid rgba(255,255,255,0.2)', width: { xs: 26, md: 24 }, height: { xs: 26, md: 24 }, zIndex: 10, '&:hover': { bgcolor: '#FF4D4D', color: 'white', borderColor: '#FF4D4D' } }
};

function Chatbot() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // State Management
  const [uiState, setUiState] = useState({ isOpen: false, isVisible: true });
  const [chatState, setChatState] = useState({ input: "", loading: false, messages: [{ text: "Hello! I am Chef AI 🧑‍🍳. How can I help you explore Vietnamese cuisine today?", isUser: false }] });

  // Auto-scroll on new message
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatState.messages, uiState.isOpen]);

  // Handle User Input
  const handleSend = async () => {
    if (!chatState.input.trim()) return;
    const userMsg = chatState.input;
    
    setChatState(p => ({ ...p, input: "", loading: true, messages: [...p.messages, { text: userMsg, isUser: true }] }));

    const reply = await sendMessageToGemini(userMsg);
    setChatState(p => ({ ...p, loading: false, messages: [...p.messages, { text: reply, isUser: false }] }));
  };

  // Helper to parse links like [Link Name](/path)
  const formatMessage = (text) => text.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
    const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
    return match ? <span key={i} style={{ color: '#FFD700', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate(match[2])}>{match[1]}</span> : part;
  });

  if (!uiState.isVisible) return null;

  return (
    <Box sx={STYLES.container}>
      {uiState.isOpen ? (
        <Fade in={uiState.isOpen}>
          <Paper elevation={0} sx={STYLES.window}>
            {/* Header */}
            <Box sx={STYLES.header}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RestaurantMenuRounded sx={{ color: 'white', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>Chef AI</Typography>
              </Box>
              <IconButton size="small" onClick={() => setUiState(p => ({ ...p, isOpen: false }))} sx={{ color: 'white' }}><CloseRounded fontSize="small" /></IconButton>
            </Box>

            {/* Chat Area */}
            <Box sx={STYLES.msgArea}>
              {chatState.messages.map((msg, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: msg.isUser ? 'flex-end' : 'flex-start', mb: 0.5 }}>
                  {!msg.isUser && <Avatar sx={{ bgcolor: '#EA7C69', width: 28, height: 28, mr: 1, mt: 0.5 }}><SmartToyRounded sx={{ fontSize: 16 }} /></Avatar>}
                  <Paper sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: '85%', bgcolor: msg.isUser ? '#EA7C69' : '#252836', color: 'white', borderRadius: 2, borderBottomRightRadius: msg.isUser ? 0 : 2, borderBottomLeftRadius: msg.isUser ? 2 : 0, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="body2" sx={{ lineHeight: 1.4, fontSize: '0.9rem' }}>{msg.isUser ? msg.text : formatMessage(msg.text)}</Typography>
                  </Paper>
                </Box>
              ))}
              {chatState.loading && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ABBBC2', ml: 1 }}><CircularProgress size={14} color="inherit" /><Typography variant="caption">Chef is typing...</Typography></Box>}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box sx={STYLES.inputArea}>
              <TextField fullWidth size="small" placeholder="Ask about food..." value={chatState.input} onChange={(e) => setChatState(p => ({ ...p, input: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} autoComplete="off" sx={STYLES.textField} />
              <IconButton onClick={handleSend} disabled={chatState.loading || !chatState.input.trim()} sx={{ bgcolor: '#EA7C69', color: 'white', flexShrink: 0, width: 40, height: 40, '&:hover': { bgcolor: '#d96552' }, '&.Mui-disabled': { bgcolor: 'rgba(234, 124, 105, 0.3)' } }}><SendRounded sx={{ fontSize: 20 }} /></IconButton>
            </Box>
          </Paper>
        </Fade>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <IconButton onClick={(e) => { e.stopPropagation(); setUiState(p => ({ ...p, isVisible: false })); }} sx={STYLES.killSwitch}><CancelRounded sx={{ fontSize: 16 }} /></IconButton>
          <Tooltip title="Chat with Chef AI" placement="left">
            <Box onClick={() => setUiState(p => ({ ...p, isOpen: true }))} sx={STYLES.launcher}><SmartToyRounded sx={{ color: 'white', fontSize: { xs: 28, md: 40 } }} /></Box>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}

export default Chatbot;
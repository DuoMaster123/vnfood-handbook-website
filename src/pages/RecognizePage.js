import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Typography, Box, Button, CircularProgress, Paper, Tabs, Tab, 
  Alert, CardMedia, Chip 
} from '@mui/material';
import { 
  CameraAltRounded, UploadFileRounded, AutoFixHighRounded, ArrowForwardRounded, 
  ReplayRounded, ImageSearchRounded 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const API_URL = `${BASE_URL}/api/predict`;
const FOOD_INFO_URL = `${BASE_URL}/api/foods/`;

function RecognizePage() {
  const navigate = useNavigate();
  
  // State Management
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ prediction: null, info: null, error: null });
  const [tabValue, setTabValue] = useState(0); // 0: Camera, 1: Upload
  const [upload, setUpload] = useState({ file: null, preview: null });

  // Refs for DOM elements
  const refs = { video: useRef(null), canvas: useRef(null), fileInput: useRef(null), stream: useRef(null) };

  // WEBCAM LOGIC 
  
  const stopWebcam = () => {
    if (refs.stream.current) { 
      refs.stream.current.getTracks().forEach(t => t.stop()); 
      refs.stream.current = null; 
    }
    if (refs.video.current) refs.video.current.srcObject = null;
  };

  const startWebcam = async () => {
    if (refs.stream.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      refs.stream.current = stream;
      if (refs.video.current) refs.video.current.srcObject = stream;
    } catch (err) { setResult(p => ({ ...p, error: "Camera access denied. Please check permissions." })); }
  };

  // Auto-start/stop webcam based on active tab
  useEffect(() => {
    if (tabValue === 0) startWebcam();
    return () => stopWebcam();
  }, [tabValue]);

  const handleTabChange = (e, val) => {
    stopWebcam(); 
    setTabValue(val);
    setResult({ prediction: null, info: null, error: null });
    if (val !== 1) setUpload({ file: null, preview: null });
  };

  // PREDICTION LOGIC 

  const handlePredict = async (file) => {
    if (!file) return setResult(p => ({ ...p, error: "No image selected." }));
    setLoading(true); setResult({ prediction: null, info: null, error: null });

    const fd = new FormData(); fd.append("file", file);
    try {
      // 1. Send image to Python Backend AI
      const { prediction: slug, confidence } = (await axios.post(API_URL, fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
      const predData = { name: slug, confidence: (confidence * 100).toFixed(1) };
      
      // 2. Fetch detailed food info from Database
      try {
        const info = (await axios.get(FOOD_INFO_URL + slug)).data;
        setResult({ prediction: predData, info, error: null });
      } catch {
        // Fallback if dish not in DB
        setResult({ prediction: predData, info: { name: slug, imageUrl: URL.createObjectURL(file) }, error: null });
      }
    } catch { setResult(p => ({ ...p, error: "Server connection failed or AI could not recognize." })); }
    finally { setLoading(false); }
  };

  const handleCapture = () => {
    if (refs.video.current && refs.canvas.current) {
      const ctx = refs.canvas.current.getContext('2d');
      refs.canvas.current.width = refs.video.current.videoWidth;
      refs.canvas.current.height = refs.video.current.videoHeight;
      ctx.drawImage(refs.video.current, 0, 0);
      refs.canvas.current.toBlob(blob => handlePredict(blob), 'image/jpeg');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0] || (e.dataTransfer && e.dataTransfer.files[0]);
    if (file) {
        setUpload({ file, preview: URL.createObjectURL(file) });
        handlePredict(file);
    }
  };

  // RENDER 
  return (
    <Container maxWidth="xl" sx={{ minHeight: 'calc(100vh - 80px)', pb: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <Box sx={{ mb: 3, width: '100%', maxWidth: '1400px' }}><Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>AI Food Scanner</Typography></Box>
      
      {result.error && <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: '1400px' }}>{result.error}</Alert>}

      <Box sx={{ display: 'flex', gap: 4, flexGrow: 1, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', width: '100%', maxWidth: '1400px', justifyContent: 'center' }}>
        
        {/* LEFT PANEL: INPUT (Camera/Upload) */}
        <Paper elevation={0} sx={{ flex: { xs: 'none', md: 2 }, bgcolor: '#1F1D2B', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', height: '640px', display: 'flex', flexDirection: 'column', width: { xs: '100%', md: 'auto' } }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', minHeight: '64px', '& .Mui-selected': { color: '#EA7C69 !important' } }} TabIndicatorProps={{ style: { backgroundColor: '#EA7C69', height: 3 } }}>
            <Tab icon={<CameraAltRounded />} iconPosition="start" label="Live Camera" sx={{ color: '#ABBBC2', fontWeight: 'bold', minHeight: '64px' }} />
            <Tab icon={<UploadFileRounded />} iconPosition="start" label="Upload Image" sx={{ color: '#ABBBC2', fontWeight: 'bold', minHeight: '64px' }} />
          </Tabs>

          <Box sx={{ flexGrow: 1, position: 'relative', bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} onDrop={tabValue === 1 ? (e) => { e.preventDefault(); handleFileSelect(e); } : undefined} onDragOver={(e) => e.preventDefault()}>
            {tabValue === 0 ? (
              <>
                <video ref={refs.video} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay playsInline muted />
                <canvas ref={refs.canvas} style={{ display: 'none' }} />
                {/* Scanning Animation Overlay */}
                {!loading && !result.prediction && <motion.div style={{ position: 'absolute', width: '80%', height: '80%', zIndex: 10 }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }}><Box sx={{ position: 'absolute', top: 0, left: 0, borderTop: '3px solid #EA7C69', borderLeft: '3px solid #EA7C69', width: 40, height: 40 }} /><Box sx={{ position: 'absolute', top: 0, right: 0, borderTop: '3px solid #EA7C69', borderRight: '3px solid #EA7C69', width: 40, height: 40 }} /><Box sx={{ position: 'absolute', bottom: 0, left: 0, borderBottom: '3px solid #EA7C69', borderLeft: '3px solid #EA7C69', width: 40, height: 40 }} /><Box sx={{ position: 'absolute', bottom: 0, right: 0, borderBottom: '3px solid #EA7C69', borderRight: '3px solid #EA7C69', width: 40, height: 40 }} /></motion.div>}
              </>
            ) : (
              <Box onClick={() => refs.fileInput.current.click()} sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ABBBC2', cursor: 'pointer', border: '2px dashed #393C49', bgcolor: 'rgba(255,255,255,0.02)' }}>
                {upload.preview ? (
                  <Box sx={{ position: 'relative', width: '100%', height: 380 }}><img src={upload.preview} alt="Upload" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />{loading && <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={60} sx={{ color: '#EA7C69' }} /></Box>}</Box>
                ) : <><ImageSearchRounded sx={{ fontSize: 80, mb: 2, opacity: 0.5 }} /><Typography>Click or Drop Image Here</Typography></>}
                <input type="file" ref={refs.fileInput} onChange={handleFileSelect} accept="image/*" style={{ display: 'none' }} />
              </Box>
            )}
          </Box>
          <Box sx={{ p: 3, bgcolor: '#252836', display: 'flex', justifyContent: 'center' }}>
            <Button variant="contained" onClick={tabValue === 0 ? handleCapture : (upload.preview ? () => handlePredict(upload.file) : () => refs.fileInput.current.click())} disabled={loading} startIcon={tabValue === 0 ? <AutoFixHighRounded /> : null} sx={{ bgcolor: '#EA7C69', color: 'white', py: 1.5, px: 6, borderRadius: 4, fontWeight: 'bold', '&:hover': { bgcolor: '#d96552' } }}>{tabValue === 0 ? "Scan & Identify" : (upload.preview ? "Identify This" : "Select Image")}</Button>
          </Box>
        </Paper>

        {/* RIGHT PANEL: RESULT DISPLAY */}
        <Paper elevation={0} sx={{ flex: 1, bgcolor: '#1F1D2B', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', p: 3, height: '560px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: { xs: '100%', md: 'auto' } }}>
          <AnimatePresence mode='wait'>
            {!result.prediction ? (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', marginTop: '100px' }}>
                <Box sx={{ width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #393C49', mx: 'auto', mb: 1 }}><AutoFixHighRounded sx={{ fontSize: 60, color: '#393C49' }} /></Box>
                <Typography variant="h5" color="white" fontWeight="bold">AI Recognition</Typography>
                <Typography variant="body1" color="#ABBBC2">Point camera at Vietnamese food.</Typography>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', textAlign: 'center', overflowY: 'auto' }}>
                <Chip label="AI PREDICTION" sx={{ bgcolor: '#EA7C69', color: 'white', fontWeight: 'bold', mb: 2 }} />
                
                {result.info?.imageUrl && (
                  <Box sx={{ position: 'relative', mb: 3 }}>
                    <CardMedia component="img" image={result.info.imageUrl} sx={{ width: '100%', maxHeight: 220, borderRadius: 4, objectFit: 'cover' }} />
                    <Box sx={{ position: 'absolute', bottom: 10, right: 10, bgcolor: 'rgba(0,0,0,0.7)', color: '#4CAF50', px: 1.5, borderRadius: 2, fontWeight: 'bold' }}>{result.prediction.confidence}%</Box>
                  </Box>
                )}
                
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>{result.info?.name || result.prediction.name}</Typography>
                
                {result.info?.id && (
                  <Button variant="contained" endIcon={<ArrowForwardRounded />} onClick={() => navigate(`/dish/${result.info.slug}`)} fullWidth sx={{ bgcolor: 'white', color: '#1F1D2B', fontWeight: 'bold', mt: 2, '&:hover': { bgcolor: '#f0f0f0' } }}>
                    View Details
                  </Button>
                )}
                
                <Button variant="outlined" startIcon={<ReplayRounded />} onClick={() => { setResult({ prediction: null, info: null, error: null }); setUpload({ file: null, preview: null }); }} fullWidth sx={{ mt: 1.5, borderColor: 'rgba(255,255,255,0.3)', color: 'white', '&:hover': { borderColor: '#EA7C69', color: '#EA7C69' } }}>
                  Reset
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Paper>
      </Box>
    </Container>
  );
}

export default RecognizePage;
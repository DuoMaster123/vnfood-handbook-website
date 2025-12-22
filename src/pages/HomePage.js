import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, MenuItem, Select, FormControl, Typography, CircularProgress, 
  Pagination, TextField, InputAdornment, IconButton, Tooltip 
} from '@mui/material';
import { SearchRounded, SwapVertRounded, LocationOn } from '@mui/icons-material';
import FoodCard from '../components/FoodCard';

// CONFIGURATION 
const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api";
const ITEMS_PER_PAGE = 20;
const TABS = ['All', 'Hot Dishes', 'Cold Dishes', 'Soup', 'Side Dishes'];

// Utility to remove Vietnamese accents for better search
const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

function HomePage() {
  // Data State
  const [foods, setFoods] = useState([]); 
  const [loading, setLoading] = useState(true); 
  
  // Filter & Search State
  const [activeTab, setActiveTab] = useState('All'); 
  const [locationFilter, setLocationFilter] = useState('All'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isReversed, setIsReversed] = useState(false);
  
  // Pagination & UI State
  const [page, setPage] = useState(1);
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Fetch food data from backend
  useEffect(() => {
    axios.get(`${API_URL}/foods`)
      .then(res => {
        setFoods(res.data.filter(item => item.region !== 'Forum'));
        setLoading(false);
      })
      .catch(err => { console.error("Fetch Error:", err); setLoading(false); });
  }, []);

  // Handle Scroll to hide/show filter bar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 50) setIsFilterVisible(true);
      else if (currentScrollY > lastScrollY && currentScrollY > 100) setIsFilterVisible(false);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Reset pagination when filters change
  useEffect(() => { setPage(1); }, [activeTab, locationFilter, searchTerm, isReversed]);

  // Filter and Sort Logic (Memoized for performance)
  const processedFoods = useMemo(() => {
    let result = foods.filter(item => {
      const matchTab = activeTab === 'All' || (item.type && item.type.includes(activeTab));
      const matchLocation = locationFilter === 'All' || item.region === locationFilter;
      const matchSearch = removeAccents(item.name || '').includes(removeAccents(searchTerm));
      return matchTab && matchLocation && matchSearch;
    });

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (isReversed) result.reverse();
    return result;
  }, [activeTab, locationFilter, searchTerm, foods, isReversed]);

  const totalPages = Math.ceil(processedFoods.length / ITEMS_PER_PAGE);
  const displayedFoods = processedFoods.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: '#EA7C69' }} /></Box>;

  return (
    <Box>
      {/* Sticky Filter Header */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 100, bgcolor: '#252836', 
        pt: { xs: 1, md: 2 }, pb: { xs: 1, md: 2 }, mb: { xs: 2, md: 3 },
        borderBottom: '1px solid rgba(255,255,255,0.08)', 
        display: 'flex', flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' },
        gap: { xs: 1.5, md: 2 },
        transform: { xs: isFilterVisible ? 'translateY(0)' : 'translateY(-100%)', md: 'translateY(0)' },
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        
        {/* Category Tabs */}
        <Box sx={{ 
          display: 'flex', gap: 1, overflowX: 'auto', pb: 1, maxWidth: { md: '60%' },
          '&::-webkit-scrollbar': { height: '4px' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }
        }}>
          {TABS.map(tab => (
            <Box
              key={tab} onClick={() => setActiveTab(tab)}
              sx={{
                px: { xs: 1.5, md: 2.5 }, py: { xs: 0.5, md: 1 }, borderRadius: '20px',
                bgcolor: activeTab === tab ? '#EA7C69' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? 'white' : '#ABBBC2',
                fontWeight: 600, fontSize: { xs: '0.8rem', md: '0.95rem' }, cursor: 'pointer',
                border: `1px solid ${activeTab === tab ? '#EA7C69' : 'rgba(255,255,255,0.1)'}`,
                transition: 'all 0.3s', whiteSpace: 'nowrap',
                '&:hover': { bgcolor: activeTab === tab ? '#d96552' : 'rgba(255,255,255,0.08)' }
              }}
            >
              {tab}
            </Box>
          ))}
        </Box>

        {/* Search & Filter Controls */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch', width: { xs: '100%', md: 'auto' }, minWidth: { md: '400px' } }}>
            <TextField
              placeholder="Search dishes..." variant="outlined" size="small"
              value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)}
              sx={{ flex: 1, bgcolor:'#1F1D2B', borderRadius: '12px', '& .MuiOutlinedInput-root': { height: 40, color:'white', borderRadius: '12px', '& fieldset':{ borderColor:'rgba(255,255,255,0.1)' }, '&.Mui-focused fieldset':{ borderColor:'#EA7C69' } }, '& input::placeholder': { color: '#ABBBC2' } }}
              InputProps={{ startAdornment:(<InputAdornment position="start"><SearchRounded sx={{ color:'#EA7C69', fontSize: 20 }}/></InputAdornment>) }}
            />

            <Box sx={{ display:'flex', alignItems:'center', bgcolor:'#1F1D2B', borderRadius: '12px', px: 1.5, border:'1px solid rgba(255,255,255,0.1)', minWidth: '110px', height: 40 }}>
              <LocationOn sx={{ fontSize: 18, color: '#EA7C69', mr: 0.5 }} />
              <FormControl variant="standard" sx={{ flex: 1 }}>
                <Select 
                  value={locationFilter} onChange={(e)=>setLocationFilter(e.target.value)} disableUnderline 
                  sx={{ color:'white', fontWeight: 600, fontSize: '0.85rem', '.MuiSelect-icon':{ color:'#EA7C69' } }}
                  MenuProps={{ PaperProps: { sx: { bgcolor:'#1F1D2B', color:'white', border: '1px solid rgba(255,255,255,0.1)', '& .MuiMenuItem-root:hover': { bgcolor: 'rgba(234,124,105,0.1)' } } } }}
                >
                  {['All', 'North', 'Central', 'South'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            <Tooltip title={isReversed ? "Newest" : "Oldest"}>
              <IconButton 
                onClick={() => setIsReversed(!isReversed)} 
                sx={{ color: isReversed ? 'white' : '#ABBBC2', border: '1px solid rgba(255,255,255,0.1)', bgcolor: isReversed ? '#EA7C69' : '#1F1D2B', borderRadius: '12px', width: 40, height: 40, '&:hover': { bgcolor: isReversed ? '#d96552' : 'rgba(234,124,105,0.1)', borderColor: '#EA7C69' } }}
              >
                <SwapVertRounded sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
        </Box>
      </Box>

      {/* Food Grid */}
      <Box sx={{ 
        minHeight: '60vh', mt: { xs: 1.5, md: 0 }, width: '100%',
        display: 'grid', gap: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }
      }}>
        <AnimatePresence mode='popLayout'>
          {displayedFoods.map((food, index) => (
            <motion.div
              key={food.id} layout
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, delay: index * 0.03, ease: "easeOut" }}
              style={{ width: '100%', display: 'flex' }}
            >
              <FoodCard food={food} />
            </motion.div>
          ))}
        </AnimatePresence>

        {processedFoods.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 10, width: '100%', gridColumn: '1 / -1' }}>
            <Typography variant="h5" color="#ABBBC2">No dishes found matching "{searchTerm}".</Typography>
          </Box>
        )}
      </Box>

      {/* Pagination */}
      {processedFoods.length > ITEMS_PER_PAGE && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 2 }}>
            <Pagination count={totalPages} page={page} onChange={(e, v) => { setPage(v); window.scrollTo({ top: 0, behavior: 'smooth' }); }} shape="rounded" sx={{ '& .MuiPaginationItem-root': { color: '#ABBBC2', fontSize: '1rem' }, '& .Mui-selected': { backgroundColor: '#EA7C69 !important', color: 'white', fontWeight: 'bold' } }} />
        </Box>
      )}
    </Box>
  );
}

export default HomePage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { alpha } from '@mui/material/styles';
import { auth } from '../firebase';
import {
    Box, Typography, Grid, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Chip,
    Tabs, Tab, CircularProgress, Button, Avatar, Dialog, DialogTitle,
    DialogActions, DialogContent, Tooltip, Alert, Pagination
} from '@mui/material';
import {
    PeopleAlt, Description, Forum, Comment, DeleteOutline,
    Security, GppGood, Launch, BarChartRounded, StorageRounded
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList
} from 'recharts';
import { seedDataToMySQL } from '../utils/seedData'; 

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api";
const ITEMS_PER_PAGE = 20;
const COLORS = ['#A66CFF', '#FFD93D', '#00E5FF', '#FF3D71'];

// Display card for top summary statistics
const StatCard = ({ title, count, icon, color }) => (
    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', bgcolor: '#252836', color: 'white', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
        <Box sx={{ p: 2, borderRadius: '50%', bgcolor: alpha(color, 0.12), mr: 2, color: color }}>{icon}</Box>
        <Box><Typography variant="h4" sx={{ fontWeight: 'bold' }}>{count}</Typography><Typography variant="body2" sx={{ color: '#ABBBC2' }}>{title}</Typography></Box>
    </Paper>
);

// Reusable table component with built-in pagination
const CustomTable = ({ head, body, totalItems, page, onPageChange }) => {
    const pageCount = Math.ceil(totalItems / ITEMS_PER_PAGE);
    return (
        <>
            <TableContainer component={Paper} sx={{ bgcolor: '#252836', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#2D303E' }}>
                        <TableRow>{head.map((h, i) => <TableCell key={i} sx={{ color: '#ABBBC2', fontWeight: 'bold' }} align={i === head.length - 1 ? 'right' : 'left'}>{h}</TableCell>)}</TableRow>
                    </TableHead>
                    <TableBody>
                        {totalItems > 0 ? body : <TableRow><TableCell colSpan={head.length} align="center" sx={{ color: '#555', py: 4 }}>No data available.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </TableContainer>
            {pageCount > 1 && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><Pagination count={pageCount} page={page} onChange={onPageChange} sx={{ '& .MuiPaginationItem-root': { color: '#ABBBC2' }, '& .Mui-selected': { bgcolor: '#EA7C69', color: 'white' } }} /></Box>}
        </>
    );
};

function AdminPage() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    
    // Data Containers
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [forums, setForums] = useState([]);
    const [comments, setComments] = useState([]);
    
    // UI State
    const [page, setPage] = useState(1);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [actionType, setActionType] = useState("");
    const [targetId, setTargetId] = useState(null);
    const [alertMsg, setAlertMsg] = useState("");

    // Authenticate and check Admin role
    useEffect(() => {
        const init = async () => {
            const user = auth.currentUser;
            if (!user) { navigate('/login'); return; }
            try {
                const res = await axios.get(`${API_URL}/users/${user.uid}`);
                if (res.data.role === 'admin') {
                    setCurrentUser(user);
                    fetchStats(user.uid);
                    fetchDataForTab(0, user.uid);
                } else { navigate('/home'); }
            } catch { navigate('/home'); } 
            finally { setLoading(false); }
        };
        init();
    }, []);

    const fetchStats = async (uid) => { try { const res = await axios.get(`${API_URL}/admin/stats?uid=${uid}`); setStats(res.data); } catch {} };

    // Lazy load data based on the active tab
    const fetchDataForTab = async (tabIndex, uid) => {
        const adminUid = uid || currentUser?.uid;
        if (!adminUid) return;
        try {
            if (tabIndex === 0) {
                setUsers((await axios.get(`${API_URL}/admin/users?uid=${adminUid}`)).data);
            } else if (tabIndex === 1 || tabIndex === 2) {
                const all = (await axios.get(`${API_URL}/foods`)).data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setBlogs(all.filter(f => f.region !== 'Forum'));
                setForums(all.filter(f => f.region === 'Forum'));
            } else if (tabIndex === 3) {
                setComments((await axios.get(`${API_URL}/admin/comments?uid=${adminUid}`)).data);
            }
        } catch (e) { console.error(e); }
    };

    const handleTabChange = (e, newValue) => { setActiveTab(newValue); setPage(1); fetchDataForTab(newValue); };
    const handlePageChange = (event, value) => { setPage(value); window.scrollTo({ top: 300, behavior: 'smooth' }); };
    const paginateData = (data) => data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    
    const openConfirm = (type, id) => { setActionType(type); setTargetId(id); setConfirmOpen(true); };

    // Execute actions like Delete or Promote
    const executeAction = async () => {
        if (!currentUser) return;
        const uid = currentUser.uid;
        try {
            if (actionType === 'delete_user') {
                await axios.delete(`${API_URL}/admin/users/${targetId}?uid=${uid}`);
                setUsers(users.filter(u => u.uid !== targetId));
                setAlertMsg("User deleted.");
            } else if (actionType === 'promote_admin') {
                await axios.put(`${API_URL}/admin/users/${targetId}/role?uid=${uid}&new_role=admin`);
                setUsers(users.map(u => u.uid === targetId ? { ...u, role: 'admin' } : u));
                setAlertMsg("Role updated.");
            } else if (actionType === 'delete_food') {
                await axios.delete(`${API_URL}/foods/${targetId}`);
                setBlogs(blogs.filter(b => b.slug !== targetId));
                setForums(forums.filter(f => f.slug !== targetId));
                setAlertMsg("Post deleted.");
            } else if (actionType === 'delete_comment') {
                await axios.delete(`${API_URL}/admin/comments/${targetId}?uid=${uid}`);
                setComments(comments.filter(c => c.id !== targetId));
                setAlertMsg("Comment deleted.");
            }
            fetchStats(uid);
        } catch (e) { setAlertMsg("Action failed: " + e.message); }
        setConfirmOpen(false); setTimeout(() => setAlertMsg(""), 3000);
    };

    // Chart Component for Analytics Tab
    const AnalyticsTab = () => (
        <Grid container spacing={8} justifyContent="center">
            <Grid item xs={12} md={5}>
                <Paper sx={{ p: 4, bgcolor: '#252836', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.98)', height: 450, width: 350, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Content Distribution</Typography>
                    <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={[{ name: 'Blogs', value: stats?.foods || 0 }, { name: 'Forums', value: stats?.forum_posts || 0 }]} cx="50%" cy="50%" innerRadius="0%" outerRadius="80%" dataKey="value" stroke="none" label={({ cx, cy, midAngle, outerRadius, value }) => {
                                    const RADIAN = Math.PI / 180;
                                    const x = cx + (outerRadius + 12) * Math.cos(-midAngle * RADIAN);
                                    const y = cy + (outerRadius + 12) * Math.sin(-midAngle * RADIAN);
                                    return <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" style={{ fontSize: "15px", fontWeight: "bold" }}>{value}</text>;
                                }} labelLine={false}>
                                    {[{ name: 'Blogs', value: stats?.foods }, { name: 'Forums', value: stats?.forum_posts }].map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip contentStyle={{ backgroundColor: '#1F1D2B', borderColor: '#EA7C69', color: 'white' }} itemStyle={{ color: 'white' }} cursor={false} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper sx={{ p: 4, bgcolor: '#252836', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 1)', height: 450, width: 350, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Community Interaction</Typography>
                    <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{ name: 'Users', count: stats?.users || 0 }, { name: 'Comments', count: stats?.comments || 0 }]} layout="vertical" margin={{ top: 20, right: 50, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#393C49" horizontal={false} />
                                <XAxis type="number" stroke="#ABBBC2" />
                                <YAxis dataKey="name" type="category" stroke="white" width={80} tick={{ fontSize: 14, fontWeight: 'bold' }} />
                                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1F1D2B', borderColor: '#EA7C69', color: 'white' }} itemStyle={{ color: '#EA7C69' }} />
                                <Bar dataKey="count" fill="#EA7C69" radius={[0, 10, 10, 0]} barSize={60}>
                                    <LabelList dataKey="count" position="right" style={{ fill: 'white', fontWeight: 'bold', fontSize: '16px' }} />
                                    {[{ name: 'Users' }, { name: 'Comments' }].map((_, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#00E5FF' : '#FF3D71'} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );

    if (loading) return <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress sx={{ color: '#EA7C69' }} /></Box>;

    return (
        <Box sx={{ p: 0 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box><Typography variant="body1" sx={{ color: '#ABBBC2', mb: 0.5 }}>Overview</Typography><Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>Welcome back, Admin!</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip icon={<Security />} label="Administrator Mode" sx={{ bgcolor: 'rgba(234,124,105,0.2)', color: '#EA7C69', fontWeight: 'bold', border: '1px solid #EA7C69' }} />
                    <Tooltip title="Reset Database to 36 Original Dishes">
                        <IconButton onClick={() => { if(window.confirm("WARNING: This will delete ALL current foods and reset to the original 36 dishes with Video ID. Continue?")) seedDataToMySQL(); }} sx={{ ml: 2, color: '#EA7C69', border: '1px solid #EA7C69', borderRadius: '12px' }}><StorageRounded /></IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {alertMsg && <Alert severity="success" sx={{ mb: 3, bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', border: '1px solid #4CAF50' }}>{alertMsg}</Alert>}

            {/* Stat Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Total Users" count={stats?.users || 0} icon={<PeopleAlt />} color="#4CAF50" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Total Blogs" count={stats?.foods || 0} icon={<Description />} color="#c869eaff" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Forum Posts" count={stats?.forum_posts || 0} icon={<Forum />} color="#2196F3" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Comments" count={stats?.comments || 0} icon={<Comment />} color="#FFC107" /></Grid>
            </Grid>

            {/* Tab Navigation */}
            <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} textColor="inherit" TabIndicatorProps={{ style: { backgroundColor: '#EA7C69' } }}>
                    <Tab label="User Management" sx={{ textTransform: 'none', color: 'white' }} />
                    <Tab label="Blog Management" sx={{ textTransform: 'none', color: 'white' }} />
                    <Tab label="Forum Management" sx={{ textTransform: 'none', color: 'white' }} />
                    <Tab label="Comment Management" sx={{ textTransform: 'none', color: 'white' }} />
                    <Tab label="Analytics" icon={<BarChartRounded fontSize="small" />} iconPosition="start" sx={{ textTransform: 'none', color: 'white' }} />
                </Tabs>
            </Box>

            {/* Tab 0: Users Table */}
            {activeTab === 0 && <CustomTable totalItems={users.length} page={page} onPageChange={handlePageChange} head={['User', 'Email', 'Role', 'Joined', 'Actions']} body={paginateData(users).map((u) => (
                <TableRow key={u.uid} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <TableCell sx={{ color: 'white', display: 'flex', gap: 2, alignItems: 'center' }}><Avatar src={u.photo_url}>{u.display_name?.[0]}</Avatar> {u.display_name}</TableCell>
                    <TableCell sx={{ color: '#E0E6E9' }}>{u.email}</TableCell>
                    <TableCell><Chip label={u.role.toUpperCase()} size="small" sx={{ bgcolor: u.role === 'admin' ? '#EA7C69' : 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 'bold' }} /></TableCell>
                    <TableCell sx={{ color: '#ABBBC2' }}>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">{u.role !== 'admin' && <><Tooltip title="Promote"><IconButton onClick={() => openConfirm('promote_admin', u.uid)} color="success"><GppGood /></IconButton></Tooltip><Tooltip title="Ban User"><IconButton onClick={() => openConfirm('delete_user', u.uid)} color="error"><DeleteOutline /></IconButton></Tooltip></>}</TableCell>
                </TableRow>
            ))} />}

            {/* Tab 1 & 2: Blogs and Forums */}
            {(activeTab === 1 || activeTab === 2) && <CustomTable totalItems={activeTab === 1 ? blogs.length : forums.length} page={page} onPageChange={handlePageChange} head={['Image', 'Title', 'Author', 'Type', 'Date', 'Actions']} body={paginateData(activeTab === 1 ? blogs : forums).map((item) => (
                <TableRow key={item.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <TableCell><Avatar variant="rounded" src={item.imageUrl} sx={{ width: 50, height: 50 }} /></TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{item.name}</TableCell>
                    <TableCell sx={{ color: '#EA7C69' }}>{item.author}</TableCell>
                    <TableCell><Chip label={item.region === 'Forum' ? 'Discussion' : item.region} size="small" sx={{ bgcolor: '#1F1D2B', color: '#ABBBC2', border: '1px solid #393C49' }} /></TableCell>
                    <TableCell sx={{ color: '#ABBBC2', fontSize: '0.8rem' }}>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right"><Tooltip title="View"><IconButton onClick={() => navigate(item.region === 'Forum' ? `/forum/${item.slug}` : `/dish/${item.slug}`)} sx={{ color: 'white' }}><Launch /></IconButton></Tooltip><Tooltip title="Delete"><IconButton onClick={() => openConfirm('delete_food', item.slug)} color="error"><DeleteOutline /></IconButton></Tooltip></TableCell>
                </TableRow>
            ))} />}

            {/* Tab 3: Comments */}
            {activeTab === 3 && <CustomTable totalItems={comments.length} page={page} onPageChange={handlePageChange} head={['User', 'Comment', 'Location', 'Date', 'Actions']} body={paginateData(comments).map((c) => (
                <TableRow key={c.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <TableCell sx={{ color: '#EA7C69', fontWeight: 'bold' }}>{c.user_name}</TableCell>
                    <TableCell sx={{ color: 'white', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</TableCell>
                    <TableCell sx={{ color: '#ABBBC2' }}>{c.post_name}</TableCell>
                    <TableCell sx={{ color: '#ABBBC2', fontSize: '0.8rem' }}>{new Date(c.created_at).toLocaleString()}</TableCell>
                    <TableCell align="right"><Tooltip title="Delete"><IconButton onClick={() => openConfirm('delete_comment', c.id)} color="error"><DeleteOutline /></IconButton></Tooltip></TableCell>
                </TableRow>
            ))} />}

            {/* Tab 4: Analytics */}
            {activeTab === 4 && <AnalyticsTab />}

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} PaperProps={{ sx: { bgcolor: '#252836', color: 'white' } }}>
                <DialogTitle>Confirm Action</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this item permanently?</Typography></DialogContent>
                <DialogActions><Button onClick={() => setConfirmOpen(false)} sx={{ color: '#ABBBC2' }}>Cancel</Button><Button onClick={executeAction} variant="contained" color="error">Delete</Button></DialogActions>
            </Dialog>
        </Box>
    );
}

export default AdminPage;
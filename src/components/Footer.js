import React from 'react';
import { Box, Container, Grid, Typography, Divider, Link } from '@mui/material';

// Static Data: Project Team Members
const members = [
    { name: "Trần Nguyên Vũ (leader)", id: "23BI14458", major: "ICT", email: "vutn.23bi14458@usth.edu.vn" },
    { name: "Bùi Quang Dương", id: "23BI14121", major: "ICT", email: "duongbq.23bi14121@usth.edu.vn" },
    { name: "Phạm Nhật Minh", id: "23BI14292", major: "ICT", email: "minhpn.23bi14292@usth.edu.vn" },
    { name: "Phùng Đỗ Việt Dũng", id: "23BI14112", major: "ICT", email: "dungpdv.23bi14112@usth.edu.vn" },
    { name: "Nguyễn Trọng Minh Đức", id: "22BA13082", major: "DS", email: "ducntm.22ba13082@usth.edu.vn" },
    { name: "Nguyễn Công Minh", id: "22BA13219", major: "CS", email: "minhnc.22ba13219@usth.edu.vn" },
    { name: "Nguyễn Tuấn Anh", id: "22BI13031", major: "MAT", email: "anhnt.22bi13031@usth.edu.vn" },
];

function Footer() {
    // Styles for grid items
    const itemStyle = { fontSize: '0.9rem', lineHeight: 2.2, whiteSpace: 'nowrap', color: '#E0E6E9' };
    const headerStyle = { color: 'white', fontWeight: 'bold', mb: 2, fontSize: '1rem', borderBottom: '1px solid #EA7C69', display: 'inline-block', pb: 0.5 };

    return (
        <Box component="footer" sx={{ 
          bgcolor: '#1F1D2B', 
          color: '#ABBBC2', 
          py: { xs: 4, md: 3 }, 
          pb: { xs: '57px', md: 3 }, // Add extra padding on mobile to clear the bottom nav
          borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
          mt: 'auto' 
        }}>
            <Container maxWidth="xl">

                {/* Team Member Section */}
                <Box sx={{ mb: { xs: 0.5, md: 2 }, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ width: '100%', maxWidth: { md: '90%', lg: '85%' } }}>
                        
                        {/* Desktop Layout: 4-Column Grid */}
                        <Grid container columnSpacing={{ md: 16 }} rowSpacing={2} justifyContent="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
                            <Grid item md={3}>
                                <Typography sx={headerStyle}>MEMBERS</Typography>
                                <Box>{members.map((m, i) => <Typography key={i} sx={{ ...itemStyle, fontSize: '0.9rem', whiteSpace: 'nowrap', fontWeight: 500 }}>{m.name}</Typography>)}</Box>
                            </Grid>
                            <Grid item md={2}>
                                <Typography sx={headerStyle}>STUDENT ID</Typography>
                                <Box>{members.map((m, i) => <Typography key={i} sx={{ ...itemStyle, fontSize: '0.9rem', color: '#EA7C69', fontFamily: 'monospace' }}>{m.id}</Typography>)}</Box>
                            </Grid>
                            <Grid item md={2}>
                                <Typography sx={headerStyle}>MAJOR</Typography>
                                <Box>{members.map((m, i) => <Typography key={i} sx={{ ...itemStyle, fontSize: '0.9rem' }}>{m.major}</Typography>)}</Box>
                            </Grid>
                            <Grid item md={3}>
                                <Typography sx={headerStyle}>CONTACTS</Typography>
                                <Box>
                                    {members.map((m, i) => (
                                        <Typography key={i} sx={{ ...itemStyle, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                            <Link href={`mailto:${m.email}`} underline="hover" sx={{ color: '#ABBBC2', fontStyle: 'italic' }}>{m.email}</Link>
                                        </Typography>
                                    ))}
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Mobile Layout: Stacked List */}
                        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                            {members.map((m, i) => (
                                <Box key={i} sx={{ 
                                    mb: i === members.length - 1 ? 0 : 1.2, 
                                    pb: i === members.length - 1 ? 1 : 1.2, 
                                    borderBottom: i < members.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' 
                                }}>
                                    <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem', mb: 0.1 }}>
                                        {m.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mb: 0.1 }}>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#EA7C69', fontFamily: 'monospace' }}>{m.id}</Typography>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#ABBBC2' }}>{m.major}</Typography>
                                    </Box>
                                    <Link href={`mailto:${m.email}`} underline="hover" sx={{ color: '#ABBBC2', fontStyle: 'italic', fontSize: '0.75rem' }}>{m.email}</Link>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: { xs: 1, md: 3 } }} />

                {/* Branding & School Info */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' }, 
                  mt: { xs: 3, md: 0 },
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: { xs: 1, md: 8 }, 
                  textAlign: { xs: 'center', md: 'initial' } 
                }}>
                    {/* USTH Logo & Name */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center', 
                      gap: 1, 
                      justifyContent: { xs: 'center', md: 'flex-start' } 
                    }}>
                        <Box component="img" src="/assets/brand.png" alt="USTH Logo" sx={{ height: { xs: 55, md: 65 }, objectFit: 'contain' }} />
                        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 'bold', 
                              color: 'white', 
                              lineHeight: 1.1, 
                              fontSize: { xs: '0.8rem', sm: '1rem', md: '1.1rem' }, 
                              m: 0, p: 0 
                            }}>
                              University of Science and Technology of Hanoi
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#ABBBC2', fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
                              Trường Đại học Khoa học và Công nghệ Hà Nội
                            </Typography>
                        </Box>
                    </Box>

                    {/* Project Info */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: { xs: 'center', md: 'flex-start' },
                      mt: { xs: -0.5, md: 0 } 
                    }}>
                        <Typography variant="subtitle1" sx={{ color: '#EA7C69', fontWeight: 'bold', fontSize: { xs: '0.8rem', md: '1rem' }, m: 0 }}>
                            Group Project 2025
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.6, fontSize: { xs: '0.7rem', md: '0.875rem' } }}>
                          VN Food Handbook Application
                        </Typography>
                    </Box>
                </Box>

            </Container>
        </Box>
    );
}

export default Footer;
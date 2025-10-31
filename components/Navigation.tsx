'use client';

import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Button, Menu, MenuItem } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useRouter, usePathname } from 'next/navigation';
import { initGun, getCurrentUser, logoutUser } from '@/lib/db';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const init = async () => {
      await initGun();
      
      const checkAuth = () => {
        const user = getCurrentUser();
        setIsAuthenticated(!!user?.is);
      };
      checkAuth();
      
      // Check auth status periodically
      interval = setInterval(checkAuth, 1000);
    };
    
    init();
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    handleMenuClose();
    router.push('/');
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Decentralized Social
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            color="inherit"
            onClick={() => router.push('/')}
            aria-label="feed"
          >
            <HomeIcon />
          </IconButton>
          
          {isAuthenticated && (
            <>
              <IconButton
                color="inherit"
                onClick={() => router.push('/profile')}
                aria-label="profile"
              >
                <PersonIcon />
              </IconButton>
              
              <IconButton
                color="inherit"
                onClick={() => router.push('/upload')}
                aria-label="upload"
              >
                <AddCircleIcon />
              </IconButton>
              
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                aria-label="account"
              >
                <AccountCircleIcon />
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          )}
          
          {!isAuthenticated && pathname !== '/auth' && (
            <Button color="inherit" onClick={() => router.push('/auth')}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

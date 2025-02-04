import React from 'react';
import { Box, Typography } from '@mui/material';
import CompanySettings from '../components/CompanySettings';
import useResponsiveness from '../hooks/useResponsive';

const Settings = () => {
  const { isMobile, isTablet } = useResponsiveness();

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
         <Typography 
                variant={isMobile ? "h5" : "h4"}
                sx={{ fontWeight: 600, color: 'primary.main' }}
              >
        Company Settings
      </Typography>
      <CompanySettings />
    </Box>
  );
};

export default Settings; 
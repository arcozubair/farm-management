import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#008000',
      light: '#f37d69',
      dark: '#008000',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiBox: {
      styleOverrides: {
        root: {
          padding: '0px', // Default to 8px instead of relying on sx
        },
      },
    },
  },
});

export default theme;
import { createTheme } from '@mui/material/styles';

// Fun, colorful Kahoot-inspired theme for Key & Peele game
export const theme = createTheme({
  palette: {
    primary: {
      main: '#7B2CBF', // Purple
      light: '#9D4EDD',
      dark: '#5A189A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF006E', // Pink
      light: '#FF4791',
      dark: '#C9004F',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2F02',
      light: '#E85D04',
      dark: '#9D0208',
    },
    warning: {
      main: '#FB5607',
      light: '#FF7733',
      dark: '#D84200',
    },
    info: {
      main: '#3A86FF',
      light: '#5E9EFF',
      dark: '#2B6ACC',
    },
    success: {
      main: '#06FFA5',
      light: '#3CFFB8',
      dark: '#04CC84',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2B2D42',
      secondary: '#6C757D',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '3rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out',
          },
        },
        sizeLarge: {
          padding: '16px 32px',
          fontSize: '1.125rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;

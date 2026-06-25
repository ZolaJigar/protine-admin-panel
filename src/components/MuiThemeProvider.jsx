'use client';

import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    primary:    { main: '#1B4332', light: '#40916C', dark: '#0D2B1F', contrastText: '#FFF8F0' },
    secondary:  { main: '#F59E0B', light: '#FCD34D', dark: '#D97706', contrastText: '#1C1917' },
    background: { default: '#F1F5F0', paper: '#FFFFFF' },
    text:       { primary: '#1C1917', secondary: '#57534E', disabled: '#A8A29E' },
    divider:    '#E7E5E4',
    success:    { main: '#1B4332', contrastText: '#FFF8F0' },
    warning:    { main: '#D97706', contrastText: '#FFF8F0' },
    error:      { main: '#B91C1C', contrastText: '#FFF8F0' },
    info:       { main: '#0369A1', contrastText: '#FFF8F0' },
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', Arial, Helvetica, sans-serif",
    button: { textTransform: 'none', fontWeight: 700 },
    h1: { fontWeight: 900 }, h2: { fontWeight: 800 }, h3: { fontWeight: 800 },
    h4: { fontWeight: 700 }, h5: { fontWeight: 700 }, h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: '50px', padding: '10px 28px', boxShadow: 'none', fontWeight: 700 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
          color: '#FFF8F0',
          '&:hover': { background: 'linear-gradient(135deg, #0D2B1F 0%, #1B4332 100%)' },
        },
      },
    },
    MuiCard:   { styleOverrides: { root: { borderRadius: 16, boxShadow: '0 4px 20px rgba(27,67,50,0.08)' } } },
    MuiPaper:  { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover fieldset': { borderColor: '#2D6A4F' },
            '&.Mui-focused fieldset': { borderColor: '#1B4332' },
          },
          '& label.Mui-focused': { color: '#1B4332' },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } } },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': { background: '#1B4332', color: '#FFF8F0', fontWeight: 700 },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': { background: '#F8FBF8' },
          '&:hover': { background: '#D8F3DC30' },
        },
      },
    },
    MuiTabs: { styleOverrides: { indicator: { backgroundColor: '#F59E0B', height: 3, borderRadius: 2 } } },
    MuiTab:  { styleOverrides: { root: { fontWeight: 600, '&.Mui-selected': { color: '#1B4332' } } } },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: '#E7E5E4' },
        bar:  { borderRadius: 4 },
      },
    },
    MuiDrawer:  { styleOverrides: { paper: { background: 'transparent', border: 'none' } } },
    MuiDivider: { styleOverrides: { root: { borderColor: '#E7E5E4' } } },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: { background: '#D8F3DC', color: '#1B4332' },
        standardError:   { background: '#FEE2E2', color: '#7F1D1D' },
        standardWarning: { background: '#FEF3C7', color: '#92400E' },
        standardInfo:    { background: '#E0F2FE', color: '#0369A1' },
      },
    },
  },
});

export default function MuiThemeProvider({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

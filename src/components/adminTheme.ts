import { createTheme } from "@mui/material/styles";

const adminTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ff3366", // Vivid pink/red accent
      light: "#ff5e8a",
      dark: "#b8003c",
      contrastText: "#fff",
    },
    secondary: {
      main: "#23232a", // Card background
      light: "#2a2a33",
      dark: "#18181b",
      contrastText: "#fff",
    },
    background: {
      default: "#18181b", // Main background
      paper: "#23232a",   // Card background
    },
    text: {
      primary: "#fff",
      secondary: "#b0b0b0",
    },
    divider: "#23232a",
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    h1: { fontSize: "2.5rem", fontWeight: 600 },
    h2: { fontSize: "2rem", fontWeight: 600 },
    h3: { fontSize: "1.75rem", fontWeight: 600 },
    h4: { fontSize: "1.5rem", fontWeight: 600 },
    h5: { fontSize: "1.25rem", fontWeight: 600 },
    h6: { fontSize: "1rem", fontWeight: 600 },
    body1: { fontSize: "1rem", lineHeight: 1.5 },
    body2: { fontSize: "0.875rem", lineHeight: 1.5 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 12,
          padding: "10px 20px",
          fontWeight: 600,
        },
        contained: {
          backgroundColor: "#ff3366",
          color: "#fff",
          boxShadow: "none",
          '&:hover': {
            backgroundColor: "#ff5e8a",
            boxShadow: "0 2px 8px rgba(255,51,102,0.15)",
          },
        },
        outlined: {
          borderColor: "#ff3366",
          color: "#ff3366",
          '&:hover': {
            backgroundColor: "rgba(255,51,102,0.08)",
            borderColor: "#ff3366",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: "#23232a",
          boxShadow: "0 2px 16px 0 rgba(0,0,0,0.25)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: "#23232a",
          boxShadow: "0 2px 16px 0 rgba(0,0,0,0.25)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#23232a",
          borderRight: "1px solid #23232a",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #23232a",
          padding: "14px 20px",
          color: "#fff",
        },
        head: {
          fontWeight: 600,
          backgroundColor: "#18181b",
          color: "#fff",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#18181b",
          '& .MuiTableCell-root': {
            color: "#b0b0b0",
            fontWeight: 600,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: "#18181b",
          color: "#fff",
          borderRadius: 8,
          border: "1px solid #23232a",
        },
        input: {
          color: "#fff",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#18181b",
          color: "#fff",
          borderRadius: 8,
          border: "1px solid #23232a",
        },
        notchedOutline: {
          borderColor: "#23232a",
        },
        input: {
          color: "#fff",
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: "#ff3366",
        },
        colorPrimary: {
          '&.Mui-checked': {
            color: "#ff3366",
          },
        },
        track: {
          backgroundColor: "#23232a",
          '.Mui-checked &': {
            backgroundColor: "#ff3366",
          },
        },
      },
    },
  },
});

export default adminTheme; 
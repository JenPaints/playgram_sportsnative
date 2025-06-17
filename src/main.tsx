import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

// Force dark mode globally
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#18181b',
      paper: '#23232a',
    },
    primary: { main: '#ff9800' },
    secondary: { main: '#2196f3' },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: 'Inter, sans-serif' },
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </ThemeProvider>
);

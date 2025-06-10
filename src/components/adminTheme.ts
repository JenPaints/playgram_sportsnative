import { createTheme } from "@mui/material/styles";

export const adminTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ef4444" }, // Red
    secondary: { main: "#001f3f" }, // Navy Blue
    background: {
      default: "#000000", // Black
      paper: "#001f3f",   // Navy for cards/panels
    },
    error: { main: "#ef4444" },
    success: { main: "#16a34a" },
    warning: { main: "#f59e0b" },
    info: { main: "#3b82f6" },
    text: {
      primary: "#fff",
      secondary: "#b0b8c1",
    },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: "Inter, sans-serif" },
}); 
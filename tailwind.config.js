const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
    "./src/components/**/*.{js,ts,jsx,tsx,css}",
    "./src/components/admin/**/*.{js,ts,jsx,tsx,css}",
    "./src/components/coach/**/*.{js,ts,jsx,tsx,css}",
    "./src/components/student/**/*.{js,ts,jsx,tsx,css}",
    "./src/components/ui/**/*.{js,ts,jsx,tsx,css}",
    "./src/components/backgrounds/**/*.{js,ts,jsx,tsx,css}",
    "./src/contexts/**/*.{js,ts,jsx,tsx,css}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,css}",
    "./src/lib/**/*.{js,ts,jsx,tsx,css}",
    "./src/utils/**/*.{js,ts,jsx,tsx,css}",
    "./src/styles/**/*.{js,ts,jsx,tsx,css}",
    "./src/assets/**/*.{js,ts,jsx,tsx,css,json}"
  ],
  safelist: [
    // Buttons
    "bg-primary", "text-primary-foreground", "hover:bg-primary/90",
    "bg-destructive", "text-destructive-foreground", "hover:bg-destructive/90",
    "border", "border-input", "bg-background", "shadow", "hover:bg-accent",
    "hover:text-accent-foreground", "bg-secondary", "text-secondary-foreground",
    "hover:bg-secondary/80", "hover:bg-accent", "hover:text-accent-foreground",
    "rounded-md", "rounded-xl", "rounded-full",
    // Badges
    "bg-green-500", "bg-yellow-500", "bg-red-500", "text-white",
    // Inputs
    "border", "border-gray-200", "focus:border-indigo-500", "focus:ring-2", "focus:ring-indigo-300",
    // Card, Tabs, Toast, etc.
    "bg-card", "text-card-foreground", "bg-muted", "text-muted-foreground",
    "bg-popover", "text-popover-foreground", "bg-accent-foreground",
    "focus-visible:outline-none", "focus-visible:ring-2", "focus-visible:ring-ring", "focus-visible:ring-offset-2",
    "disabled:pointer-events-none", "disabled:opacity-50",
    // Add more as needed based on your UI usage
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter var", ...fontFamily.sans],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          dark: "var(--secondary-dark)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        DEFAULT: "0 1px 4px rgba(0, 0, 0, 0.1)",
        hover: "0 2px 8px rgba(0, 0, 0, 0.12)",
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
    },
  },
  variants: {
    extend: {
      boxShadow: ["hover", "active"],
    },
  },
};

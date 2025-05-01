/*
 * Solana Theme for TelegramWeb
 * This file provides theme settings for Solana integration features
 */

import { createTheme } from "@mui/material/styles";

// Kolory Solana
const SOLANA_PURPLE = "#9945FF";
const SOLANA_GREEN = "#14F195";
const SOLANA_BLACK = "#000000";
const SOLANA_WHITE = "#FFFFFF";

// Bazowy motyw dla funkcji Solana (light mode)
const solanaLightTheme = {
  palette: {
    primary: {
      main: SOLANA_PURPLE,
    },
    secondary: {
      main: SOLANA_GREEN,
    },
    background: {
      default: SOLANA_WHITE,
      paper: "#F9F9F9",
    },
    text: {
      primary: SOLANA_BLACK,
      secondary: "#555555",
    },
  },
  // Specjalne ustawienia dla funkcji Solana
  solana: {
    map: {
      markerColor: SOLANA_PURPLE,
      activeMarkerColor: SOLANA_GREEN,
      backgroundColor: "#F5F5F5",
    },
    payment: {
      buttonBackground: SOLANA_GREEN,
      buttonText: SOLANA_BLACK,
    },
    chat: {
      localChatBadge: SOLANA_PURPLE,
      premiumBadge: SOLANA_GREEN,
    },
    ai: {
      creditsColor: SOLANA_PURPLE,
      premiumColor: SOLANA_GREEN,
    },
  },
};

// Ciemny motyw dla funkcji Solana
const solanaDarkTheme = {
  palette: {
    primary: {
      main: SOLANA_PURPLE,
    },
    secondary: {
      main: SOLANA_GREEN,
    },
    background: {
      default: "#1E1E1E",
      paper: "#2D2D2D",
    },
    text: {
      primary: SOLANA_WHITE,
      secondary: "#BBBBBB",
    },
  },
  // Specjalne ustawienia dla funkcji Solana
  solana: {
    map: {
      markerColor: SOLANA_PURPLE,
      activeMarkerColor: SOLANA_GREEN,
      backgroundColor: "#2A2A2A",
    },
    payment: {
      buttonBackground: SOLANA_GREEN,
      buttonText: SOLANA_BLACK,
    },
    chat: {
      localChatBadge: SOLANA_PURPLE,
      premiumBadge: SOLANA_GREEN,
    },
    ai: {
      creditsColor: SOLANA_PURPLE,
      premiumColor: SOLANA_GREEN,
    },
  },
};

// Funkcja wybierająca odpowiedni motyw Solana na podstawie trybu (jasny/ciemny)
export function getSolanaTheme(mode) {
  const baseTheme = mode === "dark" ? solanaDarkTheme : solanaLightTheme;
  return createTheme(baseTheme);
}

// Stały obiekt z kolorami Solana do wykorzystania w całej aplikacji
export const SOLANA_COLORS = {
  PURPLE: SOLANA_PURPLE,
  GREEN: SOLANA_GREEN,
  BLACK: SOLANA_BLACK,
  WHITE: SOLANA_WHITE,
};

export default getSolanaTheme;

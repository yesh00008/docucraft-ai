export type ThemeId =
  | "midnight"
  | "editorial"
  | "academic"
  | "technical"
  | "minimal"
  | "corporate";

export type DocTheme = {
  id: ThemeId;
  label: string;
  description: string;
  // Preview (on-screen)
  pageBg: string;
  pageText: string;
  titleFont: string;
  bodyFont: string;
  accent: string;
  // PDF (RGB 0-255)
  pdf: {
    titleFont: "helvetica" | "times" | "courier";
    bodyFont: "helvetica" | "times" | "courier";
    titleColor: [number, number, number];
    bodyColor: [number, number, number];
    accentColor: [number, number, number];
    bgColor: [number, number, number] | null;
  };
  // DOCX
  docx: {
    titleFont: string;
    bodyFont: string;
    titleHex: string;
    headingHex: string;
    bodyHex: string;
  };
};

export const THEMES: Record<ThemeId, DocTheme> = {
  midnight: {
    id: "midnight",
    label: "Midnight Focus",
    description: "App-matching dark indigo. Premium feel.",
    pageBg: "linear-gradient(180deg, #141432 0%, #0a0a1a 100%)",
    pageText: "#e8eaf6",
    titleFont: "'Sora', sans-serif",
    bodyFont: "'Manrope', sans-serif",
    accent: "#7c83ff",
    pdf: {
      titleFont: "helvetica",
      bodyFont: "helvetica",
      titleColor: [240, 242, 255],
      bodyColor: [220, 224, 245],
      accentColor: [124, 131, 255],
      bgColor: [15, 15, 35],
    },
    docx: { titleFont: "Calibri", bodyFont: "Calibri", titleHex: "F0F2FF", headingHex: "9AA1FF", bodyHex: "DCE0F5" },
  },
  editorial: {
    id: "editorial",
    label: "Editorial Serif",
    description: "Magazine-style. Warm, classic.",
    pageBg: "#faf7f2",
    pageText: "#1c1a17",
    titleFont: "'Instrument Serif', 'Georgia', serif",
    bodyFont: "'Work Sans', sans-serif",
    accent: "#b85042",
    pdf: {
      titleFont: "times",
      bodyFont: "times",
      titleColor: [25, 22, 18],
      bodyColor: [40, 35, 30],
      accentColor: [184, 80, 66],
      bgColor: null,
    },
    docx: { titleFont: "Georgia", bodyFont: "Georgia", titleHex: "1A1612", headingHex: "B85042", bodyHex: "1A1612" },
  },
  academic: {
    id: "academic",
    label: "Academic",
    description: "Times-style, clean and citable.",
    pageBg: "#ffffff",
    pageText: "#0d0d0d",
    titleFont: "'Libre Baskerville', 'Times', serif",
    bodyFont: "'Times', serif",
    accent: "#1a4a6e",
    pdf: {
      titleFont: "times",
      bodyFont: "times",
      titleColor: [10, 10, 10],
      bodyColor: [25, 25, 25],
      accentColor: [26, 74, 110],
      bgColor: null,
    },
    docx: { titleFont: "Times New Roman", bodyFont: "Times New Roman", titleHex: "0A0A0A", headingHex: "1A4A6E", bodyHex: "1A1A1A" },
  },
  technical: {
    id: "technical",
    label: "Technical",
    description: "Monospace headings, clean sans body.",
    pageBg: "#fcfcfd",
    pageText: "#16161a",
    titleFont: "'JetBrains Mono', monospace",
    bodyFont: "'Inter', 'Manrope', sans-serif",
    accent: "#2dd4a8",
    pdf: {
      titleFont: "courier",
      bodyFont: "helvetica",
      titleColor: [22, 22, 26],
      bodyColor: [38, 38, 42],
      accentColor: [16, 129, 95],
      bgColor: null,
    },
    docx: { titleFont: "Consolas", bodyFont: "Calibri", titleHex: "16161A", headingHex: "10815F", bodyHex: "26262A" },
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    description: "Quiet whites, subtle accents.",
    pageBg: "#ffffff",
    pageText: "#222222",
    titleFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    accent: "#222222",
    pdf: {
      titleFont: "helvetica",
      bodyFont: "helvetica",
      titleColor: [25, 25, 25],
      bodyColor: [55, 55, 55],
      accentColor: [25, 25, 25],
      bgColor: null,
    },
    docx: { titleFont: "Calibri", bodyFont: "Calibri", titleHex: "191919", headingHex: "191919", bodyHex: "373737" },
  },
  corporate: {
    id: "corporate",
    label: "Corporate Navy",
    description: "Trustworthy navy, business-ready.",
    pageBg: "#f4f6fa",
    pageText: "#0f1b3d",
    titleFont: "'Sora', sans-serif",
    bodyFont: "'Manrope', sans-serif",
    accent: "#1e3a5f",
    pdf: {
      titleFont: "helvetica",
      bodyFont: "helvetica",
      titleColor: [15, 27, 61],
      bodyColor: [30, 35, 55],
      accentColor: [30, 58, 95],
      bgColor: [244, 246, 250],
    },
    docx: { titleFont: "Calibri", bodyFont: "Calibri", titleHex: "0F1B3D", headingHex: "1E3A5F", bodyHex: "1E2337" },
  },
};

export const THEME_LIST = Object.values(THEMES);
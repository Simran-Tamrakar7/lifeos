/** Curated Google Fonts for LifeOS appearance settings */

export type FontChoice = {
  id: string;
  label: string;
  family: string;
  google: string;
};

export const DISPLAY_FONTS: FontChoice[] = [
  {
    id: "fraunces",
    label: "Fraunces",
    family: '"Fraunces", Georgia, serif',
    google: "Fraunces:wght@500;600;700",
  },
  {
    id: "playfair",
    label: "Playfair Display",
    family: '"Playfair Display", Georgia, serif',
    google: "Playfair+Display:wght@500;600;700",
  },
  {
    id: "instrument",
    label: "Instrument Serif",
    family: '"Instrument Serif", Georgia, serif',
    google: "Instrument+Serif:wght@400",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    family: '"Space Grotesk", system-ui, sans-serif',
    google: "Space+Grotesk:wght@500;600;700",
  },
  {
    id: "outfit",
    label: "Outfit",
    family: '"Outfit", system-ui, sans-serif',
    google: "Outfit:wght@500;600;700",
  },
];

export const BODY_FONTS: FontChoice[] = [
  {
    id: "public-sans",
    label: "Public Sans",
    family: '"Public Sans", system-ui, sans-serif',
    google: "Public+Sans:wght@400;500;600",
  },
  {
    id: "source-sans",
    label: "Source Sans 3",
    family: '"Source Sans 3", system-ui, sans-serif',
    google: "Source+Sans+3:wght@400;500;600",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    family: '"DM Sans", system-ui, sans-serif',
    google: "DM+Sans:wght@400;500;600",
  },
  {
    id: "inter",
    label: "Inter",
    family: '"Inter", system-ui, sans-serif',
    google: "Inter:wght@400;500;600",
  },
  {
    id: "ibm-plex-sans",
    label: "IBM Plex Sans",
    family: '"IBM Plex Sans", system-ui, sans-serif',
    google: "IBM+Plex+Sans:wght@400;500;600",
  },
];

export const MONO_FONTS: FontChoice[] = [
  {
    id: "ibm-plex-mono",
    label: "IBM Plex Mono",
    family: '"IBM Plex Mono", ui-monospace, monospace',
    google: "IBM+Plex+Mono:wght@400;500;600",
  },
  {
    id: "jetbrains",
    label: "JetBrains Mono",
    family: '"JetBrains Mono", ui-monospace, monospace',
    google: "JetBrains+Mono:wght@400;500;600",
  },
  {
    id: "space-mono",
    label: "Space Mono",
    family: '"Space Mono", ui-monospace, monospace',
    google: "Space+Mono:wght@400;700",
  },
];

export function findFont(
  list: FontChoice[],
  id: string | undefined,
  fallbackId: string
): FontChoice {
  return list.find((f) => f.id === id) ?? list.find((f) => f.id === fallbackId) ?? list[0];
}

export function googleFontsHref(ids: { display?: string; body?: string; mono?: string }) {
  const families = [
    findFont(DISPLAY_FONTS, ids.display, "fraunces").google,
    findFont(BODY_FONTS, ids.body, "public-sans").google,
    findFont(MONO_FONTS, ids.mono, "ibm-plex-mono").google,
  ];
  const unique = [...new Set(families)];
  return `https://fonts.googleapis.com/css2?${unique
    .map((f) => `family=${f}`)
    .join("&")}&display=swap`;
}

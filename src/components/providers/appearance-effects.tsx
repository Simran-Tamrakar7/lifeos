"use client";

import { useEffect } from "react";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import {
  BODY_FONTS,
  DISPLAY_FONTS,
  MONO_FONTS,
  findFont,
  googleFontsHref,
} from "@/lib/fonts";

const LINK_ID = "lifeos-google-fonts";

export function AppearanceEffects() {
  const settings = useLifeOSStore((s) => s.settings);

  useEffect(() => {
    const href = googleFontsHref({
      display: settings.displayFont,
      body: settings.bodyFont,
      mono: settings.monoFont,
    });
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;

    const display = findFont(DISPLAY_FONTS, settings.displayFont, "fraunces");
    const bodyFont = findFont(BODY_FONTS, settings.bodyFont, "public-sans");
    const mono = findFont(MONO_FONTS, settings.monoFont, "ibm-plex-mono");
    const root = document.documentElement;
    const docBody = document.body;
    for (const el of [root, docBody]) {
      el.style.setProperty("--font-display", display.family);
      el.style.setProperty("--font-geist-sans", bodyFont.family);
      el.style.setProperty("--font-sans", bodyFont.family);
      el.style.setProperty("--font-geist-mono", mono.family);
      el.style.setProperty("--font-mono", mono.family);
    }

    const scale = settings.fontScale ?? "md";
    root.dataset.fontScale = scale;
    root.style.fontSize = scale === "sm" ? "14px" : scale === "lg" ? "18px" : "16px";

    const motion =
      settings.reducedMotion || settings.motion === "off"
        ? "off"
        : settings.motion ?? "full";
    root.dataset.motion = motion;
    root.classList.toggle("reduce-motion", motion === "off");

    root.dataset.radius = settings.radius ?? "soft";
    root.dataset.wallpaper = settings.wallpaper ?? "blobs";
    root.classList.toggle("no-glass", settings.glassEffects === false);
    root.classList.toggle("compact", !!settings.compactMode);
    root.classList.toggle("high-contrast", !!settings.highContrast);
    root.classList.toggle("no-page-motion", settings.pageTransitions === false);
  }, [settings]);

  return null;
}

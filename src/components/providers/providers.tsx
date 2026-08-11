"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { AppearanceEffects } from "@/components/providers/appearance-effects";

function StoreHydration({ children }: { children: React.ReactNode }) {
  const hydrated = useLifeOSStore((s) => s.hydrated);
  const setHydrated = useLifeOSStore((s) => s.setHydrated);
  const accent = useLifeOSStore((s) => s.settings.accent);
  const daylightMode = useLifeOSStore((s) => s.settings.daylightMode);
  const { setTheme } = useTheme();

  useEffect(() => {
    if (useLifeOSStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useLifeOSStore.persist.onFinishHydration(() => setHydrated(true));
    const t = setTimeout(() => setHydrated(true), 300);
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, [setHydrated]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  // Keep next-themes + store in sync (ink navy vs warm cream)
  useEffect(() => {
    if (!hydrated) return;
    setTheme(daylightMode ? "light" : "dark");
  }, [hydrated, daylightMode, setTheme]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <p className="text-sm text-[var(--fg-muted)]">Booting LifeOS…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppearanceEffects />
      {children}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={client}>
        <StoreHydration>{children}</StoreHydration>
        <Toaster theme="system" position="bottom-right" richColors closeButton />
      </QueryClientProvider>
    </NextThemesProvider>
  );
}

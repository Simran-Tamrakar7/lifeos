"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function RegisterSW() {
  const reloading = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let reg: ServiceWorkerRegistration | undefined;

    const onControllerChange = () => {
      if (reloading.current) return;
      reloading.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const promptUpdate = (waiting: ServiceWorker) => {
      toast("Update available", {
        description: "A new LifeOS version is ready.",
        duration: Infinity,
        action: {
          label: "Refresh",
          onClick: () => waiting.postMessage("SKIP_WAITING"),
        },
      });
    };

    navigator.serviceWorker
      .register(`/sw.js?v=${process.env.NEXT_PUBLIC_BUILD_ID || "1"}`)
      .then((r) => {
        reg = r;
        if (r.waiting) promptUpdate(r.waiting);

        r.addEventListener("updatefound", () => {
          const sw = r.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              promptUpdate(sw);
            }
          });
        });
      })
      .catch(() => {
        /* ponytail: SW optional */
      });

    // Check for new SW when tab is focused / periodically
    const check = () => {
      void reg?.update();
    };
    const onVis = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", check);
    const interval = window.setInterval(check, 60_000);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", check);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}

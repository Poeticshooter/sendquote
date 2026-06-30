"use client";

import { useEffect } from "react";

export function FormbricksProvider() {
  useEffect(() => {
    try {
      const envId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
      if (!envId || envId === "placeholder") return;

      const script = document.createElement("script");
      script.src = `https://cdn.jsdelivr.net/npm/@formbricks/js@latest/dist/index.umd.js`;
      script.async = true;
      script.onload = () => {
        try {
          const fb = (window as unknown as { formbricks?: { init: (c: { environmentId: string; apiHost: string }) => void } }).formbricks;
          if (fb) fb.init({ environmentId: envId, apiHost: "https://app.formbricks.com" });
        } catch { /* formbricks init failed silently */ }
      };
      script.onerror = () => { /* formbricks script load failed silently */ };
      document.head.appendChild(script);
    } catch { /* formbricks setup failed silently */ }
  }, []);

  return null;
}

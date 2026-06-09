"use client";

import { useEffect } from "react";

export function FormbricksProvider() {
  useEffect(() => {
    const envId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
    if (!envId) return;

    const script = document.createElement("script");
    script.src = `https://cdn.jsdelivr.net/npm/@formbricks/js@latest/dist/index.umd.js`;
    script.async = true;
    script.onload = () => {
      const formbricks = (window as unknown as { formbricks?: { init: (config: { environmentId: string; apiHost: string }) => void } }).formbricks;
      if (formbricks) {
        formbricks.init({ environmentId: envId, apiHost: "https://app.formbricks.com" });
      }
    };
    document.head.appendChild(script);
  }, []);

  return null;
}

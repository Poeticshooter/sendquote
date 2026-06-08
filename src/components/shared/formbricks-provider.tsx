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
      const win = window as any;
      if (win.formbricks) {
        win.formbricks.init({ environmentId: envId, apiHost: "https://app.formbricks.com" });
      }
    };
    document.head.appendChild(script);
  }, []);

  return null;
}

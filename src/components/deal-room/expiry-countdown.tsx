"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface ExpiryCountdownProps {
  validUntil: string | null;
}

export function ExpiryCountdown({ validUntil }: ExpiryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!validUntil) return;
    const expiryDate = new Date(validUntil);

    function update() {
      const now = Date.now();
      const diff = expiryDate.getTime() - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        setExpired(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${mins}m remaining`);
      } else {
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${mins}m remaining`);
      }
    }

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [validUntil]);

  if (!validUntil) return null;

  return (
    <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
      expired ? "bg-red-50 text-red-600 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
    }`}>
      {expired ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      <span>{expired ? "This quote has expired" : timeLeft}</span>
    </div>
  );
}

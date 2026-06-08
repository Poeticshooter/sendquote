"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "deal" | "payment" | "system";
  read: boolean;
  createdAt: string;
  href?: string;
}

interface NotificationCenterProps {
  notifications?: Notification[];
}

const defaultNotifications: Notification[] = [
  { id: "1", title: "Quote Opened", message: "Acme Corp viewed their quote", type: "deal", read: false, createdAt: new Date().toISOString() },
  { id: "2", title: "Quote Accepted", message: "Client accepted your quote", type: "deal", read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
];

export function NotificationCenter({ notifications = defaultNotifications }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1" onClick={() => {}}>
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={cn("flex gap-3 border-b px-4 py-3 last:border-0", !n.read && "bg-secondary/30")}>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium">{n.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("profiles").select("plan").eq("user_id", user.id).single()
        .then(({ data }) => {
          const plan = data?.plan;
          if (plan === "pro" || plan === "enterprise") {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        });
    });
  }, [router, supabase]);

  if (authorized === null) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 mb-6">
          <ShieldX className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Access Restricted</h2>
        <p className="text-muted-foreground max-w-md mb-8">
           Admin access requires a <span className="text-foreground font-medium">Pro</span> or{" "}
           <span className="text-foreground font-medium">Enterprise</span> plan.{" "}
          Upgrade your plan to access system administration features.
        </p>
        <div className="flex gap-4">
          <Link href="/settings">
            <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Upgrade Plan
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="border-border">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";

export default async function PortalTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("public_token")
    .eq("public_token", token)
    .single();

  if (!quote) notFound();
  redirect(`/q/${token}`);
}

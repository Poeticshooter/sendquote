import "server-only";
import { cache } from "react";
import { createClient } from "./server";
import { createAdminClient } from "./admin";
import { v4 as uuid } from "uuid";

function requireUser<T>(user: T | null): asserts user is T {
  if (!user) throw new Error("Not authenticated");
}

export async function getQuotes(orgId?: string, page = 0, pageSize = 50) {
  pageSize = Math.min(pageSize, 100);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  requireUser(user);

  let query = supabase
    .from("quotes")
    .select("id, quote_number, client_name, client_email, client_phone, status, total, subtotal, gst_rate, gst_amount, notes, terms, payment_terms, valid_until, created_at, updated_at, public_token, organization_id, user_id")
    .or("is_deleted.is.null,is_deleted.eq.false")
    .order("created_at", { ascending: false });

  if (orgId) {
    query = query.eq("organization_id", orgId);
  } else {
    query = query.eq("user_id", user.id);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await query.range(from, to);
  if (error) throw error;
  return data;
}

export async function getQuote(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  requireUser(user);

  const { data, error } = await supabase
    .from("quotes")
    .select("*, quote_items(*)")
    .eq("id", id)
    .or("is_deleted.is.null,is_deleted.eq.false")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Quote not found");
  if (data.user_id !== user.id) throw new Error("Not authorized");

  return data;
}

export async function getQuoteByToken(token: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*, quote_items(*)")
    .eq("public_token", token)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export const getCachedQuotes = cache(getQuotes);
export const getCachedQuote = cache(getQuote);

export async function createQuote(quote: {
  user_id: string;
  quote_number: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  items: { description: string; quantity: number; rate: number; unit?: string; hsn_code?: string }[];
  notes?: string;
  terms?: string;
  payment_terms?: string;
  valid_until?: string;
  tax?: number;
  gst_rate?: number;
  discount?: number;
  discount_type?: "percentage" | "fixed";
  is_inter_state?: boolean;
  place_of_supply?: string;
  organization_id?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  requireUser(user);

  const subtotal = quote.items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const gstRate = quote.gst_rate || 0;

  // Apply discount BEFORE tax (standard Indian GST practice)
  const discountType = quote.discount_type || "percentage";
  const discountAmount = discountType === "percentage"
    ? subtotal * ((quote.discount || 0) / 100)
    : (quote.discount || 0);
  const taxableAmount = subtotal - discountAmount;

  const gstAmount = gstRate ? taxableAmount * (gstRate / 100) : 0;

  // Split GST into CGST/SGST (intra-state) or IGST (inter-state)
  const isInterState = quote.is_inter_state ?? false;
  const halfGstRate = isInterState ? 0 : gstRate / 2;
  const halfGstAmount = isInterState ? 0 : gstAmount / 2;
  const igstRate = isInterState ? gstRate : 0;
  const igstAmount = isInterState ? gstAmount : 0;

  const total = taxableAmount + gstAmount;
  const token = uuid();

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      user_id: quote.user_id,
      quote_number: quote.quote_number,
      client_name: quote.client_name,
      client_email: quote.client_email,
      client_phone: quote.client_phone,
      client_address: quote.client_address || null,
      status: "draft",
      subtotal,
      discount: discountAmount,
      discount_type: discountType,
      tax: quote.tax || 0,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      cgst_rate: halfGstRate,
      cgst_amount: halfGstAmount,
      sgst_rate: halfGstRate,
      sgst_amount: halfGstAmount,
      igst_rate: igstRate,
      igst_amount: igstAmount,
      total,
      notes: quote.notes,
      terms: quote.terms,
      payment_terms: quote.payment_terms,
      valid_until: quote.valid_until,
      public_token: token,
      place_of_supply: quote.place_of_supply || null,
      organization_id: quote.organization_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const itemsToInsert = quote.items.map((item, index) => ({
    quote_id: data.id,
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
    unit: item.unit || "pc",
    hsn_code: item.hsn_code || null,
    amount: item.quantity * item.rate,
    sort_order: index,
  }));

  const { error: itemsError } = await supabase
    .from("quote_items")
    .insert(itemsToInsert);

  if (itemsError) {
    await supabase.from("quotes").update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq("id", data.id);
    throw new Error(`Failed to create quote items: ${itemsError.message}`);
  }

  return data;
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent", "archived"],
  sent: ["opened", "accepted", "lost", "archived"],
  opened: ["accepted", "changes_requested", "lost", "archived"],
  changes_requested: ["draft", "sent", "lost", "archived"],
  accepted: ["archived"],
  expired: ["archived"],
  archived: [],
  lost: [],
};

export async function updateQuoteStatus(id: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  requireUser(user);

  const { data: existing } = await supabase
    .from("quotes")
    .select("status, user_id")
    .eq("id", id)
    .single();

  if (!existing) throw new Error("Quote not found");
  if (existing.user_id !== user.id) throw new Error("Not authorized");

  const allowed = VALID_STATUS_TRANSITIONS[existing.status];
  if (!allowed || !allowed.includes(status)) {
    throw new Error(`Cannot transition from "${existing.status}" to "${status}"`);
  }

  const { data, error } = await supabase
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  // Log status change to audit trail
  await supabase.from("quote_events").insert({
    quote_id: id,
    event_type: `status:${status}`,
    notes: `Status changed from "${existing.status}" to "${status}"`,
    metadata: { previous_status: existing.status, new_status: status },
  });

  return data;
}

export async function getClients() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, phone, address, gst_number, notes, total_quotes, total_revenue, last_quote_date, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function generateQuoteNumber(userId: string): Promise<string> {
  const supabase = await createClient();
  // Use RPC for atomic increment (avoids race conditions from read-then-write)
  const { data: rpcData, error: rpcError } = await supabase.rpc("increment_quote_counter", {
    user_id: userId,
  });

  if (rpcError) {
    throw new Error(`Failed to generate quote number: ${rpcError.message}`);
  }

  // RPC returns an array with the result or a single object
  const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  const nextNum = (result as Record<string, number> | undefined)?.quote_counter ?? 1;
  const date = new Date();
  return `QTE-${date.getFullYear()}-${String(nextNum).padStart(4, "0")}`;
}

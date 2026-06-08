import { z } from "zod";

export const QuoteItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  quantity: z.number().min(0.01, "Quantity must be > 0").max(999999),
  rate: z.number().min(0, "Rate must be >= 0").max(999999999),
  unit: z.string().max(50).optional(),
});

export const CreateQuoteSchema = z.object({
  client_name: z.string().min(1, "Client name is required").max(200),
  client_email: z.string().email("Invalid email").max(320).optional().or(z.literal("")),
  client_phone: z.string().max(50).optional().or(z.literal("")),
  items: z.array(QuoteItemSchema).min(1, "At least one item is required").max(500),
  notes: z.string().max(5000).optional().or(z.literal("")),
  terms: z.string().max(10000).optional().or(z.literal("")),
  payment_terms: z.string().max(1000).optional().or(z.literal("")),
  valid_until: z.string().max(50).optional().or(z.literal("")),
  tax: z.number().min(0).max(999999999).optional(),
  gst_rate: z.number().min(0).max(100).optional(),
  organization_id: z.string().uuid().optional().or(z.literal("")),
});

export const UpdateQuoteStatusSchema = z.object({
  status: z.enum(["draft", "sent", "opened", "accepted", "changes_requested", "expired", "archived", "lost"]),
});

export const SendQuoteSchema = z.object({
  quote_id: z.string().uuid("Invalid quote ID"),
  recipient_email: z.string().email("Invalid email").max(320).optional().or(z.literal("")),
});

export const AcceptQuoteSchema = z.object({
  public_token: z.string().min(1, "Public token is required"),
  signatory_name: z.string().max(200).optional().or(z.literal("")),
  signatory_email: z.string().email().max(320).optional().or(z.literal("")),
  signature_data: z.string().min(1, "Signature is required"),
});

export const AIGenerateSchema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters").max(2000).refine((s) => s.trim().length >= 3, { message: "Description must be at least 3 characters" }),
  industry: z.string().max(100).optional(),
});

export const AICopilotSchema = z.object({
  quote_id: z.string().uuid("Invalid quote ID"),
});

export const AIFollowupSchema = z.object({
  quote_id: z.string().uuid("Invalid quote ID"),
});

export const ChatMessageSchema = z.object({
  quote_id: z.string().uuid("Invalid quote ID"),
  message: z.string().min(1, "Message is required").max(5000),
});

export const BuyerChatSchema = z.object({
  public_token: z.string().min(1, "Public token is required"),
  message: z.string().min(1, "Message is required").max(5000),
  sender_name: z.string().max(200).optional().or(z.literal("")),
});

export const PortalSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const CreateClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().max(320).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(1000).optional().or(z.literal("")),
  gst_number: z.string().max(50).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  organization_id: z.string().uuid().optional().or(z.literal("")),
});

export const RazorpayPaymentSchema = z.object({
  amount: z.number().min(1, "Amount must be > 0").max(999999999),
  currency: z.string().max(10).optional(),
});

export const EventSchema = z.object({
  quote_id: z.string().uuid("Invalid quote ID"),
  event_type: z.string().min(1, "Event type is required").max(100),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const ApprovalCheckSchema = z.object({
  quote_id: z.string().uuid("Invalid quote ID"),
});

export const SubscriptionSchema = z.object({}).optional();

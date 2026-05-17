import { z } from 'zod'

export function validate<T extends z.ZodType>(schema: T, data: unknown): { data: z.infer<T>; error: null } | { data: null; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const path = firstIssue.path.join('.')
    return { data: null, error: path ? `${path}: ${firstIssue.message}` : firstIssue.message }
  }
  return { data: result.data, error: null }
}

// /api/webhooks POST
export const webhookCreateSchema = z.object({
  url: z.string().url('Must be a valid URL').startsWith('http', 'Must start with http or https'),
  events: z.array(z.string()).min(1, 'At least one event required'),
  secret: z.string().optional().nullable(),
})

// /api/webhooks/trigger POST
export const webhookTriggerSchema = z.object({
  event: z.string().min(1, 'Event is required'),
  data: z.record(z.string(), z.unknown()).refine(val => Object.keys(val).length > 0, 'Data object must not be empty'),
})

// /api/send-quote-email POST
export const sendQuoteEmailSchema = z.object({
  quoteId: z.string().min(1, 'quoteId is required'),
})

// /api/public-quote-action POST
export const publicQuoteActionSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  action: z.enum(['accepted', 'changes_requested']),
  notes: z.string().max(2000, 'Notes must be under 2000 characters').optional(),
})

// /api/convert-to-invoice POST
export const convertToInvoiceSchema = z.object({
  quoteId: z.string().min(1, 'quoteId is required'),
})

// /api/create-razorpay-order POST
export const createRazorpayOrderSchema = z.object({
  planType: z.string().min(1, 'Plan type is required'),
  billingCycle: z.enum(['monthly', 'annual']).optional(),
  couponCode: z.string().max(50).optional(),
})

// /api/clients POST
export const clientCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be under 200 characters'),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().max(20, 'Phone must be under 20 characters').optional().nullable(),
  address: z.string().max(500, 'Address must be under 500 characters').optional().nullable(),
  gstNumber: z.string().max(20, 'GST number must be under 20 characters').optional().nullable(),
  notes: z.string().max(1000, 'Notes must be under 1000 characters').optional().nullable(),
})

// /api/create-razorpay-order PUT (payment confirmation)
export const razorpayConfirmSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  signature: z.string().min(1, 'Signature is required'),
  planType: z.string().min(1, 'Plan type is required'),
  billingCycle: z.enum(['monthly', 'annual']).optional(),
})

// /api/clients PUT/PATCH
export const clientUpdateSchema = z.object({
  id: z.string().uuid('Invalid client ID'),
  name: z.string().min(1, 'Name is required').max(200, 'Name must be under 200 characters').optional(),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().max(20, 'Phone must be under 20 characters').optional().nullable(),
  address: z.string().max(500, 'Address must be under 500 characters').optional().nullable(),
  gstNumber: z.string().max(20, 'GST number must be under 20 characters').optional().nullable(),
  notes: z.string().max(1000, 'Notes must be under 1000 characters').optional().nullable(),
})

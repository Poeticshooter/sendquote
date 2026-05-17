import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generateInvoicePDF } from '@/lib/pdf'
import { getUser } from '@/lib/auth'
import { logger } from '@/lib/logger'

type InvoiceItem = { description: string; spec?: string; quantity: number; unit: string; rate: number; amount: number }
type Payment = { amount: number }

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    if (invErr || !invoice) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    if (invoice.user_id !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, logo_url, phone, gst_number, address, upi_id')
      .eq('user_id', invoice.user_id)
      .single()

    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order')

    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("invoice_id", id)
    const paidAmount = (payments || []).reduce((sum: number, p: Payment) => sum + Number(p.amount), 0)

    const pdfBytes = await generateInvoicePDF({
      businessName: profile?.business_name || 'Your Business',
      logoUrl: profile?.logo_url || undefined,
      invoiceNumber: invoice.invoice_number,
      date: new Date(invoice.created_at).toLocaleDateString('en-IN'),
      dueDate: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'N/A',
      status: invoice.status,
      clientName: invoice.client_name,
      clientAddress: invoice.client_address || '',
      clientPhone: invoice.client_phone || '',
      clientEmail: invoice.client_email || '',
      items: (items || []).map((i: InvoiceItem) => ({
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        rate: i.rate,
        amount: i.amount,
      })),
      subtotal: Number(invoice.subtotal),
      discount: Number(invoice.discount),
      discountType: invoice.discount_type,
      gstRate: Number(invoice.gst_rate),
      gstAmount: Number(invoice.gst_amount),
      total: Number(invoice.total),
      paidAmount,
      terms: invoice.terms || '',
      notes: invoice.notes || '',
      paymentTerms: invoice.payment_terms || '',
      upiId: profile?.upi_id || undefined,
    })

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    logger.error('Invoice PDF error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

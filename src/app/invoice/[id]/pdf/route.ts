import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getUser } from '@/lib/auth'
import { generateInvoicePDF } from '@/lib/pdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !invoice) {
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

  const pdfBytes = await generateInvoicePDF({
    businessName: profile?.business_name || 'Your Business',
    logoUrl: profile?.logo_url || undefined,
    phone: profile?.phone || '',
    gstNumber: profile?.gst_number || '',
    address: profile?.address || '',
    invoiceNumber: invoice.invoice_number,
    date: new Date(invoice.created_at).toLocaleDateString('en-IN'),
    dueDate: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'N/A',
    status: invoice.status,
    clientName: invoice.client_name,
    clientAddress: invoice.client_address || '',
    clientPhone: invoice.client_phone || '',
    clientEmail: invoice.client_email || '',
    items: (items || []).map(i => ({
      description: i.description,
      quantity: Number(i.quantity),
      unit: i.unit,
      rate: Number(i.rate),
      amount: Number(i.amount),
    })),
    subtotal: Number(invoice.subtotal),
    discount: Number(invoice.discount),
    discountType: invoice.discount_type,
    gstRate: Number(invoice.gst_rate),
    gstAmount: Number(invoice.gst_amount),
    total: Number(invoice.total),
    paidAmount: Number(invoice.paid_amount || 0),
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
}

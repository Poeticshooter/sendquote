import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import JSZip from 'jszip'
import { getUser } from '@/lib/auth'
import { logger } from '@/lib/logger'

function toCSV(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (val: unknown) => {
    const s = String(val ?? '')
    return `"${s.replace(/"/g, '""')}"`
  }
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n')
}

export async function GET(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const format = request.nextUrl.searchParams.get('format') || 'zip'
  const supabase = createAdminClient()

  const [quotes, profile, invoices, payments] = await Promise.all([
    supabase.from('quotes').select('*, quote_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('invoices').select('*, invoice_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('payments').select('*, invoices(invoice_number)').in('invoice_id', (await supabase.from('invoices').select('id').eq('user_id', user.id)).data?.map((i: { id: string }) => i.id) || []),
  ])

  const quoteHeaders = ['id', 'quote_number', 'client_name', 'client_email', 'client_phone', 'status', 'subtotal', 'discount', 'gst_rate', 'total', 'created_at', 'valid_until']
  const invoiceHeaders = ['id', 'invoice_number', 'client_name', 'client_email', 'status', 'subtotal', 'gst_rate', 'total', 'paid_amount', 'balance_due', 'created_at', 'due_date']
  const paymentHeaders = ['id', 'invoice_number', 'amount', 'payment_date', 'payment_method', 'notes']
  const clientHeaders = ['name', 'email', 'phone', 'address', 'total_quotes', 'total_value']

  const quoteRows = (quotes.data || []).map(q => ({
    id: q.id,
    quote_number: q.quote_number,
    client_name: q.client_name,
    client_email: q.client_email,
    client_phone: q.client_phone,
    status: q.status,
    subtotal: q.subtotal,
    discount: q.discount,
    gst_rate: q.gst_rate,
    total: q.total,
    created_at: q.created_at,
    valid_until: q.valid_until || '',
  }))

  const invoiceRows = (invoices.data || []).map(inv => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    client_name: inv.client_name,
    client_email: inv.client_email,
    status: inv.status,
    subtotal: inv.subtotal,
    gst_rate: inv.gst_rate,
    total: inv.total,
    paid_amount: inv.paid_amount || 0,
    balance_due: inv.balance_due || 0,
    created_at: inv.created_at,
    due_date: inv.due_date || '',
  }))

  const clientMap = new Map<string, { name: string; email: string; phone: string; address: string; total_quotes: number; total_value: number }>()
  for (const q of quotes.data || []) {
    const key = q.client_email || q.client_phone || q.client_name
    if (!clientMap.has(key)) {
      clientMap.set(key, { name: q.client_name, email: q.client_email || '', phone: q.client_phone || '', address: q.client_address || '', total_quotes: 0, total_value: 0 })
    }
    const c = clientMap.get(key)!
    c.total_quotes++
    c.total_value += Number(q.total)
  }
  const clientRows = Array.from(clientMap.values())

  const paymentRows = (payments.data || []).map(p => ({
    id: p.id,
    invoice_number: p.invoices?.invoice_number || '',
    amount: p.amount,
    payment_date: p.payment_date,
    payment_method: p.payment_method,
    notes: p.notes || '',
  }))

  const profileData = profile.data || {}

  if (format === 'json') {
    return NextResponse.json({
      profile: profileData,
      quotes: quoteRows,
      invoices: invoiceRows,
      clients: clientRows,
      payments: paymentRows,
      exportedAt: new Date().toISOString(),
    })
  }

  if (format === 'csv') {
    const csvContent = [
      '=== QUOTES ===',
      toCSV(quoteHeaders, quoteRows),
      '',
      '=== INVOICES ===',
      toCSV(invoiceHeaders, invoiceRows),
      '',
      '=== CLIENTS ===',
      toCSV(clientHeaders, clientRows),
      '',
      '=== PAYMENTS ===',
      toCSV(paymentHeaders, paymentRows),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sendquote-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  const zip = new JSZip()
  zip.file('quotes.csv', toCSV(quoteHeaders, quoteRows))
  zip.file('invoices.csv', toCSV(invoiceHeaders, invoiceRows))
  zip.file('clients.csv', toCSV(clientHeaders, clientRows))
  zip.file('payments.csv', toCSV(paymentHeaders, paymentRows))
  zip.file('profile.json', JSON.stringify(profileData, null, 2))
  zip.file('full-export.json', JSON.stringify({
    profile: profileData,
    quotes: quoteRows,
    invoices: invoiceRows,
    clients: clientRows,
    payments: paymentRows,
    exportedAt: new Date().toISOString(),
  }, null, 2))

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

  logger.info('Data export completed', { userId: user.id, quoteCount: quotes.data?.length || 0, invoiceCount: invoices.data?.length || 0 })

  return new NextResponse(zipBuffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="sendquote-export-${new Date().toISOString().split('T')[0]}.zip"`,
    },
  })
}

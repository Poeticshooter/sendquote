import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = createAdminClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user) return user
  }
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

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
    .select('business_name, logo_url')
    .eq('user_id', invoice.user_id)
    .single()

  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order')

  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const page = doc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()

  let y = height - 50
  const margin = 50
  const col1 = margin

  if (profile?.logo_url) {
    try {
      const res = await fetch(profile.logo_url)
      if (res.ok) {
        const bytes = new Uint8Array(await res.arrayBuffer())
        const ext = profile.logo_url.split('.').pop()?.toLowerCase() || ''
        const img = ext === 'png'
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes)
        const dims = img.scale(0.35)
        page.drawImage(img, { x: col1, y: y - dims.height, width: dims.width, height: dims.height })
        y -= dims.height + 8
      }
    } catch { }
  }

  page.drawText(profile?.business_name || 'Your Business', {
    x: col1, y, size: 20, font: bold, color: rgb(0.1, 0.1, 0.1),
  })
  y -= 8

  page.drawText(`INVOICE #${invoice.invoice_number}`, {
    x: col1, y: y - 10, size: 12, font: bold, color: rgb(0.3, 0.3, 0.3),
  })

  const rightX = width - margin - 150
  page.drawText(`Date: ${new Date(invoice.created_at).toLocaleDateString('en-IN')}`, { x: rightX, y: y - 10, size: 10, font })

  y -= 40

  page.drawText('Bill To:', { x: col1, y, size: 12, font: bold })
  y -= 18
  page.drawText(invoice.client_name, { x: col1, y, size: 10, font })
  y -= 14
  if (invoice.client_address) { page.drawText(invoice.client_address, { x: col1, y, size: 10, font }); y -= 14 }
  if (invoice.client_phone) { page.drawText(`Phone: ${invoice.client_phone}`, { x: col1, y, size: 10, font }); y -= 14 }
  if (invoice.client_email) { page.drawText(`Email: ${invoice.client_email}`, { x: col1, y, size: 10, font }); y -= 14 }

  y -= 20

  const tableTop = y
  page.drawRectangle({ x: col1, y: tableTop - 4, width: 495, height: 22, color: rgb(0.95, 0.95, 0.95) })
  const cols = [
    { x: col1, label: 'Description' },
    { x: col1 + 250, label: 'Qty' },
    { x: col1 + 300, label: 'Unit' },
    { x: col1 + 340, label: 'Rate' },
    { x: col1 + 410, label: 'Amount' },
  ]
  cols.forEach(c => { page.drawText(c.label, { x: c.x, y: tableTop, size: 10, font: bold }) })

  y = tableTop - 25

  for (const item of (items || [])) {
    page.drawText(item.description, { x: col1, y, size: 9, font })
    page.drawText(String(item.quantity), { x: col1 + 250, y, size: 9, font })
    page.drawText(item.unit, { x: col1 + 300, y, size: 9, font })
    page.drawText(`₹${Number(item.rate).toFixed(2)}`, { x: col1 + 340, y, size: 9, font })
    page.drawText(`₹${Number(item.amount).toFixed(2)}`, { x: col1 + 410, y, size: 9, font })
    y -= 18
  }

  y -= 10
  const totalX = width - margin - 200

  page.drawText(`Subtotal: ₹${Number(invoice.subtotal).toFixed(2)}`, { x: totalX, y, size: 10, font })
  y -= 16

  if (Number(invoice.discount) > 0) {
    page.drawText(`Discount: -₹${Number(invoice.discount).toFixed(2)}`, { x: totalX, y, size: 10, font, color: rgb(0.9, 0.2, 0.2) })
    y -= 16
  }

  if (Number(invoice.gst_rate) > 0) {
    page.drawText(`GST (${invoice.gst_rate}%): ₹${Number(invoice.gst_amount).toFixed(2)}`, { x: totalX, y, size: 10, font })
    y -= 16
  }

  page.drawText(`Total: ₹${Number(invoice.total).toFixed(2)}`, {
    x: totalX, y, size: 14, font: bold, color: rgb(0.1, 0.1, 0.1),
  })

  y -= 40

  if (invoice.terms) {
    page.drawText('Terms & Conditions:', { x: col1, y, size: 10, font: bold })
    y -= 16
    page.drawText(invoice.terms, { x: col1, y, size: 9, font })
    y -= 20
  }

  if (invoice.notes) {
    page.drawText('Notes:', { x: col1, y, size: 10, font: bold })
    y -= 16
    page.drawText(invoice.notes, { x: col1, y, size: 9, font })
  }

  page.drawText('Generated by SendQuote', {
    x: margin, y: 30, size: 8, font, color: rgb(0.6, 0.6, 0.6),
  })

  return new NextResponse(Buffer.from(await doc.save()), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
    },
  })
}
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

async function fetchImage(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    return new Uint8Array(buffer)
  } catch {
    return null
  }
}

interface QuoteItemPDF {
  description: string
  spec?: string
  quantity: number
  unit: string
  rate: number
  amount: number
}

interface QuotePDFData {
  businessName: string
  logoUrl?: string
  phone?: string
  gstNumber?: string
  address?: string
  quoteNumber: string
  date: string
  validTill: string
  status?: string
  clientName: string
  clientAddress: string
  clientPhone: string
  clientEmail: string
  items: QuoteItemPDF[]
  subtotal: number
  discount: number
  discountType: string
  gstRate: number
  gstAmount: number
  total: number
  terms: string
  notes: string
  paymentTerms: string
}

export async function generateQuotePDF(data: QuotePDFData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const page = doc.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()

  let y = height - 50
  const margin = 50
  const col1 = margin
  const col2 = width / 2
  const lineH = 16

  // Header banner
  page.drawRectangle({ x: col1, y: height - 60, width: 495, height: 40, color: rgb(0.4, 0.47, 0.8) })
  page.drawText('QUOTE', { x: col1 + 15, y: height - 42, size: 24, font: bold, color: rgb(1, 1, 1) })
  page.drawText(`#${data.quoteNumber}`, { x: col1 + 110, y: height - 40, size: 12, font: bold, color: rgb(1, 1, 1) })
  page.drawText(`Date: ${data.date}`, { x: width - margin - 120, y: height - 38, size: 10, font, color: rgb(1, 1, 1) })
  page.drawText(`Valid Till: ${data.validTill}`, { x: width - margin - 120, y: height - 52, size: 10, font, color: rgb(1, 1, 1) })

  y = height - 110

  // Logo and business info
  if (data.logoUrl) {
    const imgBytes = await fetchImage(data.logoUrl)
    if (imgBytes) {
      try {
        const ext = data.logoUrl.split('.').pop()?.toLowerCase() || ''
        const img = ext === 'png' ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes)
        const dims = img.scale(0.3)
        page.drawImage(img, { x: col1, y: y - dims.height, width: dims.width, height: dims.height })
        y -= dims.height + 6
      } catch { }
    }
  }

  page.drawText(data.businessName || 'Your Business', { x: col1, y, size: 16, font: bold, color: rgb(0.1, 0.1, 0.1) })
  y -= 16
  if (data.phone) { page.drawText(`Ph: ${data.phone}`, { x: col1, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) }); y -= 12 }
  if (data.gstNumber) { page.drawText(`GST: ${data.gstNumber}`, { x: col1, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) }); y -= 12 }
  if (data.address) { page.drawText(data.address, { x: col1, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) }); y -= 12 }

  y -= 20

  // Client details
  page.drawText('Bill To:', { x: col1, y, size: 11, font: bold, color: rgb(0.4, 0.47, 0.8) })
  y -= 16
  page.drawText(data.clientName, { x: col1, y, size: 10, font: bold })
  y -= 14
  if (data.clientAddress) { page.drawText(data.clientAddress, { x: col1, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) }); y -= 13 }
  if (data.clientPhone) { page.drawText(`Phone: ${data.clientPhone}`, { x: col1, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) }); y -= 13 }
  if (data.clientEmail) { page.drawText(`Email: ${data.clientEmail}`, { x: col1, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) }); y -= 13 }

  y -= 25

  // Table header
  const tableTop = y
  const cols = [
    { x: col1, w: 200, label: 'Description' },
    { x: col1 + 200, w: 100, label: 'Spec' },
    { x: col1 + 300, w: 40, label: 'Qty' },
    { x: col1 + 340, w: 40, label: 'Unit' },
    { x: col1 + 380, w: 60, label: 'Rate' },
    { x: col1 + 440, w: 50, label: 'Amount' },
  ]

  page.drawRectangle({ x: col1, y: tableTop - 4, width: 495, height: 22, color: rgb(0.95, 0.95, 0.98) })
  cols.forEach(c => { page.drawText(c.label, { x: c.x, y: tableTop, size: 9, font: bold, color: rgb(0.4, 0.47, 0.8) }) })

  y = tableTop - 22

  // Table rows
  for (const item of data.items) {
    const desc = item.description.length > 70 ? item.description.substring(0, 67) + '...' : item.description
    page.drawText(desc, { x: col1, y, size: 8, font })
    page.drawText(item.spec ? item.spec.substring(0, 20) : '-', { x: col1 + 200, y, size: 7, font, color: rgb(0.5, 0.5, 0.5) })
    page.drawText(String(item.quantity), { x: col1 + 300, y, size: 8, font })
    page.drawText(item.unit, { x: col1 + 340, y, size: 8, font })
    page.drawText(`₹${item.rate.toLocaleString('en-IN')}`, { x: col1 + 380, y, size: 8, font })
    page.drawText(`₹${item.amount.toLocaleString('en-IN')}`, { x: col1 + 440, y, size: 8, font })
    y -= 14
  }

  // Table border
  page.drawRectangle({ x: col1, y: y, width: 495, height: tableTop - y + 26, borderColor: rgb(0.9, 0.9, 0.95), borderWidth: 1 })

  y -= 15

  // Total section (right aligned)
  const totalX = width - margin - 180
  const boxWidth = 180

  // Totals box
  page.drawRectangle({ x: totalX, y: y - 100, width: boxWidth, height: 110, color: rgb(0.97, 0.97, 0.99) })
  page.drawRectangle({ x: totalX, y: y - 30, width: boxWidth, height: 30, color: rgb(0.4, 0.47, 0.8) })
  page.drawText('Total', { x: totalX + 10, y: y - 20, size: 12, font: bold, color: rgb(1, 1, 1) })
  page.drawText(`₹${data.total.toFixed(2)}`, { x: totalX + boxWidth - 80, y: y - 20, size: 12, font: bold, color: rgb(1, 1, 1) })

  let ty = y - 10
  page.drawText(`Subtotal: ₹${data.subtotal.toFixed(2)}`, { x: totalX + 10, y: ty, size: 9, font })
  ty -= 14

  if (data.discount > 0) {
    const discLabel = data.discountType === 'percentage' ? `Discount (${data.discount}%):` : `Discount:`
    page.drawText(`${discLabel} -₹${data.discount.toFixed(2)}`, { x: totalX + 10, y: ty, size: 9, font, color: rgb(0.8, 0.2, 0.2) })
    ty -= 14
  }

  if (data.gstRate > 0) {
    page.drawText(`GST (${data.gstRate}%): ₹${data.gstAmount.toFixed(2)}`, { x: totalX + 10, y: ty, size: 9, font })
    ty -= 14
  }

  y -= 120

  // Payment Terms
  if (data.paymentTerms) {
    page.drawText('Payment Terms:', { x: col1, y, size: 10, font: bold })
    y -= 14
    page.drawText(data.paymentTerms, { x: col1, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
    y -= 20
  }

  // Terms
  if (data.terms) {
    page.drawText('Terms & Conditions:', { x: col1, y, size: 10, font: bold })
    y -= 14
    const termLines = data.terms.substring(0, 500).split('\n')
    termLines.forEach(line => {
      page.drawText(line, { x: col1, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
      y -= 12
    })
  }

  // Notes
  if (data.notes) {
    y -= 10
    page.drawText('Notes:', { x: col1, y, size: 10, font: bold })
    y -= 14
    page.drawText(data.notes, { x: col1, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
  }

  // Footer
  page.drawText('Generated by QuoteSend', { x: margin, y: 30, size: 8, font, color: rgb(0.6, 0.6, 0.6) })

  // Draft Watermark
  if (data.status === "draft") {
    const watermarkFont = await doc.embedFont(StandardFonts.HelveticaBold)
    const text = "DRAFT"
    const textWidth = watermarkFont.widthOfTextAtSize(text, 60)
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: 60,
      font: watermarkFont,
      color: rgb(0.9, 0.9, 0.9),
      rotate: degrees(45),
    })
  }

  return doc.save()
}

interface InvoiceItemPDF {
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
}

interface InvoicePDFData {
  businessName: string
  logoUrl?: string
  invoiceNumber: string
  date: string
  dueDate: string
  status: string
  clientName: string
  clientAddress: string
  clientPhone: string
  clientEmail: string
  items: InvoiceItemPDF[]
  subtotal: number
  discount: number
  discountType: string
  gstRate: number
  gstAmount: number
  total: number
  paidAmount: number
  terms: string
  notes: string
  paymentTerms?: string
}

export async function generateInvoicePDF(data: InvoicePDFData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const page = doc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()

  let y = height - 50
  const margin = 50
  const col1 = margin

  if (data.logoUrl) {
    const imgBytes = await fetchImage(data.logoUrl)
    if (imgBytes) {
      try {
        const ext = data.logoUrl.split('.').pop()?.toLowerCase() || ''
        const img = ext === 'png'
          ? await doc.embedPng(imgBytes)
          : await doc.embedJpg(imgBytes)
        const dims = img.scale(0.35)
        page.drawImage(img, { x: col1, y: y - dims.height, width: dims.width, height: dims.height })
        y -= dims.height + 8
      } catch { }
    }
  }

  page.drawText(data.businessName || 'Your Business', {
    x: col1, y, size: 20, font: bold, color: rgb(0.1, 0.1, 0.1),
  })
  y -= 8

  page.drawText(`INVOICE #${data.invoiceNumber}`, {
    x: col1, y: y - 10, size: 12, font: bold, color: rgb(0.3, 0.3, 0.3),
  })

  const rightX = width - margin - 150
  page.drawText(`Date: ${data.date}`, { x: rightX, y: y - 10, size: 10, font })
  y -= 16
  page.drawText(`Due: ${data.dueDate}`, { x: rightX, y: y - 10, size: 10, font })

  if (data.paidAmount > 0) {
    page.drawText(`Paid: ₹${data.paidAmount.toFixed(2)}`, { x: rightX, y: y - 10, size: 10, font, color: rgb(0.2, 0.6, 0.2) })
  }

  y -= 40

  page.drawText('Bill To:', { x: col1, y, size: 12, font: bold })
  y -= 18
  page.drawText(data.clientName, { x: col1, y, size: 10, font })
  y -= 14
  if (data.clientAddress) { page.drawText(data.clientAddress, { x: col1, y, size: 10, font }); y -= 14 }
  if (data.clientPhone) { page.drawText(`Phone: ${data.clientPhone}`, { x: col1, y, size: 10, font }); y -= 14 }
  if (data.clientEmail) { page.drawText(`Email: ${data.clientEmail}`, { x: col1, y, size: 10, font }); y -= 14 }

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

  for (const item of data.items) {
    page.drawText(item.description, { x: col1, y, size: 9, font })
    page.drawText(String(item.quantity), { x: col1 + 250, y, size: 9, font })
    page.drawText(item.unit, { x: col1 + 300, y, size: 9, font })
    page.drawText(`₹${item.rate.toFixed(2)}`, { x: col1 + 340, y, size: 9, font })
    page.drawText(`₹${item.amount.toFixed(2)}`, { x: col1 + 410, y, size: 9, font })
    y -= 18
  }

  y -= 10
  const totalX = width - margin - 200

  page.drawText(`Subtotal: ₹${data.subtotal.toFixed(2)}`, { x: totalX, y, size: 10, font })
  y -= 16

  if (data.discount > 0) {
    page.drawText(`Discount: -₹${data.discount.toFixed(2)}`, { x: totalX, y, size: 10, font, color: rgb(0.9, 0.2, 0.2) })
    y -= 16
  }

  if (data.gstRate > 0) {
    page.drawText(`GST (${data.gstRate}%): ₹${data.gstAmount.toFixed(2)}`, { x: totalX, y, size: 10, font })
    y -= 16
  }

  page.drawText(`Total: ₹${data.total.toFixed(2)}`, {
    x: totalX, y, size: 14, font: bold, color: rgb(0.1, 0.1, 0.1),
  })

  y -= 40

  y -= 20

  // Payment Terms
  if (data.paymentTerms) {
    page.drawText('Payment Terms:', { x: col1, y, size: 10, font: bold })
    y -= 14
    page.drawText(data.paymentTerms, { x: col1, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
    y -= 20
  }

  if (data.terms) {
    page.drawText('Terms & Conditions:', { x: col1, y, size: 10, font: bold })
    y -= 14
    const termLines = data.terms.substring(0, 500).split('\n')
    termLines.forEach(line => {
      page.drawText(line, { x: col1, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
      y -= 12
    })
  }

  if (data.notes) {
    page.drawText('Notes:', { x: col1, y, size: 10, font: bold })
    y -= 16
    page.drawText(data.notes, { x: col1, y, size: 9, font })
  }

  page.drawText('Generated by SendQuote', {
    x: margin, y: 30, size: 8, font, color: rgb(0.6, 0.6, 0.6),
  })

  // Status watermark
  if (data.status === "unpaid" || data.status === "cancelled") {
    const watermarkFont = await doc.embedFont(StandardFonts.HelveticaBold)
    const text = data.status === "unpaid" ? "UNPAID" : "CANCELLED"
    const textWidth = watermarkFont.widthOfTextAtSize(text, 40)
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: 40,
      font: watermarkFont,
      color: data.status === "unpaid" ? rgb(0.9, 0.6, 0.2) : rgb(0.8, 0.3, 0.3),
      rotate: degrees(45),
    })
  }

  return doc.save()
}

import { PDFDocument, StandardFonts, rgb, degrees, PDFFont, PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MARGIN = 50
const FOOTER_HEIGHT = 40
const MIN_Y = FOOTER_HEIGHT

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

function addPage(doc: PDFDocument) {
  const page = doc.addPage([A4_WIDTH, A4_HEIGHT])
  return { page, y: A4_HEIGHT - 50 }
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  maxWidth: number,
  color = rgb(0.1, 0.1, 0.1),
  lineHeight?: number
): number {
  const lh = lineHeight || (size + 4)
  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, size)
    if (testWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font, color })
      currentY -= lh
      line = word
    } else {
      line = testLine
    }
  }
  if (line) {
    page.drawText(line, { x, y: currentY, size, font, color })
    currentY -= lh
  }

  return currentY
}

function drawMultilineText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0.1, 0.1, 0.1),
  lineHeight?: number
): number {
  const lh = lineHeight || (size + 4)
  const lines = text.split('\n')
  let currentY = y

  for (const line of lines) {
    page.drawText(line, { x, y: currentY, size, font, color })
    currentY -= lh
  }

  return currentY
}

function needsNewPage(y: number, requiredSpace: number): boolean {
  return y - requiredSpace < MIN_Y
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
  isFreePlan?: boolean
}

export async function generateQuotePDF(data: QuotePDFData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let { page, y } = addPage(doc)
  const col1 = MARGIN
  const lineH = 16

  // Header banner
  page.drawRectangle({ x: col1, y: A4_HEIGHT - 60, width: 495, height: 40, color: rgb(0.4, 0.47, 0.8) })
  page.drawText('QUOTE', { x: col1 + 15, y: A4_HEIGHT - 42, size: 24, font: bold, color: rgb(1, 1, 1) })
  page.drawText(`#${data.quoteNumber}`, { x: col1 + 110, y: A4_HEIGHT - 40, size: 12, font: bold, color: rgb(1, 1, 1) })
  page.drawText(`Date: ${data.date}`, { x: A4_WIDTH - MARGIN - 120, y: A4_HEIGHT - 38, size: 10, font, color: rgb(1, 1, 1) })
  page.drawText(`Valid Till: ${data.validTill}`, { x: A4_WIDTH - MARGIN - 120, y: A4_HEIGHT - 52, size: 10, font, color: rgb(1, 1, 1) })

  y = A4_HEIGHT - 110

  // Logo and business info
  if (data.logoUrl) {
    const imgBytes = await fetchImage(data.logoUrl)
    if (imgBytes) {
      try {
        const ext = data.logoUrl.split('.').pop()?.toLowerCase() || ''
        let img
        if (ext === 'png') {
          img = await doc.embedPng(imgBytes)
        } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
          img = await doc.embedJpg(imgBytes)
        } else {
          img = await doc.embedJpg(imgBytes)
        }
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
  if (data.address) {
    y = drawWrappedText(page, data.address, col1, y, font, 9, 495, rgb(0.5, 0.5, 0.5), 12)
    y -= 4
  }

  y -= 20

  // Client details
  page.drawText('Bill To:', { x: col1, y, size: 11, font: bold, color: rgb(0.4, 0.47, 0.8) })
  y -= 16
  page.drawText(data.clientName, { x: col1, y, size: 10, font: bold })
  y -= 14
  if (data.clientAddress) {
    y = drawWrappedText(page, data.clientAddress, col1, y, font, 9, 495, rgb(0.4, 0.4, 0.4), 13)
    y -= 4
  }
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
  const rowHeight = 14

  // Table rows with page break support
  for (const item of data.items) {
    if (needsNewPage(y, 60)) {
      // Draw table bottom border on current page
      page.drawRectangle({ x: col1, y: y, width: 495, height: tableTop - y + 26, borderColor: rgb(0.9, 0.9, 0.95), borderWidth: 1 })
      // Add continuation note
      page.drawText('(continued)', { x: col1, y: A4_HEIGHT - 30, size: 8, font: bold, color: rgb(0.5, 0.5, 0.5) })
      // New page
      const newPage = addPage(doc)
      page = newPage.page
      y = newPage.y

      // Redraw table header
      const newTableTop = y
      page.drawRectangle({ x: col1, y: newTableTop - 4, width: 495, height: 22, color: rgb(0.95, 0.95, 0.98) })
      cols.forEach(c => { page.drawText(c.label, { x: c.x, y: newTableTop, size: 9, font: bold, color: rgb(0.4, 0.47, 0.8) }) })
      y = newTableTop - 22
    }

    const desc = item.description.length > 70 ? item.description.substring(0, 67) + '...' : item.description
    page.drawText(desc, { x: col1, y, size: 8, font })
    page.drawText(item.spec ? item.spec.substring(0, 20) : '-', { x: col1 + 200, y, size: 7, font, color: rgb(0.5, 0.5, 0.5) })
    page.drawText(String(item.quantity), { x: col1 + 300, y, size: 8, font })
    page.drawText(item.unit, { x: col1 + 340, y, size: 8, font })
    page.drawText(`₹${item.rate.toLocaleString('en-IN')}`, { x: col1 + 380, y, size: 8, font })
    page.drawText(`₹${item.amount.toLocaleString('en-IN')}`, { x: col1 + 440, y, size: 8, font })
    y -= rowHeight
  }

  // Table border
  page.drawRectangle({ x: col1, y: y, width: 495, height: tableTop - y + 26, borderColor: rgb(0.9, 0.9, 0.95), borderWidth: 1 })

  y -= 15

  // Check if totals fit
  const totalsHeight = 120
  if (needsNewPage(y, totalsHeight)) {
    const newPage = addPage(doc)
    page = newPage.page
    y = newPage.y
  }

  // Total section (right aligned)
  const totalX = A4_WIDTH - MARGIN - 180
  const boxWidth = 180

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
    if (needsNewPage(y, 50)) {
      const newPage = addPage(doc)
      page = newPage.page
      y = newPage.y
    }
    page.drawText('Payment Terms:', { x: col1, y, size: 10, font: bold })
    y -= 14
    y = drawWrappedText(page, data.paymentTerms, col1, y, font, 9, 495, rgb(0.4, 0.4, 0.4), 12)
    y -= 20
  }

  // Terms
  if (data.terms) {
    if (needsNewPage(y, 40)) {
      const newPage = addPage(doc)
      page = newPage.page
      y = newPage.y
    }
    page.drawText('Terms & Conditions:', { x: col1, y, size: 10, font: bold })
    y -= 14
    y = drawMultilineText(page, data.terms.substring(0, 500), col1, y, font, 9, rgb(0.4, 0.4, 0.4), 12)
    y -= 10
  }

  // Notes
  if (data.notes) {
    if (needsNewPage(y, 40)) {
      const newPage = addPage(doc)
      page = newPage.page
      y = newPage.y
    }
    page.drawText('Notes:', { x: col1, y, size: 10, font: bold })
    y -= 14
    y = drawWrappedText(page, data.notes, col1, y, font, 9, 495, rgb(0.4, 0.4, 0.4), 12)
  }

  // Footer on last page
  const footerY = data.isFreePlan ? 45 : 30
  page.drawText('Generated by SendQuote', { x: MARGIN, y: footerY, size: 8, font, color: rgb(0.6, 0.6, 0.6) })

  if (data.isFreePlan) {
    const watermarkText = 'Generated by SendQuote — Free Plan | Upgrade to remove'
    const textWidth = font.widthOfTextAtSize(watermarkText, 8)
    page.drawText(watermarkText, {
      x: (A4_WIDTH - textWidth) / 2,
      y: 20,
      size: 8,
      font,
      color: rgb(0.85, 0.85, 0.85),
    })
  }

  // Draft Watermark on first page
  if (data.status === "draft") {
    const watermarkFont = await doc.embedFont(StandardFonts.HelveticaBold)
    const text = "DRAFT"
    const textWidth = watermarkFont.widthOfTextAtSize(text, 60)
    const firstPage = doc.getPages()[0]
    firstPage.drawText(text, {
      x: (A4_WIDTH - textWidth) / 2,
      y: A4_HEIGHT / 2,
      size: 60,
      font: watermarkFont,
      color: rgb(0.9, 0.9, 0.9),
      rotate: degrees(45),
    })
  }

  return doc.save()
}

async function generateUpiQrDataUrl(vpa: string, name: string, amount: number): Promise<string> {
  const upiIntent = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`
  const qrDataUrl = await QRCode.toDataURL(upiIntent, {
    width: 200,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  })
  return qrDataUrl
}

interface InvoiceItemPDF {
  description: string
  spec?: string
  quantity: number
  unit: string
  rate: number
  amount: number
}

interface InvoicePDFData {
  businessName: string
  logoUrl?: string
  phone?: string
  gstNumber?: string
  address?: string
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
  upiId?: string
}

export async function generateInvoicePDF(data: InvoicePDFData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let { page, y } = addPage(doc)
  const col1 = MARGIN

  // Logo
  if (data.logoUrl) {
    const imgBytes = await fetchImage(data.logoUrl)
    if (imgBytes) {
      try {
        const ext = data.logoUrl.split('.').pop()?.toLowerCase() || ''
        let img
        if (ext === 'png') {
          img = await doc.embedPng(imgBytes)
        } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
          img = await doc.embedJpg(imgBytes)
        } else {
          img = await doc.embedJpg(imgBytes)
        }
        const dims = img.scale(0.35)
        page.drawImage(img, { x: col1, y: y - dims.height, width: dims.width, height: dims.height })
        y -= dims.height + 8
      } catch { }
    }
  }

  page.drawText(data.businessName || 'Your Business', { x: col1, y, size: 20, font: bold, color: rgb(0.1, 0.1, 0.1) })
  y -= 8

  page.drawText(`INVOICE #${data.invoiceNumber}`, { x: col1, y: y - 10, size: 12, font: bold, color: rgb(0.3, 0.3, 0.3) })

  const rightX = A4_WIDTH - MARGIN - 150
  page.drawText(`Date: ${data.date}`, { x: rightX, y: y - 10, size: 10, font })
  y -= 16
  page.drawText(`Due: ${data.dueDate}`, { x: rightX, y: y - 10, size: 10, font })
  y -= 16

  if (data.paidAmount > 0) {
    page.drawText(`Paid: ₹${data.paidAmount.toFixed(2)}`, { x: rightX, y: y - 10, size: 10, font, color: rgb(0.2, 0.6, 0.2) })
  }

  y -= 30

  // Business details (right side)
  if (data.gstNumber) {
    page.drawText(`GSTIN: ${data.gstNumber}`, { x: rightX, y: y - 10, size: 9, font, color: rgb(0.5, 0.5, 0.5) })
    y -= 14
  }
  if (data.phone) {
    page.drawText(`Ph: ${data.phone}`, { x: rightX, y: y - 10, size: 9, font, color: rgb(0.5, 0.5, 0.5) })
    y -= 14
  }
  if (data.address) {
    y = drawWrappedText(page, data.address, rightX, y - 10, font, 9, 150, rgb(0.5, 0.5, 0.5), 12)
    y -= 4
  }

  y -= 10

  // Client details
  page.drawText('Bill To:', { x: col1, y, size: 12, font: bold })
  y -= 18
  page.drawText(data.clientName, { x: col1, y, size: 10, font })
  y -= 14
  if (data.clientAddress) {
    y = drawWrappedText(page, data.clientAddress, col1, y, font, 10, 495, rgb(0.4, 0.4, 0.4), 14)
    y -= 4
  }
  if (data.clientPhone) { page.drawText(`Phone: ${data.clientPhone}`, { x: col1, y, size: 10, font }); y -= 14 }
  if (data.clientEmail) { page.drawText(`Email: ${data.clientEmail}`, { x: col1, y, size: 10, font }); y -= 14 }

  y -= 20

  // Table header
  const tableTop = y
  const tableCols = [
    { x: col1, w: 240, label: 'Description' },
    { x: col1 + 250, w: 50, label: 'Qty' },
    { x: col1 + 300, w: 40, label: 'Unit' },
    { x: col1 + 340, w: 70, label: 'Rate' },
    { x: col1 + 410, w: 80, label: 'Amount' },
  ]

  page.drawRectangle({ x: col1, y: tableTop - 4, width: 495, height: 22, color: rgb(0.95, 0.95, 0.95) })
  tableCols.forEach(c => { page.drawText(c.label, { x: c.x, y: tableTop, size: 10, font: bold }) })

  y = tableTop - 25
  const rowHeight = 18

  // Table rows with page break support
  for (const item of data.items) {
    if (needsNewPage(y, 60)) {
      page.drawRectangle({ x: col1, y: y, width: 495, height: tableTop - y + 26, borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 1 })
      page.drawText('(continued)', { x: col1, y: A4_HEIGHT - 30, size: 8, font: bold, color: rgb(0.5, 0.5, 0.5) })
      const newPage = addPage(doc)
      page = newPage.page
      y = newPage.y

      const newTableTop = y
      page.drawRectangle({ x: col1, y: newTableTop - 4, width: 495, height: 22, color: rgb(0.95, 0.95, 0.95) })
      tableCols.forEach(c => { page.drawText(c.label, { x: c.x, y: newTableTop, size: 10, font: bold }) })
      y = newTableTop - 25
    }

    const desc = item.description.length > 60 ? item.description.substring(0, 57) + '...' : item.description
    page.drawText(desc, { x: col1, y, size: 9, font })
    page.drawText(String(item.quantity), { x: col1 + 250, y, size: 9, font })
    page.drawText(item.unit, { x: col1 + 300, y, size: 9, font })
    page.drawText(`₹${item.rate.toFixed(2)}`, { x: col1 + 340, y, size: 9, font })
    page.drawText(`₹${item.amount.toFixed(2)}`, { x: col1 + 410, y, size: 9, font })
    y -= rowHeight
  }

  // Table border
  page.drawRectangle({ x: col1, y: y, width: 495, height: tableTop - y + 26, borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 1 })

  y -= 10

  // Check if totals fit
  const totalsHeight = 80
  if (needsNewPage(y, totalsHeight)) {
    const newPage = addPage(doc)
    page = newPage.page
    y = newPage.y
  }

  // Totals
  const totalX = A4_WIDTH - MARGIN - 200

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

  page.drawText(`Total: ₹${data.total.toFixed(2)}`, { x: totalX, y, size: 14, font: bold, color: rgb(0.1, 0.1, 0.1) })
  y -= 24

  if (data.paidAmount > 0) {
    const balanceDue = data.total - data.paidAmount
    page.drawText(`Paid: ₹${data.paidAmount.toFixed(2)}`, { x: totalX, y, size: 10, font, color: rgb(0.2, 0.6, 0.2) })
    y -= 14
    page.drawText(`Balance Due: ₹${balanceDue.toFixed(2)}`, { x: totalX, y, size: 10, font: bold, color: balanceDue > 0 ? rgb(0.8, 0.2, 0.2) : rgb(0.2, 0.6, 0.2) })
    y -= 14
  }

  y -= 10

  // Payment Terms
  if (data.paymentTerms) {
    if (needsNewPage(y, 50)) {
      const newPage = addPage(doc)
      page = newPage.page
      y = newPage.y
    }
    page.drawText('Payment Terms:', { x: col1, y, size: 10, font: bold })
    y -= 14
    y = drawWrappedText(page, data.paymentTerms, col1, y, font, 9, 495, rgb(0.4, 0.4, 0.4), 12)
    y -= 20
  }

  // Terms
  if (data.terms) {
    if (needsNewPage(y, 40)) {
      const newPage = addPage(doc)
      page = newPage.page
      y = newPage.y
    }
    page.drawText('Terms & Conditions:', { x: col1, y, size: 10, font: bold })
    y -= 14
    y = drawMultilineText(page, data.terms.substring(0, 500), col1, y, font, 9, rgb(0.4, 0.4, 0.4), 12)
    y -= 10
  }

  // Notes
  if (data.notes) {
    if (needsNewPage(y, 40)) {
      const newPage = addPage(doc)
      page = newPage.page
      y = newPage.y
    }
    page.drawText('Notes:', { x: col1, y, size: 10, font: bold })
    y -= 16
    y = drawWrappedText(page, data.notes, col1, y, font, 9, 495, rgb(0.4, 0.4, 0.4), 12)
  }

  // Footer
  page.drawText('Generated by SendQuote', { x: MARGIN, y: 30, size: 8, font, color: rgb(0.6, 0.6, 0.6) })

  // Status watermarks on first page
  const firstPage = doc.getPages()[0]
  if (data.status === "unpaid" || data.status === "cancelled") {
    const watermarkFont = await doc.embedFont(StandardFonts.HelveticaBold)
    const text = data.status === "unpaid" ? "UNPAID" : "CANCELLED"
    const textWidth = watermarkFont.widthOfTextAtSize(text, 40)
    firstPage.drawText(text, {
      x: (A4_WIDTH - textWidth) / 2,
      y: A4_HEIGHT / 2,
      size: 40,
      font: watermarkFont,
      color: data.status === "unpaid" ? rgb(0.9, 0.6, 0.2) : rgb(0.8, 0.3, 0.3),
      rotate: degrees(45),
    })
  }

  // PAID stamp
  const balanceDue = data.total - data.paidAmount
  if (balanceDue <= 0 && data.paidAmount > 0) {
    const watermarkFont = await doc.embedFont(StandardFonts.HelveticaBold)
    const text = "PAID"
    const textWidth = watermarkFont.widthOfTextAtSize(text, 50)
    firstPage.drawText(text, {
      x: (A4_WIDTH - textWidth) / 2,
      y: A4_HEIGHT / 2,
      size: 50,
      font: watermarkFont,
      color: rgb(0.2, 0.7, 0.2),
      rotate: degrees(45),
    })
  }

  // UPI QR Code
  if (data.upiId && balanceDue > 0) {
    const qrSize = 80
    const qrX = A4_WIDTH - MARGIN - qrSize - 10
    const qrY = 60
    try {
      const qrDataUrl = await generateUpiQrDataUrl(data.upiId, data.businessName, balanceDue)
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64')
      const qrImage = await doc.embedPng(qrBuffer)
      page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize })
      page.drawText('Scan to pay via UPI', { x: qrX - 10, y: qrY - 10, size: 7, font, color: rgb(0.4, 0.4, 0.4) })
    } catch {
      // QR generation failed, continue without it
    }
  }

  return doc.save()
}

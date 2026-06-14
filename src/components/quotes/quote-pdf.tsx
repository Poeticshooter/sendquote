import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { amountInWords } from "@/lib/currency";

const BRAND = "#00D4AA";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  logo: { fontSize: 18, fontWeight: "bold", color: BRAND },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 2, color: BRAND },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 4 },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontWeight: "bold", color: "#6B7280", marginBottom: 6, textTransform: "uppercase" },
  row: { flexDirection: "row", borderBottom: "1 solid #F3F4F6", paddingVertical: 5 },
  headerRow: { flexDirection: "row", backgroundColor: "#F9FAFB", paddingVertical: 5, borderBottom: "1 solid #E5E7EB" },
  colHash: { width: 20, fontSize: 8, color: "#6B7280", fontWeight: "bold" },
  colDesc: { flex: 3, fontSize: 9, fontWeight: "bold", color: "#6B7280" },
  colQty: { width: 35, textAlign: "center", fontSize: 9, fontWeight: "bold", color: "#6B7280" },
  colRate: { width: 65, textAlign: "right", fontSize: 9, fontWeight: "bold", color: "#6B7280" },
  colAmount: { width: 70, textAlign: "right", fontSize: 9, fontWeight: "bold", color: "#6B7280" },
  cellHash: { width: 20, fontSize: 8, color: "#9CA3AF" },
  cellDesc: { flex: 3, fontSize: 9 },
  cellDescSmall: { fontSize: 7, color: "#9CA3AF", marginTop: 1 },
  cellQty: { width: 35, textAlign: "center", fontSize: 9 },
  cellRate: { width: 65, textAlign: "right", fontSize: 9 },
  cellAmount: { width: 70, textAlign: "right", fontSize: 9 },
  totalRow: { flexDirection: "row", paddingVertical: 3, justifyContent: "flex-end" },
  totalLabel: { width: 100, textAlign: "right", marginRight: 10, fontSize: 9, color: "#6B7280" },
  totalValue: { width: 80, textAlign: "right", fontWeight: "bold", fontSize: 9 },
  grandTotalRow: {
    flexDirection: "row",
    backgroundColor: BRAND,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  grandTotalLabel: { flex: 1, textAlign: "right", color: "white", fontWeight: "bold", fontSize: 11 },
  grandTotalValue: { width: 80, textAlign: "right", color: "white", fontWeight: "bold", fontSize: 13 },
  amountInWords: { fontSize: 8, color: "#6B7280", marginTop: 8, fontStyle: "italic" },
  termsBlock: { marginTop: 16, fontSize: 8, color: "#6B7280", lineHeight: 1.5 },
  upiSection: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#F0FDF9",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1FAF0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  upiQrImage: { width: 64, height: 64 },
  upiTitle: { fontSize: 8, fontWeight: "bold", color: "#065F46", marginBottom: 2 },
  upiSubtitle: { fontSize: 7, color: "#374151", marginBottom: 2 },
  upiApps: { fontSize: 6, color: "#6B7280" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 7,
    borderTop: "1 solid #E5E7EB",
    paddingTop: 8,
  },
  watermark: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#F3F4F6",
    fontSize: 60,
    transform: "rotate(-45)",
    opacity: 0.4,
  },
});

export interface QuotePDFItem {
  description: string;
  spec?: string;
  quantity: number;
  rate: number;
  amount: number;
  hsnCode?: string;
}

export interface QuotePDFProps {
  quoteNumber: string;
  clientName: string;
  clientAddress?: string;
  clientGst?: string;
  items: QuotePDFItem[];
  subtotal: number;
  discount?: number;
  gstRate: number;
  gstAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  total: number;
  businessName: string;
  businessAddress?: string;
  businessGst?: string;
  businessPhone?: string;
  businessEmail?: string;
  subject?: string;
  notes?: string;
  terms?: string;
  bankDetails?: string;
  upiId?: string;
  upiQrDataUrl?: string;
  expiryDate?: string;
  status: string;
}

export function QuotePDF({
  quoteNumber,
  clientName,
  clientAddress,
  clientGst,
  items,
  subtotal,
  discount,
  gstRate,
  gstAmount: _gstAmount,
  cgstRate,
  cgstAmount,
  sgstRate,
  sgstAmount,
  igstRate,
  igstAmount,
  total,
  businessName,
  businessAddress,
  businessGst,
  businessPhone,
  businessEmail,
  subject,
  notes,
  terms,
  bankDetails,
  upiId,
  upiQrDataUrl,
  expiryDate,
  status,
}: QuotePDFProps) {
  const hasGst = gstRate > 0;
  const isInterState = igstRate > 0;
  const subnet = subtotal - (discount ?? 0);
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {status === "draft" && <Text style={styles.watermark}>DRAFT</Text>}

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.logo}>{businessName}</Text>
            {businessAddress && <Text style={{ fontSize: 8, color: "#6B7280", marginTop: 2 }}>{businessAddress}</Text>}
            {businessGst && <Text style={{ fontSize: 8, color: "#6B7280" }}>GST: {businessGst}</Text>}
            {businessPhone && <Text style={{ fontSize: 8, color: "#6B7280" }}>Tel: {businessPhone}</Text>}
            {businessEmail && <Text style={{ fontSize: 8, color: "#6B7280" }}>{businessEmail}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.title}>QUOTATION</Text>
            <Text style={{ fontSize: 10, fontWeight: "bold", marginTop: 4 }}>{quoteNumber}</Text>
            <Text style={{ fontSize: 8, color: "#6B7280", marginTop: 2 }}>Date: {today}</Text>
            {expiryDate && (
              <Text style={{ fontSize: 8, color: "#DC2626", marginTop: 1 }}>Valid until: {expiryDate}</Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Subject */}
        {subject && (
          <Text style={{ fontSize: 11, fontWeight: "bold", marginBottom: 12 }}>Re: {subject}</Text>
        )}

        {/* Client Block */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quoted To</Text>
          <Text style={{ fontSize: 10, fontWeight: "bold" }}>{clientName}</Text>
          {clientAddress && <Text style={{ fontSize: 8, color: "#6B7280", marginTop: 1 }}>{clientAddress}</Text>}
          {clientGst && <Text style={{ fontSize: 8, color: "#6B7280" }}>GST: {clientGst}</Text>}
        </View>

        {/* Line Items Table */}
        <View style={[styles.section, { marginTop: 12 }]}>
          <View style={styles.headerRow}>
            <Text style={styles.colHash}>#</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRate}>Rate (₹)</Text>
            <Text style={styles.colAmount}>Amount (₹)</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.row} wrap={false}>
              <Text style={styles.cellHash}>{i + 1}</Text>
              <View style={styles.cellDesc}>
                <Text>{item.description}</Text>
                {item.hsnCode && <Text style={styles.cellDescSmall}>HSN: {item.hsnCode}</Text>}
              </View>
              <Text style={styles.cellQty}>{item.quantity}</Text>
              <Text style={styles.cellRate}>{Number(item.rate).toLocaleString("en-IN")}</Text>
              <Text style={styles.cellAmount}>{Number(item.amount).toLocaleString("en-IN")}</Text>
            </View>
          ))}
        </View>

        {/* Totals Block */}
        <View style={{ marginTop: 8 }}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>₹{Number(subtotal).toLocaleString("en-IN")}</Text>
          </View>
          {discount != null && discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={[styles.totalValue, { color: "#10B981" }]}>- ₹{Number(discount).toLocaleString("en-IN")}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Taxable Amount:</Text>
            <Text style={styles.totalValue}>₹{Number(subnet).toLocaleString("en-IN")}</Text>
          </View>
          {isInterState ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IGST ({igstRate}%):</Text>
              <Text style={styles.totalValue}>₹{Number(igstAmount).toLocaleString("en-IN")}</Text>
            </View>
          ) : hasGst ? (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>CGST ({cgstRate}%):</Text>
                <Text style={styles.totalValue}>₹{Number(cgstAmount).toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>SGST ({sgstRate}%):</Text>
                <Text style={styles.totalValue}>₹{Number(sgstAmount).toLocaleString("en-IN")}</Text>
              </View>
            </>
          ) : null}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>₹{Number(total).toLocaleString("en-IN")}</Text>
          </View>
          <Text style={styles.amountInWords}>{amountInWords(total)}</Text>
        </View>

        {/* Bank Details & UPI QR */}
        {bankDetails && (
          <View style={styles.termsBlock}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Payment Details:</Text>
            <Text>{bankDetails}</Text>
            {upiId && <Text>UPI ID: {upiId}</Text>}
          </View>
        )}
        {upiQrDataUrl && upiId && (
          <View style={styles.upiSection}>
            <Image src={upiQrDataUrl} style={styles.upiQrImage} />
            <View>
              <Text style={styles.upiTitle}>Scan to Pay Instantly</Text>
              <Text style={styles.upiSubtitle}>{upiId}</Text>
              <Text style={styles.upiApps}>GPay • PhonePe • Paytm • Any UPI App</Text>
            </View>
          </View>
        )}

        {/* Notes & Terms */}
        {notes && (
          <View style={styles.termsBlock}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Notes:</Text>
            <Text>{notes}</Text>
          </View>
        )}
        {terms && (
          <View style={styles.termsBlock}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Terms & Conditions:</Text>
            <Text>{terms}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is a computer-generated quotation and does not require a physical signature.{"  "}
            Created with SendQuote.in — Get your free GST-ready quotes at https://sendquote.in
          </Text>
        </View>
      </Page>
    </Document>
  );
}

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  logo: { fontSize: 20, fontWeight: "bold", color: "#00D4AA" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 20 },
  section: { marginBottom: 20 },
  row: { flexDirection: "row", borderBottom: "1 solid #eee", paddingVertical: 6 },
  description: { flex: 3 },
  qty: { flex: 1, textAlign: "center" },
  rate: { flex: 1.5, textAlign: "right" },
  amount: { flex: 1.5, textAlign: "right" },
  totalRow: { flexDirection: "row", paddingVertical: 4, justifyContent: "flex-end" },
  totalLabel: { width: 100, textAlign: "right", marginRight: 10 },
  totalValue: { width: 80, textAlign: "right", fontWeight: "bold" },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#999",
    fontSize: 8,
    borderTop: "1 solid #eee",
    paddingTop: 10,
  },
  watermark: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#ddd",
    fontSize: 60,
    transform: "rotate(-45)",
    opacity: 0.3,
  },
});

export interface QuotePDFItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface QuotePDFProps {
  quoteNumber: string;
  clientName: string;
  clientCompany?: string;
  items: QuotePDFItem[];
  subtotal: number;
  gstRate?: number;
  gstAmount?: number;
  total: number;
  businessName: string;
  businessGst?: string;
  expiryDate?: string;
  status: string;
}

export function QuotePDF({
  quoteNumber,
  clientName,
  items,
  subtotal,
  gstRate,
  gstAmount,
  total,
  businessName,
  businessGst,
  expiryDate,
  status,
}: QuotePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {status === "draft" && <Text style={styles.watermark}>DRAFT</Text>}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>SendQuote</Text>
            <Text style={{ fontSize: 8, color: "#999", marginTop: 2 }}>
              {businessName}
            </Text>
            {businessGst && (
              <Text style={{ fontSize: 8, color: "#999" }}>GST: {businessGst}</Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.title}>QUOTE</Text>
            <Text style={{ fontSize: 10 }}>{quoteNumber}</Text>
            {expiryDate && (
              <Text style={{ fontSize: 8, color: "#999", marginTop: 2 }}>
                Valid until: {expiryDate}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>
            Bill To:
          </Text>
          <Text style={{ fontSize: 10 }}>{clientName}</Text>
        </View>

        <View style={[styles.section, { marginTop: 20 }]}>
          <View
            style={[
              styles.row,
              { backgroundColor: "#f5f5f5", fontWeight: "bold" },
            ]}
          >
            <Text style={styles.description}>Description</Text>
            <Text style={styles.qty}>Qty</Text>
            <Text style={styles.rate}>Rate</Text>
            <Text style={styles.amount}>Amount</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Text style={styles.rate}>
                ₹{Number(item.rate).toLocaleString("en-IN")}
              </Text>
              <Text style={styles.amount}>
                ₹{Number(item.amount).toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 10 }}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              ₹{Number(subtotal).toLocaleString("en-IN")}
            </Text>
          </View>
          {gstRate && gstAmount ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST ({gstRate}%):</Text>
              <Text style={styles.totalValue}>
                ₹{Number(gstAmount).toLocaleString("en-IN")}
              </Text>
            </View>
          ) : null}
          <View
            style={[
              styles.totalRow,
              { borderTop: "2 solid #00D4AA", paddingTop: 6 },
            ]}
          >
            <Text style={[styles.totalLabel, { fontWeight: "bold" }]}>
              Total:
            </Text>
            <Text
              style={[
                styles.totalValue,
                { fontSize: 14, color: "#00D4AA" },
              ]}
            >
              ₹{Number(total).toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated by SendQuote.in — AI-Powered Quoting for Indian Businesses
        </Text>
      </Page>
    </Document>
  );
}

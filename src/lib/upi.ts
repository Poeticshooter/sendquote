import QRCode from "qrcode";

export interface UpiQrParams {
  upiId: string;
  businessName: string;
  amount: number;
  invoiceNumber: string;
}

/**
 * Generates a UPI deep link string
 * Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
 */
export function buildUpiLink(params: UpiQrParams): string {
  const { upiId, businessName, amount, invoiceNumber } = params;
  const note = `Payment for ${invoiceNumber}`;
  return (
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(businessName)}` +
    `&am=${amount.toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(note)}`
  );
}

/**
 * Generates a base64 PNG data URL of the UPI QR code
 * Compatible with @react-pdf/renderer <Image src={dataUrl} />
 */
export async function generateUpiQrDataUrl(
  params: UpiQrParams
): Promise<string> {
  const upiLink = buildUpiLink(params);
  return QRCode.toDataURL(upiLink, {
    width: 200,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#FFFFFF" },
  });
}

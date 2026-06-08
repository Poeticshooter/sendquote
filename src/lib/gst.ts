// GST number format: 22AAAAA0000A1Z5
// 2 chars state code + 10 chars PAN + 1 char entity + 1 char blank + 1 char checksum + 1 char check digit
export function validateGstFormat(gst: string): { valid: boolean; reason?: string } {
  if (!gst || gst.length !== 15) {
    return { valid: false, reason: "GST must be exactly 15 characters" };
  }
  if (!/^\d{2}[A-Za-z]{5}\d{4}[A-Za-z]{1}\d[Zz][0-9A-Za-z]{1}$/.test(gst)) {
    return { valid: false, reason: "Invalid GST format" };
  }
  return { valid: true };
}

export function getStateCode(gst: string): string | null {
  if (!validateGstFormat(gst).valid) return null;
  return gst.substring(0, 2);
}

export function getPanFromGst(gst: string): string | null {
  if (!validateGstFormat(gst).valid) return null;
  return gst.substring(2, 12);
}

export const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
  "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura",
  "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra",
  "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep",
  "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar",
  "36": "Telangana", "37": "Andhra Pradesh (New)",
};

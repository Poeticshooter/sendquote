/**
 * Converts a numeric amount to Indian Rupees in words.
 * Example: 42500 → "Rupees Forty-Two Thousand Five Hundred Only"
 * Handles paise (sub-unit) correctly: 42500.50 → "Rupees Forty-Two Thousand Five Hundred and Fifty Paise Only"
 */
export function amountInWords(amount: number): string {
  if (isNaN(amount)) return "Rupees Zero Only";

  const whole = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - whole) * 100);

  if (whole === 0 && paise === 0) return "Rupees Zero Only";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertBelowThousand(n: number): string {
    if (n === 0) return "";
    const res: string[] = [];
    if (n >= 100) {
      res.push(ones[Math.floor(n / 100)] + " Hundred");
      n %= 100;
    }
    if (n >= 20) {
      res.push(tens[Math.floor(n / 10)]);
      n %= 10;
    }
    if (n > 0) {
      res.push(ones[n]);
    }
    return res.join(" ");
  }

  function convert(num: number): string {
    if (num === 0) return "";
    // Indian numbering: lakh (100k) and crore (10M)
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = num % 1000;

    const parts: string[] = [];
    if (crore > 0) parts.push(convertBelowThousand(crore) + " Crore");
    if (lakh > 0) parts.push(convertBelowThousand(lakh) + " Lakh");
    if (thousand > 0) parts.push(convertBelowThousand(thousand) + " Thousand");
    if (hundred > 0) parts.push(convertBelowThousand(hundred));

    return parts.join(" ");
  }

  const wholeWords = convert(whole);
  const sign = amount < 0 ? "Minus " : "";

  if (paise === 0) {
    return `Rupees ${sign}${wholeWords} Only`.replace(/\s+/g, " ").trim();
  }

  const paiseWords = convert(paise);
  return `Rupees ${sign}${wholeWords} and ${paiseWords} Paise Only`.replace(/\s+/g, " ").trim();
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

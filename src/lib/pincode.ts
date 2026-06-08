interface PincodeResult {
  pincode: string;
  office: string;
  district: string;
  state: string;
  country: string;
}

function normalizePincode(pin: string): string {
  return pin.replace(/\s/g, "").slice(0, 6);
}

export function validatePincode(pin: string): boolean {
  return /^\d{6}$/.test(normalizePincode(pin));
}

export async function lookupPincode(pin: string): Promise<{ success: true; data: PincodeResult[] } | { success: false; error: string }> {
  const normalized = normalizePincode(pin);
  if (!validatePincode(normalized)) {
    return { success: false, error: "Invalid pincode format" };
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${normalized}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { success: false, error: "API unavailable" };

    const data = (await res.json()) as Array<{ Status: string; PostOffice: Array<{
      Name: string; District: string; State: string; Country: string;
    }> | null }>;

    if (!data?.[0] || data[0].Status !== "Success" || !data[0].PostOffice?.length) {
      return { success: false, error: "Pincode not found" };
    }

    const offices = data[0].PostOffice.map((o) => ({
      pincode: normalized,
      office: o.Name,
      district: o.District,
      state: o.State,
      country: o.Country,
    }));

    return { success: true, data: offices };
  } catch {
    return { success: false, error: "Lookup failed" };
  }
}

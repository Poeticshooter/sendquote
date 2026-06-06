export interface CrmQuote {
  id: string;
  quote_number: string;
  client_name: string;
  client_email: string | null;
  total: number;
  status: string;
  public_url: string;
  created_at: string;
}

export async function syncToHubspot(apiKey: string, quote: CrmQuote): Promise<{ success: boolean; deal_id?: string; error?: string }> {
  if (!apiKey || apiKey === "placeholder") {
    return { success: false, error: "HubSpot API key not configured" };
  }

  try {
    const dealData = {
      properties: {
        dealname: `Quote ${quote.quote_number} — ${quote.client_name}`,
        dealstage: quote.status === "accepted" ? "closedwon" : "qualifiedtobuy",
        amount: String(quote.total),
        hs_quote_number: quote.quote_number,
        notes: `Quote URL: ${quote.public_url}`,
        closedate: new Date().toISOString(),
      },
    };

    const res = await fetch("https://api.hubapi.com/crm/v3/objects/deals", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dealData),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `HubSpot error: ${err}` };
    }

    const data = await res.json();
    return { success: true, deal_id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncToPipedrive(apiKey: string, quote: CrmQuote): Promise<{ success: boolean; deal_id?: string; error?: string }> {
  if (!apiKey || apiKey === "placeholder") {
    return { success: false, error: "Pipedrive API key not configured" };
  }

  try {
    const dealData = {
      title: `Quote ${quote.quote_number} — ${quote.client_name}`,
      value: quote.total,
      currency: "INR",
      status: quote.status === "accepted" ? "won" : "open",
      add_time: quote.created_at,
      notes: [
        { content: `Quote URL: ${quote.public_url}` },
        { content: `Quote Number: ${quote.quote_number}` },
      ],
    };

    const res = await fetch("https://api.pipedrive.com/v1/deals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...dealData, api_token: apiKey }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Pipedrive error: ${err}` };
    }

    const data = await res.json();
    return { success: true, deal_id: data.data?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncQuoteToCrm(quote: CrmQuote): Promise<{ hubspot?: any; pipedrive?: any }> {
  const results: any = {};

  if (process.env.HUBSPOT_API_KEY) {
    results.hubspot = await syncToHubspot(process.env.HUBSPOT_API_KEY, quote);
  }

  if (process.env.PIPEDRIVE_API_KEY) {
    results.pipedrive = await syncToPipedrive(process.env.PIPEDRIVE_API_KEY, quote);
  }

  return results;
}

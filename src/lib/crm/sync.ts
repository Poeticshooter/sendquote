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

interface SyncResult {
  success: boolean;
  deal_id?: string;
  error?: string;
}

async function callCrmApi<T>(
  url: string,
  headers: Record<string, string>,
  body: T,
  errorLabel: string,
): Promise<SyncResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `${errorLabel} error: ${err}` };
    }

    const data = await res.json();
    // HubSpot: data.id, Pipedrive: data.data?.id
    const dealId = data.data?.id || data.id;
    return { success: true, deal_id: dealId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

async function syncToHubspot(apiKey: string | undefined, quote: CrmQuote): Promise<SyncResult> {
  if (!apiKey || apiKey === "placeholder") {
    return { success: false, error: "HubSpot API key not configured" };
  }

  return callCrmApi(
    "https://api.hubapi.com/crm/v3/objects/deals",
    {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    {
      properties: {
        dealname: `Quote ${quote.quote_number} — ${quote.client_name}`,
        dealstage: quote.status === "accepted" ? "closedwon" : "qualifiedtobuy",
        amount: String(quote.total),
        hs_quote_number: quote.quote_number,
        notes: `Quote URL: ${quote.public_url}`,
        closedate: new Date().toISOString(),
      },
    },
    "HubSpot",
  );
}

async function syncToPipedrive(apiKey: string | undefined, quote: CrmQuote): Promise<SyncResult> {
  if (!apiKey || apiKey === "placeholder") {
    return { success: false, error: "Pipedrive API key not configured" };
  }

  return callCrmApi(
    "https://api.pipedrive.com/v1/deals",
    {
      "Content-Type": "application/json",
      "X-API-Token": apiKey,
    },
    {
      title: `Quote ${quote.quote_number} — ${quote.client_name}`,
      value: quote.total,
      currency: "INR",
      status: quote.status === "accepted" ? "won" : "open",
      add_time: quote.created_at,
    },
    "Pipedrive",
  );
}

export async function syncQuoteToCrm(quote: CrmQuote): Promise<{
  hubspot?: SyncResult;
  pipedrive?: SyncResult;
  errors: string[];
}> {
  const results: { hubspot?: SyncResult; pipedrive?: SyncResult; errors: string[] } = { errors: [] };

  if (process.env.HUBSPOT_API_KEY) {
    results.hubspot = await syncToHubspot(process.env.HUBSPOT_API_KEY, quote);
    if (!results.hubspot.success && results.hubspot.error) {
      results.errors.push(`HubSpot: ${results.hubspot.error}`);
    }
  }

  if (process.env.PIPEDRIVE_API_KEY) {
    results.pipedrive = await syncToPipedrive(process.env.PIPEDRIVE_API_KEY, quote);
    if (!results.pipedrive.success && results.pipedrive.error) {
      results.errors.push(`Pipedrive: ${results.pipedrive.error}`);
    }
  }

  return results;
}

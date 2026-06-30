import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage, formatHelp, formatWeeklyDigest } from "@/lib/telegram/bot";

export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: {
    chat?: { id: number };
    text?: string;
    from?: { id: number; username?: string };
  };
};

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === "placeholder") {
    return NextResponse.json({ ok: true, note: "Bot not configured" });
  }

  try {
    const update: TelegramUpdate = await request.json();
    const msg = update.message;
    if (!msg?.chat?.id || !msg.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const telegramUsername = msg.from?.username;

    // Link Telegram user to SendQuote account via /start <code>
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const code = parts[1];

      if (code) {
        const supabase = createAdminClient();
        const { data: link } = await supabase
          .from("profiles")
          .update({
            telegram_chat_id: String(chatId),
            telegram_username: telegramUsername || null,
          })
          .eq("telegram_link_code", code)
          .select("business_name")
          .single();

        if (link) {
          await sendMessage(chatId, `✅ <b>Connected!</b>\n\nYour SendQuote account (${link.business_name || "SendQuote"}) is now linked. You'll receive deal notifications here.`);
        } else {
          await sendMessage(chatId, "❌ Invalid or expired link code. Generate a new one from SendQuote Settings > Notifications.");
        }
      } else {
        await sendMessage(chatId, `<b>SendQuote Bot</b>\n\nGet real-time notifications when your quotes are viewed, accepted, or paid.\n\nTo connect: Go to SendQuote Settings > Notifications and generate a Telegram link.`);
      }
      return NextResponse.json({ ok: true });
    }

    // Verify user is linked
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("telegram_chat_id", String(chatId))
      .single();

    if (!profile) {
      await sendMessage(chatId, "⚠️ Your Telegram isn't linked to a SendQuote account. Go to SendQuote Settings > Notifications to connect.");
      return NextResponse.json({ ok: true });
    }

    // Handle commands
    switch (text) {
      case "/start":
      case "/help": {
        await sendMessage(chatId, formatHelp());
        break;
      }
      case "/stats": {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const [quotesRes, invoicesRes] = await Promise.all([
          supabase.from("quotes").select("id, status, total").eq("user_id", profile.user_id).gte("created_at", weekAgo),
          supabase.from("invoices").select("id, status, total, balance_due").eq("user_id", profile.user_id).gte("created_at", weekAgo),
        ]);

        const quotes = quotesRes.data ?? [];
        const invoices = invoicesRes.data ?? [];
        const accepted = quotes.filter((q) => q.status === "accepted").length;
        const collected = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
        const outstanding = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + Number(i.balance_due), 0);

        await sendMessage(chatId, formatWeeklyDigest(quotes.length, accepted, collected, outstanding));
        break;
      }
      default: {
        await sendMessage(chatId, "Unknown command. Send /help to see available commands.");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Telegram webhook error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

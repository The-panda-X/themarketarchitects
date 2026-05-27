/**
 * Discord webhook integration for signal delivery.
 *
 * Posts formatted #SIGNAL messages to a Discord channel via webhook URL.
 * DiscordBridge.py sees these messages and writes signal files for all EAs.
 */

interface SignalPayload {
  pair: string;
  direction: string;
  entry: number;
  sl: number;
  tp1: number;
  tp2?: number | null;
  tp3?: number | null;
  risk?: number | null;
}

export async function postSignalToDiscord(signal: SignalPayload): Promise<{ ok: boolean; error?: string }> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return { ok: false, error: 'DISCORD_WEBHOOK_URL not configured' };
  }

  const lines = ['#SIGNAL'];
  lines.push(`PAIR: ${signal.pair}`);
  lines.push(signal.direction);
  lines.push(`ENTRY: ${signal.entry > 0 ? signal.entry : 'NOW'}`);
  lines.push(`SL: ${signal.sl}`);
  if (signal.tp1) lines.push(`TP1: ${signal.tp1}`);
  if (signal.tp2) lines.push(`TP2: ${signal.tp2}`);
  if (signal.tp3) lines.push(`TP3: ${signal.tp3}`);
  if (signal.risk && signal.risk > 0) lines.push(`RISK: ${signal.risk}`);

  const content = lines.join('\n');

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        username: 'TMA Signal Hub',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Discord webhook failed: ${res.status} ${text}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Discord webhook error: ${err}` };
  }
}

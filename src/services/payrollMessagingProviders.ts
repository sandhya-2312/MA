/**
 * Placeholder adapters for future server-side messaging.
 * Wire Twilio / WhatsApp Business API here without changing UI call sites.
 */

export type SendSmsParams = {
  to: string;
  body: string;
};

export type SendWhatsAppParams = {
  to: string;
  body: string;
};

export type MessagingSendResult = { ok: boolean; error?: string };

/** Future: Twilio SMS API */
export async function sendSmsViaTwilio(_params: SendSmsParams): Promise<MessagingSendResult> {
  return { ok: false, error: 'Twilio SMS is not configured. Use device SMS links for now.' };
}

/** Future: WhatsApp Business Cloud API */
export async function sendWhatsAppViaBusinessApi(_params: SendWhatsAppParams): Promise<MessagingSendResult> {
  return { ok: false, error: 'WhatsApp Business API is not configured. Use wa.me links for now.' };
}

import crypto from "crypto";
import env from "../config/env.config.js";

// PayFast's redirect/ITN flow, implemented to their documented spec
// (https://developers.payfast.co.za). Two completely separate domains depending
// on PAYFAST_MODE — sandbox and live never share credentials or reachability.
const PROCESS_URL  = env.PAYFAST_MODE === "live" ? "https://www.payfast.co.za/eng/process" : "https://sandbox.payfast.co.za/eng/process";
const VALIDATE_URL = env.PAYFAST_MODE === "live" ? "https://www.payfast.co.za/eng/query/validate" : "https://sandbox.payfast.co.za/eng/query/validate";

// PayFast's own encoding rule: percent-encode, but a literal space becomes `+`
// (the classic application/x-www-form-urlencoded convention), not `%20`.
function pfEncode(value: string): string {
  return encodeURIComponent(value.trim()).replace(/%20/g, "+");
}

// Signs a flat key/value object IN THE ORDER GIVEN — PayFast's signature is
// order-sensitive, not alphabetical. Empty/undefined values are skipped (PayFast
// does the same on their side).
function sign(fields: Record<string, string | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === "" || key === "signature") continue;
    parts.push(`${key}=${pfEncode(value)}`);
  }
  if (env.PAYFAST_PASSPHRASE) parts.push(`passphrase=${pfEncode(env.PAYFAST_PASSPHRASE)}`);
  return crypto.createHash("md5").update(parts.join("&")).digest("hex");
}

export interface InitiatePaymentParams {
  mPaymentId: string;
  amountCents: number;
  itemName: string;
  itemDescription?: string;
  buyerEmail: string;
  buyerFirstName?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

/**
 * Builds the fields for an auto-submitting form POST to PayFast — their
 * documented, canonical redirect method (not a GET query string, which
 * some integrations use but isn't the spec'd approach). The frontend renders
 * a hidden form with these fields and submits it to `actionUrl`.
 */
export function buildPaymentRedirect(params: InitiatePaymentParams): { actionUrl: string; fields: Record<string, string> } {
  // Fails loudly and clearly rather than crashing later inside pfEncode()'s
  // .trim() call on undefined — this is the first thing to hit if someone
  // tries a purchase before PAYFAST_MERCHANT_ID/KEY are set in .env.
  if (!env.PAYFAST_MERCHANT_ID || !env.PAYFAST_MERCHANT_KEY) {
    // Logged, not returned to the client — a customer should never see "not
    // configured", just a generic error, while whoever's at the terminal
    // during setup/testing sees exactly what to fix.
    console.error("[PayFast] PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY not set in .env");
    throw new Error("PayFast is not configured");
  }

  // Field ORDER here is what gets signed below — must match what's actually
  // rendered into the form fields in the same order, field-for-field.
  const fields: Record<string, string> = {
    merchant_id:  env.PAYFAST_MERCHANT_ID,
    merchant_key: env.PAYFAST_MERCHANT_KEY,
    return_url:   params.returnUrl,
    cancel_url:   params.cancelUrl,
    notify_url:   params.notifyUrl,
    ...(params.buyerFirstName ? { name_first: params.buyerFirstName } : {}),
    email_address: params.buyerEmail,
    m_payment_id:  params.mPaymentId,
    amount:        (params.amountCents / 100).toFixed(2),
    item_name:     params.itemName.slice(0, 100), // PayFast's own field limit
    ...(params.itemDescription ? { item_description: params.itemDescription.slice(0, 255) } : {}),
  };

  return { actionUrl: PROCESS_URL, fields: { ...fields, signature: sign(fields) } };
}

/**
 * Verifies an incoming ITN POST body. Two independent checks, both required
 * (this is PayFast's own recommended pairing — neither alone is sufficient):
 *   1. Signature — recomputed from the posted fields, in the order PayFast sent
 *      them (Express's urlencoded body parser preserves that order for flat
 *      form data), compared to the `signature` field they included.
 *   2. Server-to-server confirmation — posting the raw body back to PayFast's
 *      own validate endpoint. This is what we rely on instead of an IP
 *      allowlist: PayFast's ITN source IPs change (their dashboard was
 *      mid-expanding its range as of this integration), so a hardcoded list
 *      would need constant upkeep. Asking PayFast "was this really you?"
 *      sidesteps that entirely.
 */
export function verifyItnSignature(body: Record<string, string>): boolean {
  const { signature, ...rest } = body;
  if (!signature) return false;
  return sign(rest) === signature;
}

export async function confirmWithPayFast(rawBody: string): Promise<boolean> {
  try {
    const res = await fetch(VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    const text = (await res.text()).trim();
    return text === "VALID";
  } catch (err) {
    console.error("[PayFast] validate call failed:", err);
    return false;
  }
}

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = `${process.env.EMAIL_FROM_NAME || "The 0-Bit Platform Team"} <${process.env.SENDER_EMAIL || "noreply@phoque-orbit.co.za"}>`;
const APP    = process.env.APP_NAME || "My App";

async function send(payload: Parameters<typeof resend.emails.send>[0]) {
  const { data, error } = await resend.emails.send(payload);
  if (error) {
    console.error("❌ [MAIL] Resend error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
  console.log(`✅ [MAIL] Sent to ${Array.isArray(payload.to) ? payload.to.join(", ") : payload.to} (id: ${data?.id})`);
}

// ── Invite email ───────────────────────────────────────────────────────────────
// Purely a courtesy notification — there's no token/expiry, the account is
// already live. Whoever it's addressed to can sign in with Google whenever
// they like, whether they've seen this email or not.
//
// Dark is used as an accent (header band only), not the whole email — a fully
// dark background email reads poorly in most clients and is harder to read.
//
// No logo image here — Gmail blocks remote images outright on mail it's
// classified as spam (regardless of whether the URL is valid), which a new
// sending domain runs into constantly during its reputation warm-up. Text-only
// header, same approach as the reference design.

const GOLD        = "#f59e0b";
const INK         = "#0e0401";
const CREAM       = "#fbf9ef";
const GOLD_DIM    = "#e0b876";
const BODY_TEXT   = "#374151";
const CALLOUT_BG  = "#fdf3e2";
const CALLOUT_TEXT = "#57534e";
const FOOTER_TEXT = "#9ca3af";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const ROLE_ARTICLE: Record<string, string> = {
  Customer: "a customer",
  Manager:  "a manager",
  Admin:    "an admin",
};

export async function sendInviteEmail(
  to: string, name: string, roleLabel: "Customer" | "Manager" | "Admin"
) {
  const signInUrl = process.env.FRONTEND_URL || "";
  const roleText  = ROLE_ARTICLE[roleLabel] ?? "a member";

  await send({
    from:    FROM,
    to,
    subject: `You're in — your ${APP} account is ready`,
    html: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 16px;font-family:${SANS};">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
              <tr>
                <td align="center" style="background:${INK};padding:30px 32px 26px;">
                  <p style="margin:0;color:${GOLD_DIM};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">
                    ${APP}
                  </p>
                  <p style="margin:8px 0 0;color:${CREAM};font-size:20px;font-weight:700;">
                    You're in
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 32px 8px;">
                  <p style="margin:0 0 24px;color:${BODY_TEXT};font-size:15px;line-height:1.6;">
                    Hi ${name}, you've been added to ${APP} as ${roleText}.
                  </p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${signInUrl}" style="display:inline-block;padding:13px 34px;background:${GOLD};color:${INK};border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
                          Sign in to ${APP}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 32px 36px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CALLOUT_BG};border-left:4px solid ${GOLD};border-radius:4px;">
                    <tr>
                      <td style="padding:14px 16px;">
                        <p style="margin:0;color:${CALLOUT_TEXT};font-size:13px;line-height:1.5;">
                          Sign in anytime with Google — no password needed. This isn't time-limited.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0;color:${FOOTER_TEXT};font-size:12px;text-align:center;">
              ${APP}
            </p>
          </td>
        </tr>
      </table>
    `,
  });
}

// ── Verification email ─────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string, verifyLink: string
) {
  await send({
    from:    FROM,
    to,
    subject: `Verify your ${APP} account`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your email address.</p>
        <a href="${verifyLink}" style="display:inline-block;padding:12px 24px;background:#84cc16;color:#0f172a;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
          Verify Email
        </a>
      </div>
    `,
  });
}

// ── Password reset email ───────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  to: string, resetLink: string
) {
  await send({
    from:    FROM,
    to,
    subject: `Reset your ${APP} password`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2>Reset your password</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#84cc16;color:#0f172a;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#666;font-size:13px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

// ── Booking inquiry notification (to staff) ────────────────────────────────────

export async function sendBookingNotificationEmail(
  to: string[], inquiry: { name: string; email: string; phone?: string | null; eventDetails: string; message?: string | null }
) {
  if (to.length === 0) return;
  await send({
    from:    FROM,
    to,
    subject: `New booking inquiry from ${inquiry.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2>New booking inquiry</h2>
        <p><strong>Name:</strong> ${inquiry.name}</p>
        <p><strong>Email:</strong> ${inquiry.email}</p>
        ${inquiry.phone ? `<p><strong>Phone:</strong> ${inquiry.phone}</p>` : ""}
        <p><strong>Event details:</strong><br/>${inquiry.eventDetails}</p>
        ${inquiry.message ? `<p><strong>Message:</strong><br/>${inquiry.message}</p>` : ""}
      </div>
    `,
  });
}

// ── Verification code email ────────────────────────────────────────────────────

export async function sendVerificationCodeEmail(
  to: string, code: string
) {
  await send({
    from:    FROM,
    to,
    subject: `Your ${APP} verification code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2>Your verification code</h2>
        <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a;background:#f1f5f9;padding:16px;border-radius:8px;text-align:center">
          ${code}
        </p>
        <p style="color:#666;font-size:13px">This code expires in 15 minutes.</p>
      </div>
    `,
  });
}
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
// Kept deliberately plain: a single div, one muted-color text link (not a
// boxed button), no background color blocks, no bordered callout box. The
// earlier version (nested tables, dark header band, gold button, bordered
// notice box) landed in spam — that kind of layout pattern-matches marketing/
// phishing templates far more than a plain email does, on top of which this
// sending domain has limited volume/reputation with Gmail so far. This is
// intentionally closer to the original template that was known to land in
// the inbox.

const ACCENT    = "#b45309";
const BODY_TEXT = "#1f2937";
const MUTED     = "#6b7280";
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
    subject: `You've been added to ${APP}`,
    html: `
      <div style="font-family:${SANS};max-width:480px;margin:0 auto;padding:32px;color:${BODY_TEXT};">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT};">
          ${APP}
        </p>
        <h1 style="margin:0 0 18px;font-size:19px;font-weight:700;">You're in</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
          Hi ${name}, you've been added to ${APP} as ${roleText}.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
          <a href="${signInUrl}" style="color:${ACCENT};font-weight:700;text-decoration:none;">Sign in to ${APP} →</a>
        </p>
        <p style="margin:24px 0 0;font-size:13px;color:${MUTED};">
          Sign in anytime with Google — no password needed.
        </p>
      </div>
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
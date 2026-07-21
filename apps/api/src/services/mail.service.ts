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

// ── Shared branded shell ────────────────────────────────────────────────────────
// Every transactional email wraps its content in this: a bordered card (not a
// dark background block, not a nested-table layout), an accent-colored eyebrow
// + heading, and a divider under the header. This is the "signature branding"
// look, applied consistently everywhere instead of ad-hoc colored text.
//
// Deliberately still avoids the specific patterns that landed an earlier
// version in spam: no dark background color blocks, no boxed CTA buttons, no
// nested `<table>` layouts, no bordered "notice"/alert callout boxes. A single
// light-bordered card with real typographic hierarchy reads as a normal
// transactional receipt (the same visual language Stripe/Linear-style emails
// use), not a marketing template — that combination is what previously
// pattern-matched as spam, not a border by itself.

const ACCENT    = "#b45309";
const BODY_TEXT = "#1f2937";
const MUTED     = "#6b7280";
const BORDER    = "#e5e7eb";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:${SANS};max-width:520px;margin:0 auto;padding:24px;">
      <div style="border:1px solid ${BORDER};border-radius:14px;padding:32px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT};">
          ${APP}
        </p>
        <h1 style="margin:0 0 20px;padding-bottom:20px;border-bottom:1px solid ${BORDER};font-size:19px;font-weight:700;color:${BODY_TEXT};">
          ${title}
        </h1>
        ${bodyHtml}
      </div>
    </div>
  `;
}

// A stacked label/value pair — the same visual pattern used throughout the
// admin dashboard (uppercase muted label above a larger dark value) rather
// than inline "Label: value" text.
function fieldRow(label: string, value: string): string {
  return `
    <div style="margin:0 0 16px;">
      <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${MUTED};">${label}</p>
      <p style="margin:3px 0 0;font-size:15px;color:${BODY_TEXT};line-height:1.5;">${value}</p>
    </div>
  `;
}

// ── Invite email ───────────────────────────────────────────────────────────────
// Purely a courtesy notification — there's no token/expiry, the account is
// already live. Whoever it's addressed to can sign in with Google whenever
// they like, whether they've seen this email or not.

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
    html: emailShell("You're in", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BODY_TEXT};">
        Hi ${name}, you've been added to ${APP} as ${roleText}.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        <a href="${signInUrl}" style="color:${ACCENT};font-weight:700;text-decoration:none;">Sign in to ${APP} →</a>
      </p>
      <p style="margin:24px 0 0;font-size:13px;color:${MUTED};">
        Sign in anytime with Google — no password needed.
      </p>
    `),
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
    html: emailShell("Reset your password", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BODY_TEXT};">
        Click the link below to reset your password. This link expires in 1 hour.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        <a href="${resetLink}" style="color:${ACCENT};font-weight:700;text-decoration:none;">Reset password →</a>
      </p>
      <p style="margin:24px 0 0;font-size:13px;color:${MUTED};">
        If you didn't request this, you can safely ignore this email.
      </p>
    `),
  });
}

// ── Booking inquiry notification (to staff) ────────────────────────────────────

export async function sendBookingNotificationEmail(
  to: string[], inquiry: {
    name: string; email: string; phone?: string | null;
    eventType?: string | null; eventDate?: string | null; venue?: string | null;
    eventDetails?: string | null; message?: string | null;
  }
) {
  if (to.length === 0) return;

  const rows = [
    fieldRow("Name", inquiry.name),
    fieldRow("Email", `<a href="mailto:${inquiry.email}" style="color:${ACCENT};text-decoration:none;">${inquiry.email}</a>`),
    inquiry.phone ? fieldRow("Phone", inquiry.phone) : "",
    inquiry.eventType ? fieldRow("Event type", inquiry.eventType) : "",
    inquiry.eventDate ? fieldRow("Date", inquiry.eventDate) : "",
    inquiry.venue ? fieldRow("Venue", inquiry.venue) : "",
    inquiry.eventDetails ? fieldRow("Additional details", inquiry.eventDetails.replace(/\n/g, "<br/>")) : "",
    inquiry.message ? fieldRow("Message", inquiry.message.replace(/\n/g, "<br/>")) : "",
  ].join("");

  await send({
    from:    FROM,
    to,
    subject: `New booking inquiry from ${inquiry.name}`,
    html: emailShell("New booking inquiry", rows),
  });
}

// ── Booking auto-acknowledgment (to the inquirer) ──────────────────────────────
// Purely a "we got it" courtesy — no action required.

export async function sendBookingAcknowledgmentEmail(to: string, name: string) {
  await send({
    from:    FROM,
    to,
    subject: `We got your booking inquiry — ${APP}`,
    html: emailShell(`Thanks, ${name.split(" ")[0]}`, `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BODY_TEXT};">
        We've received your booking inquiry and will get back to you within 48 hours.
      </p>
      <p style="margin:24px 0 0;font-size:13px;color:${MUTED};">
        No need to reply to this email — we'll follow up directly.
      </p>
    `),
  });
}

// ── Booking reply (staff → inquirer) ───────────────────────────────────────────

export async function sendBookingReplyEmail(to: string, name: string, message: string) {
  await send({
    from:    FROM,
    to,
    subject: `Re: your booking inquiry — ${APP}`,
    html: emailShell("Reply to your inquiry", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BODY_TEXT};">Hi ${name.split(" ")[0]},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BODY_TEXT};white-space:pre-wrap;">${message}</p>
      <p style="margin:24px 0 0;font-size:13px;color:${MUTED};">— ${APP}</p>
    `),
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
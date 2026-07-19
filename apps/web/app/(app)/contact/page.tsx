"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/features/public/PageHeader";
import { publicBookingsService } from "@/features/public/services/bookings.service";
import { publicContentService, type PublicContent } from "@/features/public/services/content.service";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-primary)",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)",
  marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em",
};

export default function ContactPage() {
  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [phone, setPhone]               = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [message, setMessage]           = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent]             = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [content, setContent]           = useState<PublicContent | null>(null);

  useEffect(() => {
    publicContentService.getContent().then((res) => setContent(res.data?.content ?? null));
  }, []);

  const contactInfo = content
    ? [
        { label: "Email", value: content.contact_email },
        { label: "Phone", value: content.contact_phone },
        { label: "Socials", value: content.contact_socials },
      ].filter((item) => item.value)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setError(null);
    try {
      await publicBookingsService.submit({
        name: name.trim(), email: email.trim(),
        phone: phone.trim() || undefined,
        eventDetails: eventDetails.trim(),
        message: message.trim() || undefined,
      });
      setIsSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Contact" />
      <p style={{ fontSize: "14px", color: "var(--color-text-muted)", margin: "8px 0 24px" }}>
        Get in touch or submit a booking inquiry — we'll follow up by email.
      </p>

      <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }}>
      <div style={{
        flex: "2 1 480px", padding: "28px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-xl)",
      }}>
        {isSent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>Thanks, {name.split(" ")[0]}!</p>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>We've received your inquiry and will be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Phone <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
              <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Event details</label>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }} value={eventDetails} onChange={(e) => setEventDetails(e.target.value)} placeholder="Date, venue, type of event…" required />
            </div>
            <div>
              <label style={labelStyle}>Message <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-danger)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} style={{
              padding: "12px", background: isSubmitting ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700,
              color: isSubmitting ? "var(--color-accent)" : "var(--color-accent-text)",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}>
              {isSubmitting ? "Sending…" : "Submit inquiry"}
            </button>
          </form>
        )}
      </div>

      {contactInfo.length > 0 && (
        <div style={{
          flex: "1 1 300px", maxWidth: "340px", padding: "24px",
          background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
          borderRadius: "var(--radius-xl)", display: "flex", flexDirection: "column", gap: "16px",
        }}>
          {contactInfo.map(({ label, value }) => (
            <div key={label}>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>{value}</p>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

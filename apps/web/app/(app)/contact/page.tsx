"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import PageHeader from "@/features/public/PageHeader";
import { publicBookingsService } from "@/features/public/services/bookings.service";
import { publicContentService, type PublicContent } from "@/features/public/services/content.service";
import { InstagramIcon, YoutubeIcon, FacebookIcon, XIcon } from "@/shared/components/SocialIcons";
import { useAuth } from "@/shared/context/AuthContext";
import { useTheme } from "@/shared/context/ThemeContext";

function handleGoogleSignIn() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  window.location.href = `${apiBase}/auth/google`;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

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
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [name, setName]                 = useState("");
  const [phone, setPhone]               = useState("");
  const [eventType, setEventType]       = useState("");
  const [eventDate, setEventDate]       = useState("");
  const [venue, setVenue]               = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [message, setMessage]           = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent]             = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [content, setContent]           = useState<PublicContent | null>(null);
  const [enabledEventTypes, setEnabledEventTypes] = useState<string[]>([]);

  useEffect(() => {
    publicContentService.getContent().then((res) => setContent(res.data?.content ?? null));
    publicBookingsService.getEventTypes().then((res) => setEnabledEventTypes(res.data?.enabledEventTypes ?? []));
  }, []);

  useEffect(() => {
    if (user && !name) {
      setName(user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "");
    }
  }, [user]);

  const contactInfo = content
    ? [
        { label: "Email", value: content.contact_email },
        { label: "Phone", value: content.contact_phone },
      ].filter((item) => item.value)
    : [];

  const socialLinks = content
    ? ([
        { href: content.contact_social_instagram, label: "Instagram", icon: <InstagramIcon size={16} /> },
        { href: content.contact_social_youtube,    label: "YouTube",   icon: <YoutubeIcon size={16} /> },
        { href: content.contact_social_facebook,   label: "Facebook",  icon: <FacebookIcon size={16} /> },
        { href: content.contact_social_x,          label: "X",         icon: <XIcon size={16} /> },
        { href: content.contact_social_website,    label: "Website",   icon: <Globe size={16} /> },
      ]).filter((s) => s.href)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setError(null);
    try {
      await publicBookingsService.submit({
        name: name.trim(),
        phone: phone.trim() || undefined,
        eventType: eventType || undefined,
        eventDate: eventDate || undefined,
        venue: venue.trim() || undefined,
        eventDetails: eventDetails.trim() || undefined,
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
        {authLoading ? null : !user ? (
          <div style={{ textAlign: "center", padding: "24px 12px" }}>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>Sign in to submit an inquiry</p>
            <p style={{ fontSize: "13.5px", color: "var(--color-text-muted)", margin: "0 0 22px", lineHeight: 1.5 }}>
              We ask booking inquiries to sign in with Google so replies always reach the right inbox.
            </p>
            <button
              onClick={handleGoogleSignIn}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                width: "100%", maxWidth: "280px", margin: "0 auto", padding: "11px",
                background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600,
                color: "var(--color-text-primary)", cursor: "pointer",
              }}
            >
              <GoogleIcon /> Continue with Google
            </button>
          </div>
        ) : isSent ? (
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
                <div style={{ ...inputStyle, display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>
                  {user.email}
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Phone <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
              <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Event type</label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={eventType} onChange={(e) => setEventType(e.target.value)} required>
                  <option value="" disabled>Select one…</option>
                  {enabledEventTypes.map((label) => <option key={label} value={label}>{label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Event date</label>
                <input
                  style={{ ...inputStyle, colorScheme: theme, cursor: "pointer" }}
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  required
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Venue</label>
              <input style={inputStyle} value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Where's the event?" required />
            </div>
            <div>
              <label style={labelStyle}>Additional details <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }} value={eventDetails} onChange={(e) => setEventDetails(e.target.value)} placeholder="Guest count, timing, anything else we should know…" />
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

      {(contactInfo.length > 0 || socialLinks.length > 0) && (
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

          {socialLinks.length > 0 && (
            <div>
              <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Follow</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {socialLinks.map(({ href, label, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    aria-label={label}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "38px", height: "38px", borderRadius: "var(--radius-md)",
                      background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                      color: "var(--color-text-secondary)", textDecoration: "none",
                    }}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

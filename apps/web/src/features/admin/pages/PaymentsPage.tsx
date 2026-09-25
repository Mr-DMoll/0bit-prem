"use client";

import { useState, useEffect } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { paymentsService } from "../services/payments.service";
import { ComingSoonPage } from "../components/ComingSoonPage";

// Real on/off switch for PayFast checkout — added the same day the PayFast
// integration first went live, because the account was still pending
// PayFast's own verification. Until that clears, every "Buy" click on the
// real site redirects to a PayFast checkout that rejects the payment; this
// keeps that off (showing customers a plain "temporarily unavailable"
// message instead) until someone here flips it back on.
//
// The rest of this page (settlement history, refunds, reconciliation) is
// still the placeholder it always was — only the toggle is real.
export function PaymentsPage() {
  const [enabled, setEnabled]     = useState<boolean | null>(null);
  const [isSaving, setIsSaving]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    paymentsService.getSettings()
      .then((res) => setEnabled(res.data.enabled))
      .catch(() => setError("Couldn't load the current setting."));
  }, []);

  const toggle = async () => {
    if (enabled === null || isSaving) return;
    const next = !enabled;
    setIsSaving(true); setError(null);
    try {
      const res = await paymentsService.setEnabled(next);
      setEnabled(res.data.enabled);
    } catch {
      setError("Couldn't save — please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
          Payments
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Turn real PayFast checkout on or off across the whole site.
        </p>
      </div>

      <div style={{
        background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>
              Real PayFast checkout
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px", maxWidth: "480px", lineHeight: 1.5 }}>
              {enabled
                ? "Live — customers who click Buy are sent to PayFast for a real payment."
                : "Off — customers who click Buy see “Purchases are temporarily unavailable” instead of being sent to PayFast."}
            </div>
          </div>

          <button
            onClick={toggle}
            disabled={enabled === null || isSaving}
            title={enabled ? "Turn off" : "Turn on"}
            style={{
              background: "none", border: "none",
              cursor: enabled === null || isSaving ? "wait" : "pointer",
              color: enabled ? "var(--color-success)" : "var(--color-text-muted)",
              display: "flex", alignItems: "center", padding: "4px",
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {enabled
              ? <ToggleRight size={28} strokeWidth={1.5} />
              : <ToggleLeft  size={28} strokeWidth={1.5} />
            }
          </button>
        </div>
      </div>

      {error && <p style={{ margin: 0, fontSize: "13px", color: "var(--color-danger)" }}>{error}</p>}

      <ComingSoonPage
        title="Transaction history"
        description="Settlement status, failed payments and refunds — once there's real volume to show"
        items={[
          "Settlement status per transaction",
          "Failed payments and retries",
          "Refund handling",
        ]}
      />
    </div>
  );
}

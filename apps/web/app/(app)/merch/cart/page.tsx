"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import PageHeader from "@/features/public/PageHeader";
import { useCart } from "@/features/public/CartContext";
import { useAuth } from "@/shared/context/AuthContext";
import { publicMerchService } from "@/features/public/services/merch.service";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-primary)",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)",
  marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em",
};

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear, totalCents } = useCart();
  const { user } = useAuth();

  const [name, setName]             = useState("");
  const [phone, setPhone]           = useState("");
  const [line1, setLine1]           = useState("");
  const [line2, setLine2]           = useState("");
  const [city, setCity]             = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isPlacing, setIsPlacing]   = useState(false);
  const [placed, setPlaced]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (!user?.shippingLine1) return;
    setName(user.shippingName ?? "");
    setPhone(user.shippingPhone ?? "");
    setLine1(user.shippingLine1 ?? "");
    setLine2(user.shippingLine2 ?? "");
    setCity(user.shippingCity ?? "");
    setPostalCode(user.shippingPostalCode ?? "");
  }, [user?.id]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      window.location.href = `${apiBase}/auth/google`;
      return;
    }
    setIsPlacing(true); setError(null);
    try {
      await publicMerchService.checkout(
        items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        { name, phone, line1, line2: line2 || undefined, city, postalCode },
      );
      clear();
      setPlaced(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Checkout failed. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  if (placed) {
    return (
      <div>
        <PageHeader title="Cart" />
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>Order placed!</p>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Thanks — we'll get your order ready to ship.</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Cart" />
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Your cart is empty — browse <a href="/merch" style={{ color: "var(--color-accent)" }}>Merch</a> to add something.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Cart" />

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px", maxWidth: "560px" }}>
        {items.map((item) => (
          <div key={item.variantId} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-lg)" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "var(--radius-md)", flexShrink: 0,
              background: item.imageUrl ? `url(${item.imageUrl}) center/cover` : "linear-gradient(135deg, hsl(38,65%,22%), hsl(16,50%,8%))",
              border: "1px solid var(--color-border)",
            }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.productName}</p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>{item.variantLabel} — R{(item.priceCents / 100).toFixed(2)}</p>
            </div>
            <input
              type="number" min="1" value={item.quantity}
              onChange={(e) => updateQuantity(item.variantId, Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: "56px", padding: "6px 8px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "var(--color-text-primary)" }}
            />
            <button onClick={() => removeItem(item.variantId)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", padding: "4px" }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", paddingTop: "8px" }}>
          Total: R{(totalCents / 100).toFixed(2)}
        </div>
      </div>

      <div style={{ maxWidth: "480px", padding: "28px", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 16px" }}>Shipping details</h3>
        <form onSubmit={handlePlaceOrder} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>Address line 1</label>
            <input style={inputStyle} value={line1} onChange={(e) => setLine1(e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>Address line 2 <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
            <input style={inputStyle} value={line2} onChange={(e) => setLine2(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Postal code</label>
              <input style={inputStyle} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-danger)" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={isPlacing} style={{
            padding: "12px", background: isPlacing ? "var(--color-accent-subtle)" : "var(--color-accent)",
            border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700,
            color: "var(--color-accent-text)", cursor: isPlacing ? "not-allowed" : "pointer",
          }}>
            {isPlacing ? "Placing order…" : `Place Order — R${(totalCents / 100).toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

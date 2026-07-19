"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/shared/context/AuthContext";
import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";
import PageHeader from "@/features/public/PageHeader";
import { publicMusicService, type MyAlbumPurchase } from "@/features/public/services/music.service";
import { publicMerchService, type MyOrder } from "@/features/public/services/merch.service";

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

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
      borderRadius: "var(--radius-xl)", padding: "24px",
    }}>
      {title && <h3 style={{ margin: "0 0 18px", fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</h3>}
      {children}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    PENDING:   { background: "var(--color-warning-subtle)", color: "var(--color-warning)" },
    PAID:      { background: "var(--color-info-subtle)",    color: "var(--color-info)" },
    FULFILLED: { background: "var(--color-success-subtle)", color: "var(--color-success)" },
    CANCELLED: { background: "var(--color-danger-subtle)",  color: "var(--color-danger)" },
  };
  return (
    <span style={{ ...(styles[status] ?? styles.PENDING), display: "inline-flex", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {status}
    </span>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "18px 20px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
      <p style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "var(--color-accent)" }}>{value}</p>
      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
    </div>
  );
}

const TABS = ["Overview", "My Albums", "My Orders", "Profile", "Address"] as const;
type Tab = typeof TABS[number];

function AccountContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("Overview");
  const [albums, setAlbums]       = useState<MyAlbumPurchase[]>([]);
  const [orders, setOrders]       = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      publicMusicService.getMyAlbums(),
      publicMerchService.getMyOrders(),
    ]).then(([albumsRes, ordersRes]) => {
      setAlbums(albumsRes.data?.purchases ?? []);
      setOrders(ordersRes.data?.orders ?? []);
    }).finally(() => setIsLoading(false));
  }, []);

  const totalSpentCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—";

  const accountNav = (
    <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--color-border)", flexWrap: "wrap" }}>
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          style={{
            padding: "10px 16px", background: "none", border: "none",
            borderBottom: tab === t ? "2px solid var(--color-accent)" : "2px solid transparent",
            fontSize: "13.5px", fontWeight: 600,
            color: tab === t ? "var(--color-accent)" : "var(--color-text-muted)",
            cursor: "pointer",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader title="Account" tabs={accountNav} />

      {isLoading ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading…</p>
      ) : tab === "Overview" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", maxWidth: "760px" }}>
            <StatTile label="Albums owned" value={String(albums.length)} />
            <StatTile label="Orders placed" value={String(orders.length)} />
            <StatTile label="Total spent" value={`R${(totalSpentCents / 100).toFixed(2)}`} />
            <StatTile label="Member since" value={memberSince} />
          </div>
          {albums.length === 0 && orders.length === 0 && (
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              Nothing here yet — browse <Link href="/music" style={{ color: "var(--color-accent)" }}>Music</Link> or <Link href="/merch" style={{ color: "var(--color-accent)" }}>Merch</Link> to get started.
            </p>
          )}
        </div>
      ) : tab === "My Albums" ? (
        albums.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No albums yet — browse <Link href="/music" style={{ color: "var(--color-accent)" }}>Music</Link>.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px" }}>
            {albums.map(({ id, album }) => (
              <Link key={id} href={`/music/${album.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  aspectRatio: "1", borderRadius: "var(--radius-lg)",
                  background: album.coverImageUrl ? `url(${album.coverImageUrl}) center/cover` : "linear-gradient(135deg, hsl(38,65%,22%), hsl(16,50%,8%))",
                  border: "1px solid var(--color-card-border)", marginBottom: "8px",
                }} />
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{album.title}</p>
              </Link>
            ))}
          </div>
        )
      ) : tab === "My Orders" ? (
        orders.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No orders yet — browse <Link href="/merch" style={{ color: "var(--color-accent)" }}>Merch</Link>.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "14px", alignItems: "start" }}>
            {orders.map((order) => {
              const expanded = expandedOrder === order.id;
              return (
                <div key={order.id} style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  <button
                    onClick={() => setExpandedOrder(expanded ? null : order.id)}
                    style={{ width: "100%", textAlign: "left", padding: "14px 16px", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-muted)" }}>
                        {new Date(order.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    {order.items.map((item) => (
                      <p key={item.id} style={{ margin: "2px 0", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                        {item.quantity}× {item.productVariant.product.name} ({item.productVariant.label})
                      </p>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {order.currency} {(order.totalCents / 100).toFixed(2)}
                      </p>
                      <span style={{ fontSize: "12px", color: "var(--color-accent)" }}>{expanded ? "Hide details ▲" : "View details ▼"}</span>
                    </div>
                  </button>
                  {expanded && (
                    <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--color-border)" }}>
                      <p style={{ margin: "14px 0 4px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Shipping to</p>
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>{order.shippingName} · {order.shippingPhone}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                        {order.shippingLine1}{order.shippingLine2 ? `, ${order.shippingLine2}` : ""}, {order.shippingCity}, {order.shippingPostalCode}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : tab === "Profile" ? (
        <ProfileTab />
      ) : (
        <AddressTab />
      )}
    </div>
  );
}

function ProfileTab() {
  const { user, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    displayName: user?.displayName ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    country: user?.country ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = (user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const { data } = await apiClient.post(endpoints.users.avatarPresign, { filename: file.name, contentType: file.type });
      const { uploadUrl, publicUrl } = data.data;
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      const res = await apiClient.patch(endpoints.users.profile, { avatarUrl: publicUrl });
      setUser({ ...user, ...res.data.data.user });
    } catch {
      setError("Avatar upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const { data } = await apiClient.patch(endpoints.users.profile, form);
      setUser({ ...user, ...data.data.user });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }}>
      <div style={{ flex: "1 1 280px", maxWidth: "320px" }}>
        <Card title="Identity">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px" }}>
            <div style={{
              width: "84px", height: "84px", borderRadius: "50%",
              background: user?.avatarUrl ? "transparent" : "var(--color-accent-subtle)",
              border: "2px solid var(--color-accent-border)",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
            }}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "26px", fontWeight: 700, color: "var(--color-accent)" }}>{initials}</span>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {uploading ? "Uploading…" : "Change photo"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile} />
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-muted)" }}>{user?.email}</p>
          </div>
        </Card>
      </div>

      <div style={{ flex: "2 1 480px" }}>
        <Card title="Personal information">
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>First name</label>
                <input style={inputStyle} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Last name</label>
                <input style={inputStyle} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Display name</label>
                <input style={inputStyle} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <input style={inputStyle} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-muted)", padding: "10px 0" }}>{user?.email} (managed by Google sign-in)</p>
            </div>

            {success && <p style={{ margin: 0, fontSize: "13px", color: "var(--color-success)" }}>Profile updated.</p>}
            {error && <p style={{ margin: 0, fontSize: "13px", color: "var(--color-danger)" }}>{error}</p>}

            <button type="submit" disabled={saving} style={{
              alignSelf: "flex-start", padding: "10px 22px",
              background: saving ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 700,
              color: "var(--color-accent-text)", cursor: saving ? "not-allowed" : "pointer",
            }}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function AddressTab() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    shippingName: user?.shippingName ?? "",
    shippingPhone: user?.shippingPhone ?? "",
    shippingLine1: user?.shippingLine1 ?? "",
    shippingLine2: user?.shippingLine2 ?? "",
    shippingCity: user?.shippingCity ?? "",
    shippingPostalCode: user?.shippingPostalCode ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { data } = await apiClient.patch(endpoints.users.profile, form);
      setUser({ ...user, ...data.data.user });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const hasSavedAddress = !!(user?.shippingLine1);

  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }}>
      <div style={{ flex: "2 1 480px" }}>
        <Card title="Default shipping address">
          <p style={{ margin: "-8px 0 16px", fontSize: "12.5px", color: "var(--color-text-muted)" }}>
            Saved once, used to pre-fill Merch checkout every time.
          </p>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Full name</label>
                <input style={inputStyle} value={form.shippingName} onChange={(e) => setForm({ ...form, shippingName: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={form.shippingPhone} onChange={(e) => setForm({ ...form, shippingPhone: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Address line 1</label>
                <input style={inputStyle} value={form.shippingLine1} onChange={(e) => setForm({ ...form, shippingLine1: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Address line 2 <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                <input style={inputStyle} value={form.shippingLine2} onChange={(e) => setForm({ ...form, shippingLine2: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} value={form.shippingCity} onChange={(e) => setForm({ ...form, shippingCity: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Postal code</label>
                <input style={inputStyle} value={form.shippingPostalCode} onChange={(e) => setForm({ ...form, shippingPostalCode: e.target.value })} />
              </div>
            </div>

            {success && <p style={{ margin: 0, fontSize: "13px", color: "var(--color-success)" }}>Address saved.</p>}

            <button type="submit" disabled={saving} style={{
              alignSelf: "flex-start", padding: "10px 22px",
              background: saving ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 700,
              color: "var(--color-accent-text)", cursor: saving ? "not-allowed" : "pointer",
            }}>
              {saving ? "Saving…" : "Save address"}
            </button>
          </form>
        </Card>
      </div>

      <div style={{ flex: "1 1 280px", maxWidth: "320px" }}>
        <Card title="Currently saved">
          {hasSavedAddress ? (
            <div style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--color-text-secondary)" }}>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text-primary)" }}>{user?.shippingName}</p>
              <p style={{ margin: 0 }}>{user?.shippingPhone}</p>
              <p style={{ margin: "8px 0 0" }}>
                {user?.shippingLine1}{user?.shippingLine2 ? `, ${user.shippingLine2}` : ""}
              </p>
              <p style={{ margin: 0 }}>{user?.shippingCity}, {user?.shippingPostalCode}</p>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-muted)" }}>
              No address saved yet — fill in the form and it'll be used automatically at Merch checkout.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    const handleGoogleSignIn = () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      window.location.href = `${apiBase}/auth/google`;
    };

    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "60vh", gap: "16px",
      }}>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>
          Sign in to see your purchases and orders.
        </p>
        <button
          onClick={handleGoogleSignIn}
          style={{
            padding: "10px 20px", background: "var(--color-accent)", border: "none",
            borderRadius: "var(--radius-lg)", fontSize: "14px", fontWeight: 700,
            color: "var(--color-accent-text)", cursor: "pointer",
          }}
        >
          Continue with Google
        </button>
      </div>
    );
  }

  return <AccountContent />;
}

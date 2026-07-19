"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { merchService, type Product, type Variant, type VariantInput } from "../services/merch.service";
import { useConfirm } from "@/shared/context/ConfirmContext";
import { useToast } from "@/shared/context/ToastContext";

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)", fontSize: "13.5px", color: "var(--color-text-primary)",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

function AddVariantRow({ onSubmit }: { onSubmit: (input: VariantInput) => Promise<void> }) {
  const [label, setLabel]   = useState("");
  const [price, setPrice]   = useState("");
  const [stock, setStock]   = useState("");
  const [busy, setBusy]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !price) return;
    setBusy(true);
    try {
      await onSubmit({ label: label.trim(), priceCents: Math.round(parseFloat(price) * 100), stock: stock ? parseInt(stock) : 0 });
      setLabel(""); setPrice(""); setStock("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 90px", gap: "10px", padding: "16px 20px", background: "var(--color-bg-subtle)" }}>
      <input style={inputStyle} placeholder="Label (e.g. Black / M)" value={label} onChange={(e) => setLabel(e.target.value)} required />
      <input style={inputStyle} placeholder="Price (ZAR)" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <input style={inputStyle} placeholder="Stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
      <button type="submit" disabled={busy} style={{
        padding: "9px 14px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)",
        fontSize: "12.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: busy ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
      }}>
        <Plus size={13} /> Add
      </button>
    </form>
  );
}

export function VariantsPage({ productId }: { productId: string }) {
  const confirm = useConfirm();
  const toast = useToast();
  const [product, setProduct]     = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await merchService.getProduct(productId);
      setProduct(res.data?.product ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load product.");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const variants = product?.variants ?? [];

  const handleAdd = async (input: VariantInput) => { await merchService.createVariant(productId, input); await fetchProduct(); };
  const handleUpdateField = async (id: string, input: Partial<VariantInput>) => { await merchService.updateVariant(id, input); await fetchProduct(); };
  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: "Delete this variant?", danger: true }))) return;
    try {
      await merchService.deleteVariant(id);
      await fetchProduct();
    } catch (err: any) {
      toast(err?.response?.data?.message ?? "Failed to delete variant.");
    }
  };

  if (isLoading) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>;
  if (error || !product) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)" }}>{error ?? "Product not found."}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <Link href="/admin/merch" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "8px" }}>
          <ArrowLeft size={14} /> Back to Merch
        </Link>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>{product.name}</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Manage variants</p>
      </div>

      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {variants.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13.5px" }}>No variants yet — add one below.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Label", "SKU", "Price", "Stock", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--color-bg-subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variants.map((v: Variant) => (
                <tr key={v.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 20px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{v.label}</td>
                  <td style={{ padding: "12px 20px", fontSize: "12px", color: "var(--color-text-muted)" }}>{v.sku}</td>
                  <td style={{ padding: "12px 20px" }}>
                    <input
                      style={{ ...inputStyle, width: "90px" }}
                      type="number" step="0.01" min="0"
                      defaultValue={(v.priceCents / 100).toFixed(2)}
                      onBlur={(e) => handleUpdateField(v.id, { priceCents: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <input
                      style={{ ...inputStyle, width: "70px" }}
                      type="number" min="0"
                      defaultValue={v.stock}
                      onBlur={(e) => handleUpdateField(v.id, { stock: parseInt(e.target.value) || 0 })}
                    />
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <button onClick={() => handleDelete(v.id)} style={{
                      background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger-subtle)", borderRadius: "var(--radius-md)",
                      color: "var(--color-danger)", cursor: "pointer", padding: "5px 10px", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px",
                    }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <AddVariantRow onSubmit={handleAdd} />
      </div>
    </div>
  );
}

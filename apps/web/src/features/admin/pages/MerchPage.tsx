"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, ListMusic } from "lucide-react";
import { merchService, type Product, type ProductInput, type ProductCategory } from "../services/merch.service";

const CATEGORIES: ProductCategory[] = ["APPAREL", "ACCESSORIES", "BOOKS"];
const CATEGORY_LABELS: Record<ProductCategory, string> = { APPAREL: "Apparel", ACCESSORIES: "Accessories", BOOKS: "Books" };
import { ProductImagesField } from "../components/ProductImagesField";
import { OrdersPage } from "./OrdersPage";

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

function ProductModal({ product, onClose, onSubmit }: {
  product: Product | null;
  onClose: () => void;
  onSubmit: (input: ProductInput) => Promise<void>;
}) {
  const [name, setName]             = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages]         = useState<string[]>(product?.images ?? []);
  const [category, setCategory]     = useState<ProductCategory>(product?.category ?? "APPAREL");
  const [isActive, setIsActive]     = useState(product?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true); setError(null);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined, images, category, isActive });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: "480px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)", padding: "32px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{product ? "Edit Product" : "New Product"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "18px" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <ProductImagesField label="Images" images={images} onChange={setImages} />
          <div>
            <label style={labelStyle}>Category</label>
            <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active (visible on the public Merch page)
          </label>

          {error && (
            <div style={{ padding: "10px 14px", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-danger)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-secondary)", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{
              flex: 1, padding: "10px",
              background: isSubmitting ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600,
              color: isSubmitting ? "var(--color-accent)" : "var(--color-accent-text)",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}>
              {isSubmitting ? "Saving…" : product ? "Save changes" : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<Product | null | "new">(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await merchService.getProducts();
      setProducts(res.data?.products ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleCreate = async (input: ProductInput) => { await merchService.createProduct(input); await fetchProducts(); };
  const handleUpdate = async (id: string, input: ProductInput) => { await merchService.updateProduct(id, input); await fetchProducts(); };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product and all its variants?")) return;
    await merchService.deleteProduct(id);
    await fetchProducts();
  };

  const priceRange = (product: Product) => {
    const prices = (product.variants ?? []).map((v) => v.priceCents);
    if (prices.length === 0) return "—";
    const min = Math.min(...prices), max = Math.max(...prices);
    return min === max ? `R${(min / 100).toFixed(2)}` : `R${(min / 100).toFixed(2)}–${(max / 100).toFixed(2)}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setModalProduct("new")} style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px",
          background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)",
          fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer",
        }}>
          <Plus size={15} /> New Product
        </button>
      </div>

      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)", fontSize: "14px" }}>{error}</div>
        ) : products.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>No products yet</p>
            <button onClick={() => setModalProduct("new")} style={{ padding: "10px 20px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer" }}>
              Create first product
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Product", "Category", "Active", "Price", "Variants", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--color-bg-subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "var(--radius-sm)", flexShrink: 0,
                        background: product.images[0] ? `url(${product.images[0]}) center/cover` : "var(--color-bg-subtle)",
                        border: "1px solid var(--color-border)",
                      }} />
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{product.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{CATEGORY_LABELS[product.category]}</td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: product.isActive ? "var(--color-success)" : "var(--color-text-muted)" }}>
                    {product.isActive ? "Active" : "Hidden"}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{priceRange(product)}</td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{product.variants?.length ?? 0}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Link href={`/admin/merch/${product.id}`} style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "4px 12px", fontSize: "12px", fontWeight: 600,
                        color: "var(--color-accent)", background: "var(--color-accent-subtle)",
                        border: "1px solid var(--color-accent-border)", borderRadius: "var(--radius-md)", textDecoration: "none",
                      }}>
                        <ListMusic size={12} /> Variants
                      </Link>
                      <button onClick={() => setModalProduct(product)} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => handleDelete(product.id)} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: 600, color: "var(--color-danger)", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalProduct && (
        <ProductModal
          product={modalProduct === "new" ? null : modalProduct}
          onClose={() => setModalProduct(null)}
          onSubmit={(input) => modalProduct === "new" ? handleCreate(input) : handleUpdate((modalProduct as Product).id, input)}
        />
      )}
    </div>
  );
}

export function MerchPage() {
  const [tab, setTab] = useState<"products" | "orders">("products");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Merch</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Products, variants, and orders</p>
      </div>

      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--color-border)" }}>
        {(["products", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 16px", background: "none", border: "none",
              borderBottom: tab === t ? "2px solid var(--color-accent)" : "2px solid transparent",
              fontSize: "13.5px", fontWeight: 600,
              color: tab === t ? "var(--color-accent)" : "var(--color-text-muted)",
              cursor: "pointer", textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "products" ? <ProductsTab /> : <OrdersPage />}
    </div>
  );
}

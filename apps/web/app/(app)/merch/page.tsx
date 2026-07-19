"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/features/public/PageHeader";
import { useCart } from "@/features/public/CartContext";
import { publicMerchService, type PublicProduct, type ProductCategory } from "@/features/public/services/merch.service";

function priceRange(product: PublicProduct) {
  const prices = product.variants.map((v) => v.priceCents);
  if (prices.length === 0) return "—";
  const min = Math.min(...prices), max = Math.max(...prices);
  return min === max ? `R${(min / 100).toFixed(2)}` : `R${(min / 100).toFixed(2)}–${(max / 100).toFixed(2)}`;
}

const FILTERS: { value: ProductCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "APPAREL", label: "Apparel" },
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "BOOKS", label: "Books" },
];

export default function MerchPage() {
  const [products, setProducts]   = useState<PublicProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter]       = useState<ProductCategory | "ALL">("ALL");
  const { count } = useCart();

  useEffect(() => {
    setIsLoading(true);
    publicMerchService.getProducts(filter === "ALL" ? undefined : filter)
      .then((res) => setProducts(res.data?.products ?? []))
      .finally(() => setIsLoading(false));
  }, [filter]);

  const cartLink = (
    <Link href="/merch/cart" style={{
      display: "flex", alignItems: "center", gap: "8px", padding: "9px 16px", marginTop: "4px",
      background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600,
      color: "var(--color-text-primary)", textDecoration: "none", whiteSpace: "nowrap",
    }}>
      Cart {count > 0 ? `(${count})` : ""}
    </Link>
  );

  const filterPills = (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "16px 0" }}>
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          style={{
            padding: "7px 16px", borderRadius: "var(--radius-pill)",
            fontSize: "12.5px", fontWeight: 600, cursor: "pointer",
            border: filter === f.value ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
            background: filter === f.value ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)",
            color: filter === f.value ? "var(--color-accent)" : "var(--color-text-secondary)",
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader title="Merch" action={cartLink} tabs={filterPills} />

      {isLoading ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading…</p>
      ) : products.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No merch available yet — check back soon.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" }}>
          {products.map((product) => (
            <Link key={product.id} href={`/merch/${product.id}`} style={{ textDecoration: "none" }}>
              <div>
                <div style={{
                  aspectRatio: "1", borderRadius: "var(--radius-lg)",
                  background: product.images[0] ? `url(${product.images[0]}) center/cover` : "linear-gradient(135deg, hsl(38,65%,22%), hsl(16,50%,8%))",
                  border: "1px solid var(--color-card-border)", marginBottom: "10px",
                }} />
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{product.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-accent)" }}>{priceRange(product)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

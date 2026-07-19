"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/features/public/PageHeader";
import { useCart } from "@/features/public/CartContext";
import { publicMerchService, type PublicProduct, type PublicVariant, type ProductCategory } from "@/features/public/services/merch.service";

const CATEGORY_LABELS: Record<ProductCategory, string> = { APPAREL: "Apparel", ACCESSORIES: "Accessories", BOOKS: "Books" };

function priceRange(product: PublicProduct) {
  const prices = product.variants.map((v) => v.priceCents);
  if (prices.length === 0) return "—";
  const min = Math.min(...prices), max = Math.max(...prices);
  return min === max ? `R${(min / 100).toFixed(2)}` : `R${(min / 100).toFixed(2)}–${(max / 100).toFixed(2)}`;
}

function RelatedProducts({ products }: { products: PublicProduct[] }) {
  if (products.length === 0) return null;
  return (
    <div style={{ marginTop: "56px" }}>
      <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
        You might also like
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "18px" }}>
        {products.map((p) => (
          <Link key={p.id} href={`/merch/${p.id}`} style={{ textDecoration: "none" }}>
            <div style={{
              aspectRatio: "1", borderRadius: "var(--radius-lg)",
              background: p.images[0] ? `url(${p.images[0]}) center/cover` : "linear-gradient(135deg, hsl(38,65%,22%), hsl(16,50%,8%))",
              border: "1px solid var(--color-card-border)", marginBottom: "8px",
            }} />
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{p.name}</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-accent)" }}>{priceRange(p)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct]         = useState<PublicProduct | null>(null);
  const [related, setRelated]         = useState<PublicProduct[]>([]);
  const [variantId, setVariantId]     = useState<string>("");
  const [quantity, setQuantity]       = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isLoading, setIsLoading]     = useState(true);
  const [added, setAdded]             = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setAdded(false);
    setActiveImage(0);
    publicMerchService.getProduct(productId).then((res) => {
      const p = res.data?.product ?? null;
      setProduct(p);
      setRelated(res.data?.relatedProducts ?? []);
      if (p?.variants?.[0]) setVariantId(p.variants[0].id);
    }).finally(() => setIsLoading(false));
  }, [productId]);

  const selectedVariant: PublicVariant | undefined = product?.variants.find((v) => v.id === variantId);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      variantLabel: selectedVariant.label,
      priceCents: selectedVariant.priceCents,
      imageUrl: product.images[0] ?? null,
    }, quantity);
    setAdded(true);
  };

  if (isLoading) return <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading…</p>;
  if (!product) return <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Product not found.</p>;

  const images = product.images.length > 0 ? product.images : [null];
  const outOfStock = product.variants.length > 0 && product.variants.every((v) => v.stock === 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
        <Link href="/merch" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Merch</Link>
        <span>/</span>
        <Link href="/merch" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>{CATEGORY_LABELS[product.category]}</Link>
        <span>/</span>
        <span style={{ color: "var(--color-text-secondary)" }}>{product.name}</span>
      </div>

      <PageHeader title={product.name} />

      <div style={{ display: "flex", gap: "40px", flexWrap: "wrap", maxWidth: "1100px" }}>
        <div style={{ width: "380px", flexShrink: 0 }}>
          <div style={{
            aspectRatio: "1", borderRadius: "var(--radius-lg)", width: "100%",
            background: images[activeImage] ? `url(${images[activeImage]}) center/cover` : "linear-gradient(135deg, hsl(38,65%,22%), hsl(16,50%,8%))",
            border: "1px solid var(--color-card-border)", marginBottom: "12px",
          }} />
          {images.length > 1 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  style={{
                    width: "60px", height: "60px", borderRadius: "var(--radius-md)", padding: 0, cursor: "pointer",
                    background: img ? `url(${img}) center/cover` : "linear-gradient(135deg, hsl(38,65%,22%), hsl(16,50%,8%))",
                    border: activeImage === i ? "2px solid var(--color-accent)" : "1px solid var(--color-card-border)",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: "280px", flex: 1 }}>
          <p style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "var(--color-accent)" }}>
            {selectedVariant ? `R${(selectedVariant.priceCents / 100).toFixed(2)}` : priceRange(product)}
          </p>

          {product.description && (
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "var(--color-text-secondary)", maxWidth: "480px" }}>{product.description}</p>
          )}

          {product.variants.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Option</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    disabled={v.stock === 0}
                    style={{
                      padding: "8px 16px", borderRadius: "var(--radius-pill)", fontSize: "13px", fontWeight: 600,
                      cursor: v.stock === 0 ? "not-allowed" : "pointer",
                      border: variantId === v.id ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                      background: variantId === v.id ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)",
                      color: v.stock === 0 ? "var(--color-text-muted)" : (variantId === v.id ? "var(--color-accent)" : "var(--color-text-secondary)"),
                      textDecoration: v.stock === 0 ? "line-through" : "none",
                    }}
                  >
                    {v.label}{v.stock === 0 ? " (out of stock)" : ""}
                  </button>
                ))}
              </div>
              {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
                <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: "var(--color-warning)" }}>Only {selectedVariant.stock} left</p>
              )}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quantity</label>
            <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{ width: "34px", height: "34px", background: "var(--color-bg-subtle)", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--color-text-primary)" }}
              >
                −
              </button>
              <span style={{ width: "40px", textAlign: "center", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(selectedVariant?.stock ?? 99, q + 1))}
                style={{ width: "34px", height: "34px", background: "var(--color-bg-subtle)", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--color-text-primary)" }}
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stock === 0}
            style={{
              alignSelf: "flex-start", padding: "12px 28px",
              background: (!selectedVariant || selectedVariant.stock === 0) ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "14.5px", fontWeight: 700,
              color: "var(--color-accent-text)",
              cursor: (!selectedVariant || selectedVariant.stock === 0) ? "not-allowed" : "pointer",
            }}
          >
            {outOfStock ? "Out of stock" : "Add to Cart"}
          </button>

          {added && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", color: "var(--color-success)" }}>Added to cart.</span>
              <button onClick={() => router.push("/merch/cart")} style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                View cart →
              </button>
            </div>
          )}
        </div>
      </div>

      <RelatedProducts products={related} />
    </div>
  );
}

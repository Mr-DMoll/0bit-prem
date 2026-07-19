"use client";

import { useState, useEffect, useCallback } from "react";
import { merchOrdersService, type OrderView } from "../services/merchOrders.service";

const STATUS_OPTIONS = ["PENDING", "PAID", "FULFILLED", "CANCELLED"] as const;

function StatusBadge({ status }: { status: string }) {
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

export function OrdersPage() {
  const [orders, setOrders]       = useState<OrderView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await merchOrdersService.getOrders();
      setOrders(res.data?.orders ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load orders.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (id: string, status: string) => {
    await merchOrdersService.updateStatus(id, status);
    await fetchOrders();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Orders</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Merch orders and fulfillment</p>
      </div>

      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)", fontSize: "14px" }}>{error}</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>No orders yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Customer", "Items", "Shipping", "Total", "Status"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--color-bg-subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const name = order.user.displayName || [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email;
                return (
                  <tr key={order.id} style={{ borderBottom: "1px solid var(--color-border)", verticalAlign: "top" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>{order.user.email}</p>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      {order.items.map((item) => (
                        <div key={item.id}>{item.quantity}× {item.productVariant.product.name} ({item.productVariant.label})</div>
                      ))}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "var(--color-text-muted)", maxWidth: "220px" }}>
                      {order.shippingName}<br />
                      {order.shippingLine1}{order.shippingLine2 ? `, ${order.shippingLine2}` : ""}<br />
                      {order.shippingCity}, {order.shippingPostalCode}<br />
                      {order.shippingPhone}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>
                      {order.currency} {(order.totalCents / 100).toFixed(2)}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <StatusBadge status={order.status} />
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          style={{ padding: "5px 8px", fontSize: "12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)" }}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

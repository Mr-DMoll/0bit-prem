import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export type ProductCategory = "APPAREL" | "ACCESSORIES" | "BOOKS";

export interface PublicVariant {
  id: string;
  label: string;
  priceCents: number;
  stock: number;
}

export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  images: string[];
  category: ProductCategory;
  variants: PublicVariant[];
}

export interface CheckoutShipping {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country?: string;
}

export interface MyOrderItem {
  id: string;
  quantity: number;
  unitPriceCents: number;
  productVariant: { label: string; product: { name: string; images: string[] } };
}

export interface MyOrder {
  id: string;
  status: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED";
  totalCents: number;
  currency: string;
  createdAt: string;
  items: MyOrderItem[];
  shippingName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
}

export const publicMerchService = {
  async getProducts(category?: ProductCategory): Promise<{ data: { products: PublicProduct[] } }> {
    const { data } = await apiClient.get(endpoints.merch.products, { params: category ? { category } : undefined });
    return data;
  },
  async getProduct(id: string): Promise<{ data: { product: PublicProduct; relatedProducts: PublicProduct[] } }> {
    const { data } = await apiClient.get(endpoints.merch.productById(id));
    return data;
  },
  async checkout(items: { variantId: string; quantity: number }[], shipping: CheckoutShipping) {
    const { data } = await apiClient.post(endpoints.merch.checkout, { items, shipping });
    return data;
  },
  async getMyOrders(): Promise<{ data: { orders: MyOrder[] } }> {
    const { data } = await apiClient.get(endpoints.merch.myOrders);
    return data;
  },
};

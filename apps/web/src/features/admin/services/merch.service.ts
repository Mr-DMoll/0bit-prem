import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface Variant {
  id: string;
  productId: string;
  label: string;
  sku: string;
  priceCents: number;
  stock: number;
}

export type ProductCategory = "APPAREL" | "ACCESSORIES" | "BOOKS";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  images: string[];
  category: ProductCategory;
  isActive: boolean;
  variants?: Variant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  images?: string[];
  category?: ProductCategory;
  isActive?: boolean;
}

export interface VariantInput {
  label: string;
  priceCents: number;
  stock?: number;
}

export const merchService = {
  async getProducts(): Promise<{ data: { products: Product[] } }> {
    const { data } = await apiClient.get(endpoints.adminMerch.products);
    return data;
  },
  async getProduct(id: string): Promise<{ data: { product: Product } }> {
    const { data } = await apiClient.get(endpoints.adminMerch.productById(id));
    return data;
  },
  async createProduct(input: ProductInput) {
    const { data } = await apiClient.post(endpoints.adminMerch.products, input);
    return data;
  },
  async updateProduct(id: string, input: Partial<ProductInput>) {
    const { data } = await apiClient.patch(endpoints.adminMerch.productById(id), input);
    return data;
  },
  async deleteProduct(id: string) {
    const { data } = await apiClient.delete(endpoints.adminMerch.productById(id));
    return data;
  },
  async createVariant(productId: string, input: VariantInput) {
    const { data } = await apiClient.post(endpoints.adminMerch.variants(productId), input);
    return data;
  },
  async updateVariant(id: string, input: Partial<VariantInput>) {
    const { data } = await apiClient.patch(endpoints.adminMerch.variantById(id), input);
    return data;
  },
  async deleteVariant(id: string) {
    const { data } = await apiClient.delete(endpoints.adminMerch.variantById(id));
    return data;
  },
};

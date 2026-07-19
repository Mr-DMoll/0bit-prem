"use client";
import { use } from "react";
import { VariantsPage } from "@/features/admin/pages/VariantsPage";

export default function AdminProductVariantsRoute({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  return <VariantsPage productId={productId} />;
}

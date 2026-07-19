import { randomBytes } from "crypto";
import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";
import { slugify } from "../../utils/slugify.js";

// ── ADMIN: products ─────────────────────────────────────────────────────────────

export const adminListProducts = catchAsync(async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: true },
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: { products } });
});

export const adminGetProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  if (!product) throw new AppError("Product not found", HttpStatus.NOT_FOUND);
  return res.status(HttpStatus.OK).json({ status: "success", data: { product } });
});

const PRODUCT_CATEGORIES = ["APPAREL", "ACCESSORIES", "BOOKS"];

export const adminCreateProduct = catchAsync(async (req: Request, res: Response) => {
  const { name, description, images, category, isActive } = req.body;
  if (!name) throw new AppError("Name is required", HttpStatus.BAD_REQUEST);
  if (category && !PRODUCT_CATEGORIES.includes(category))
    throw new AppError("Invalid category", HttpStatus.BAD_REQUEST);

  const product = await prisma.product.create({
    data: {
      name,
      slug: slugify(name),
      description: description ?? null,
      images: Array.isArray(images) ? images : [],
      category: category ?? "APPAREL",
      isActive: isActive ?? true,
    },
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { product } });
});

export const adminUpdateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, images, category, isActive } = req.body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError("Product not found", HttpStatus.NOT_FOUND);
  if (category && !PRODUCT_CATEGORIES.includes(category))
    throw new AppError("Invalid category", HttpStatus.BAD_REQUEST);

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(images !== undefined && { images: Array.isArray(images) ? images : [] }),
      ...(category !== undefined && { category }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { product } });
});

export const adminDeleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError("Product not found", HttpStatus.NOT_FOUND);

  const orderItemCount = await prisma.orderItem.count({ where: { productVariant: { productId: id } } });
  if (orderItemCount > 0) {
    throw new AppError(
      "This product has existing orders and can't be deleted — deactivate it instead to hide it from new customers while keeping order history intact.",
      HttpStatus.CONFLICT
    );
  }

  await prisma.product.delete({ where: { id } });
  return res.status(HttpStatus.OK).json({ status: "success", message: "Product deleted" });
});

// ── ADMIN: variants ─────────────────────────────────────────────────────────────

export const adminCreateVariant = catchAsync(async (req: Request, res: Response) => {
  const { id: productId } = req.params;
  const { label, priceCents, stock } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("Product not found", HttpStatus.NOT_FOUND);
  if (!label) throw new AppError("Label is required", HttpStatus.BAD_REQUEST);
  if (typeof priceCents !== "number" || priceCents < 0)
    throw new AppError("priceCents must be a non-negative number", HttpStatus.BAD_REQUEST);

  const sku = `${product.slug}-${randomBytes(4).toString("hex")}`;

  const variant = await prisma.productVariant.create({
    data: { productId, label, priceCents, stock: stock ?? 0, sku },
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { variant } });
});

export const adminUpdateVariant = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { label, priceCents, stock } = req.body;

  const variant = await prisma.productVariant.findUnique({ where: { id } });
  if (!variant) throw new AppError("Variant not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.productVariant.update({
    where: { id },
    data: {
      ...(label !== undefined && { label }),
      ...(priceCents !== undefined && { priceCents }),
      ...(stock !== undefined && { stock }),
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { variant: updated } });
});

export const adminDeleteVariant = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const variant = await prisma.productVariant.findUnique({ where: { id } });
  if (!variant) throw new AppError("Variant not found", HttpStatus.NOT_FOUND);

  const orderItemCount = await prisma.orderItem.count({ where: { productVariantId: id } });
  if (orderItemCount > 0) {
    throw new AppError(
      "This variant has existing orders and can't be deleted — set its stock to 0 instead to stop new orders while keeping order history intact.",
      HttpStatus.CONFLICT
    );
  }

  await prisma.productVariant.delete({ where: { id } });
  return res.status(HttpStatus.OK).json({ status: "success", message: "Variant deleted" });
});

// ── PUBLIC: browse ──────────────────────────────────────────────────────────────

export const listProducts = catchAsync(async (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const where = {
    isActive: true,
    ...(category && PRODUCT_CATEGORIES.includes(category) ? { category: category as any } : {}),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { variants: true },
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: { products } });
});

export const getProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  if (!product || !product.isActive) throw new AppError("Product not found", HttpStatus.NOT_FOUND);

  const relatedProducts = await prisma.product.findMany({
    where: { isActive: true, category: product.category, NOT: { id: product.id } },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { variants: true },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { product, relatedProducts } });
});

// ── PUBLIC: checkout ────────────────────────────────────────────────────────────

export const checkout = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { items, shipping } = req.body;

  if (!Array.isArray(items) || items.length === 0)
    throw new AppError("Cart is empty", HttpStatus.BAD_REQUEST);
  if (!shipping?.name || !shipping?.phone || !shipping?.line1 || !shipping?.city || !shipping?.postalCode)
    throw new AppError("Shipping details are incomplete", HttpStatus.BAD_REQUEST);

  const variantIds = items.map((i: any) => i.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });

  if (variants.length !== variantIds.length)
    throw new AppError("One or more items are no longer available", HttpStatus.BAD_REQUEST);

  let totalCents = 0;
  const lineItems: { variantId: string; quantity: number; unitPriceCents: number }[] = [];

  for (const item of items) {
    const variant = variants.find((v) => v.id === item.variantId)!;
    const quantity = Number(item.quantity) || 0;

    if (!variant.product.isActive) throw new AppError(`${variant.product.name} is no longer available`, HttpStatus.BAD_REQUEST);
    if (quantity < 1) throw new AppError("Invalid quantity", HttpStatus.BAD_REQUEST);
    if (variant.stock < quantity) throw new AppError(`Not enough stock for ${variant.product.name} (${variant.label})`, HttpStatus.CONFLICT);

    totalCents += variant.priceCents * quantity;
    lineItems.push({ variantId: variant.id, quantity, unitPriceCents: variant.priceCents });
  }

  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        status: "PAID",
        totalCents,
        currency: "ZAR",
        shippingName: shipping.name,
        shippingPhone: shipping.phone,
        shippingLine1: shipping.line1,
        shippingLine2: shipping.line2 ?? null,
        shippingCity: shipping.city,
        shippingPostalCode: shipping.postalCode,
        shippingCountry: shipping.country ?? "ZA",
        paidAt: new Date(),
        items: {
          create: lineItems.map((li) => ({
            productVariantId: li.variantId,
            quantity: li.quantity,
            unitPriceCents: li.unitPriceCents,
          })),
        },
      },
    });

    for (const li of lineItems) {
      await tx.productVariant.update({
        where: { id: li.variantId },
        data: { stock: { decrement: li.quantity } },
      });
    }

    await tx.paymentTransaction.create({
      data: {
        userId,
        purpose: "MERCH_ORDER",
        referenceId: order.id,
        mPaymentId: `order_${order.id}`,
        amountCents: totalCents,
        currency: "ZAR",
        status: "COMPLETE",
      },
    });

    return order;
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { order } });
});

// ── PUBLIC: my orders ───────────────────────────────────────────────────────────

export const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { productVariant: { include: { product: true } } } },
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { orders } });
});

// ── STAFF: orders (Admin + Manager) ────────────────────────────────────────────

export const listOrders = catchAsync(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const where = status ? { status: status as any } : {};

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { productVariant: { include: { product: true } } } },
      user: { select: { email: true, displayName: true, firstName: true, lastName: true } },
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { orders } });
});

export const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const valid = ["PENDING", "PAID", "FULFILLED", "CANCELLED"];
  if (!valid.includes(status)) throw new AppError("Invalid status value", HttpStatus.BAD_REQUEST);

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) throw new AppError("Order not found", HttpStatus.NOT_FOUND);

  const order = await prisma.order.update({ where: { id }, data: { status } });
  return res.status(HttpStatus.OK).json({ status: "success", data: { order } });
});

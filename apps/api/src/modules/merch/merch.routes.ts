import { Router } from "express";
import {
  adminListProducts, adminGetProduct, adminCreateProduct, adminUpdateProduct, adminDeleteProduct,
  adminCreateVariant, adminUpdateVariant, adminDeleteVariant,
  listProducts, getProduct, checkout, getMyOrders,
  listOrders, updateOrderStatus,
} from "./merch.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";

// Mounted at /admin/merch — product catalog management, staff only.
export const adminMerchRouter = Router();
adminMerchRouter.use(protect);
adminMerchRouter.use(authorize([Role.ADMIN, Role.SUPER_ADMIN]));

adminMerchRouter.get("/products",              adminListProducts);
adminMerchRouter.get("/products/:id",          adminGetProduct);
adminMerchRouter.post("/products",             adminCreateProduct);
adminMerchRouter.patch("/products/:id",        adminUpdateProduct);
adminMerchRouter.delete("/products/:id",       adminDeleteProduct);
adminMerchRouter.post("/products/:id/variants", adminCreateVariant);
adminMerchRouter.patch("/variants/:id",        adminUpdateVariant);
adminMerchRouter.delete("/variants/:id",       adminDeleteVariant);

// Mounted at /merch — public browsing + checkout.
export const publicMerchRouter = Router();
publicMerchRouter.get("/products",     listProducts);
publicMerchRouter.get("/my-orders",    protect, getMyOrders);
publicMerchRouter.get("/products/:id", getProduct);
publicMerchRouter.post("/checkout",    protect, checkout);

// Mounted at /merch-orders — order fulfillment, Admin AND Manager.
export const merchOrdersRouter = Router();
merchOrdersRouter.use(protect);
merchOrdersRouter.use(authorize([Role.ADMIN, Role.MANAGER]));
merchOrdersRouter.get("/",             listOrders);
merchOrdersRouter.patch("/:id/status", updateOrderStatus);

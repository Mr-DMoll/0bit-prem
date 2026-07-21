import { Router } from "express";
import {
  adminListAlbums, adminCreateAlbum, adminUpdateAlbum, adminDeleteAlbum,
  adminListImages, adminCreateImage, adminBulkCreateImages,
  adminUpdateImage, adminReorderImages, adminBulkMoveImages, adminBulkDeleteImages, adminDeleteImage,
  listImages,
} from "./gallery.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";

export const adminGalleryRouter = Router();
adminGalleryRouter.use(protect);
adminGalleryRouter.use(authorize([Role.ADMIN, Role.SUPER_ADMIN]));

adminGalleryRouter.get("/albums",       adminListAlbums);
adminGalleryRouter.post("/albums",      adminCreateAlbum);
adminGalleryRouter.patch("/albums/:id", adminUpdateAlbum);
adminGalleryRouter.delete("/albums/:id", adminDeleteAlbum);

// Literal paths must come before the /:id catch-all below.
adminGalleryRouter.post("/bulk",        adminBulkCreateImages);
adminGalleryRouter.patch("/reorder",    adminReorderImages);
adminGalleryRouter.patch("/bulk-move",  adminBulkMoveImages);
adminGalleryRouter.delete("/bulk",      adminBulkDeleteImages);

adminGalleryRouter.get("/",       adminListImages);
adminGalleryRouter.post("/",      adminCreateImage);
adminGalleryRouter.patch("/:id",  adminUpdateImage);
adminGalleryRouter.delete("/:id", adminDeleteImage);

export const publicGalleryRouter = Router();
publicGalleryRouter.get("/", listImages);

import { Router } from "express";
import {
  adminListImages, adminCreateImage, adminUpdateImage, adminDeleteImage,
  listImages,
} from "./gallery.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";

export const adminGalleryRouter = Router();
adminGalleryRouter.use(protect);
adminGalleryRouter.use(authorize([Role.ADMIN, Role.SUPER_ADMIN]));

adminGalleryRouter.get("/",       adminListImages);
adminGalleryRouter.post("/",      adminCreateImage);
adminGalleryRouter.patch("/:id",  adminUpdateImage);
adminGalleryRouter.delete("/:id", adminDeleteImage);

export const publicGalleryRouter = Router();
publicGalleryRouter.get("/", listImages);

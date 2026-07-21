import { Router } from "express";
import { adminGetContent, adminUpdateContent, adminRevertContent, getContent } from "./content.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";

export const adminContentRouter = Router();
adminContentRouter.use(protect);
adminContentRouter.use(authorize([Role.ADMIN, Role.SUPER_ADMIN]));
adminContentRouter.get("/",  adminGetContent);
adminContentRouter.put("/",  adminUpdateContent);
adminContentRouter.post("/:key/revert", adminRevertContent);

export const publicContentRouter = Router();
publicContentRouter.get("/", getContent);

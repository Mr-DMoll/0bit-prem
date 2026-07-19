import { Router } from "express";
import { submitInquiry, adminListInquiries, adminUpdateInquiryStatus } from "./bookings.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";

export const publicBookingsRouter = Router();
publicBookingsRouter.post("/", submitInquiry);

export const adminBookingsRouter = Router();
adminBookingsRouter.use(protect);
adminBookingsRouter.use(authorize([Role.ADMIN, Role.SUPER_ADMIN]));
adminBookingsRouter.get("/",          adminListInquiries);
adminBookingsRouter.patch("/:id/status", adminUpdateInquiryStatus);

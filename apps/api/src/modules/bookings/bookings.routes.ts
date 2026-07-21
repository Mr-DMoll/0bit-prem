import { Router } from "express";
import {
  submitInquiry, publicGetEventTypes, adminListInquiries, adminUpdateInquiryStatus,
  adminUpdateNotes, adminReplyToInquiry,
  adminListEventTypes, adminCreateEventType, adminUpdateEventType, adminDeleteEventType,
} from "./bookings.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";

export const publicBookingsRouter = Router();
publicBookingsRouter.get("/event-types", publicGetEventTypes);
publicBookingsRouter.post("/", protect, submitInquiry);

export const adminBookingsRouter = Router();
adminBookingsRouter.use(protect);
adminBookingsRouter.use(authorize([Role.ADMIN, Role.SUPER_ADMIN]));
adminBookingsRouter.get("/",                  adminListInquiries);
adminBookingsRouter.get("/event-types",       adminListEventTypes);
adminBookingsRouter.post("/event-types",      adminCreateEventType);
adminBookingsRouter.patch("/event-types/:id", adminUpdateEventType);
adminBookingsRouter.delete("/event-types/:id", adminDeleteEventType);
adminBookingsRouter.patch("/:id/status",      adminUpdateInquiryStatus);
adminBookingsRouter.patch("/:id/notes",       adminUpdateNotes);
adminBookingsRouter.post("/:id/reply",        adminReplyToInquiry);

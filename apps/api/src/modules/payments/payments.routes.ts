import { Router } from "express";
import { adminGetPaymentsSettings, adminSetPaymentsSettings } from "./payments.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";

// Admin-only — kept as a separate router from payfast.routes.ts (the public,
// unauthenticated ITN endpoint) so a mounting mistake can't accidentally
// expose the on/off switch without auth.
export const adminPaymentsRouter = Router();
adminPaymentsRouter.use(protect);
adminPaymentsRouter.use(authorize([Role.ADMIN, Role.SUPER_ADMIN]));
adminPaymentsRouter.get("/settings", adminGetPaymentsSettings);
adminPaymentsRouter.patch("/settings", adminSetPaymentsSettings);

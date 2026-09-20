import { Router } from "express";
import {
  adminListEvents, adminCreateEvent, adminUpdateEvent, adminDeleteEvent,
  listEvents, getEvent,
} from "./events.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { publicCache } from "../../middleware/cache.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";

export const adminEventsRouter = Router();
adminEventsRouter.use(protect);
adminEventsRouter.use(authorize([Role.ADMIN, Role.SUPER_ADMIN]));

adminEventsRouter.get("/",          adminListEvents);
adminEventsRouter.post("/",         adminCreateEvent);
adminEventsRouter.patch("/:id",     adminUpdateEvent);
adminEventsRouter.delete("/:id",    adminDeleteEvent);

export const publicEventsRouter = Router();
publicEventsRouter.get("/", publicCache(), listEvents);
publicEventsRouter.get("/:id", getEvent);

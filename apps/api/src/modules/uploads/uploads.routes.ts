import { Router } from "express";
import { presignUpload, uploadTrack, uploadTrackMiddleware } from "./uploads.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";

const router = Router();
router.use(protect);
router.use(authorize([Role.ADMIN, Role.SUPER_ADMIN]));

router.post("/presign", presignUpload);
router.post("/track", uploadTrackMiddleware, uploadTrack);

export default router;

import { Router } from "express";
import { claimDevice, checkDevice } from "./sessions.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();
router.use(protect);

router.post("/claim", claimDevice);
router.post("/check", checkDevice);

export default router;

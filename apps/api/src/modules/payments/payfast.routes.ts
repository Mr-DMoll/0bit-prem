import { Router } from "express";
import { handleNotify } from "./payfast.controller.js";

// Public — PayFast's server is the caller, not a logged-in user. See
// payfast.controller.ts for how trust is established without a session.
const router = Router();
router.post("/notify", handleNotify);

export default router;

import { Router } from "express";
import {
  adminListAlbums, adminGetAlbum, adminCreateAlbum, adminUpdateAlbum, adminDeleteAlbum,
  adminCreateTrack, adminUpdateTrack, adminDeleteTrack, adminCreateTracksBatch, adminBulkUpdateTracks,
  listAlbums, getAlbum, purchaseAlbum, getMyAlbums, getSanctumMix,
} from "./music.controller.js";
import { protect, optionalAuth } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";

// Mounted at /admin/music — content management, staff only.
export const adminMusicRouter = Router();
adminMusicRouter.use(protect);
adminMusicRouter.use(authorize([Role.ADMIN, Role.SUPER_ADMIN]));

adminMusicRouter.get("/albums",              adminListAlbums);
adminMusicRouter.get("/albums/:id",          adminGetAlbum);
adminMusicRouter.post("/albums",             adminCreateAlbum);
adminMusicRouter.patch("/albums/:id",        adminUpdateAlbum);
adminMusicRouter.delete("/albums/:id",       adminDeleteAlbum);
adminMusicRouter.post("/albums/:id/tracks",       adminCreateTrack);
adminMusicRouter.post("/albums/:id/tracks/batch", adminCreateTracksBatch);
adminMusicRouter.patch("/albums/:id/tracks/bulk", adminBulkUpdateTracks);
adminMusicRouter.patch("/tracks/:id",             adminUpdateTrack);
adminMusicRouter.delete("/tracks/:id",            adminDeleteTrack);

// Mounted at /music — public browsing, optional auth (gates locked tracks).
export const publicMusicRouter = Router();
publicMusicRouter.get("/albums",           optionalAuth, listAlbums);
publicMusicRouter.get("/my-albums",        protect, getMyAlbums);
publicMusicRouter.get("/sanctum-mix",      optionalAuth, getSanctumMix);
publicMusicRouter.get("/albums/:id",       optionalAuth, getAlbum);
publicMusicRouter.post("/albums/:id/purchase", protect, purchaseAlbum);

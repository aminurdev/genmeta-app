/**
 * AppKey Model (Backward-compatible Re-export)
 *
 * NOTE: "App Key" was historically the term used when static keys were issued.
 * The system has transitioned to "App ID" / "App User" (`AppId` / `AppUser`).
 * This module re-exports `AppId` and `AppUser` for 100% backward compatibility.
 */

import { AppUser, AppKey, AppId, extractDeviceMeta } from "./appUser.model.js";

export { AppUser, AppKey, AppId, extractDeviceMeta };
export default AppKey;

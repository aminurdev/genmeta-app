/**
 * AppId Model (Modern Canonical Model)
 *
 * NOTE: Previously referred to as "App Key".
 * In the modern architecture, users log in directly, so this identifier
 * serves as their unique App ID (desktop application identifier & license holder).
 */

import { AppUser, AppKey, AppId, extractDeviceMeta } from "./appUser.model.js";

export { AppUser, AppKey, AppId, extractDeviceMeta };
export default AppId;

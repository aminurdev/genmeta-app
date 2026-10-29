/**
 * AppKey Model (Legacy Wrapper)
 *
 * NOTE: "App Key" was historically the concept used when static keys were issued.
 * The system has since transitioned to "App Users" (`AppUser`).
 * This module re-exports `AppUser` as `AppKey` to provide 100% backward
 * compatibility for existing controllers, services, and middlewares.
 */

import { AppUser, AppKey } from "./appUser.model.js";

export { AppUser, AppKey };
export default AppKey;

/**
 * AppKey Controller (Backward Compatibility Wrapper)
 *
 * NOTE: The application architecture has migrated from "App Key" to "App ID".
 * All logic now lives in `./appId.controller.js`.
 * This file re-exports all endpoints for complete backward compatibility.
 */

export * from "./appId.controller.js";

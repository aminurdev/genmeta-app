import mongoose from "mongoose";
import { AiAPI } from "../models/aiApiKey.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/api.error.js";
import {
  decrypt,
  encrypt,
  resolveAiApiKeyForClient,
} from "../utils/encrypt.js";

function setNoStoreHeaders(res) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
}

function serializeAiApiKey(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    isActive: Boolean(doc.isActive),
    ai_api_key: decrypt(doc.ai_api_key),
    isHealthy: Boolean(resolveAiApiKeyForClient(doc.ai_api_key)),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// GET all Gemini API keys (decrypted for superAdmin)
export const getAllGeminiKeys = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const records = await AiAPI.find().sort({
    isActive: -1,
    updatedAt: -1,
    createdAt: -1,
  });

  const decryptedKeys = records.map(serializeAiApiKey);

  return new ApiResponse(
    200,
    true,
    "Gemini API keys fetched successfully",
    decryptedKeys
  ).send(res);
});

// CREATE a new Gemini API key
export const createGeminiKey = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const { ai_api_key, name = "Gemini API Key", isActive = true } = req.body;

  const trimmedKey = typeof ai_api_key === "string" ? ai_api_key.trim() : "";
  if (!trimmedKey) {
    throw new ApiError(400, "AI API key is required");
  }

  const normalizedName =
    String(name || "Gemini API Key").trim() || "Gemini API Key";
  const encryptedKey = encrypt(trimmedKey);
  const newKey = await AiAPI.create({
    ai_api_key: encryptedKey,
    name: normalizedName,
    isActive: Boolean(isActive),
  });

  return new ApiResponse(201, true, "Gemini API key created", {
    _id: newKey._id,
    name: newKey.name,
    isActive: Boolean(newKey.isActive),
    ai_api_key: trimmedKey,
    isHealthy: true,
    createdAt: newKey.createdAt,
    updatedAt: newKey.updatedAt,
  }).send(res);
});

// UPDATE an existing Gemini API key
export const updateGeminiKey = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const { id } = req.params;
  const { ai_api_key, name, isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Gemini API key ID");
  }

  const updateData = {};
  if (ai_api_key !== undefined) {
    const trimmedKey = typeof ai_api_key === "string" ? ai_api_key.trim() : "";
    if (!trimmedKey) {
      throw new ApiError(400, "AI API key cannot be empty");
    }
    updateData.ai_api_key = encrypt(trimmedKey);
  }
  if (name !== undefined) {
    updateData.name =
      String(name || "Gemini API Key").trim() || "Gemini API Key";
  }
  if (isActive !== undefined) {
    updateData.isActive = Boolean(isActive);
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(
      400,
      "Provide at least one field to update (name, ai_api_key, or isActive)"
    );
  }

  const updatedKey = await AiAPI.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  if (!updatedKey) {
    throw new ApiError(404, "Gemini API key not found");
  }

  return new ApiResponse(
    200,
    true,
    "Gemini API key updated",
    serializeAiApiKey(updatedKey)
  ).send(res);
});

// DELETE a Gemini API key
export const deleteGeminiKey = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Gemini API key ID");
  }

  const deleted = await AiAPI.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Gemini API key not found");
  }

  return new ApiResponse(200, true, "Gemini API key deleted", {
    _id: deleted._id,
  }).send(res);
});

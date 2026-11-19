import { AiAPI } from "../models/aiApiKey.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/api.error.js";
import { decrypt, encrypt } from "../utils/encrypt.js";

// GET all Gemini API keys (decrypted for admin)
export const getAllGeminiKeys = asyncHandler(async (req, res) => {
  const records = await AiAPI.find().sort({ createdAt: -1 });

  const decryptedKeys = records.map((doc) => ({
    _id: doc._id,
    name: doc.name,
    isActive: doc.isActive,
    ai_api_key: decrypt(doc.ai_api_key),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));

  return new ApiResponse(
    200,
    true,
    "Gemini API keys fetched successfully",
    decryptedKeys
  ).send(res);
});

// CREATE a new Gemini API key
export const createGeminiKey = asyncHandler(async (req, res) => {
  const { ai_api_key, name = "Gemini API Key" } = req.body;

  if (!ai_api_key) {
    throw new ApiError(400, "ai_api_key is required");
  }

  const encryptedKey = encrypt(ai_api_key);
  const newKey = await AiAPI.create({
    ai_api_key: encryptedKey,
    name,
    isActive: true,
  });

  return new ApiResponse(201, true, "Gemini API key created", {
    _id: newKey._id,
    name: newKey.name,
    ai_api_key,
  }).send(res);
});

// UPDATE an existing Gemini API key
export const updateGeminiKey = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ai_api_key, name, isActive } = req.body;

  const updateData = {};
  if (ai_api_key) {
    updateData.ai_api_key = encrypt(ai_api_key);
  }
  if (name !== undefined) updateData.name = name;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updatedKey = await AiAPI.findByIdAndUpdate(id, updateData, { new: true });

  if (!updatedKey) {
    throw new ApiError(404, "Gemini API key not found");
  }

  return new ApiResponse(200, true, "Gemini API key updated", {
    _id: updatedKey._id,
    name: updatedKey.name,
    isActive: updatedKey.isActive,
    ai_api_key: ai_api_key || decrypt(updatedKey.ai_api_key),
  }).send(res);
});

// DELETE a Gemini API key
export const deleteGeminiKey = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await AiAPI.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Gemini API key not found");
  }

  return new ApiResponse(200, true, "Gemini API key deleted").send(res);
});

import { AiAPI } from "../models/aiApiKey.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/api.error.js";
import { decrypt, encrypt } from "../utils/encrypt.js";

// GET all Gemini API keys (decrypted)
export const getAllGeminiKeys = asyncHandler(async (req, res) => {
  const records = await AiAPI.find();

  const decryptedKeys = records.map((doc) => ({
    _id: doc._id,
    ai_api_key: decrypt(doc.ai_api_key),
  }));

  return new ApiResponse(
    200,
    true,
    "Gemini API keys fetched",
    decryptedKeys
  ).send(res);
});

// CREATE a new Gemini API key
export const createGeminiKey = asyncHandler(async (req, res) => {
  const { ai_api_key } = req.body;

  if (!ai_api_key) {
    throw new ApiError(400, "ai_api_key is required");
  }

  const encryptedKey = encrypt(ai_api_key);
  const newKey = await AiAPI.create({ ai_api_key: encryptedKey });

  return new ApiResponse(201, true, "Gemini API key created", {
    _id: newKey._id,
    ai_api_key,
  }).send(res);
});

// UPDATE an existing Gemini API key
export const updateGeminiKey = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ai_api_key } = req.body;

  if (!ai_api_key) {
    throw new ApiError(400, "ai_api_key is required");
  }

  const encryptedKey = encrypt(ai_api_key);

  const updatedKey = await AiAPI.findByIdAndUpdate(
    id,
    { ai_api_key: encryptedKey },
    { new: true }
  );

  if (!updatedKey) {
    throw new ApiError(404, "Gemini API key not found");
  }

  return new ApiResponse(200, true, "Gemini API key updated", {
    _id: updatedKey._id,
    ai_api_key,
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

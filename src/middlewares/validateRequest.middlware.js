import { asyncHandler } from "../utils/asyncHandler.js";

const validateRequest = (schema) => {
  return asyncHandler(async (req, res, next) => {
    await schema.parseAsync({
      body: req.body,
      cookies: req.cookies,
    });
    return next();
  });
};

export default validateRequest;

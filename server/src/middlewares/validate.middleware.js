import ApiError from "../utils/api.error.js";

/**
 * Higher-order middleware function to validate incoming request schemas using Zod
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 */
export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const errorMessages = result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        const summaryMessage = errorMessages
          .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
          .join("; ");

        throw new ApiError(400, summaryMessage || "Validation failed", errorMessages);
      }

      req[source] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;

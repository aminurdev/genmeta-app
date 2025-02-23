const apiResponse = (res, data) => {
  res.status(data?.statusCode).json({
    success: data.success || true,
    message: data.message,
    data: data.data,
  });
};

export { apiResponse };

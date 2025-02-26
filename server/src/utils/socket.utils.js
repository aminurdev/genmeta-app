export function emitProcessStart(io, totalImages) {
  io?.emit("processStart", {
    total: totalImages,
    message: "Starting image processing",
  });
}

export function emitProcessProgress(io, completed, total, currentResult) {
  io?.emit("processProgress", {
    status: "progress",
    completed,
    total,
    currentResult,
  });
}

export function emitProcessError(io, filename, errorMessage) {
  io?.emit("processError", {
    status: "error",
    file: filename,
    error: errorMessage,
  });
}

export function emitProcessComplete(io, results) {
  io?.emit("processComplete", {
    status: "completed",
    results,
  });
}

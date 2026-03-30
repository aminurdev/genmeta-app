module.exports = {
  apps: [
    {
      name: "express-app",
      script: "./server/src/index.js",
      instances: 2, // 🔥 fully use CPU
      exec_mode: "cluster",
      max_memory_restart: "400M", // 🔥 keep tight
      env: {
        PORT: 5000,
      },
    },

    {
      name: "nextjs-app",
      script: "npm",
      args: "start",
      cwd: "./client",
      instances: 1, // 🔥 IMPORTANT: don't run 2
      exec_mode: "fork",
      max_memory_restart: "1000M",
      env: {
        PORT: 3000,
      },
    },
  ],
};

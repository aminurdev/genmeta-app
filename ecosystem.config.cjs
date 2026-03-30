module.exports = {
  apps: [
    {
      name: "genmeta-app",
      script: "./server/src/index.js", // TypeScript compiled output
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "500M",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};

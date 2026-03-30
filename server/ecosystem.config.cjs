module.exports = {
    apps: [
        {
            name: "genmeta-backend",
            script: "./src/index.js",
            instances: 1,
            exec_mode: "cluster",
            env: {
                NODE_ENV: "production",
            },
            error_file: "./logs/error.log",
            out_file: "./logs/out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            merge_logs: true,
            max_memory_restart: "500M",
            autorestart: true,
            max_restarts: 10,
            min_uptime: "10s",
            listen_timeout: 10000,
            kill_timeout: 5000,
        },
    ],
};

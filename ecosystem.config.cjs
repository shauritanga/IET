module.exports = {
  apps: [
    {
      name: "iet-api",
      cwd: "/var/www/iet/api",
      script: "dist/main.js",
      node_args: "--env-file=/var/www/iet/api/.env",
      env: { NODE_ENV: "production", PORT: "3000" },
      max_memory_restart: "600M",
      time: true,
    },
    {
      name: "iet-members-portal",
      cwd: "/var/www/iet/engineer-portal",
      script: "node_modules/@react-router/serve/bin.js",
      args: "./build/server/index.js",
      node_args: "--env-file=/var/www/iet/engineer-portal/.env",
      env: { NODE_ENV: "production", PORT: "4000" },
      max_memory_restart: "500M",
      time: true,
    },
    {
      name: "iet-admin-portal",
      cwd: "/var/www/iet/admin-portal",
      script: "node_modules/@react-router/serve/bin.js",
      args: "./build/server/index.js",
      node_args: "--env-file=/var/www/iet/admin-portal/.env",
      env: { NODE_ENV: "production", PORT: "4100" },
      max_memory_restart: "500M",
      time: true,
    },
  ],
};

// PM2 process manager config for the IET production droplet.
// Deployed at: /var/www/iet/ecosystem.config.cjs  (run as the `iet` user)
//
// Runtime env is loaded per-app via Node 20's --env-file (node_args) so that
// secrets live only in each app's .env on the server and are never committed:
//   - api            -> /var/www/iet/api/.env            (DB, JWT, payments, SMTP, etc.)
//   - engineer-portal -> /var/www/iet/engineer-portal/.env (needs SESSION_SECRET at runtime)
//   - admin-portal    -> /var/www/iet/admin-portal/.env   (VITE_* are build-time only)
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

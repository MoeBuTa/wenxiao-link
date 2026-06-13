module.exports = {
  apps: [
    {
      name: "wenxiao-link",
      cwd: ".",
      script: "node_modules/next/dist/bin/next",
      // Frontend on 8890 (non-default port to avoid local collisions).
      args: "start -p 8890 -H 0.0.0.0",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "1G",
      autorestart: true,
    },
  ],
};

module.exports = {
  apps: [
    {
      name: "erp-review",
      script: "node_modules/.bin/next",
      args: "start -p 3001",
      cwd: "/home/work/erp-review/erp-app",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

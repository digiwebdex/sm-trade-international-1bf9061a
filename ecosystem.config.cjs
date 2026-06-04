module.exports = {
  apps: [
    {
      name: 'sm-trade-backend',
      script: '/var/www/smtradeapp/backend/server.js',
      cwd: '/var/www/smtradeapp/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3105,
      },
    },
  ],
};

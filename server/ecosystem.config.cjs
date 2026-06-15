module.exports = {
  apps: [{
    name: 'smtrade-api',
    script: 'index.js',
    cwd: '/var/www/smtradeapp/server',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      DB_HOST: 'localhost',
      DB_USER: 'smtrade_user',
      DB_PASSWORD: 'StrongPass123!',
      DB_NAME: 'smtrade_db',
      PORT: '3105'
    }
  }]
}

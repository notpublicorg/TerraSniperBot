module.exports = {
  apps: [
    {
      name: 'api',
      script: './dist/api.js',
      autorestart: true,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      instance_var: 'INSTANCE_ID',
      env_development: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};

module.exports = {
  apps: [
    {
      name: 'tb',
      script: './dist/index.js',
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

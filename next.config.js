// next.config.js
module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  env: {
    DB_HOST: process.env.BUILD_ENV === 'true' ? 'dummy_host' : process.env.DB_HOST,
    DB_USER: process.env.BUILD_ENV === 'true' ? 'dummy_user' : process.env.DB_USER,
    DB_PASSWORD: process.env.BUILD_ENV === 'true' ? 'dummy_password' : process.env.DB_PASSWORD,
    DB_NAME: process.env.BUILD_ENV === 'true' ? 'dummy_database' : process.env.DB_NAME,
  },
};

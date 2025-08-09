module.exports = {
  // Production environment variables
  production: {
    NODE_ENV: 'production',
    PORT: process.env.PORT || 5000,
    CORS_ORIGIN: process.env.FRONTEND_URL || 'https://your-frontend-domain.vercel.app'
  },
  
  // Development environment variables
  development: {
    NODE_ENV: 'development',
    PORT: 5000,
    CORS_ORIGIN: 'http://localhost:3000'
  }
}; 
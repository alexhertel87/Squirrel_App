const { createProxyMiddleware } = require('http-proxy-middleware');

const apiTarget = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
    })
  );
};

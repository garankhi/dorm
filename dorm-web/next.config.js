/**
 * Proxy API requests from Next dev server to backend to avoid CORS in development.
 */
module.exports = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:5147/api/:path*' },
    ];
  },
};

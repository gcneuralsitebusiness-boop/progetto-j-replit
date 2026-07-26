/**
 * Production stub server for the mobile artifact.
 *
 * The Expo app is a native mobile app served via the Expo dev server during
 * development. It has no static export for web production, so this stub
 * satisfies the deployment healthcheck without blocking the deployment of
 * the main web app and API.
 *
 * Returns 200 for all requests so the deployment runtime can mark the
 * service healthy and complete the publish flow.
 */
const http = require('http');

const port = parseInt(process.env.PORT || '18115', 10);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('Progetto J Mobile – development only');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Mobile stub server listening on port ${port}`);
});

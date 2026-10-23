import type { IncomingMessage } from 'node:http';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

function rewriteAdminIndex(req: IncomingMessage) {
  if (!req.url) return;
  const queryAt = req.url.indexOf('?');
  const path = queryAt === -1 ? req.url : req.url.slice(0, queryAt);
  const search = queryAt === -1 ? '' : req.url.slice(queryAt);
  const folder = ['/admin', '/guide'].find((name) => path.endsWith(name) || path.endsWith(`${name}/`));
  if (folder) {
    const directory = path.endsWith('/') ? path : `${path}/`;
    req.url = `${directory}index.html${search}`;
  }
}

function adminDirectoryIndex(): Plugin {
  const rewrite = (req: IncomingMessage, _res: unknown, next: () => void) => {
    rewriteAdminIndex(req);
    next();
  };
  return {
    name: 'admin-directory-index',
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss(), adminDirectoryIndex()],
});

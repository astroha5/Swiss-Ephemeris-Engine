import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  
  return {
    // This changes the output dir from dist to build
    build: {
      outDir: "build",
      chunkSizeWarningLimit: 2000,
    },
    plugins: [tsconfigPaths(), react(), tagger()],
    server: {
      port: 4028,
      host: "0.0.0.0",
      strictPort: true,
      // Only use proxy in development mode
      ...(isDevelopment && {
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
            // Add logging for debugging
            configure: (proxy, options) => {
              proxy.on('error', (err, req, res) => {
                console.log('🚨 Proxy error:', err);
              });
              proxy.on('proxyReq', (proxyReq, req, res) => {
                console.log('🔄 Proxying request:', req.method, req.url);
              });
            }
          }
        }
      })
    },
    // Environment-specific configurations
    define: {
      __DEV__: isDevelopment,
    }
  };
});

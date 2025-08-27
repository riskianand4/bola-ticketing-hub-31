import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import mkcert from "vite-plugin-mkcert";
import path from "path";

export default defineConfig({
  server: {
    host: true,     
    port: 8080,
    https: {},       
    cors: true,
  },
  plugins: [react(), mkcert()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

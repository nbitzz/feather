import { defineConfig } from "vite";
import { resolve } from "node:path"
export default defineConfig({
    build: {
        outDir: "../dist",
        rollupOptions: {
            input: {
                index: resolve(__dirname, "index.html")
            }
        }
    }
})
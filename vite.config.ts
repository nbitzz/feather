import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import webExtension from "vite-plugin-web-extension";

const browser = process.env.TARGET || "firefox"

export default defineConfig({
    plugins: [
        webExtension({
            browser
        }),
        viteStaticCopy({
          targets: [
            {
              src: "icons",
              dest: "."
            }
          ]
        })
    ],
    esbuild: {
      supported: {
        'top-level-await': true
      },
    },
    define: {
      __BROWSER__: JSON.stringify(browser)
    }
})
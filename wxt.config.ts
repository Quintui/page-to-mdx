import tailwindcss from "@tailwindcss/vite";
import { defineConfig, WxtViteConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Page to MDX",
    description: "Convert web pages to clean MDX format optimized for LLMs",
    permissions: ["tabs", "activeTab"],
    host_permissions: ["<all_urls>"],
  },
  vite: () => {
    return {
      plugins: [tailwindcss()],
    } as WxtViteConfig;
  },
});

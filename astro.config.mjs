import { execSync } from 'node:child_process';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return process.env.COMMIT_REF?.slice(0, 7) || 'unknown';
  }
}

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
    define: {
      __COMMIT_SHA__: JSON.stringify(gitCommit()),
    },
  },
});

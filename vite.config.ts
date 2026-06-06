import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/redbook-policy-topic-assistant/',
  plugins: [react()]
});

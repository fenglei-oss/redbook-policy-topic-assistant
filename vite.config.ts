import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  base: '/redbook-policy-topic-assistant/',
  plugins: [react(), cloudflare()],
  server: {
    proxy: {
      '/news-proxy/xinhua': {
        target: 'https://www.news.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news-proxy\/xinhua/, '')
      },
      '/news-proxy/people-rss': {
        target: 'http://www.people.com.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news-proxy\/people-rss/, '')
      },
      '/news-proxy/people': {
        target: 'http://politics.people.com.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news-proxy\/people/, '')
      },
      '/news-proxy/cctv': {
        target: 'https://news.cctv.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news-proxy\/cctv/, '')
      },
      '/news-proxy/qstheory': {
        target: 'https://www.qstheory.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news-proxy\/qstheory/, '')
      },
      '/news-proxy/gmw': {
        target: 'https://news.gmw.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news-proxy\/gmw/, '')
      },
      '/news-proxy/xuexi': {
        target: 'https://www.xuexi.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news-proxy\/xuexi/, '')
      },
      '/news-proxy/12371': {
        target: 'https://www.12371.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news-proxy\/12371/, '')
      }
    }
  }
});
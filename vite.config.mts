import { gitHubSpaConfig } from "@quick-vite/gh-pages-spa/config";
import solid from 'vite-plugin-solid'
import preload from "vite-plugin-preload"
import UnpluginInjectPreload from 'unplugin-inject-preload/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

import packageJson from './package.json' with { type: 'json' }


export default gitHubSpaConfig(packageJson, {
  plugins: [
    solid(),
    basicSsl(),
    preload({
      mode: 'prefetch',
    }),
    UnpluginInjectPreload({
      files: [
        {
          entryMatch: /.*\.svg$/,
          attributes: {
            'rel': 'prefetch',
            'type': 'image/svg+xml',
            'as': 'image',
            crossorigin: true,
          }
        },
        {
          entryMatch: /.*\.png$/,
          attributes: {
            'rel': 'prefetch',
            'type': 'image/png',
            'as': 'image',
            'crossorigin': true,
          }
        },
        {
          entryMatch: /.*\.jpg$/,
          attributes: {
            'rel': 'prefetch',
            'type': 'image/jpeg',
            'as': 'image',
            'crossorigin': true,
          }
        },
        {
          outputMatch: /lazy.[a-z-0-9]*.(js)$/,
          attributes: {
            rel: 'modulepreload',
            type: undefined,
          }
        }
      ],
      injectTo: 'head-prepend'
    })
  ],
  define: {
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(Date.now())
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  },
  build: {
    target: 'esnext',
    sourcemap: 'inline'
  }
})
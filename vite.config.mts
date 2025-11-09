import { gitHubSpaConfig } from "@quick-vite/gh-pages-spa/config";
import solid from 'vite-plugin-solid'
import preload from "vite-plugin-preload"
import UnpluginInjectPreload from 'unplugin-inject-preload/vite'

import packageJson from './package.json' assert { type: 'json' }


export default gitHubSpaConfig(packageJson, {
    plugins: [
        solid() as any,
        preload({
            mode: 'prefetch',
        }),
        UnpluginInjectPreload({
      files: [
        {
          entryMatch: /.*\.svg$/,
          attributes: {
            'type': 'image/svg+xml',
            'as': 'image',
            'crossorigin': 'anonymous',
          }
        },
        {
          entryMatch: /.*\.png$/,
          attributes: {
            'type': 'image/png',
            'as': 'image',
            'crossorigin': 'anonymous',
          }
        },
        {
          entryMatch: /.*\.jpg$/,
          attributes: {
            'type': 'image/jpeg',
            'as': 'image',
            'crossorigin': 'anonymous',
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
import { gitHubSpaConfig } from "@quick-vite/gh-pages-spa/config";
import solid from 'vite-plugin-solid'
import preload from "vite-plugin-preload"

import packageJson from './package.json' assert { type: 'json' }


export default gitHubSpaConfig(packageJson, {
    plugins: [
        solid() as any,
        preload({
            mode: 'prefetch',
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
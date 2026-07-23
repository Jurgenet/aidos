import { configure } from 'quasar/wrappers'
import { fileURLToPath } from 'node:url'

const SERVER_URL = process.env.VITE_SERVER_URL ?? 'http://localhost:3000'

export default configure(function (/* ctx */) {
  return {
    boot: ['pinia', 'quasar'],

    css: ['app.scss'],

    extras: ['material-icons'],

    build: {
      target: { browser: ['es2022'] },

      env: {
        API_URL: SERVER_URL,
      },

      vueRouterMode: 'history',

      extendViteConf(viteConf) {
        viteConf.resolve = viteConf.resolve || {}
        viteConf.resolve.alias = {
          ...viteConf.resolve.alias,
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        }
      },

      vitePlugins: [],
    },

    devServer: {
      open: false,
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
      proxy: {
        '/api': {
          target: SERVER_URL,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
        },
      },
    },

    framework: {
      config: {
        lang: 'ru',
        iconSet: 'material-icons',
      },
      plugins: ['Notify', 'LocalStorage'],
    },

    electron: {
      bundler: 'packager',
      packager: {
        // options for @electron/packager
      },
      builder: {
        appId: 'com.aid.client',
        productName: 'AID',
        copyright: 'Copyright © 2026',
        directories: {
          buildResources: 'build',
          output: 'dist-electron',
        },
        win: {
          target: [
            {
              target: 'nsis',
              arch: ['x64'],
            },
          ],
          artifactName: '${productName}-${version}-setup-${arch}.${ext}',
        },
        nsis: {
          artifactName: '${productName}-${version}-setup-${arch}.${ext}',
          shortcutName: '${productName}',
          uninstallDisplayName: '${productName}',
          createDesktopShortcut: 'always',
        },
        files: [
          '!**/*.map',
          '!**/*.d.ts',
          '!**/*.d.ts.map',
          '!**/{.git,.vscode,.idea,test,tests,coverage,docs}/**',
          '!**/{.vscode,.idea,test,tests,coverage}/**',
          '!**/.vscode/*',
        ],
      },
    },

    ssr: {
      pwa: false,
    },

    pwa: {
      workboxMode: 'GenerateSW',
    },
  }
})

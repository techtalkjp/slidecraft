import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import tsconfigPaths from 'vite-tsconfig-paths'

// COOP/COEP ヘッダーを追加するプラグイン（SQLocal 用）
// /test/durably ルートと関連 worker に適用して、OAuth や外部リソースへの影響を回避
function coopCoepPlugin(): Plugin {
  return {
    name: 'coop-coep',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        // /test/durably ルートと SQLocal/sqlite-wasm の worker ファイルにヘッダーを適用
        const needsCoopCoep =
          url.startsWith('/test/durably') ||
          url.includes('sqlocal') ||
          url.includes('sqlite')
        if (needsCoopCoep) {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        }
        next()
      })
    },
  }
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    coopCoepPlugin(),
    devtoolsJson(),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  // VERCEL_ENV をクライアントに公開（GA制御用）
  define: {
    'import.meta.env.VERCEL_ENV': JSON.stringify(process.env.VERCEL_ENV),
  },
  build: {
    rollupOptions: isSsrBuild ? { input: './server/app.ts' } : undefined,
  },
  // SQLocal の Worker ファイルを最適化から除外
  optimizeDeps: {
    exclude: ['sqlocal'],
  },
  // SQLocal Worker 用の設定
  worker: {
    format: 'es',
  },
}))

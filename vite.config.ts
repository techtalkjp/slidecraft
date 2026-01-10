import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * COOP/COEP ヘッダーを追加するプラグイン（開発サーバー用）
 *
 * SQLocal (OPFS SQLite) と SharedArrayBuffer を使用するために必要。
 * Durably ワークフローエンジンが OPFS を使用する。
 *
 * 対象:
 * - /projects: プロジェクト一覧ページ
 * - /projects/{id}/edit: プロジェクト編集ページ
 * - sqlocal, sqlite を含むパス: Worker ファイル
 *
 * 注意: COOP/COEP は OAuth ポップアップなどに影響するため、
 * 全ページではなく必要なルートのみに適用すること。
 *
 * 本番環境では vercel.json でヘッダーを設定する。
 */
const PROJECTS_PAGE_PATTERN = /^\/projects($|\/)/

function coopCoepPlugin(): Plugin {
  return {
    name: 'coop-coep',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        const needsCoopCoep =
          PROJECTS_PAGE_PATTERN.test(url) ||
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

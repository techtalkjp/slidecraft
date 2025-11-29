import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [devtoolsJson(), tailwindcss(), reactRouter(), tsconfigPaths()],
  // VERCEL_ENV をクライアントに公開（GA制御用）
  define: {
    'import.meta.env.VERCEL_ENV': JSON.stringify(process.env.VERCEL_ENV),
  },
  ssr: {
    external: ['@prisma/client/runtime/client'],
  },
  build: {
    rollupOptions: isSsrBuild ? { input: './server/app.ts' } : undefined,
  },
}))

import { ArrowRight, FileText, Sparkles, Zap } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import type { Route } from './+types/_index'

export function meta(): Route.MetaDescriptors {
  return [
    { title: 'SlideCraft - AIでスライドを再生成' },
    {
      name: 'description',
      content: 'PDFスライドをアップロードしてAIで編集・再生成',
    },
  ]
}

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white px-4 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-block rounded-full bg-blue-100 px-4 py-2">
            <span className="text-sm font-semibold text-blue-700">
              AI Powered Slide Editor
            </span>
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            AIでスライドを
            <br />
            より魅力的に
          </h1>
          <p className="mb-8 text-xl text-slate-600">
            PDFスライドをアップロードして、AIの力で
            <br />
            デザインを改善・再生成できます
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="text-lg">
              <Link to="/projects/new">
                <FileText className="mr-2 h-5 w-5" />
                今すぐ始める
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg">
              <Link to="/projects">プロジェクト一覧</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            ※アプリは無料ですが、AI修正にはGoogle Gemini APIの利用料（1スライド修正あたり約20円）が別途かかります
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
            主な機能
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>簡単アップロード</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  PDFファイルをドラッグ&ドロップするだけで、すぐに編集を開始できます。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>AI生成</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  プロンプトを入力するだけで、AIが複数のデザイン案を生成します。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>高速処理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  ブラウザ内で完結するため、高速かつセキュアに処理できます。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold">さっそく始めましょう</h2>
          <p className="mb-8 text-lg text-slate-300">
            PDFをアップロードして、AIの力でスライドを改善しませんか？
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg">
            <Link to="/projects/new">
              <FileText className="mr-2 h-5 w-5" />
              無料で始める
            </Link>
          </Button>
          <p className="mt-4 text-sm text-slate-400">
            ※AI修正にはGoogle Gemini APIの利用料（1スライド修正あたり約20円）が別途かかります
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-slate-600">
          <p>
            © {new Date().getFullYear()}{' '}
            <a
              href="https://www.techtalk.jp"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 underline"
            >
              TechTalk Inc.
            </a>{' '}
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

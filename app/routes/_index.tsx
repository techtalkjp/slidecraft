import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Coins,
  FileText,
  Layout,
  MousePointerClick,
  Shield,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import type { Route } from './+types/_index'

export function meta(): Route.MetaDescriptors {
  return [
    {
      title:
        'SlideCraft - AIスライドをピンポイント修正 | 3枚だけ直したい時の解決策',
    },
    {
      name: 'description',
      content:
        'Nano Banana Pro、Notebook LM生成スライド、3枚だけ直したいのに全体が変わる問題を解決。気になるスライドだけピンポイント修正、他は守る。1分で完了、1スライド約20円。',
    },
  ]
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
    >
      <title>GitHub</title>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function SlideMockup({ type = 'before' }: { type?: 'before' | 'after' }) {
  return (
    <div className="group relative flex aspect-video flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="absolute top-2 right-2">
        {type === 'before' ? (
          <span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
            Original
          </span>
        ) : (
          <span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
            Fixed
          </span>
        )}
      </div>

      {/* Mock Content */}
      <div
        className={`flex h-full flex-col ${type === 'before' ? 'bg-slate-800' : 'bg-white'} rounded-sm p-4 transition-colors`}
      >
        <div
          className={`mb-4 h-4 w-3/4 rounded ${type === 'before' ? 'bg-slate-600' : 'bg-slate-800'}`}
        />
        <div className="mb-2 flex gap-2">
          <div
            className={`h-2 w-1/2 rounded ${type === 'before' ? 'bg-slate-600' : 'bg-slate-200'}`}
          />
          <div
            className={`h-2 w-1/2 rounded ${type === 'before' ? 'bg-slate-600' : 'bg-slate-200'}`}
          />
        </div>
        <div
          className={`mt-auto h-16 rounded opacity-50 ${type === 'before' ? 'bg-slate-600' : 'bg-blue-50'}`}
        />
      </div>

      {type === 'before' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
          <span className="rounded bg-white px-3 py-1 text-xs text-slate-700 shadow">
            背景色が濃すぎる...
          </span>
        </div>
      )}
    </div>
  )
}

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-700 text-white">
                <Layout className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800">
                SlideCraft
              </span>
            </div>
            <div className="hidden items-center gap-6 md:flex">
              <a
                href="#features"
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
              >
                機能
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
              >
                料金
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
              >
                よくある質問
              </a>
              <a
                href="https://github.com/coji/slidecraft"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition-colors hover:text-slate-600"
                aria-label="GitHub"
              >
                <GitHubIcon className="h-5 w-5" />
              </a>
              <Button asChild size="sm">
                <Link to="/projects/new">無料で始める</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-6">
              <Badge className="bg-blue-50 text-blue-600">
                Professional Beta
              </Badge>
              <h1 className="text-4xl leading-[1.2] font-bold tracking-tight text-slate-900 lg:text-5xl">
                AI生成スライド、
                <br />
                <span className="text-slate-500">3枚だけ直したい</span>
                のに
                <br />
                全体が変わってしまう
                <br />
                問題を解決。
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-slate-500">
                気になるスライドだけピンポイント修正。他は守る。1分で完了。
                <br />
                Nano Banana ProやNotebook LMユーザーのための、
                <br />
                質実剛健な補正ツール。
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild className="group">
                  <Link to="/projects/new">
                    今すぐ無料で始める
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                ※アプリ利用料無料 / API利用料のみ（約20円/スライド）
              </p>
            </div>

            {/* Hero Visual */}
            <div className="relative lg:col-span-6">
              <div className="relative z-10 rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-xl">
                {/* Browser Toolbar Mock */}
                <div className="mb-4 flex h-8 items-center gap-2 border-b border-slate-200 px-4">
                  <div className="h-3 w-3 rounded-full bg-slate-200" />
                  <div className="h-3 w-3 rounded-full bg-slate-200" />
                  <div className="flex-1 text-center font-mono text-[10px] text-slate-400">
                    project_alpha_final.pdf
                  </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-2 gap-4 p-4">
                  {/* Left: Problem Slide */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>Original (Slide 5)</span>
                    </div>
                    <SlideMockup type="before" />
                    <div className="rounded border border-slate-200 bg-white p-3 text-xs text-slate-500">
                      <span className="mr-2 font-bold text-amber-500">
                        課題:
                      </span>
                      背景が濃すぎて印刷時に文字が潰れてしまう...
                    </div>
                  </div>

                  {/* Arrow Center */}
                  <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 shadow-lg">
                    <ArrowRight className="h-5 w-5 text-blue-500" />
                  </div>

                  {/* Right: Solution Slide */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>Generated Candidate</span>
                    </div>
                    <SlideMockup type="after" />
                    <div className="rounded border border-blue-100 bg-blue-50 p-3 text-xs text-blue-600">
                      <span className="mr-2 font-bold">解決:</span>
                      「背景を白ベースに、文字色を濃いグレーに」
                    </div>
                  </div>
                </div>
              </div>

              {/* Decoration Background */}
              <div className="absolute -top-10 -right-10 -z-10 h-64 w-64 rounded-full bg-slate-100 opacity-50 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 -z-10 h-64 w-64 rounded-full bg-blue-50 opacity-50 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-2xl leading-tight font-bold text-slate-800 md:text-3xl">
              Nano Banana ProやNotebook LMで生成した資料、
              <br />
              こんな経験ありませんか？
            </h2>
            <p className="text-lg leading-relaxed text-slate-500">
              必要なのは3枚の修正だけなのに、なぜ30枚全部を扱わなければならないのか。
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="group relative overflow-hidden border-slate-200 p-8 transition-all hover:border-slate-300 hover:shadow-md">
              <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-red-50 opacity-50 transition-opacity group-hover:opacity-70" />
              <div className="relative">
                <div className="mb-6 inline-flex items-center justify-center">
                  <AlertTriangle
                    className="h-8 w-8 text-red-500"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  全体が変わるリスク
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  5枚目だけ直したいのに、再生成すると完璧だった他の25枚のデザインまで変わってしまう不確実性。
                </p>
              </div>
            </Card>
            <Card className="group relative overflow-hidden border-slate-200 p-8 transition-all hover:border-slate-300 hover:shadow-md">
              <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-amber-50 opacity-50 transition-opacity group-hover:opacity-70" />
              <div className="relative">
                <div className="mb-6 inline-flex items-center justify-center">
                  <Clock className="h-8 w-8 text-amber-600" strokeWidth={1.5} />
                </div>
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  手作業修正の限界
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  PowerPointでの微調整は1枚10分かかる。AIが作ったデザインの統一感を保つのは困難で、本来の業務時間を圧迫する。
                </p>
              </div>
            </Card>
            <Card className="group relative overflow-hidden border-slate-200 p-8 transition-all hover:border-slate-300 hover:shadow-md">
              <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-orange-50 opacity-50 transition-opacity group-hover:opacity-70" />
              <div className="relative">
                <div className="mb-6 inline-flex items-center justify-center">
                  <Coins
                    className="h-8 w-8 text-orange-500"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  無駄なコスト
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  微修正のために全ページ分の生成コストがかかる。「タイトルサイズ確認」だけで数百円が飛んでいく非合理性。
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution/Value Section */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="mb-8 text-3xl leading-tight font-bold text-slate-900">
                SlideCraftなら、
                <br />
                気になるスライドだけを
                <br />
                修正できる。
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-slate-500">
                コンサルタントの時間価値を最大化するために設計されました。
                余計な機能は削ぎ落とし、必要な修正を最短距離で実現します。
              </p>
              <ul className="space-y-6">
                {[
                  {
                    title: '時間効率性',
                    desc: '1スライド修正が1分で完了。月5時間の削減。',
                    icon: Clock,
                  },
                  {
                    title: '品質維持',
                    desc: '元のデザインの統一感を保ちながら微調整。',
                    icon: Sparkles,
                  },
                  {
                    title: 'セキュリティ',
                    desc: 'ブラウザ完結処理。PDFは外部に送信されません。',
                    icon: Shield,
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
              {/* Feature Visuals - Time */}
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-6">
                <div className="mb-2 text-4xl font-bold text-slate-800">
                  90%
                </div>
                <div className="mb-4 text-sm font-bold tracking-wide text-slate-500 uppercase">
                  Time Saved
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">PPT手作業</span>
                    <div className="h-2 w-32 overflow-hidden rounded bg-slate-200">
                      <div className="h-full w-full bg-slate-300" />
                    </div>
                    <span className="text-slate-500">10 min</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-600">SlideCraft</span>
                    <div className="h-2 w-32 overflow-hidden rounded bg-slate-200">
                      <div className="h-full w-[10%] bg-blue-500" />
                    </div>
                    <span className="font-bold text-blue-600">1 min</span>
                  </div>
                </div>
              </div>

              {/* Feature Visuals - Cost */}
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-6">
                <div className="mb-2 text-4xl font-bold text-slate-800">
                  1/10
                </div>
                <div className="mb-4 text-sm font-bold tracking-wide text-slate-500 uppercase">
                  Cost Efficiency
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  全体再生成（30枚）にかかるコストと比較して、必要な1枚だけの修正ならコストは約10分の1以下。
                </p>
              </div>

              {/* Feature Visuals - Security */}
              <div className="flex flex-col items-center gap-6 rounded-lg border border-slate-100 bg-slate-50 p-6 sm:col-span-2 sm:flex-row">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-emerald-500 shadow-sm">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="mb-2 font-bold text-slate-800">
                    Client-Side Processing
                  </h4>
                  <p className="text-sm text-slate-600">
                    PDFファイルはブラウザのメモリ内でのみ処理されます。
                    機密性の高いクライアント資料も、外部サーバーに保存されることなく安全に編集可能です。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-slate-900 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-2xl leading-tight font-bold md:text-3xl">
              3ステップ、1分で完了
            </h2>
            <p className="text-lg leading-relaxed text-slate-400">
              複雑な操作は一切ありません。直感的なインターフェースで完結します。
            </p>
          </div>

          <div className="relative grid gap-12 md:grid-cols-3">
            {/* Connector Lines (Desktop) */}
            <div className="absolute top-12 left-1/6 -z-10 hidden h-0.5 w-2/3 bg-slate-700 md:block" />

            {[
              {
                step: '01',
                title: 'PDFアップロード',
                text: '生成済みPDFをドラッグ&ドロップ。自動でスライド一覧に変換。',
                icon: FileText,
              },
              {
                step: '02',
                title: 'スライド選択と指示',
                text: '修正したいスライドをクリック。「背景を明るく」と入力。',
                icon: MousePointerClick,
              },
              {
                step: '03',
                title: '候補生成と選択',
                text: '生成コストを確認して実行。比較して最適なものを採用。',
                icon: Check,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="hover:bg-slate-750 relative rounded-lg border border-slate-700 bg-slate-800 p-8 transition-colors"
              >
                <div className="absolute top-4 right-4 text-5xl font-bold text-slate-700 opacity-50">
                  {item.step}
                </div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700 text-blue-400">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-lg font-bold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-2xl leading-tight font-bold text-slate-800 md:text-3xl">
              こんな時に使われています
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: '提案直前の最終調整',
                text: '「全体は良いが、P.5の背景だけ濃すぎる」。全体再生成のリスクを冒さず、そこだけをピンポイント修正。',
              },
              {
                title: '誤字・数値の緊急修正',
                text: 'プレゼン1時間前に発見したミス。PowerPointでレイアウトを崩さずに直す時間がない時に、1分で解決。',
              },
              {
                title: 'デザインパターンの探索',
                text: '重要なスライドだけ4パターン生成して比較。全ページ生成する無駄を省き、低コストで最適解へ。',
              },
            ].map((useCase) => (
              <div key={useCase.title} className="flex items-start gap-4">
                <div className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                <div>
                  <h4 className="mb-2 font-bold text-slate-800">
                    {useCase.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {useCase.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="border-y border-slate-200 bg-slate-50 py-24"
      >
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-block">
            <Badge className="bg-emerald-50 text-emerald-600">
              透明な料金体系
            </Badge>
          </div>
          <h2 className="mb-6 text-3xl font-bold text-slate-900">
            アプリは無料。
            <br />
            使った分だけの明朗会計。
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-slate-500">
            SlideCraft自体の利用料、月額固定費は一切かかりません。
            <br />
            発生するのは、ご自身のGoogle Gemini API利用料（実費）のみです。
          </p>

          <div className="mx-auto max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-8">
              <div className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
                Estimated Cost
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-slate-800">~20</span>
                <span className="text-xl font-bold text-slate-500">円</span>
                <span className="ml-2 text-sm text-slate-400">
                  / 1スライド修正
                </span>
              </div>
            </div>
            <div className="bg-slate-50 p-6">
              <ul className="mx-auto max-w-xs space-y-3 text-left text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>初期費用・月額費用 0円</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>修正前に見積もりコストを表示</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Google Cloudから直接請求</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-xs text-slate-400">
            ※ Gemini 1.5 Flash
            モデルを使用した場合の概算です。為替レートやGoogleの価格改定により変動します。
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-900">
            よくある質問
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'APIキーの取得は難しくないですか？',
                a: 'Google AI Studioで5分程度で取得可能です。クレジットカードの登録が必要ですが、無料枠内で収まる場合も多いです。手順はチュートリアルで案内します。',
              },
              {
                q: '本当にセキュリティは安全ですか？',
                a: 'はい。PDFの解析・画像化は全てお客様のブラウザ内で行われます。ファイルそのものが外部サーバーに送信されることはありません。',
              },
              {
                q: '元のPDFは上書きされますか？',
                a: 'いいえ。元のPDFは変更されず、修正が反映された新しいPDFとしてエクスポートされます。いつでもやり直しが可能です。',
              },
              {
                q: '対応ブラウザは？',
                a: 'Chrome、Safari、Edgeなどのモダンブラウザ（PC推奨）で動作します。',
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-slate-100 pb-6">
                <h3 className="mb-2 flex items-start gap-3 font-bold text-slate-800">
                  <span className="text-blue-500">Q.</span> {item.q}
                </h3>
                <p className="pl-7 text-sm leading-relaxed text-slate-600">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-24 text-center text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold lg:text-4xl">
            今すぐ無料で始める
          </h2>
          <p className="mb-10 text-lg text-slate-400">
            APIキーの設定は5分。最初のスライド修正まで1分。
            <br />
            合計6分で、新しいワークフローを体験できます。
          </p>
          <Button
            asChild
            className="bg-blue-500 px-8 py-6 text-lg shadow-lg shadow-blue-900/50 hover:bg-blue-600"
          >
            <Link to="/projects/new">無料で試してみる</Link>
          </Button>
          <p className="mt-6 text-sm text-slate-500">
            クレジットカード登録不要（SlideCraft側） / 登録なしで即試用可能
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-700 text-white">
                <Layout className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-slate-800">SlideCraft</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-500">
              <Link to="/terms" className="hover:text-slate-800">
                利用規約
              </Link>
              <Link to="/privacy" className="hover:text-slate-800">
                プライバシーポリシー
              </Link>
              <a
                href="https://github.com/techtalkjp/slidecraft"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-slate-800"
              >
                <GitHubIcon className="h-4 w-4" />
                <span>GitHub</span>
              </a>
            </div>
            <div className="text-xs text-slate-400">
              © 2025{' '}
              <a
                href="https://www.techtalk.jp"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-600"
              >
                TechTalk Inc.
              </a>{' '}
              All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

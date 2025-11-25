import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Lock,
  MousePointerClick,
  Shield,
  Sparkles,
  Upload,
} from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { GitHubIcon } from '~/components/icons/github-icon'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from '~/components/ui/dialog'
import { loadProjects } from '~/lib/projects-repository.client'
import type { Route } from './+types/_index'

export function meta(): Route.MetaDescriptors {
  const title =
    'SlideCraft - AIスライドをピンポイント修正 | 3枚だけ直したい時の解決策'
  const description =
    'Nano Banana Pro、Notebook LM生成スライド、3枚だけ直したいのに全体が変わる問題を解決。気になるスライドだけピンポイント修正。1分で完了、1スライド約20円。'
  const url = 'https://www.slidecraft.work'

  return [
    { title },
    { name: 'description', content: description },

    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: `${url}/ogp-image.jpg` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    {
      property: 'og:image:alt',
      content: 'SlideCraft - 3枚だけ直したいのに全体が変わる問題を解決',
    },
    { property: 'og:site_name', content: 'SlideCraft' },
    { property: 'og:locale', content: 'ja_JP' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@techtalkjp' },
    { name: 'twitter:creator', content: '@techtalkjp' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: `${url}/ogp-image.jpg` },
    {
      name: 'twitter:image:alt',
      content: 'SlideCraft - 3枚だけ直したいのに全体が変わる問題を解決',
    },
  ]
}

export async function clientLoader() {
  const projects = await loadProjects()
  return { hasProjects: projects.length > 0 }
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { hasProjects } = loaderData
  const ctaLink = hasProjects ? '/projects' : '/projects/new'
  const ctaText = hasProjects ? 'プロジェクトを見る' : '無料で始める'
  const ctaTextLong = hasProjects ? 'プロジェクトを見る' : '今すぐ無料で始める'
  /**
   * LP専用のスムーススクロール設定
   * External system: DOM (html要素のスタイル変更)
   *
   * ページ内リンクのみスムーススクロールを適用し、
   * 別ページへの遷移時は即座にスクロールする
   */
  useEffect(() => {
    const htmlElement = document.documentElement
    const originalScrollBehavior = htmlElement.style.scrollBehavior
    const originalScrollPaddingTop = htmlElement.style.scrollPaddingTop

    // スクロールパディングを設定
    htmlElement.style.scrollPaddingTop = '4rem' // ヘッダーの高さ (h-16 = 64px)

    // クリックイベントでページ内リンクの場合のみスムーススクロール
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      if (anchor?.hash && anchor.pathname === window.location.pathname) {
        // ページ内リンクの場合のみスムーススクロール
        htmlElement.style.scrollBehavior = 'smooth'
        // スクロール後に戻す
        setTimeout(() => {
          htmlElement.style.scrollBehavior = originalScrollBehavior
        }, 1000)
      }
    }

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
      htmlElement.style.scrollBehavior = originalScrollBehavior
      htmlElement.style.scrollPaddingTop = originalScrollPaddingTop
    }
  }, [])

  return (
    <div id="top" className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a
              href="#top"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <img src="/logo.svg" alt="SlideCraft" className="h-8 w-8" />
              <span className="text-xl font-bold tracking-tight text-slate-800">
                SlideCraft
              </span>
            </a>
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
                href="https://github.com/techtalkjp/slidecraft"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition-colors hover:text-slate-600"
                aria-label="GitHub"
              >
                <GitHubIcon className="h-5 w-5" />
              </a>
              <Button asChild size="sm">
                <Link to={ctaLink}>{ctaText}</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-5">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-50 text-blue-600">
                  Professional Beta
                </Badge>
                <a
                  href="https://github.com/techtalkjp/slidecraft"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-80"
                >
                  <Badge className="cursor-pointer bg-slate-100 text-slate-700">
                    Open Source
                  </Badge>
                </a>
              </div>
              <h1 className="text-4xl leading-[1.2] font-bold tracking-tight text-slate-900 lg:text-5xl">
                AI生成スライド、
                <br />
                <span className="text-slate-500">3枚だけ直したい</span>
                <br />
                のに全体が変わって
                <br />
                しまう問題を解決。
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-slate-500">
                気になるスライドだけをピンポイント修正。
                <br />
                Nano Banana Pro・Notebook LMユーザー向け
                <br />
                補正ツール。
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild className="group">
                  <Link to={ctaLink}>
                    {ctaTextLong}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                ※アプリ利用料無料 / Google Gemini
                API利用料のみ（約20円/スライド）
              </p>
            </div>

            {/* Hero Visual */}
            <div className="relative lg:col-span-7">
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="group relative z-10 overflow-hidden rounded-md bg-white shadow-lg transition-opacity hover:opacity-90"
                  >
                    <img
                      src="/slidecraft_image.png"
                      alt="SlideCraft アプリケーション画面 - スライド編集インターフェース"
                      className="h-auto w-full"
                      width={1280}
                      height={800}
                    />
                    {/* Click hint */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/10 group-hover:opacity-100">
                      <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-lg">
                        クリックで拡大
                      </div>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw]! p-0 sm:max-w-[90vw]!">
                  <DialogClose asChild>
                    <button type="button" className="cursor-pointer">
                      <img
                        src="/slidecraft_image.png"
                        alt="SlideCraft アプリケーション画面 - スライド編集インターフェース"
                        className="h-auto w-full rounded-lg"
                        width={1280}
                        height={800}
                      />
                    </button>
                  </DialogClose>
                </DialogContent>
              </Dialog>
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
                  全ページガチャ状態
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  3枚だけ直したいのに、再生成すると完璧だった他の27枚まで全部変わる。何度やっても満足いく結果にならない。
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
                  再生成の待ち時間
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  Notebook
                  LMは無料だが、1回の再生成に5〜10分かかる。微調整のたびに待つ時間が積み重なり、本来の業務時間を圧迫する。
                </p>
              </div>
            </Card>
            <Card className="group relative overflow-hidden border-slate-200 p-8 transition-all hover:border-slate-300 hover:shadow-md">
              <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-orange-50 opacity-50 transition-opacity group-hover:opacity-70" />
              <div className="relative">
                <div className="mb-6 inline-flex items-center justify-center">
                  <Lock className="h-8 w-8 text-orange-500" strokeWidth={1.5} />
                </div>
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  編集不可能なPDF
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  生成されたPDFはPowerPointで編集できない。手元で微調整したくてもできず、再生成ガチャを回すしかない。
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

              {/* Feature Visuals - Certainty */}
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-6">
                <div className="mb-2 text-4xl font-bold text-slate-800">
                  100%
                </div>
                <div className="mb-4 text-sm font-bold tracking-wide text-slate-500 uppercase">
                  Certainty
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  再生成ガチャで全ページが変わるリスクなし。修正したいスライドだけが確実に変わる。
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
                icon: Upload,
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
                text: '「全体は良いが、P.5の背景だけ濃すぎる」。全体再生成で他のページまで変わるリスクを冒さず、そこだけをピンポイント修正。',
              },
              {
                title: '誤字・数値の緊急修正',
                text: 'プレゼン1時間前に発見したミス。再生成では5〜10分待つ余裕がない。SlideCraftなら1分で完了。',
              },
              {
                title: 'デザインパターンの探索',
                text: '重要なスライドだけ4パターン生成して比較。全ページ再生成の待ち時間を省き、約80円・5分で最適解へ。',
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
                <span className="text-sm text-slate-500">約</span>
                <span className="text-5xl font-bold text-slate-800">20</span>
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
            ※ Gemini 3 Pro Image (Nano Banana Pro)
            モデルを使用した場合の概算です。
            <br />
            為替レートやGoogleの価格改定により変動する場合があります。
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
            {/* Q1: API Key */}
            <div className="border-b border-slate-100 pb-6">
              <h3 className="mb-2 flex items-start gap-3 font-bold text-slate-800">
                <span className="text-blue-500">Q.</span>{' '}
                APIキーの取得は難しくないですか？
              </h3>
              <p className="pl-7 text-sm leading-relaxed text-slate-600">
                Google AI
                Studioで5分程度で取得可能です。クレジットカードの登録が必要ですが、使った分だけの従量課金です。
                <Link
                  to="/guides/api-key-setup"
                  state={{ from: '/' }}
                  className="ml-1 font-medium text-blue-600 hover:underline"
                >
                  詳しい手順はこちら →
                </Link>
              </p>
            </div>

            {/* Q2: Security */}
            <div className="border-b border-slate-100 pb-6">
              <h3 className="mb-2 flex items-start gap-3 font-bold text-slate-800">
                <span className="text-blue-500">Q.</span>{' '}
                本当にセキュリティは安全ですか？
              </h3>
              <p className="pl-7 text-sm leading-relaxed text-slate-600">
                はい。PDFの解析・画像化は全てお客様のブラウザ内で行われます。ファイルそのものが外部サーバーに送信されることはありません。
                <Link
                  to="/guides/security"
                  state={{ from: '/' }}
                  className="ml-1 font-medium text-blue-600 hover:underline"
                >
                  セキュリティの詳細 →
                </Link>
              </p>
            </div>

            {/* Q3: PDF Overwrite */}
            <div className="border-b border-slate-100 pb-6">
              <h3 className="mb-2 flex items-start gap-3 font-bold text-slate-800">
                <span className="text-blue-500">Q.</span>{' '}
                元のPDFは上書きされますか？
              </h3>
              <p className="pl-7 text-sm leading-relaxed text-slate-600">
                いいえ。元のPDFは変更されず、修正が反映された新しいPDFとしてエクスポートされます。いつでもやり直しが可能です。
              </p>
            </div>

            {/* Q4: Browser Support */}
            <div className="border-b border-slate-100 pb-6">
              <h3 className="mb-2 flex items-start gap-3 font-bold text-slate-800">
                <span className="text-blue-500">Q.</span> 対応ブラウザは？
              </h3>
              <p className="pl-7 text-sm leading-relaxed text-slate-600">
                Chrome、Safari、Edgeなどのモダンブラウザ（PC推奨）で動作します。
              </p>
            </div>
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
            <Link to={ctaLink}>
              {hasProjects ? 'プロジェクトを見る' : '無料で試してみる'}
            </Link>
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
            <a
              href="#top"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <img src="/logo.svg" alt="SlideCraft" className="h-6 w-6" />
              <span className="font-bold text-slate-800">SlideCraft</span>
            </a>
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

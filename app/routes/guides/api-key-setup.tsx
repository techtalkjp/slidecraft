import { ArrowLeft, ExternalLink, Key, Lock } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import type { Route } from './+types/api-key-setup'

export function meta(): Route.MetaDescriptors {
  const title = 'Google AI Studio APIキー取得ガイド | SlideCraft'
  const description =
    'SlideCraftで使用するGoogle Gemini APIキーの取得方法を5分で理解できるステップバイステップガイド。クレジットカード登録、無料枠、セキュリティについて解説。'
  const url = 'https://www.slidecraft.work/guides/api-key-setup'

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: 'https://www.slidecraft.work/ogp.jpg' },
    {
      property: 'og:image:alt',
      content: 'SlideCraft - APIキー取得ガイド',
    },
  ]
}

export default function ApiKeySetupGuide() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ホームに戻る
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                APIキー取得ガイド
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                所要時間: 約5分 / Google AI Studio
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-slate max-w-none">
          {/* Why */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              なぜAPIキーが必要なのか
            </h2>
            <p className="leading-relaxed text-slate-600">
              SlideCraftは、スライド画像の生成にGoogle
              Geminiという最先端のAIモデルを使用しています。このAIはGoogleが提供するクラウドサービスであり、利用するためには認証情報としてAPIキーが必要です。
            </p>
            <p className="leading-relaxed text-slate-600">
              SlideCraft自体は無料ですが、Gemini
              APIの利用料は直接Googleから請求されます。これにより、あなたのデータは第三者のサービスを経由せず、Googleとあなたのブラウザだけでやり取りされるため、セキュリティとプライバシーが保たれます。
            </p>
          </section>

          {/* What you need */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              準備するもの
            </h2>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-blue-500">●</span>
                  <span>Googleアカウント（Gmailアドレス）- 既存のものでOK</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-blue-500">●</span>
                  <span>
                    クレジットカード -
                    無料枠内でも登録必須（不正利用防止のため）
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-blue-500">●</span>
                  <span>約5分の時間</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Steps */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">取得手順</h2>

            <div className="space-y-8">
              {/* Step 1 */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    1
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Google AI Studioにアクセス
                  </h3>
                </div>
                <p className="mb-4 text-slate-600">
                  以下のリンクからGoogle AI
                  Studioを開き、Googleアカウントでログインします。
                </p>
                <Button asChild variant="outline" size="sm">
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google AI Studioを開く
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>

              {/* Step 2 */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    2
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    「Get API key」ボタンをクリック
                  </h3>
                </div>
                <p className="text-slate-600">
                  ページ上部に表示される「Get API key」または「APIキーを取得」
                  ボタンをクリックします。
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    3
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Google Cloud プロジェクトを作成
                  </h3>
                </div>
                <p className="mb-3 text-slate-600">
                  初めて利用する場合、新しいプロジェクトを作成する必要があります。
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>● 「Create API key in new project」を選択（推奨）</li>
                  <li>● プロジェクト名は自動生成されます（変更可能）</li>
                  <li>● 「Create」をクリック</li>
                </ul>
              </div>

              {/* Step 4 */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    4
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    請求先アカウントの設定
                  </h3>
                </div>
                <p className="mb-3 text-slate-600">
                  無料枠を超えた場合の請求先として、クレジットカード情報を登録します。
                </p>
                <div className="rounded-md bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    <strong>重要:</strong>{' '}
                    無料枠内であれば課金されません。月間の無料枠は、Gemini 1.5
                    Flashモデルで約1500回の画像生成に相当します。通常の使用では無料枠で十分です。
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    5
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    APIキーをコピー
                  </h3>
                </div>
                <p className="mb-3 text-slate-600">
                  生成されたAPIキー（`AIza...`で始まる長い文字列）をコピーします。
                </p>
                <div className="rounded-md bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    <Lock className="mr-2 inline h-4 w-4" />
                    このAPIキーは他人に見せないでください。GitHubなどの公開リポジトリにもアップロードしないよう注意してください。
                  </p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    6
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    SlideCraftに設定
                  </h3>
                </div>
                <p className="mb-4 text-slate-600">
                  SlideCraftのプロジェクト画面で、コピーしたAPIキーを入力します。APIキーはブラウザのlocalStorageに安全に保存され、外部サーバーには送信されません。
                </p>
                <Button asChild>
                  <Link to="/projects/new">今すぐ設定する</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              無料枠と料金について
            </h2>
            <p className="mb-4 leading-relaxed text-slate-600">
              Gemini
              APIには無料枠があり、通常の個人利用であれば無料枠内で収まるケースがほとんどです。
            </p>
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h4 className="mb-3 font-bold text-slate-900">
                Gemini 1.5 Flash（SlideCraftで使用）
              </h4>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <strong>無料枠:</strong>{' '}
                  月間1500リクエスト（画像入力含む）まで無料
                </p>
                <p>
                  <strong>無料枠超過後:</strong>{' '}
                  1スライド修正あたり約20円（為替レートにより変動）
                </p>
                <p className="mt-4 text-xs text-slate-500">
                  ※
                  詳細な料金はGoogleの公式ドキュメントをご確認ください。予告なく変更される場合があります。
                </p>
              </div>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              よくある問題
            </h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 font-bold text-slate-900">
                  「APIキーが無効です」と表示される
                </h4>
                <p className="text-sm text-slate-600">
                  APIキーのコピーミスが考えられます。前後にスペースが入っていないか、全文字が正しくコピーされているか確認してください。
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 font-bold text-slate-900">
                  請求先アカウントの設定がうまくいかない
                </h4>
                <p className="text-sm text-slate-600">
                  Google Cloud
                  Consoleから直接設定することもできます。「お支払い」セクションから請求先アカウントを作成してください。
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 font-bold text-slate-900">
                  無料枠の残量を確認したい
                </h4>
                <p className="text-sm text-slate-600">
                  Google Cloud
                  Consoleの「請求」ダッシュボードから、現在の使用状況と残量を確認できます。
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center">
            <h3 className="mb-3 text-xl font-bold text-slate-900">
              APIキーの準備ができたら
            </h3>
            <p className="mb-6 text-slate-600">
              早速SlideCraftでスライドを修正してみましょう。
            </p>
            <Button asChild size="lg">
              <Link to="/projects/new">プロジェクトを開始する</Link>
            </Button>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          <p>
            その他のご質問は
            <Link to="/#faq" className="text-blue-600 hover:underline">
              FAQ
            </Link>
            をご覧ください
          </p>
        </div>
      </footer>
    </div>
  )
}

import { Check, Database, Lock, Shield, Upload } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import type { Route } from './+types/security'
import { GuideHeader } from './_layout'

export function meta(): Route.MetaDescriptors {
  const title = 'セキュリティとプライバシー | SlideCraft'
  const description =
    'SlideCraftのセキュリティ設計を詳しく解説。PDFファイルはブラウザ内で処理され外部サーバーに送信されません。クライアントサイド処理、データの流れ、企業での利用について。'
  const url = 'https://www.slidecraft.work/guides/security'

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    {
      property: 'og:image',
      content: 'https://www.slidecraft.work/ogp-image.jpg',
    },
    {
      property: 'og:image:alt',
      content: 'SlideCraft - セキュリティとプライバシー',
    },
  ]
}

export default function SecurityGuide() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <GuideHeader />
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                セキュリティとプライバシー
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                データの流れと保護の仕組み
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-slate max-w-none">
          {/* Overview */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              SlideCraftの基本設計思想
            </h2>
            <p className="leading-relaxed text-slate-600">
              SlideCraftは、機密性の高いビジネス資料を扱うことを前提に設計されています。そのため、最も重要な原則として「PDFファイルそのものを外部サーバーに送信しない」という設計を採用しています。
            </p>
            <p className="leading-relaxed text-slate-600">
              すべての処理はあなたのブラウザ内で完結し、外部に送信されるのは画像データとテキスト指示のみです。この仕組みにより、企業の重要資料や顧客情報を含むプレゼンテーションでも安心して利用できます。
            </p>
          </section>

          {/* Client-side Processing */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              クライアントサイド処理とは
            </h2>
            <p className="mb-6 leading-relaxed text-slate-600">
              クライアントサイド処理とは、あなたのパソコン上のブラウザ（Chrome、Safari、Edge等）だけで処理が完結し、外部のサーバーにデータを送らない仕組みです。
            </p>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <h3 className="mb-4 font-bold text-slate-900">
                ブラウザ内で行われる処理
              </h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-500" />
                  <span>PDFファイルの解析と各ページへの分解</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-500" />
                  <span>各ページを画像（PNG形式）に変換</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-500" />
                  <span>
                    プロジェクトデータのOPFS（ブラウザのプライベートファイルシステム）への保存
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-500" />
                  <span>修正後のPDFファイルの生成とダウンロード</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Data Flow */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              データの流れ
            </h2>

            <div className="space-y-6">
              {/* Step 1: PDF Upload */}
              <div className="rounded-lg border-2 border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    1. PDFアップロード時
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    <strong className="text-slate-900">
                      ブラウザのメモリ内で処理:
                    </strong>{' '}
                    PDFファイルは選択された瞬間、ブラウザのJavaScriptエンジンによって読み込まれ、各ページが画像に変換されます。
                  </p>
                  <p>
                    <strong className="text-slate-900">OPFSに保存:</strong>{' '}
                    変換された画像データは、ブラウザのOPFS（Origin Private File
                    System）に保存されます。これはあなたのパソコン内のプライベートファイルシステムであり、インターネット経由でアクセスされることはありません。
                  </p>
                  <p className="rounded bg-emerald-50 p-3 text-emerald-800">
                    <Lock className="mr-2 inline h-4 w-4" />
                    この段階で外部サーバーへの通信は一切発生しません。
                  </p>
                </div>
              </div>

              {/* Step 2: Image Generation */}
              <div className="rounded-lg border-2 border-amber-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    2. AI修正実行時（唯一の外部通信）
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    <strong className="text-slate-900">
                      Google Gemini APIへの送信:
                    </strong>{' '}
                    修正したいスライドの画像とあなたの指示テキスト（例:
                    「背景を明るく」）のみがGoogle Gemini（AI）に送信されます。
                  </p>
                  <p>
                    <strong className="text-slate-900">送信される情報:</strong>
                  </p>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>選択したスライド1枚の画像データ（PNG形式）</li>
                    <li>修正指示のテキスト</li>
                    <li>APIキー（認証情報）</li>
                  </ul>
                  <p className="rounded bg-amber-50 p-3 text-amber-800">
                    <strong>注意:</strong>{' '}
                    この画像データはGoogleのサーバーで一時的に処理されます。機密性の極めて高い情報（パスワード、個人情報、未公開の財務データなど）が含まれるスライドの修正は慎重に判断してください。
                  </p>
                </div>
              </div>

              {/* Step 3: Storage */}
              <div className="rounded-lg border-2 border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50">
                    <Database className="h-5 w-5 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    3. データの保存
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    <strong className="text-slate-900">
                      すべてブラウザ内:
                    </strong>{' '}
                    プロジェクト情報、元画像、修正候補画像、メタデータはすべてOPFS（Origin
                    Private File System）に保存されます。
                  </p>
                  <p>
                    <strong className="text-slate-900">削除方法:</strong>{' '}
                    プロジェクトを削除すると、関連するすべてのデータがブラウザから完全に削除されます。ブラウザのストレージクリアでも削除可能です。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* API Key Security */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              APIキーの扱い
            </h2>
            <p className="mb-4 leading-relaxed text-slate-600">
              あなたのGoogle Gemini
              APIキーは、ブラウザのlocalStorageに暗号化されずに保存されます。これはブラウザの標準的なストレージ機能であり、同じブラウザ・同じプロファイルからのみアクセス可能です。
            </p>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
              <h4 className="mb-3 font-bold text-amber-900">
                セキュリティ上の注意点
              </h4>
              <ul className="space-y-2 text-sm text-amber-800">
                <li>
                  ● 共用パソコンで使用する場合、作業後はブラウザを閉じてください
                </li>
                <li>
                  ●
                  ブラウザの開発者ツールやローカルストレージにアクセスできる人は、APIキーを閲覧可能です
                </li>
                <li>
                  ● 不要になったAPIキーは、Google Cloud
                  Consoleから無効化できます
                </li>
              </ul>
            </div>
          </section>

          {/* For Enterprises */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              企業での利用について
            </h2>
            <p className="mb-4 leading-relaxed text-slate-600">
              SlideCraftは、クライアントサイド処理により高いプライバシー保護を実現していますが、企業で利用する際には以下の点を考慮してください。
            </p>

            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 font-bold text-slate-900">
                  検討すべきポイント
                </h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>
                    <strong>Google Gemini APIの利用規約:</strong>{' '}
                    あなたの組織のデータガバナンスポリシーと照らし合わせてください
                  </li>
                  <li>
                    <strong>データの一時的な外部送信:</strong>{' '}
                    修正するスライド画像はGoogleに送信されます
                  </li>
                  <li>
                    <strong>ログと監査:</strong>{' '}
                    SlideCraft自体はログを記録しませんが、Google
                    CloudのAPIログは記録されます
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="mb-2 font-bold text-emerald-900">
                  推奨される利用シーン
                </h4>
                <ul className="space-y-2 text-sm text-emerald-800">
                  <li>● 社外向けプレゼン資料（既に外部公開予定のもの）</li>
                  <li>● 一般的なビジネス資料の微調整</li>
                  <li>● 個人情報や機密情報を含まないスライド</li>
                </ul>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h4 className="mb-2 font-bold text-red-900">
                  避けるべき利用シーン
                </h4>
                <ul className="space-y-2 text-sm text-red-800">
                  <li>● 個人情報（氏名、住所、メールアドレス等）を含むもの</li>
                  <li>● NDA（機密保持契約）で保護されている情報</li>
                  <li>● 医療情報や法的に保護された情報</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Google's Data Handling */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Googleによるデータの取り扱い
            </h2>
            <p className="mb-4 leading-relaxed text-slate-600">
              送信された画像データは、Google Gemini
              APIで処理されます。Googleのデータ取り扱いについては、以下をご確認ください。
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                ●
                送信データは、リクエスト処理のためにGoogleのサーバーで一時的に保持されます
              </li>
              <li>
                ● Google
                Cloudのエンタープライズ向けサービスでは、顧客データを広告やモデル訓練に使用しない旨が保証されています
              </li>
              <li>
                ● 詳細は
                <a
                  href="https://cloud.google.com/terms/cloud-privacy-notice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Cloud Privacy Notice
                </a>
                をご覧ください
              </li>
            </ul>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              よくある質問
            </h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 font-bold text-slate-900">
                  SlideCraft運営側にデータは送られますか？
                </h4>
                <p className="text-sm text-slate-600">
                  いいえ。SlideCraftのサーバーは静的ファイル配信のみを行い、あなたのPDFやプロジェクトデータを受信することはありません。すべてブラウザとGoogle
                  API間で直接やり取りされます。
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 font-bold text-slate-900">
                  オフラインでも使えますか？
                </h4>
                <p className="text-sm text-slate-600">
                  PDF読み込みや候補選択などの操作はオフラインでも可能ですが、AI修正の実行にはインターネット接続が必要です（Google
                  Gemini APIへの通信のため）。
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 font-bold text-slate-900">
                  別のパソコンやスマホからプロジェクトにアクセスできますか？
                </h4>
                <p className="text-sm text-slate-600">
                  できません。プロジェクトデータはそのブラウザのOPFS（Origin
                  Private File
                  System）に保存されているため、別デバイスからはアクセスできません。PDFをエクスポートして他デバイスに移動する必要があります。
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center">
            <h3 className="mb-3 text-xl font-bold text-slate-900">
              セキュリティについて理解できましたか？
            </h3>
            <p className="mb-6 text-slate-600">
              安心してSlideCraftをご利用ください。
            </p>
            <Button asChild size="lg">
              <Link to="/projects/new">今すぐ始める</Link>
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

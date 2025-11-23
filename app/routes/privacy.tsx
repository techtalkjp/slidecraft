import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import type { Route } from './+types/privacy'

export function meta(): Route.MetaDescriptors {
  return [
    { title: 'プライバシーポリシー - SlideCraft' },
    { name: 'description', content: 'SlideCraftのプライバシーポリシー' },
  ]
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button asChild variant="outline" size="sm">
            <Link to="/">← トップページに戻る</Link>
          </Button>
        </div>

        <h1 className="mb-12 text-3xl font-bold text-slate-900">
          プライバシーポリシー
        </h1>

        <div className="space-y-8 leading-relaxed text-slate-700">
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第1条（基本方針）
            </h2>
            <p>
              TechTalk
              Inc.（以下「当社」）は、SlideCraft（以下「本サービス」）の提供にあたり、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第2条（収集する情報）
            </h2>
            <p className="mb-4">本サービスは、以下の情報を取り扱います。</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>APIキー</strong>: ユーザーが設定したGoogle Gemini
                APIキーは、ブラウザのlocalStorageに保存されます。当社がこの情報にアクセスすることはありません。
              </li>
              <li>
                <strong>アップロードファイル</strong>:
                ユーザーがアップロードしたPDFファイルは、ブラウザ内でのみ処理され、当社のサーバーに送信されることはありません。
              </li>
              <li>
                <strong>プロジェクトデータ</strong>:
                スライド情報や生成された画像は、ブラウザのOPFS（Origin Private
                File System）に保存されます。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第3条（データの処理場所）
            </h2>
            <p>
              本サービスは、ブラウザ完結型のアプリケーションです。全てのデータ処理はユーザーのブラウザ内で行われ、当社のサーバーにデータが送信されることはありません。唯一の外部通信は、ユーザーが設定したGoogle
              Gemini APIへのリクエストのみです。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第4条（第三者への提供）
            </h2>
            <p>
              当社は、ユーザーの個人情報を第三者に提供することはありません。ただし、以下の場合を除きます。
            </p>
            <ul className="mt-4 ml-6 list-disc space-y-2">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく場合</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第5条（Google Gemini APIの利用）
            </h2>
            <p>
              本サービスは、スライド修正にGoogle Gemini
              APIを利用します。APIへの通信は、ユーザーが設定したAPIキーを使用して、ユーザーのブラウザから直接行われます。当社はこの通信を仲介せず、通信内容にアクセスすることもありません。Google
              のプライバシーポリシーについては、
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Googleプライバシーポリシー
              </a>
              をご確認ください。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第6条（Cookieの使用）
            </h2>
            <p>
              本サービスは、必要最小限の機能実現のためにlocalStorageを使用します。また、Google
              Analyticsによるアクセス解析のためにCookieを使用しますが、広告目的のCookieは使用しません。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第7条（アクセス解析ツール）
            </h2>
            <p>
              本サービスは、サービス改善のためにGoogle
              Analyticsを使用しています。Google
              Analyticsは、Cookieを使用してユーザーの利用状況を収集します。収集される情報は匿名で集計され、個人を特定するものではありません。Google
              Analyticsの詳細については、
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Googleのサービスを使用するサイトやアプリから収集した情報のGoogleによる使用
              </a>
              をご確認ください。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第8条（セキュリティ）
            </h2>
            <p>
              当社は、本サービスのセキュリティ維持に努めますが、ブラウザ完結型のアプリケーションという特性上、ユーザーのデバイスとブラウザのセキュリティ設定にも依存します。ユーザーご自身でも適切なセキュリティ対策を講じてください。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第9条（ポリシーの変更）
            </h2>
            <p>
              当社は、必要に応じて本ポリシーを変更できます。変更後のポリシーは、本サービス上に掲載した時点で効力を生じます。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第10条（お問い合わせ）
            </h2>
            <p>
              本ポリシーに関するお問い合わせは、
              <a
                href="https://www.techtalk.jp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                TechTalk Inc.
              </a>
              までご連絡ください。
            </p>
          </section>

          <div className="mt-12 border-t border-slate-200 pt-8 text-right text-sm text-slate-500">
            <p>制定日: 2025年11月23日</p>
            <p className="mt-2">TechTalk Inc.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

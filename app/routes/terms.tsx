import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import type { Route } from './+types/terms'

export function meta(): Route.MetaDescriptors {
  return [
    { title: '利用規約 - SlideCraft' },
    { name: 'description', content: 'SlideCraftの利用規約' },
  ]
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button asChild variant="outline" size="sm">
            <Link to="/">← トップページに戻る</Link>
          </Button>
        </div>

        <h1 className="mb-12 text-3xl font-bold text-slate-900">利用規約</h1>

        <div className="space-y-8 leading-relaxed text-slate-700">
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第1条（適用）
            </h2>
            <p>
              本規約は、TechTalk
              Inc.（以下「当社」）が提供するSlideCraft（以下「本サービス」）の利用条件を定めるものです。本サービスを利用する全てのユーザーに適用されます。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第2条（サービスの内容）
            </h2>
            <p>
              本サービスは、PDFスライドをブラウザ内で処理し、Google Gemini
              APIを利用してスライドの修正を支援するWebアプリケーションです。本サービス自体の利用は無料ですが、Google
              Gemini APIの利用料は別途ユーザーが負担します。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第3条（データの取り扱い）
            </h2>
            <p className="mb-4">
              本サービスは、以下の原則でデータを取り扱います。
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                アップロードされたPDFファイルは、ユーザーのブラウザ内でのみ処理され、当社のサーバーに送信されることはありません。
              </li>
              <li>
                APIキーはブラウザのlocalStorageに保存され、当社がアクセスすることはありません。
              </li>
              <li>
                生成されたスライドデータは、ブラウザのOPFS（Origin Private File
                System）に保存されます。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第4条（禁止事項）
            </h2>
            <p className="mb-4">
              ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>他のユーザーまたは第三者の権利を侵害する行為</li>
              <li>不正アクセスまたはこれに類する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第5条（免責事項）
            </h2>
            <p className="mb-4">
              当社は、本サービスに関して以下の事項について一切の責任を負いません。
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                本サービスの利用により生成されたコンテンツの正確性、完全性、有用性
              </li>
              <li>Google Gemini APIの利用料金</li>
              <li>ユーザーの環境（ブラウザ、デバイス等）に起因する不具合</li>
              <li>
                本サービスの中断、終了、変更により生じた損害（データの消失を含む）
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第6条（サービスの変更・停止）
            </h2>
            <p>
              当社は、事前の通知なく、本サービスの内容の変更、追加、または提供の停止をすることができます。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第7条（規約の変更）
            </h2>
            <p>
              当社は、必要に応じて本規約を変更できます。変更後の規約は、本サービス上に掲載した時点で効力を生じます。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              第8条（準拠法・管轄裁判所）
            </h2>
            <p className="mb-4">
              本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関する一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
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

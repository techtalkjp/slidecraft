/**
 * ジョブ定義のエクスポート
 *
 * ジョブ定義と初期化済みの Durably インスタンスを集約
 */

// Durably インスタンス（ジョブ登録済み・初期化済み）
export { durably, durablyPromise } from '~/lib/durably'

// 個別のジョブ定義（useJob で使用）
export { batchPptxExportJob } from './batch-pptx-export'
export type {
  BatchPptxExportInput,
  BatchPptxExportOutput,
} from './batch-pptx-export'
export { testMultiStepJob } from './test-multi-step'

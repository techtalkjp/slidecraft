/**
 * ジョブステータスアイコン
 *
 * 単一責務: ステータスに応じたアイコンを表示
 */
import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react'

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

interface RunStatusIconProps {
  status: RunStatus
}

export function RunStatusIcon({ status }: RunStatusIconProps) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500" />
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-slate-400" />
    default:
      return null
  }
}

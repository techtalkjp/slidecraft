import { createContext } from 'react-router'
import type { Session } from './auth'

export const sessionContext = createContext<Session | null>(null)

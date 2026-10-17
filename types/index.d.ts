export type BridgeAccount = 'here' | 'other'

export type BridgeHandoff = {
  id: string
  kind: 'handoff'
  space: string
  at: string
  title: string
  summary: string
  nextSteps?: string[]
}

export type BridgeProfile = {
  dir: string
  isLoggedIn: boolean
  email?: string
  plan?: string
}

export type BridgeLogin = {
  state: 'running' | 'done' | 'failed'
  message: string
  url?: string
}

export type BridgeView = {
  profiles: Record<BridgeAccount, BridgeProfile>
  login?: BridgeLogin
  server: 'ok' | 'down' | 'not-set-up' | 'loading'
  error?: string
  space?: string
  handoffs: BridgeHandoff[]
  query: string
}

declare module 'claude-code' {
  interface PluginState {
    twinbridge: { view: BridgeView }
  }
}

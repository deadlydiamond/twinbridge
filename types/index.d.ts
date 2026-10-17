export type BridgeHandoff = {
  id: string
  kind: 'handoff'
  space: string
  at: string
  title: string
  summary: string
  nextSteps?: string[]
}

export type BridgeView = {
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

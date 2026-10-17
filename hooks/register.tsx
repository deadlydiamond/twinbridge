// TwinBridge panel (/bridge): the latest handoff with Continue / Save, and a search over
// handoffs. It talks only to the handoff server set in the plugin's options, with this
// account's token. It reads no local files and no chat history, logs no prompts or
// replies, and starts no programs.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { BRAND, headerSvg } from './brand'
import type { BridgeHandoff, BridgeView } from '../types'

const PANE = 'twinbridge'

const CONTINUE_PROMPT =
  'Continue my latest TwinBridge handoff: load it with twinbridge get_handoff, then carry on with its next steps.'
const SAVE_PROMPT =
  'Save a TwinBridge handoff now with twinbridge save_handoff: what was asked, what is done, key decisions, and concrete next steps, written for someone with no access to this chat.'

const view = atom({ plugin: 'twinbridge', key: 'view' } as const, {
  server: 'loading',
  handoffs: [],
  query: '',
} as BridgeView)

// Plugin options, set again on every load of the module.
let settings: { connector_url?: unknown; account_token?: unknown } = {}

function ago(iso?: string): string {
  if (!iso) return ''
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function oneLine(text = '', n = 140): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n)}…` : t
}

type Conn = { base: string; token: string }

function connection(): Conn | undefined {
  const base = String(settings.connector_url || '').trim().replace(/\/+$/, '')
  const token = String(settings.account_token || '').trim()
  return base && token ? { base, token } : undefined
}

async function api($: EngineInterface, c: Conn, path: string) {
  const res = await $.http.fetch(c.base + path, { headers: { authorization: `Bearer ${c.token}` } })
  if (!res.ok) throw new Error(res.status === 401 ? 'token rejected' : `HTTP ${res.status}`)
  return JSON.parse(res.text)
}

async function refresh($: EngineInterface, query?: string) {
  const q = query ?? (await read($, view)).query
  const c = connection()
  if (!c) {
    await update($, view, (v): BridgeView => ({
      ...v,
      server: 'not-set-up',
      error: 'Set the handoff server URL and account token in the plugin settings.',
      query: q,
    }))
    return
  }
  try {
    const path = `/api/history?only=handoffs&limit=20${q ? `&q=${encodeURIComponent(q)}` : ''}`
    const [who, { items }] = await Promise.all([api($, c, '/api/whoami'), api($, c, path)])
    await update($, view, (v): BridgeView => ({
      ...v,
      server: 'ok',
      error: undefined,
      space: who.space,
      handoffs: (items as BridgeHandoff[]).filter(i => i.kind === 'handoff'),
      query: q,
    }))
  } catch (err) {
    await update($, view, (v): BridgeView => ({
      ...v,
      server: 'down',
      error: `Handoff server not reachable at ${c.base} (${(err as Error).message}).`,
      query: q,
    }))
  }
}

export const register: Register = (on, options) => {
  settings = options

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'bridge', description: 'Open TwinBridge: both accounts and your handoffs' })
    return next(e)
  })

  on('command.run', { command: 'bridge' }, async $ => {
    await $.ui.open({ id: PANE, title: 'TwinBridge' })
    await refresh($)
    return { text: 'TwinBridge panel opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    // Not every surface has a text field or vector drawings; without them the panel falls back to text.
    const Input = 'Input' in ui ? ui.Input : undefined
    const Svg = e.surface !== 'terminal' && 'Svg' in ui ? ui.Svg : undefined
    const v = await read($, view)
    const status =
      v.server === 'ok'
        ? { label: 'Connected', tone: 'ok' as const, text: 'connected' }
        : v.server === 'loading'
          ? { label: 'Checking', tone: 'busy' as const, text: 'checking…' }
          : v.server === 'down'
            ? { label: 'Offline', tone: 'off' as const, text: 'not reachable' }
            : { label: 'Not set up', tone: 'off' as const, text: 'not set up' }
    const latest = v.query ? undefined : v.handoffs[0]
    const list = latest ? v.handoffs.slice(1) : v.handoffs

    const Section = ({ title, aside, children }: { title: string; aside?: string; children?: JSX.Children }) => (
      <Box flexDirection="column" gap={1} borderStyle="round" borderColor="subtle" paddingX={1}>
        <Box flexDirection="row" justifyContent="space-between">
          <Text bold dimColor>
            {title.toUpperCase()}
          </Text>
          {aside ? <Text dimColor>{aside}</Text> : null}
        </Box>
        {children}
      </Box>
    )

    return (
      <Box flexDirection="column" gap={1}>
        {Svg ? (
          <Svg key="brand" source={headerSvg(status)} alt={`TwinBridge by ${BRAND.author}. Handoff server ${status.text}.`} width={360} height={56} />
        ) : (
          <Box key="brand" flexDirection="column">
            <Text>
              <Text bold color={BRAND.cyan}>
                TwinBridge
              </Text>
              <Text dimColor> · handoff server {status.text}</Text>
            </Text>
            <Text dimColor>
              by {BRAND.author} · {BRAND.tagline}
            </Text>
          </Box>
        )}
        {v.error && <Text color="error">{v.error}</Text>}

        <Section title="Latest handoff" aside={latest ? `${latest.space === v.space ? 'This account' : 'Other account'} · ${ago(latest.at)}` : undefined}>
          {latest ? (
            <Box flexDirection="column">
              <Text bold>{latest.title}</Text>
              <Text dimColor>{oneLine(latest.summary, 300)}</Text>
              {(latest.nextSteps ?? []).slice(0, 3).map((s, i) => (
                <Text key={`step-${i}`}>
                  <Text color={BRAND.cyan}>→ </Text>
                  {oneLine(s, 120)}
                </Text>
              ))}
            </Box>
          ) : (
            <Text dimColor>{v.query ? 'Search results are below.' : 'No handoff yet. Save one before you switch accounts.'}</Text>
          )}
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            <Button key="continue" variant="primary" onPress={() => void $.prompt.submit({ text: CONTINUE_PROMPT })}>
              Continue here
            </Button>
            <Button key="save" onPress={() => void $.prompt.submit({ text: SAVE_PROMPT })}>
              Save handoff
            </Button>
            <Button key="refresh" onPress={() => void refresh($)}>
              Refresh
            </Button>
          </Box>
        </Section>

        <Section title="Handoffs" aside={v.query ? `Results for "${oneLine(v.query, 30)}"` : 'Earlier'}>
          {Input && (
            <Input
              key="search"
              label="Search handoffs"
              placeholder="e.g. billing, deploy, bug"
              value={v.query}
              submitLabel="Search"
              onSubmit={(value: string) => void refresh($, value.trim())}
            />
          )}
          {list.length === 0 && v.server === 'ok' && <Text dimColor>{v.query ? 'Nothing found.' : 'No earlier handoffs.'}</Text>}
          {list.slice(0, 10).map(item => (
            <Box key={item.id} flexDirection="column">
              <Text dimColor>
                {item.space === v.space ? 'This account' : 'Other account'} · {ago(item.at)}
              </Text>
              <Text wrap="truncate-end">
                <Text bold>{item.title}</Text>: {oneLine(item.summary)}
              </Text>
            </Box>
          ))}
        </Section>
      </Box>
    )
  })
}

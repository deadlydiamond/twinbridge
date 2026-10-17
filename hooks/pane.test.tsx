import { test, expect } from 'claude-code/testing'

const HOME = '/Users/me'
const NOW = new Date().toISOString()
const OPTIONS = { connector_url: 'https://handoffs.example.com', account_token: 'w'.repeat(48) }
const H1 = { id: 'h1', kind: 'handoff', space: 'personal', at: NOW, title: 'Billing refactor', summary: 'Split billing into invoice and tax modules.', nextSteps: ['Write tax tests'] }
const H2 = { id: 'h2', kind: 'handoff', space: 'work', at: NOW, title: 'Deploy notes', summary: 'Staging is on the new image.' }
const PANE = {
  plugin: 'twinbridge',
  component: 'Pane',
  requestId: 'twinbridge',
  props: { title: 'TwinBridge', isFocused: true, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 60 }, view: {} },
} as const
const BRIDGE = { command: 'bridge', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } } as const
const login = (email: string, type: string) => JSON.stringify({ oauthAccount: { emailAddress: email, organizationType: type } })
const texts = async (ui: { findAll: (q: { type: string }) => Promise<{ text: string }[]> }) => (await ui.findAll({ type: 'Text' })).map(t => t.text).join('\n')

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: accounts, latest handoff and earlier handoffs`, { options: OPTIONS }, async ($, on) => {
    const urls: string[] = []
    on('env.get', async (_$, e) => ({ value: e.name === 'HOME' ? HOME : undefined }))
    on('fs.read', async (_$, e) =>
      e.path === `${HOME}/.claude.json`
        ? { value: login('me@work.example', 'claude_team') }
        : e.path === `${HOME}/.claude-personal/.claude.json`
          ? { value: login('me@home.example', 'claude_max') }
          : { deny: 'no such file' },
    )
    on('http.fetch', async (_$, e) => {
      urls.push(e.url)
      const body = e.url.endsWith('/api/whoami') ? { space: 'work', mode: 'shared' } : { items: [H1, H2] }
      return { value: { status: 200, ok: true, headers: {}, text: JSON.stringify(body) } }
    })
    on('ui.open', async () => ({ value: { isPlaced: true } }))

    await $.command.run(BRIDGE)
    const ui = await $.ui.mount({ ...PANE, surface })
    const all = await texts(ui)

    // Only handoffs are ever asked for: no message log, no history.
    expect(urls.filter(u => u.includes('/api/history')).every(u => u.includes('only=handoffs'))).toBe(true)
    expect(all).toContain('me@work.example · team')
    expect(all).toContain('me@home.example · max')
    expect(all).toContain('Billing refactor')
    expect(all).toContain('Write tax tests')
    expect(all).toContain('Deploy notes')
    expect(await ui.find({ key: 'login-other' })).toBeFalsy()
    if (surface === 'desktop') expect((await ui.findAll({ type: 'Svg' })).length).toBeGreaterThan(0)
    else expect(all).toContain('Omer Bin Saleem')
  })

  test(`${surface}: a signed-out other account gets a Log in button`, { options: OPTIONS }, async ($, on) => {
    const spawned: string[][] = []
    let signedIn = false
    on('env.get', async (_$, e) => ({ value: e.name === 'HOME' ? HOME : undefined }))
    on('fs.read', async (_$, e) =>
      e.path === `${HOME}/.claude.json` ? { value: login('me@work.example', 'claude_team') } : signedIn ? { value: login('me@home.example', 'claude_max') } : { value: '{}' },
    )
    on('fs.exists', async () => ({ value: false }))
    on('http.fetch', async (_$, e) => {
      const body = e.url.endsWith('/api/whoami') ? { space: 'work', mode: 'shared' } : { items: [] }
      return { value: { status: 200, ok: true, headers: {}, text: JSON.stringify(body) } }
    })
    on('process.spawn', async function* (_$, e) {
      spawned.push([...e.argv])
      signedIn = true
      yield { stream: 'stdout' as const, text: 'Opening https://claude.ai/oauth/authorize?x=1\n' }
      return { value: { code: 0, signal: null } }
    })
    on('ui.open', async () => ({ value: { isPlaced: true } }))

    await $.command.run(BRIDGE)
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await texts(ui)).toContain('Not signed in')
    await ui.press({ key: 'login-other' })

    expect(spawned).toEqual([['/usr/bin/env', `CLAUDE_CONFIG_DIR=${HOME}/.claude-personal`, 'claude', 'auth', 'login']])
    const after = await texts(ui)
    expect(after).toContain('Other account signed in.')
    expect(after).toContain('me@home.example')
  })
}

test('says what to set when the server is not configured', { options: {} }, async ($, on) => {
  const fetched: string[] = []
  on('env.get', async (_$, e) => ({ value: e.name === 'HOME' ? HOME : undefined }))
  on('fs.read', async () => ({ value: '{}' }))
  on('http.fetch', async (_$, e) => {
    fetched.push(e.url)
    return { value: { status: 200, ok: true, headers: {}, text: '{}' } }
  })
  on('ui.open', async () => ({ value: { isPlaced: true } }))

  await $.command.run(BRIDGE)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await texts(ui)).toContain('Set the handoff server URL')
  expect(fetched).toEqual([])
})

test('says so when the server is down', { options: OPTIONS }, async ($, on) => {
  on('env.get', async (_$, e) => ({ value: e.name === 'HOME' ? HOME : undefined }))
  on('fs.read', async () => ({ value: '{}' }))
  on('http.fetch', async () => ({ value: { status: 502, ok: false, headers: {}, text: '' } }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))

  await $.command.run(BRIDGE)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await texts(ui)).toContain('not reachable')
})

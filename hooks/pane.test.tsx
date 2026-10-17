import { test, expect } from 'claude-code/testing'

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
const texts = async (ui: { findAll: (q: { type: string }) => Promise<{ text: string }[]> }) => (await ui.findAll({ type: 'Text' })).map(t => t.text).join('\n')

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: latest handoff and earlier handoffs`, { options: OPTIONS }, async ($, on) => {
    const urls: string[] = []
    on('http.fetch', async (_$, e) => {
      urls.push(e.url)
      const body = e.url.endsWith('/api/whoami') ? { space: 'work', mode: 'shared' } : { items: [H1, H2] }
      return { value: { status: 200, ok: true, headers: {}, text: JSON.stringify(body) } }
    })
    on('ui.open', async () => ({ value: { isPlaced: true } }))

    await $.command.run(BRIDGE)
    const ui = await $.ui.mount({ ...PANE, surface })
    const all = await texts(ui)

    // Only handoffs are ever asked for, and only from the configured server.
    expect(urls.every(u => u.startsWith(OPTIONS.connector_url))).toBe(true)
    expect(urls.filter(u => u.includes('/api/history')).every(u => u.includes('only=handoffs'))).toBe(true)
    expect(all).toContain('Billing refactor')
    expect(all).toContain('Write tax tests')
    expect(all).toContain('Deploy notes')
    expect(all).toContain('Other account')
    if (surface === 'desktop') expect((await ui.findAll({ type: 'Svg' })).length).toBeGreaterThan(0)
    else expect(all).toContain('Omer Bin Saleem')
  })
}

test('says what to set when the server is not configured', { options: {} }, async ($, on) => {
  const fetched: string[] = []
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
  on('http.fetch', async () => ({ value: { status: 502, ok: false, headers: {}, text: '' } }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))

  await $.command.run(BRIDGE)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await texts(ui)).toContain('not reachable')
})

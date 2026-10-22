# TwinBridge

![TwinBridge by Omer Bin Saleem: continue work across your two Claude accounts](assets/banner.svg)

**Continue work across your two Claude accounts. Handoffs from a server you run yourself.**

TwinBridge is a Claude plugin. In one account you ask Claude to save a handoff (what was asked, what is done, the decisions, the next steps). In your other account you open `/bridge` and press **Continue here**, and Claude starts from the same point.

**Who it is for:** people with two Claude accounts, usually one for work and one of their own, who move the same task between them.

**Why not the alternatives:**

- *Pasting context by hand* means retyping the task and forgetting the reasons behind it. A handoff is written by Claude for someone with no access to the chat.
- *One account for everything* is not always allowed or enough.
- *Tools that sync all your history* read your conversations. TwinBridge reads none of it: it sends only the handoff Claude writes, only when you ask, and only to a server you run.

**First command** (full steps in [Setup](#setup)): start a handoff server, then

```bash
claude plugin marketplace add deadlydiamond/twinbridge
```

MIT licensed.

## Use cases

- **Office to home, same task.** Plan a migration at work, press **Continue here** at home, and Claude loads the goal, the steps done, why you picked one approach, and the next steps.
- **Find an old decision.** Search handoffs from either account and get the title, summary, account and date.
- **One project, two contexts.** Both accounts read the same handoffs.

## What it does and does not do

- It saves a handoff **only when you ask**, or when Claude asks "Save a handoff for your other account?" and you say yes.
- A handoff holds what Claude writes in it: a title, a summary, next steps, and optional context such as file paths.
- It does **not** read your chat history, Claude's memory or session transcripts, and does not log your prompts or replies.
- It does not share a login, merge accounts or switch between them.
- If one account belongs to an employer, their rules apply to what you move out of it. Check them before saving a handoff with work material.

## What it runs and sends

| Part | What it does | Where data goes |
|---|---|---|
| MCP server `twinbridge` (`.mcp.json`) | Four tools: `save_handoff`, `get_handoff`, `list_handoffs`, `search_handoffs` | Only your handoff server: `<connector_url>/mcp/<account_token>/handoffs` |
| `/bridge` panel (`hooks/register.tsx`) | Shows the latest handoffs and runs your searches | Only your handoff server: `GET <connector_url>/api/whoami` and `GET <connector_url>/api/history?only=handoffs` (plus `&q=<your search>`) |
| Skill `twinbridge` | Tells Claude when to save and load handoffs | Nothing |

- **Hosts contacted:** only the handoff server URL you enter in the plugin settings. No analytics, telemetry or update checks.
- **Programs run:** none. The panel starts no processes and reads no files on your computer.
- **Hooks:** there are no command hooks on prompts, replies or tool calls (`hooks/hooks.json`). The module registers the `/bridge` command and draws the panel.
- **Prompts submitted:** two buttons type a fixed prompt for you, with nothing from the conversation added. **Continue here** asks Claude to load the latest handoff with `get_handoff` and carry on. **Save handoff** asks Claude to call `save_handoff` with what was asked, what is done, key decisions and next steps. This is the only way conversation content leaves the conversation.

Full policy: [PRIVACY.md](PRIVACY.md).

## Setup

### 1. Run a handoff server

TwinBridge works with the open source ClaudeTwin connector, a small Node.js server (Node 20 or newer) that you host. Follow [step 1 of the ClaudeTwin install](https://github.com/deadlydiamond/claudetwin#1-run-the-connector): create two random tokens, one per account, then run it on your machine or build its Dockerfile on a host you control, with HTTPS and a persistent volume for its data. Check it with `GET /health`.

### 2. Install the plugin in each account

```bash
claude plugin marketplace add deadlydiamond/twinbridge
claude plugin install twinbridge@twinbridge
```

Set these options when asked:

- **Handoff server URL**: for example `https://handoffs.example.com`, no trailing slash
- **Account token**: the work token in your work account, the personal token in your personal one

### 3. Use it

- Type `/bridge` to open the panel.
- Say "save a handoff" when you stop, or press **Save handoff**.
- In the other account, say "continue from my other account", or press **Continue here**.

## Related

- **ClaudeTwin** ([deadlydiamond/claudetwin](https://github.com/deadlydiamond/claudetwin)): shared memory across your accounts. It also logs prompts and final replies to the same kind of self-hosted server, and provides the connector TwinBridge uses.

## Support

Open an issue at [github.com/deadlydiamond/twinbridge/issues](https://github.com/deadlydiamond/twinbridge/issues).

## License

MIT, see [LICENSE](LICENSE).

## Author

[Omer Bin Saleem](https://www.omerbinsaleem.com/), one hack a day.

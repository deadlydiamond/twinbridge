# TwinBridge

![TwinBridge by Omer Bin Saleem: continue work across your two Claude accounts](assets/banner.svg)

**Continue work across your two Claude accounts.**

Many people use two Claude accounts, one for work and one of their own. Each account knows only its own chats, so moving a task from one to the other means explaining it again: what was asked, what is done, what was decided, what comes next.

TwinBridge fixes that with handoffs. When you finish a piece of work, ask Claude to save a handoff. In your other account, open `/bridge` and press **Continue here**, and Claude starts from the same point. Handoffs are stored on a server you run yourself.

By Omer Bin Saleem. MIT licensed.

## Use cases

**Office to home, same task.** You plan a database migration in your work account in the afternoon. In the evening, in your personal account, you press **Continue here**. Claude loads the handoff (the goal, the steps already done, the reason you picked one approach over another, and the next three steps) and carries on.

**Find an old decision.** Weeks later you remember a decision but not where it was made. Search your handoffs from either account and get the title, the summary, the account and the date.

**One project, two contexts.** A side project you sometimes discuss at work, or a tool you prototype at home and use at the office. Both accounts read the same handoffs, so neither starts from zero.

**Know where you are.** The panel shows which account this session uses and whether the other one is signed in, with a **Log in** button when it is not.

## What TwinBridge does and does not do

- It saves a handoff **only when you ask**, or when Claude asks "Save a handoff for your other account?" after a large piece of work and you say yes.
- A handoff holds what Claude writes in it: a title, a summary, next steps, and optional context such as file paths. Nothing else from the conversation is sent.
- It does **not** read your chat history, Claude's memory or session transcripts, and it does not log your prompts or Claude's replies.
- It does not share a login, merge accounts or switch between them. You choose which account to use.
- If one of your accounts belongs to an employer, their rules still apply to what you move out of it. Check them before you save a handoff with work material.

## What it runs and sends

| Part | What it does | Where data goes |
|---|---|---|
| MCP server `twinbridge` (`.mcp.json`) | Four tools: `save_handoff`, `get_handoff`, `list_handoffs`, `search_handoffs` | Your handoff server, at `<connector_url>/mcp/<account_token>/handoffs` |
| `/bridge` panel (`hooks/register.tsx`) | Reads the latest handoffs and runs your searches | Your handoff server, with your account token, at `/api/whoami` and `/api/history?only=handoffs` |
| `/bridge` panel, Accounts | Reads the email and plan that each Claude Code profile's `.claude.json` records, to show who is signed in | Nowhere: shown in the panel only |
| `/bridge` panel, Log in | Runs `claude auth login` for your other profile, which opens Claude's own sign-in in your browser | Claude's sign-in page |
| Skill `twinbridge` | Tells Claude when to save and load handoffs and what to put in them | Nothing |

There are no hooks on prompts, replies or tool calls. See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Setup

### 1. Run a handoff server

TwinBridge works with the open source ClaudeTwin connector, a small server you host yourself:

```bash
git clone https://github.com/deadlydiamond/claudetwin
cd claudetwin/connector
npm install
cp .env.example .env
node --env-file=.env src/server.js
```

Fill both tokens in `.env` first. Generate each one with:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

For a URL both accounts can reach, deploy `connector/Dockerfile` (for example on Render, Railway or Fly.io) with a persistent volume on `/data` and both tokens set as environment variables. Use HTTPS.

### 2. Install the plugin in each account

Install TwinBridge from the Claude directory, or at the prompt of a Claude Code session:

```
/plugin install twinbridge --marketplace deadlydiamond/twinbridge
```

Set these options:

- **Handoff server URL**: for example `https://handoffs.example.com`, with no trailing slash
- **Account token**: the work token in your work account, the personal token in your personal one
- **Other account's Claude Code folder** (optional): the config folder of your other Claude Code profile, used only for the Accounts section

### 3. Use it

- Type `/bridge` to open the panel.
- Say "save a handoff" when you stop, or press **Save handoff**.
- In the other account, say "continue from my other account", or press **Continue here**.

## Privacy

Handoffs live only on the server you run. The plugin sends nothing to the author or to any third party. Full details: [PRIVACY.md](PRIVACY.md).

## Support

Open an issue at [github.com/deadlydiamond/twinbridge/issues](https://github.com/deadlydiamond/twinbridge/issues).

## License

MIT, see [LICENSE](LICENSE). Made by [Omer Bin Saleem](https://github.com/deadlydiamond).

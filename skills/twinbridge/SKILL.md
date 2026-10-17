---
name: twinbridge
description: Use when the user works across two Claude accounts and wants to hand work over, or pick it up, with the TwinBridge handoff tools (save_handoff, get_handoff, list_handoffs, search_handoffs).
---

# TwinBridge

The user has two Claude accounts, for example one for work and one personal, and moves between them. TwinBridge stores short handoffs on a server the user runs, so the other account can continue a task without the user explaining it again.

A handoff is written by you, from this conversation, only when the user wants one. TwinBridge never reads chat history, memory or transcripts, and nothing is saved automatically.

## Picking work up

Call `get_handoff` when the user asks to continue, resume or pick up work from their other account, or presses **Continue here** in the `/bridge` panel. If the latest handoff is not the one they mean, use `list_handoffs` or `search_handoffs` with words from their request.

Then continue the task. Mention which handoff you loaded in one line, and do not repeat it back in full.

## Saving a handoff

Call `save_handoff` only when:
- the user asks you to (handoff, save, bridge, "I'm switching accounts"), or
- you finished a large piece of multi-step work, you asked "Save a handoff for your other account?", and the user said yes.

Never save one on your own, and do not ask on every turn: ask at most once per finished piece of work.

## Writing a good handoff

Write for a reader with no access to this chat. Include only what the next session needs to continue:

- **title**: the task in a few words
- **summary**: what was asked, what is done, and the decisions made with their reasons
- **next_steps**: concrete actions, in order
- **context**: file paths, commands, or short snippets the next step depends on

Leave out passwords, keys, tokens and personal details that the task does not need. If the work involves material the user may not be allowed to move between accounts (for example an employer's confidential code), ask before saving it.

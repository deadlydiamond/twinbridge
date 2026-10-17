# TwinBridge privacy policy

Last updated: 17 October 2026

TwinBridge is a Claude plugin by Omer Bin Saleem. It lets you save a handoff in one Claude account and continue the work in another. This policy explains what data it handles.

## Who holds your data

You do. TwinBridge sends data only to the handoff server whose URL you enter in the plugin's settings. You run that server yourself. The plugin's author does not operate a server for it, and receives no data from it: no analytics, no telemetry and no crash reports.

## What is collected

- **Handoffs.** A handoff contains only what Claude writes into it at your request: a title, a summary, next steps, and optional context. It is stored on your server with the account it came from and the time it was saved.
- **Search terms.** When you search handoffs in the `/bridge` panel, your search words go to your server to find matching handoffs. They are not stored.

## What is not collected

TwinBridge does not read or send your chat history, Claude's memory, conversation summaries or session transcripts. It does not log your prompts or Claude's replies. A handoff is saved only when you ask for one, or when you agree after Claude asks.

## Data on your computer

The plugin reads no files on your computer and starts no programs. Your account token is stored in Claude's plugin settings as a sensitive value. It is sent only to your own server, to identify which account a handoff belongs to.

## How long data is kept

Handoffs stay on your server until you delete them. The ClaudeTwin connector keeps the most recent 500 handoffs and removes older ones. You can delete everything by deleting the server's data folder.

## Children

TwinBridge is not intended for people under 18.

## Contact

Questions or requests: open an issue at [github.com/deadlydiamond/twinbridge/issues](https://github.com/deadlydiamond/twinbridge/issues).

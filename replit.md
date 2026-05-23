# LoveLink Discord Bot

A full-featured Discord bot for gaming communities with dating (Web Namoro), economy (The Sims-style), matchmaking (Duo Gamer), dark love, moderation, and ticket systems. Includes a built-in web dashboard (Bank UI) served on port 3000.

## Run & Operate

- The bot starts automatically via the "Discord Bot" workflow: `cd discord-bot && node src/index.js`
- Web dashboard runs on port 3000 (Bank UI, rankings)
- Data is stored locally in `discord-bot/data/*.json` files

## Stack

- pnpm workspaces, Node.js 24
- Discord.js 14
- Express 5 (web dashboard)
- Local JSON file storage (`discord-bot/data/`)
- Winston logging

## Where things live

- `discord-bot/src/index.js` — bot entry point
- `discord-bot/src/config/config.js` — all config/env vars
- `discord-bot/src/commands/` — slash commands
- `discord-bot/src/events/` — Discord event handlers
- `discord-bot/src/systems/` — core logic (economy, dating, leveling, etc.)
- `discord-bot/src/web/` — Express web server + Bank UI
- `discord-bot/data/` — local JSON database files

## Required Secrets

- `DISCORD_TOKEN` — Bot token from Discord Developer Portal (required)

## Optional Environment Variables

- `OWNER_ID` — Discord user ID of the bot owner
- `GUILD_ID` — Main Discord server ID
- `STAFF_ROLES` — Comma-separated role IDs for staff
- `ADMIN_ROLES` — Comma-separated role IDs for admins
- `LOG_CHANNEL` — Channel ID for logs
- `MOD_LOG_CHANNEL` — Channel ID for mod logs
- `WELCOME_CHANNEL` — Channel ID for welcome messages
- `DATING_CHANNEL`, `DUO_CHANNEL`, `DARK_LOVE_CHANNEL`, `CONFESSIONS_CHANNEL`, `RANKINGS_CHANNEL`
- `TICKET_CATEGORY`, `PRIVATE_CALL_CATEGORY` — Category IDs

## User Preferences

- Uses local JSON files for storage (no external database needed)
- Portuguese-language bot (Brazilian Discord community)

## Gotchas

- Bot requires `DISCORD_TOKEN` secret to start — set it in the Secrets tab
- Lock file at `/tmp/.bot.pid` prevents duplicate instances on restart
- The web server (port 3000) serves the Bank UI dashboard

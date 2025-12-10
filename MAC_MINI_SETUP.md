# Mac mini Deployment Guide (Parallel Monitor → iMessage)

Goal: run the webhook server persistently on your Mac mini, expose a stable https webhook for Parallel Monitor, and deliver daily AI news via iMessage.

## Prerequisites
- Mac mini with macOS; Messages signed into iMessage.
- Node.js 18+ and git installed (`brew install node git`).
- Parallel API key.
- Tunnel for https (recommended: ngrok with authtoken/reserved domain).

## 1) Get the code and install
```bash
git clone https://github.com/mhismail3/ai-news-monitor.git
cd ai-news-monitor
npm install
```

## 2) Configure environment
```bash
cp env.example .env
```
Set in `.env`:
- `PARALLEL_API_KEY=<your key>`
- `IMESSAGE_RECIPIENT=<iMessage phone/email>`
- `PORT=3000` (or your choice)
- `DRY_RUN=true` for safe tests first
- `WEBHOOK_URL` will be set after you start the tunnel (next step)
- Optional `NGROK_AUTHTOKEN` if using ngrok

## 3) Start a public https webhook URL
Example with ngrok:
```bash
ngrok config add-authtoken <token>    # once
ngrok http 3000
```
Copy the https URL, e.g. `https://abcd.ngrok.io`, and set:
```
WEBHOOK_URL=https://abcd.ngrok.io/webhook
```
For reliability, use an authtoken and (ideally) a reserved domain/subdomain so the URL does not rotate; if the URL changes, you must re-run monitor setup (step 5).

## 4) Run the server persistently (pm2)
```bash
npm install -g pm2
pm2 start npm --name ai-news-monitor -- run dev   # uses PORT from .env
pm2 save
pm2 startup      # follow the printed command to enable on boot
```
Check health:
```bash
curl http://localhost:3000/health
```

## 5) Register the Parallel Monitor (daily AI news)
With the tunnel running and `.env` containing the public `WEBHOOK_URL`:
```bash
npm run setup:monitor
```
This writes `.monitor.json` (git-ignored) with the `monitor_id`.

## 6) Test end-to-end safely
- Dry run (no iMessage when `DRY_RUN=true`):
```bash
curl -X POST http://localhost:3000/test/notify
```
- When satisfied, set `DRY_RUN=false`, restart pm2, and test again:
```bash
pm2 restart ai-news-monitor
curl -X POST http://localhost:3000/test/notify
```
Real webhooks from Parallel will now fetch event groups and send the report via iMessage.

## 7) Ongoing operations
- Logs: `pm2 logs ai-news-monitor`
- Restart after config changes: `pm2 restart ai-news-monitor`
- Update code: `git pull && npm install && pm2 restart ai-news-monitor`
- Fetch events manually: `npm run fetch:events -- <monitor_id> <event_group_id?>`
- Delete monitor: `npm run delete:monitor -- <monitor_id?>`

## 8) If the public URL changes
- Update `WEBHOOK_URL` in `.env`.
- Restart pm2: `pm2 restart ai-news-monitor`.
- Re-run `npm run setup:monitor` to register the new webhook with Parallel.

## 9) Safety and privacy
- Keep `.env` and `.monitor.json` private (already git-ignored).
- Use `DRY_RUN=true` when experimenting.
- Ensure the tunnel stays alive; reserved domains or always-on tunnels are best for reliability.


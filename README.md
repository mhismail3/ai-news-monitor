# AI News Monitor (Parallel Monitor → iMessage)

Daily AI news monitor built on Parallel Monitor API. It receives webhook event groups, fetches full events, formats a concise report, and sends it via iMessage (AppleScript). Includes lifecycle scripts to create/delete monitors and fetch events for debugging.

## Prerequisites
- macOS with Messages signed in to iMessage (for delivery).
- Node 18+.
- Parallel API key.
- (Optional) Tunnel for webhook (ngrok or similar) when not running on a public host.

## Setup
1) Clone and install:
```bash
git clone https://github.com/mhismail3/ai-news-monitor.git
cd ai-news-monitor
npm install
```
2) Configure env:
```bash
cp env.example .env
```
Fill:
- `PARALLEL_API_KEY`: from Parallel.
- `WEBHOOK_URL`: e.g., `http://localhost:3000/webhook` or your tunnel URL.
- `IMESSAGE_RECIPIENT`: phone/email reachable in iMessage.
- `DRY_RUN`: `true` to log instead of sending iMessage; `false` to send.
- `PORT`: server port (default 3000).
- `NGROK_AUTHTOKEN`: if using ngrok.

## Run the webhook server
```bash
npm run dev
# or production build
npm run build && npm start
```
Health check: `curl http://localhost:3000/health`

## Create the monitor (daily AI news)
Ensure `WEBHOOK_URL` is reachable by Parallel (tunnel if local), then:
```bash
npm run setup:monitor
```
Saves `.monitor.json` with `monitor_id` (git-ignored).

## Test notification without Parallel
```bash
curl -X POST http://localhost:3000/test/notify
```
Respects `DRY_RUN`.

## Handling real webhooks
Parallel sends `event_group_id` to `POST /webhook`. The server:
1) Fetches full event group via Parallel API.
2) Builds a report (numbered items + sources).
3) Sends iMessage (or logs if dry-run).

## Fetch events manually
```bash
npm run fetch:events -- <monitor_id> <event_group_id?>
# if event_group_id omitted, tries recent events (10d lookback)
```

## Delete the monitor
```bash
npm run delete:monitor -- <monitor_id?>
```
Uses `.monitor.json` if id not provided.

## Deployment (Mac mini)
See `MAC_MINI_SETUP.md` for a full step-by-step guide (pm2 + tunnel + monitor registration).

See `AGENTS.md` for architecture and ops notes.


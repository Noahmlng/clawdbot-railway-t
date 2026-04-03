# OpenClaw Railway Template (1‑click deploy)

This repo packages **OpenClaw** for Railway with a small **/setup** web wizard so users can deploy and onboard **without running any commands**.

## What you get

- **OpenClaw Gateway + Control UI** (served at `/` and `/openclaw`)
- A friendly **Setup Wizard** at `/setup` (protected by a password)
- Persistent state via **Railway Volume** (so config/credentials/memory survive redeploys)
- Bundled **Google Calendar plugin** wiring for OpenClaw setup and OAuth file persistence
- One-click **Export backup** (so users can migrate off Railway later)
- **Import backup** from `/setup` (advanced recovery)

## How it works (high level)

- The container runs a wrapper web server.
- The wrapper protects `/setup` (and the Control UI at `/openclaw`) with `SETUP_PASSWORD` using HTTP Basic auth.
- During setup, the wrapper runs `openclaw onboard --non-interactive ...` inside the container, writes state to the volume, and then starts the gateway.
- After setup, **`/` is OpenClaw**. The wrapper reverse-proxies all traffic (including WebSockets) to the local gateway process.

## Railway deploy instructions (what you’ll publish as a Template)

In Railway Template Composer:

1) Create a new template from this GitHub repo.
2) Add a **Volume** mounted at `/data`.
3) Set the following variables:

Required:
- `SETUP_PASSWORD` — user-provided password to access `/setup` and the Control UI (`/openclaw`) via HTTP Basic auth

Recommended:
- `OPENCLAW_STATE_DIR=/data/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=/data/workspace`

Optional:
- `OPENCLAW_GATEWAY_TOKEN` — if not set, the wrapper generates one (not ideal). In a template, set it using a generated secret.
- `OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS` — comma-separated full origins allowed to open the remote Control UI WebSocket (recommended for Railway/custom domains), e.g. `https://foo.up.railway.app,https://bot.example.com`
- `OPENCLAW_SETUP_AUTH_SECRET` — prefill the setup “Key / Token” field (useful for providers like MiniMax)
- `OPENCLAW_SETUP_TELEGRAM_TOKEN` — prefill Telegram bot token in `/setup`
- `OPENCLAW_SETUP_TELEGRAM_USER_ID` — prefill Telegram user id in `/setup`
- `OPENCLAW_SETUP_TELEGRAM_PAIRING_CODE` — prefill Telegram pairing code in `/setup` and auto-approve during setup
- `OPENCLAW_SETUP_CUSTOM_PROVIDER_ID`, `OPENCLAW_SETUP_CUSTOM_PROVIDER_BASE_URL`, `OPENCLAW_SETUP_CUSTOM_PROVIDER_API`, `OPENCLAW_SETUP_CUSTOM_PROVIDER_API_KEY_ENV`, `OPENCLAW_SETUP_CUSTOM_PROVIDER_MODEL_ID` — prefill advanced custom provider fields
- `OPENCLAW_SETUP_GOOGLE_CALENDAR_ENABLED` — pre-check Google Calendar plugin setup in `/setup`
- `OPENCLAW_SETUP_GOOGLE_CALENDAR_CREDENTIALS_JSON` or `OPENCLAW_SETUP_GOOGLE_CALENDAR_CREDENTIALS_JSON_BASE64` — prefill the Google OAuth client JSON in `/setup`
- `OPENCLAW_SETUP_GOOGLE_CALENDAR_REDIRECT_URI`, `OPENCLAW_SETUP_GOOGLE_CALENDAR_DEFAULT_CALENDAR_ID`, `OPENCLAW_SETUP_GOOGLE_CALENDAR_DEFAULT_TIME_ZONE`, `OPENCLAW_SETUP_GOOGLE_CALENDAR_CONFIRMATION_MODE`, `OPENCLAW_SETUP_GOOGLE_CALENDAR_UPCOMING_WINDOW_DAYS`, `OPENCLAW_SETUP_GOOGLE_CALENDAR_READ_ONLY_MODE` — prefill Google Calendar plugin options in `/setup`
- `GOOGLE_CALENDAR_CREDENTIALS_PATH`, `GOOGLE_CALENDAR_TOKEN_PATH`, `GOOGLE_CALENDAR_OAUTH_REDIRECT_URI`, `GOOGLE_CALENDAR_DEFAULT_CALENDAR_ID`, `GOOGLE_CALENDAR_DEFAULT_TIME_ZONE`, `GOOGLE_CALENDAR_CONFIRMATION_MODE`, `GOOGLE_CALENDAR_UPCOMING_WINDOW_DAYS`, `GOOGLE_CALENDAR_READ_ONLY_MODE` — environment-level overrides consumed by the plugin itself

Notes:
- This template pins OpenClaw to a released version by default via Docker build arg `OPENCLAW_GIT_REF` (override if you want `main`).
- Never commit real API keys/tokens into Git-tracked files. Put secrets in Railway Variables (or local `.env`) only.
- The wrapper falls back to `RAILWAY_PUBLIC_DOMAIN` when `OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS` is unset, but Railway template deploys can leave `RAILWAY_PUBLIC_DOMAIN` empty on first deploy. Set `OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS` explicitly if you want predictable remote Control UI access.

4) Enable **Public Networking** (HTTP). Railway will assign a domain.
   - This service listens on Railway’s injected `PORT` at runtime (recommended).
5) Deploy.

Then:
- Visit `https://<your-app>.up.railway.app/setup`
  - Your browser will prompt for **HTTP Basic auth**. Use any username; the password is `SETUP_PASSWORD`.
- Complete setup
- Visit `https://<your-app>.up.railway.app/` and `/openclaw` (same Basic auth)

### Google Calendar plugin

This template now bundles `alefsolutions/openclaw-google-calendar` into the image so setup does not need runtime GitHub access.

To enable it in `/setup`:

1. Open the **Google Calendar** section.
2. Check **Enable Google Calendar plugin during setup**.
3. Paste your Google OAuth client JSON from Google Cloud Console.
4. Optionally set redirect URI, timezone, confirmation mode, or read-only mode.
5. Run setup.

The wrapper will:

- install/link the bundled plugin into OpenClaw
- write plugin config under `plugins.entries.openclaw-google-calendar`
- store the OAuth client JSON and token file paths under the persistent state directory
- add `openclaw-google-calendar` to `tools.allow`

After setup, finish Google authorization inside OpenClaw by using:

- `google_calendar_begin_auth`
- `google_calendar_complete_auth`

The default persisted paths are:

- credentials: `/data/.openclaw/credentials/google-calendar/oauth-client.json`
- token: `/data/.openclaw/credentials/google-calendar/token.json`

## Support / community

- GitHub Issues: https://github.com/vignesh07/clawdbot-railway-template/issues
- Discord: https://discord.com/invite/clawd

If you’re filing a bug, please include the output of:
- `/healthz`
- `/setup/api/debug` (after authenticating to /setup)

## Getting chat tokens (so you don’t have to scramble)

### Telegram bot token
1) Open Telegram and message **@BotFather**
2) Run `/newbot` and follow the prompts
3) BotFather will give you a token that looks like: `123456789:AA...`
4) Paste that token into `/setup`

### Discord bot token
1) Go to the Discord Developer Portal: https://discord.com/developers/applications
2) **New Application** → pick a name
3) Open the **Bot** tab → **Add Bot**
4) Copy the **Bot Token** and paste it into `/setup`
5) Invite the bot to your server (OAuth2 URL Generator → scopes: `bot`, `applications.commands`; then choose permissions)

## Persistence (Railway volume)

Railway containers have an ephemeral filesystem. Only the mounted volume at `/data` persists across restarts/redeploys.

What persists cleanly today:
- **Custom skills / code:** anything under `OPENCLAW_WORKSPACE_DIR` (default: `/data/workspace`)
- **Node global tools (npm/pnpm):** this template configures defaults so global installs land under `/data`:
  - npm globals: `/data/npm` (binaries in `/data/npm/bin`)
  - pnpm globals: `/data/pnpm` (binaries) + `/data/pnpm-store` (store)
- **Python packages:** create a venv under `/data` (example below). The runtime image includes Python + venv support.

What does *not* persist cleanly:
- `apt-get install ...` (installs into `/usr/*`)
- Homebrew installs (typically `/opt/homebrew` or similar)

Repository note:
- The checked-in [`data/`](data) directory is a local snapshot of runtime `/data/workspace`, not the full Railway `/data` volume.

### Optional bootstrap hook

If `/data/workspace/bootstrap.sh` exists, the wrapper will run it on startup (best-effort) before starting the gateway.
Use this to initialize persistent install prefixes or create a venv.

Example `bootstrap.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Example: create a persistent python venv
python3 -m venv /data/venv || true

# Example: ensure npm/pnpm dirs exist
mkdir -p /data/npm /data/npm-cache /data/pnpm /data/pnpm-store
```

## Troubleshooting

### “disconnected (1008): pairing required” / dashboard health offline

This is not a crash — it means the gateway is running, but no device has been approved yet.

Fix:
- Open `/setup`
- Use the **Debug Console**:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

If `openclaw devices list` shows no pending request IDs:
- Make sure you’re visiting the Control UI at `/openclaw` (or your native app) and letting it attempt to connect
  - Note: the Railway wrapper now proxies the gateway and injects the auth token automatically, so you should not need to paste the gateway token into the Control UI when using `/openclaw`.
- Ensure your state dir is the Railway volume (recommended): `OPENCLAW_STATE_DIR=/data/.openclaw`
- Check `/setup/api/debug` for the active state/workspace dirs + gateway readiness

### WeChat (Tencent iLink Bot API) plugin

By default, this image **skips** preinstalling `@tencent-weixin/openclaw-weixin@2.1.1` during Docker build to avoid build-stage package registry rate limits.

If you still want build-time preinstall, enable the Docker build arg:

- `OPENCLAW_PREINSTALL_WEIXIN=1` (default is `0`)

In Railway:
1) Open your service → **Settings** → **Build**.
2) Add/append build argument: `OPENCLAW_PREINSTALL_WEIXIN=1`.
3) Redeploy.

Production recommendation:
- Prefer installing the plugin after first boot so artifacts land in the persistent `/data` volume, which is more resilient than build-stage installs under registry throttling.
- Install from `/setup` Debug Console or shell after deployment:
  - `openclaw plugins install @tencent-weixin/openclaw-weixin@2.1.1 --pin`

After deployment:
- Enable the plugin once (from `/setup` Debug Console or shell):
  - `openclaw plugins enable openclaw-weixin`
- Login the channel by QR scan:
  - `openclaw channels login --channel openclaw-weixin`

Notes:
- The Tencent plugin uses Tencent iLink Bot API.
- Current Tencent plugin behavior is private chat only.

If plugin status is `error` with a message like:

`Cannot find module 'openclaw/plugin-sdk/channel-config-schema'`

do this sequence before attempting QR login:

1) Upgrade/redeploy so core is at least `v2026.3.24` (default in this template now).
2) Reinstall and pin the plugin:
   - `openclaw plugins uninstall openclaw-weixin`
   - `openclaw plugins install @tencent-weixin/openclaw-weixin@2.1.1 --pin`
3) Check plugin health:
   - `openclaw plugins inspect openclaw-weixin`
   - `openclaw plugins doctor`
4) Restart gateway after plugin changes.
5) Add an explicit allowlist entry in your config (plugin id, not package name):

```json
{
  "plugins": {
    "allow": ["openclaw-weixin"]
  }
}
```

### “unauthorized: gateway token mismatch”

The Control UI connects using `gateway.remote.token` and the gateway validates `gateway.auth.token`.

Fix:
- Re-run `/setup` so the wrapper writes both tokens.
- Or set both values to the same token in config.

### “origin not allowed” in `/openclaw`

This means the Gateway is rejecting the browser origin for the Control UI WebSocket.

Fix:
- Set `OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS` to a comma-separated list of full origins, for example `https://your-app.up.railway.app`
- Redeploy so the wrapper can sync `gateway.controlUi.allowedOrigins`
- Verify the active values in `/setup/api/debug`

Notes:
- The wrapper will fall back to `RAILWAY_PUBLIC_DOMAIN` when available, but Railway template deploys may leave that variable empty on the first deploy
- OpenClaw requires explicit remote origins for non-loopback Control UI deployments: [Control UI docs](https://docs.openclaw.ai/web/control-ui)
- Railway template caveat reference: [RAILWAY_PUBLIC_DOMAIN may be empty on template deploys](https://station.railway.com/questions/railway-public-domain-is-always-empty-wh-ae6fd3af)

### “Application failed to respond” / 502 Bad Gateway

Most often this means the wrapper is up, but the gateway can’t start or can’t bind.

Checklist:
- Ensure you mounted a **Volume** at `/data` and set:
  - `OPENCLAW_STATE_DIR=/data/.openclaw`
  - `OPENCLAW_WORKSPACE_DIR=/data/workspace`
- Ensure **Public Networking** is enabled (Railway will inject `PORT`).
- Check Railway logs for the wrapper error: it will show `Gateway not ready:` with the reason.

### Legacy CLAWDBOT_* env vars / multiple state directories

If you see warnings about deprecated `CLAWDBOT_*` variables or state dir split-brain (e.g. `~/.openclaw` vs `/data/...`):
- Use `OPENCLAW_*` variables only
- Ensure `OPENCLAW_STATE_DIR=/data/.openclaw` and `OPENCLAW_WORKSPACE_DIR=/data/workspace`
- Redeploy after fixing Railway Variables

### Build OOM (out of memory) on Railway

Building OpenClaw from source can exceed small memory tiers.

Recommendations:
- Use a plan with **2GB+ memory**.
- If you see `Reached heap limit Allocation failed - JavaScript heap out of memory`, upgrade memory and redeploy.

### ClawHub 429 (Rate limit exceeded) during Docker build

If Docker build logs show `429` or `Rate limit exceeded` while preinstalling plugins, it usually means ClawHub/npm registry throttled the build worker.

What this template does now:
- Build-time plugin preinstall retries up to **5 attempts**.
- Backoff intervals are **2s / 4s / 8s / 16s** for rate-limit failures only.
- Non-rate-limit failures still fail fast.

If build still fails after retries:
1) Redeploy after a short cooldown (rate limits are often temporary).
2) Disable build-time plugin preinstall in `Dockerfile`.
3) Install at runtime from `/setup` Debug Console or shell:
   - `openclaw plugins install @tencent-weixin/openclaw-weixin@2.1.1 --pin`
4) Then enable/login as usual:
   - `openclaw plugins enable openclaw-weixin`
   - `openclaw channels login --channel openclaw-weixin`

## Local smoke test

```bash
docker build -t clawdbot-railway-template .

docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e SETUP_PASSWORD=test \
  -e OPENCLAW_STATE_DIR=/data/.openclaw \
  -e OPENCLAW_WORKSPACE_DIR=/data/workspace \
  -v $(pwd)/.tmpdata:/data \
  clawdbot-railway-template

# open http://localhost:8080/setup (password: test)
```

---

## Official template / endorsements

- Officially recommended by OpenClaw: <https://docs.openclaw.ai/railway>
- Railway announcement (official): [Railway tweet announcing 1‑click OpenClaw deploy](https://x.com/railway/status/2015534958925013438)

  ![Railway official tweet screenshot](assets/railway-official-tweet.jpg)

- Endorsement from Railway CEO: [Jake Cooper tweet endorsing the OpenClaw Railway template](https://x.com/justjake/status/2015536083514405182)

  ![Jake Cooper endorsement tweet screenshot](assets/railway-ceo-endorsement.jpg)

- Created and maintained by **Vignesh N (@vignesh07)**
- **11000+ deploys on Railway and counting** [Link to template on Railway](https://railway.com/deploy/clawdbot-railway-template)

![Railway template deploy count](assets/railway-deploys.jpg)

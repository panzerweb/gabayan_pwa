# Gabayan setup guide

How to run Gabayan on your own machine and how to put it online. Every command here was run
against the current code on 2026-09-25; where a step depends on your hosting provider, the guide
says what the step must achieve so you can map it to any provider.

For what Gabayan is, see the [README](../../README.md). For presenting it, see the
[demo guide](demo_guide.md).

## Contents

1. [Choose a setup](#1-choose-a-setup)
2. [Prerequisites](#2-prerequisites)
3. [Get the code](#3-get-the-code)
4. [Setup A - the PWA with the mock API](#4-setup-a---the-pwa-with-the-mock-api)
5. [Setup B - the full stack on your machine](#5-setup-b---the-full-stack-on-your-machine)
6. [Showing it on a phone](#6-showing-it-on-a-phone)
7. [Setup C - deploying online](#7-setup-c---deploying-online)
8. [Configuration reference](#8-configuration-reference)
9. [Troubleshooting](#9-troubleshooting)

## 1. Choose a setup

| Setup                                                               | What runs                                                                  | You need                        | Best for                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| [A. PWA + mock API](#4-setup-a---the-pwa-with-the-mock-api)         | The Vue app and a JSON Server mock of the API                              | Node.js, pnpm                   | Trying the app in five minutes, frontend work               |
| [B. Full stack, local](#5-setup-b---the-full-stack-on-your-machine) | The Vue app, the FastAPI backend, PostgreSQL in Docker                     | Node.js, pnpm, Python, Docker   | Backend work, and the **recommended setup for a live demo** |
| [C. Online](#7-setup-c---deploying-online)                          | The built app on a static host, the API on a Python host, managed Postgres | Accounts with hosting providers | Sharing a link, testing on phones, installing the app       |

The app is the same in every setup. The only thing that changes is `VITE_API_BASE_URL`, the API
root the app talks to.

Setup A's demo data is fixed on **2026-09-23**, so on any other day the daily-task screens look
different from the demo script. Setup B lays the demo data out around **today**. The
[demo guide](demo_guide.md#choose-the-backend) explains the difference.

## 2. Prerequisites

| Tool           | Version                                          | Needed for                      | Check with               |
| -------------- | ------------------------------------------------ | ------------------------------- | ------------------------ |
| Git            | any recent                                       | Cloning the repositories        | `git --version`          |
| Node.js        | 24 or newer (verified with 24.19)                | The PWA and the mock API        | `node --version`         |
| pnpm           | 11 or newer (the repository pins `pnpm@11.19.0`) | Installing and running the PWA  | `pnpm --version`         |
| Python         | 3.14 (verified with 3.14.7)                      | The API (setup B)               | `python --version`       |
| Docker Desktop | with Compose v2 (verified with Docker 29.7)      | PostgreSQL for the API          | `docker compose version` |
| Google Chrome  | current                                          | The Playwright browser journeys | -                        |

- **pnpm**: install it with `npm install -g pnpm`, or run `corepack enable` once so Node.js
  provides the pinned version.
- **Python on Windows**: install from python.org or the Python install manager and tick "Add
  python.exe to PATH". On macOS/Linux the command may be `python3`.
- **Docker Desktop** must be running before any `docker compose` command.

## 3. Get the code

Gabayan is two repositories. Clone them side by side and keep the folder names: the API's test
suite checks the API against `../gabayan_pwa/docs/api_contract.md`, and skips those checks when
the folder is missing.

```powershell
mkdir gabayan
cd gabayan
git clone https://github.com/panzerweb/gabayan_pwa.git
git clone https://gitlab.com/donenargan/aqua-lens-api.git
```

```text
gabayan/
|-- gabayan_pwa/     Vue PWA, mock API, API contract
`-- aqua-lens-api/   FastAPI backend, migrations, demo-data CLI
```

## 4. Setup A - the PWA with the mock API

The mock is a small Node server (`mock-api/server.mjs`) built on JSON Server. It implements the
whole [API contract](../api_contract.md) with a deterministic seed, so every screen works without a
database or Python.

### 4.1 Install and start

```powershell
cd gabayan_pwa
Copy-Item .env.example .env      # macOS/Linux: cp .env.example .env
pnpm install
pnpm mock:reset
pnpm dev:all
```

`pnpm dev:all` starts two processes side by side, labelled `APP` and `API`; `Ctrl+C` stops both.

| What         | Address                             |
| ------------ | ----------------------------------- |
| App          | http://localhost:5173               |
| Mock API     | http://localhost:3001/api/v1        |
| Health check | http://localhost:3001/api/v1/health |

### 4.2 Sign in

Open http://localhost:5173 and sign in with the demo farmer:

- Email: `juan@example.com`
- Password: `Gabayan123!`

Or choose **Get Started** to create a new account; the mock keeps it until the next reset. The
app is designed for a phone: in Chrome or Edge press `F12`, turn on the device toolbar
(`Ctrl+Shift+M`) and pick a 390 × 844 size.

### 4.3 How the mock behaves

- **Data.** `mock-api/db.json` is an untracked working copy of `mock-api/fixtures/seed.json`, and
  every change you make in the app is written to it. `pnpm mock:reset` copies the seed back. The
  running mock keeps its data in memory, so stop it first, reset, then start it again.
- **The seed day.** The seed is written for 2026-09-23 (Asia/Manila): Juan's three tasks, the
  "1 of 3 done" progress and the unread reminders belong to that day. On any other day, Home
  shows the tasks the mock raises for the real date - a feeding task per open cultivation once
  each feeding time (08:00 and 16:30) has passed.
- **Its clock.** Reminders are raised at the mock's current time. `MOCK_API_NOW` pins that time
  (the test suites use `2026-09-23T07:30:00+08:00`); the app still asks for the browser's own
  date, so pinning the mock alone does not bring back the seed day on Home.
- **Settings.** The mock reads `MOCK_API_PORT` (default `3001`), `MOCK_API_DELAY_MS` (simulated
  latency, default `250`) and `MOCK_API_NOW` from the shell environment. Node.js does not read
  `.env` for it, so set them in the shell before starting:

  ```powershell
  $env:MOCK_API_DELAY_MS = '0'     # macOS/Linux: MOCK_API_DELAY_MS=0 pnpm dev:mock
  pnpm dev:mock
  ```

- **Mock-only fixtures.** "Continue with Google (demo)" signs in as Juan, and the password-reset
  page accepts the token `demo-reset-token`. The FastAPI backend refuses both.

To run the two processes separately, use `pnpm dev` (app) and `pnpm dev:mock` (API) in two
terminals.

## 5. Setup B - the full stack on your machine

Here the app talks to the real backend: FastAPI in a Python virtual environment and PostgreSQL 16
in Docker. The commands below are run from the `aqua-lens-api` folder unless a step says
otherwise.

### 5.1 Create the Python environment

```powershell
cd aqua-lens-api
python -m venv venv
.\venv\Scripts\Activate.ps1      # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
Copy-Item .env.example .env      # macOS/Linux: cp .env.example .env
```

If PowerShell refuses to run `Activate.ps1`, allow local scripts once with
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or skip activation and call
`.\venv\Scripts\python.exe` directly in place of `python`.

Every value in `.env.example` is also its default in `app/core/config.py`, so the copied `.env`
works against the local database unchanged.

### 5.2 Start PostgreSQL

```powershell
docker compose up -d
```

This starts PostgreSQL 16 as the container `gabayan-db` on **localhost:5433** with the database
`gabayan` (user and password `postgres`). Port 5433 is used so it can run beside another
PostgreSQL on 5432; to move it, change `POSTGRES_PORT` and the port in `DATABASE_URL` together.
The data lives in the Docker volume `gabayan_pgdata` and survives restarts.

### 5.3 Create the schema and the demo data

```powershell
python -m alembic upgrade head
python -m app.cli seed-demo
```

The migrations create every table and also load the reference data: six species, three culture
environments, the stocking, water, sizing, feed, harvest and weather rules, the product catalog
and the payment options.

`seed-demo` writes the demo farmer and prints what it created:

```text
Subject           Created  Skipped
account                 5        0
cultivations           31        0
orders                  2        0
total                  38        0
```

That is Juan Dela Cruz (`juan@example.com` / `Gabayan123!`, Pro plan) with his farm, reminder
settings and delivery address, the cultivations **Tilapia Batch #001** and **Tilapia Harvest
Demo** with their records, today's tasks, notifications, and order **GBY-10245** (shipped). The
data is laid out around today in Asia/Manila; `--date YYYY-MM-DD` lays it out around another day.
A second run writes nothing, and the command refuses to run when `ENVIRONMENT=production`.

### 5.4 Run the API

```powershell
uvicorn app.main:app --reload
```

| What             | Address                             |
| ---------------- | ----------------------------------- |
| API root         | http://127.0.0.1:8000/api/v1        |
| Health check     | http://127.0.0.1:8000/api/v1/health |
| Interactive docs | http://127.0.0.1:8000/api/v1/docs   |

`/health` and `/meta` answer without signing in. The interactive docs let you call any endpoint:
sign in through `POST /auth/login`, copy the `accessToken`, and paste it under **Authorize**.

### 5.5 Point the PWA at the API

In `gabayan_pwa/.env`, switch the API root to FastAPI:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Then start only the app (the mock is not needed), bound to `127.0.0.1`:

```powershell
cd ..\gabayan_pwa
pnpm dev --host 127.0.0.1
```

Open **http://127.0.0.1:5173** - not `localhost`. The API keeps a farmer signed in with a refresh
cookie that is `SameSite=Lax` and, over plain HTTP, not `Secure`. Browsers treat `localhost` and
`127.0.0.1` as different sites, so with the app on `localhost` the sign-in works but the session
is lost on the next reload. The API's `CORS_ORIGINS` already allows both
`http://127.0.0.1:5173` and `http://localhost:5173`.

Vite reads `.env` when it starts, so restart `pnpm dev` after changing it. To switch back to the
mock, restore `VITE_API_BASE_URL=http://localhost:3001/api/v1`.

### 5.6 Everyday commands

| Task                                                | Command (in `aqua-lens-api`)                                       |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| Stop the database (data kept)                       | `docker compose down`                                              |
| Start it again                                      | `docker compose up -d`                                             |
| Apply new migrations after pulling                  | `python -m alembic upgrade head`                                   |
| Wipe everything and start over with fresh demo data | see below                                                          |
| Browse the database in Adminer                      | `docker compose --profile tools up -d`, then http://localhost:8082 |
| List the management commands                        | `python -m app.cli --help`                                         |
| Put an account on a plan                            | `python -m app.cli set-tier <email> FREE\|PRO\|ORGANIZATION`       |
| Move an order one status along                      | `python -m app.cli advance-order GBY-10245`                        |
| Run the API's tests (no database needed)            | `python -m pytest -q`                                              |

Wipe and reseed - this deletes every account and record in the local database:

```powershell
docker compose down -v
docker compose up -d
python -m alembic upgrade head
python -m app.cli seed-demo
```

In Adminer, sign in with System **PostgreSQL**, Server **db**, Username **postgres**, Password
**postgres**, Database **gabayan**.

### 5.7 Weather forecasts

Weather alerts read a daily forecast for the farm's municipality and province.

- `WEATHER_PROVIDER=open-meteo` (the default) reads [Open-Meteo](https://open-meteo.com), which
  needs no API key but does need internet access. Alerts appear only when the real forecast calls
  for them.
- `WEATHER_PROVIDER=fixture` serves the contract's fixed forecast with no network: **Dagupan City,
  Pangasinan** has hot days, **Dumangas, Iloilo** has cloudy days, **Jomalig, Quezon** has no
  readable forecast, and anywhere else is calm. Use it for a predictable demo or offline work.

Set it in `aqua-lens-api/.env`, or for one run:

```powershell
$env:WEATHER_PROVIDER = 'fixture'  # macOS/Linux: WEATHER_PROVIDER=fixture uvicorn app.main:app --reload
uvicorn app.main:app --reload
```

## 6. Showing it on a phone

Gabayan is built for phones, but a phone cannot use the development servers over a plain
`http://192.168.x.x` address: the app needs a **secure context** (HTTPS, `localhost` or
`127.0.0.1`). It creates the idempotency key of every save with `crypto.randomUUID()`, and the
service worker that makes it installable only registers in a secure context. Over plain HTTP on
the local network the screens load, but creating a cultivation, recording a feeding, saving a
record or placing an order fails.

Use one of these instead:

1. **Deploy it online** ([setup C](#7-setup-c---deploying-online)). HTTPS works on any phone, and
   the app can be installed to the home screen. Best for demos on real devices.
2. **USB port forwarding (Android + Chrome).** On the phone, turn on Developer options and USB
   debugging, then connect it by USB. On the computer, open `chrome://inspect/#devices`, choose
   **Port forwarding**, tick **Enable port forwarding** and add:

   | Backend           | Forward device port | To               |
   | ----------------- | ------------------- | ---------------- |
   | Mock (setup A)    | `5173`              | `localhost:5173` |
   |                   | `3001`              | `localhost:3001` |
   | FastAPI (setup B) | `5173`              | `127.0.0.1:5173` |
   |                   | `8000`              | `127.0.0.1:8000` |

   On the phone, open `http://localhost:5173` (mock) or `http://127.0.0.1:5173` (FastAPI). The
   phone treats these as its own loopback address, so it is a secure context.

3. **Same Wi-Fi with a Chrome flag (Android).** Find the computer's address (`ipconfig` on
   Windows, `ipconfig getifaddr en0` on macOS), for example `192.168.1.20`, and serve on it:
   - Mock: set `VITE_API_BASE_URL=http://192.168.1.20:3001/api/v1` in `.env`, then run
     `pnpm dev --host 0.0.0.0` and `pnpm dev:mock` in two terminals.
   - FastAPI: set `VITE_API_BASE_URL=http://192.168.1.20:8000/api/v1`, add
     `http://192.168.1.20:5173` to `CORS_ORIGINS` in `aqua-lens-api/.env`, then run
     `uvicorn app.main:app --host 0.0.0.0` and `pnpm dev --host 0.0.0.0`.

   On the phone's Chrome, open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, enter
   `http://192.168.1.20:5173`, set it to **Enabled** and relaunch Chrome. Then open
   `http://192.168.1.20:5173`. Allow Node.js and Python through the Windows firewall when asked.

## 7. Setup C - deploying online

An online deployment has three parts: a PostgreSQL database, the API, and the built PWA as static
files. Any providers that offer these will do; the steps below say what each part needs, with
ready-to-use settings for common choices.

```mermaid
flowchart LR
  phone["Farmer's browser"] -- "https://YOUR-APP-HOST" --> static["Static host<br/>built PWA (dist/)"]
  static -- "/api/* forwarded" --> api["API host<br/>uvicorn app.main:app"]
  api --> db[("Managed PostgreSQL 16")]
  api --> meteo["Open-Meteo"]
```

Pick hosts in or near Singapore when you can; it is the closest region most providers offer to
the Philippines.

### 7.1 Decide how the app reaches the API

The API keeps a farmer signed in with an HttpOnly refresh cookie (`gabayanRefresh`, path
`/api/v1/auth`). The access token lives only in memory, so after a reload the app depends on that
cookie. Browsers send it back reliably only when the app and the API are the **same site**. Choose
one of these layouts:

| Layout                                                                           | `VITE_API_BASE_URL`             | API cookie settings                                          | Works in                                                                                        |
| -------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **1. One origin** (recommended): the static host forwards `/api/*` to the API    | `https://YOUR-APP-HOST/api/v1`  | `REFRESH_COOKIE_SAMESITE=lax`, `REFRESH_COOKIE_SECURE=true`  | Every browser, including Safari on iPhone                                                       |
| **2. One domain, two subdomains**, e.g. `app.example.ph` and `api.example.ph`    | `https://api.example.ph/api/v1` | `lax` and `true`                                             | Every browser; needs a domain you control                                                       |
| **3. Two different sites**, e.g. a `*.vercel.app` app and a `*.onrender.com` API | `https://YOUR-API-HOST/api/v1`  | `REFRESH_COOKIE_SAMESITE=none`, `REFRESH_COOKIE_SECURE=true` | Chrome, Edge, Firefox. Safari blocks the cookie, so iPhone users are signed out on every reload |

Layout 1 is the easiest to get right and is what the rest of this section assumes. Layout 3 is
acceptable for a quick demo on Android or desktop Chrome.

### 7.2 Step 1 - the database

1. Create a **PostgreSQL 16** database with any managed provider (for example Neon, Supabase,
   Render or Railway). Note its connection string.
2. Prefer the **direct** connection string over a pooled ("transaction mode", PgBouncer) one. The
   API keeps its own connection pool, and transaction-mode poolers do not support the prepared
   statements its driver uses.
3. Rewrite the string for the API's async driver (asyncpg):
   - scheme `postgres://` or `postgresql://` becomes `postgresql+asyncpg://`;
   - `sslmode=require` becomes `ssl=require` - asyncpg stops with
     `connect() got an unexpected keyword argument 'sslmode'` otherwise;
   - drop libpq-only parameters such as `channel_binding=require`.

```text
Provider gives: postgresql://gabayan_user:S3cret@db.example.com:5432/gabayan?sslmode=require&channel_binding=require
API needs:      postgresql+asyncpg://gabayan_user:S3cret@db.example.com:5432/gabayan?ssl=require
```

### 7.3 Step 2 - the API

The API is a standard ASGI app. Whatever the host, it needs:

- **Python 3.14** and `pip install -r requirements.txt` (the test tools in `requirements-dev.txt`
  are not needed).
- To **apply migrations before it starts**: `python -m alembic upgrade head` (safe to run on every
  start; it does nothing when the schema is current).
- To **listen on the host's port and trust its proxy**, so the sign-in throttling sees each
  farmer's own address instead of the proxy's:
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips "*"`
- The **environment variables** in the table below.

Run a single process. The throttling counters and the forecast cache are kept in memory per
process, so extra workers each admit their own burst; one process is plenty for a pilot.

**Option 1 - a native Python service** (for example a Render "Web Service" or a Railway service):

| Setting           | Value                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Repository / root | `aqua-lens-api`, repository root                                                                                               |
| Python version    | `3.14` - usually a `PYTHON_VERSION` variable or a `.python-version` file containing `3.14`                                     |
| Build command     | `pip install -r requirements.txt`                                                                                              |
| Start command     | `python -m alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips "*"` |
| Health check path | `/api/v1/health`                                                                                                               |

**Option 2 - a container**, for hosts that run Docker images or cannot provide Python 3.14.
`aqua-lens-api` has a `Dockerfile` at its root: a `python:3.14-slim` image with only the app,
the migrations and the runtime dependencies. On start it applies pending migrations, then serves
on the host's `PORT` (8000 when none is set) with the proxy flags above. Its `.dockerignore` keeps
`.env`, `venv/`, `.git/`, the tests and the docs out of the image. Point the host at the repository
root as a Docker service, set the environment variables below, and use `/api/v1/health` as the
health check.

To try the image locally, with the database reachable from the container:

```powershell
docker build -t gabayan-api .
docker run -p 8000:8000 -e DATABASE_URL=... -e JWT_SECRET_KEY=... gabayan-api
```

**Environment variables for the API:**

| Variable                  | Value                                                                                | Why                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `ENVIRONMENT`             | `production` for real farmers; `staging` for a demo site that needs the demo account | Production refuses to start without a real secret and refuses `seed-demo` |
| `JWT_SECRET_KEY`          | A long random string - see below                                                     | Signs access tokens; anyone with it can sign in as anyone                 |
| `DATABASE_URL`            | The `postgresql+asyncpg://...?ssl=require` string from step 1                        | Where the data lives                                                      |
| `CORS_ORIGINS`            | `https://YOUR-APP-HOST` (exact origin, no trailing slash; comma-separate several)    | Lets the app call the API with credentials                                |
| `REFRESH_COOKIE_SECURE`   | `true`                                                                               | Required over HTTPS                                                       |
| `REFRESH_COOKIE_SAMESITE` | `lax` for layouts 1 and 2; `none` for layout 3                                       | See [7.1](#71-decide-how-the-app-reaches-the-api)                         |
| `PASSWORD_RESET_URL`      | `https://YOUR-APP-HOST/reset-password`                                               | The link in password-reset messages                                       |
| `DEMO_DATA`               | `true`                                                                               | Published by `/meta`; keep it until the rule figures are reviewed         |
| `WEATHER_PROVIDER`        | `open-meteo`, or `fixture` for a scripted demo                                       | See [5.7](#57-weather-forecasts)                                          |
| `PYTHON_VERSION`          | `3.14` (native Python hosts that use this variable)                                  | The code needs Python 3.14                                                |

Generate the secret on your own machine and paste it into the host's settings:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Leave `GOOGLE_CLIENT_ID` empty: the app's "Continue with Google (demo)" button is a placeholder
that only the mock accepts. The full list of settings is in
[8.2](#82-api-aqua-lens-api).

Once deployed, `https://YOUR-API-HOST/api/v1/health` should answer
`{"data":{"status":"ok","service":"gabayan-api",...}}`, and `/api/v1/meta` shows the
`environment` you set.

### 7.4 Step 3 - the demo account (demo sites only)

Farmers on a real deployment create their own accounts. For a demo site, seed Juan's account into
the hosted database from your own machine. The API settings read the process environment before
`.env`, so a `DATABASE_URL` set in the shell points the commands at the hosted database:

```powershell
cd aqua-lens-api
.\venv\Scripts\Activate.ps1
$env:DATABASE_URL = 'postgresql+asyncpg://USER:PASSWORD@HOST:5432/DB?ssl=require'
python -m alembic upgrade head   # harmless if the host already ran it
python -m app.cli seed-demo
Remove-Item Env:DATABASE_URL
```

```bash
# macOS/Linux
export DATABASE_URL='postgresql+asyncpg://USER:PASSWORD@HOST:5432/DB?ssl=require'
python -m alembic upgrade head
python -m app.cli seed-demo
unset DATABASE_URL
```

> **Never seed a production database.** The demo password is published in this repository. The
> command's production guard reads `ENVIRONMENT` from the machine it runs on, and your machine
> says `development`, so the guard cannot protect a hosted database from your laptop.

Seed on the day of the demo (or use `--date` with the demo day): the data is laid out around the
day it is seeded, and harvest readiness ignores growth samples older than 14 days.

### 7.5 Step 4 - the PWA

The PWA builds to static files in `dist/`. `VITE_API_BASE_URL` is **baked in at build time**, must
be a full URL (a relative `/api/v1` fails when the app starts), and must include `/api/v1`.

```powershell
cd gabayan_pwa
$env:VITE_API_BASE_URL = 'https://YOUR-APP-HOST/api/v1'   # layout 1
pnpm install --frozen-lockfile
pnpm build
```

`pnpm build` type-checks and then writes `dist/`, including the web manifest and the service
worker. On a hosting provider, set `VITE_API_BASE_URL` as a build environment variable instead,
and rebuild whenever it changes.

The static host must:

1. **Serve `index.html` for unknown paths.** The app uses history-mode routes such as
   `/app/home`, so a reload on any route must return the app.
2. **Forward `/api/*` to the API** (layout 1).
3. **Serve over HTTPS** (every static host does).

**Netlify** - `gabayan_pwa` has a `netlify.toml` at its root that does all three:

1. **Replace `YOUR-API-HOST`** in its `/api/*` redirect with the API's host (for example
   `gabayan-api.onrender.com`) and commit the change. Netlify cannot read variables in redirects,
   so this is the one line to edit.
2. In Netlify, **add the site from the `gabayan_pwa` repository**. The build command, the `dist`
   publish folder and Node.js 24 come from the file.
3. Leave `VITE_API_BASE_URL` unset. The build command sets it to the site's own address plus
   `/api/v1` (`$URL/api/v1`; deploy previews and branch deploys use their own address), which is
   layout 1. Set it in the Netlify UI only to use layout 2 or 3.
4. Set the API's `CORS_ORIGINS` and `PASSWORD_RESET_URL` to the Netlify site's address.

The build command was checked on 2026-09-25: with `URL=https://<site>.netlify.app`, the built app
calls `https://<site>.netlify.app/api/v1`.

**Vercel** - choose the Vite framework preset, set `VITE_API_BASE_URL` in the project's
environment variables, and add `vercel.json` to the root of `gabayan_pwa`:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://YOUR-API-HOST/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Any other static host** (Cloudflare Pages, Render Static Site, Firebase Hosting, nginx): publish
`dist/`, add a rewrite of every path to `/index.html`, and a proxy rule for `/api/*` to the API.
If the host cannot proxy, use layout 2 or 3 from [7.1](#71-decide-how-the-app-reaches-the-api).

With layout 1, `CORS_ORIGINS` on the API is still set to `https://YOUR-APP-HOST`: same-origin
requests do not need it, but it keeps the API's answers correct if anything calls it directly.
Open the API's interactive docs on the API host itself (`https://YOUR-API-HOST/api/v1/docs`); on
the app's host the service worker answers page navigations with the app.

### 7.6 Step 5 - check the deployment

Work through this list once after the first deployment and after any configuration change:

1. `https://YOUR-API-HOST/api/v1/health` answers `"status":"ok"`, and `/api/v1/meta` shows the
   right `environment`.
2. `https://YOUR-APP-HOST` shows the welcome screen, and reloading `https://YOUR-APP-HOST/app/home`
   does not give a 404.
3. Sign in (Juan on a demo site, or a new account), then **reload the page**: you stay signed in.
   If you are sent back to sign-in, the refresh cookie is not coming back - recheck
   [7.1](#71-decide-how-the-app-reaches-the-api).
4. In the browser's developer tools, **Application > Cookies** lists `gabayanRefresh` with the
   path `/api/v1/auth`, marked `Secure` and `HttpOnly`.
5. Create a cultivation or record a feeding. A save proves the secure context, the database and
   the idempotency keys all work.
6. **Application > Manifest** has no errors and **Service workers** shows one activated worker;
   on Android Chrome, the menu offers **Install app** or **Add to Home screen**.
7. Request a password reset and find the link in the API's logs (see below).
8. Home's weather card shows the farm's municipality and province.

### 7.7 Running it

- **Plans and orders.** There is no billing or courier integration yet, so an operator approves
  plan requests and moves orders along with the same commands as locally, pointed at the hosted
  database as in [7.4](#74-step-3---the-demo-account-demo-sites-only):
  `python -m app.cli set-tier farmer@example.com PRO` and
  `python -m app.cli advance-order GBY-10246`.
- **Password resets.** No mail vendor is wired in yet. The reset message, with its link, is
  written to the API's log as a `Mail not delivered (log adapter)` warning; read it in the host's
  log viewer.
- **Updates.** Redeploying the API applies new migrations before it starts. After a new PWA build
  is deployed, open copies of the app show "Update when you're ready to continue with the latest
  Gabayan experience" with an **Update** button.
- **Idle services.** Free plans on several hosts put an idle service to sleep, and the first
  request after that can take up to a minute. Open `/api/v1/health` a few minutes before a demo.
- **Backups.** Turn on the database provider's automatic backups before real farmers use it.

### 7.8 Before a public launch

- `ENVIRONMENT=production`, a strong `JWT_SECRET_KEY`, and `REFRESH_COOKIE_SECURE=true`.
- The demo account is not in the production database.
- The sign-in screen currently shows the demo credentials and the "Continue with Google (demo)"
  button in every build; remove them or replace them with real Google sign-in first.
- A mail vendor for password resets (the `app/shared/services/mail` adapter is the place to add
  one).
- Keep `DEMO_DATA=true` until a qualified source has reviewed the biological figures.
- The manual items in the [release checklist](../release_checklist.md): screen-reader, 200 % text
  size and contrast checks, and installation on a physical Android device and a desktop browser.

## 8. Configuration reference

### 8.1 PWA (`gabayan_pwa`)

| Variable                | Default                        | Read by                | Notes                                                                             |
| ----------------------- | ------------------------------ | ---------------------- | --------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | `http://localhost:3001/api/v1` | The app, at build time | Full API root including `/api/v1`; the only setting that differs between backends |
| `MOCK_API_PORT`         | `3001`                         | Mock (shell only)      | Port of `pnpm dev:mock`                                                           |
| `MOCK_API_DELAY_MS`     | `250`                          | Mock (shell only)      | Simulated latency per request                                                     |
| `MOCK_API_NOW`          | unset (system clock)           | Mock (shell only)      | Pins the mock's clock, e.g. `2026-09-23T07:30:00+08:00`                           |
| `CONTRACT_API_BASE_URL` | unset (in-process mock)        | Contract suite         | Runs the contract suite against another API                                       |
| `E2E_APP_PORT`          | `5174` (mock) or `5173`        | Playwright             | Port the journeys serve the app on                                                |
| `E2E_MOCK_API_PORT`     | `3101`                         | Playwright             | Port of the journeys' own mock                                                    |

Vite reads `VITE_*` values from `.env`; a variable already set in the shell wins over `.env`.

### 8.2 API (`aqua-lens-api`)

Settings are read from the process environment first, then from `.env`. Every one has a default
that works with `docker-compose.yml`.

| Variable                                                                | Default                                                             | Notes                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `ENVIRONMENT`                                                           | `development`                                                       | `production` enforces a real `JWT_SECRET_KEY` and blocks `seed-demo`    |
| `DEMO_DATA`                                                             | `true`                                                              | Published by `GET /meta`                                                |
| `DATABASE_URL`                                                          | `postgresql+asyncpg://postgres:postgres@localhost:5433/gabayan`     | Must use `postgresql+asyncpg://`; SSL as `?ssl=require`                 |
| `DB_ECHO`                                                               | `false`                                                             | Logs every SQL statement                                                |
| `CORS_ORIGINS`                                                          | `http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173` | Exact origins, comma separated; no wildcard                             |
| `JWT_SECRET_KEY`                                                        | a development value                                                 | Required in production                                                  |
| `JWT_ALGORITHM`                                                         | `HS256`                                                             |                                                                         |
| `ACCESS_TOKEN_EXPIRE_SECONDS`                                           | `3600`                                                              | Access tokens live in memory in the app                                 |
| `PASSWORD_HASH_ROUNDS`                                                  | `12`                                                                | bcrypt work factor                                                      |
| `REFRESH_TOKEN_EXPIRE_DAYS`                                             | `30`                                                                | How long a device stays signed in                                       |
| `REFRESH_COOKIE_NAME`                                                   | `gabayanRefresh`                                                    |                                                                         |
| `REFRESH_COOKIE_SECURE`                                                 | `false`                                                             | `true` over HTTPS                                                       |
| `REFRESH_COOKIE_SAMESITE`                                               | `lax`                                                               | `lax`, `strict` or `none`; `none` requires `REFRESH_COOKIE_SECURE=true` |
| `PASSWORD_RESET_URL`                                                    | `http://localhost:5173/reset-password`                              | The reset link is `<this>?token=<token>`                                |
| `PASSWORD_RESET_TOKEN_EXPIRE_MINUTES`                                   | `60`                                                                |                                                                         |
| `MAIL_FROM`                                                             | `Gabayan <no-reply@gabayan.local>`                                  | Sender shown in logged messages                                         |
| `GOOGLE_CLIENT_ID`                                                      | empty                                                               | Empty makes `POST /auth/google` answer 503                              |
| `WEATHER_PROVIDER`                                                      | `open-meteo`                                                        | `open-meteo` or `fixture`                                               |
| `WEATHER_GEOCODING_URL`                                                 | `https://geocoding-api.open-meteo.com/v1/search`                    |                                                                         |
| `WEATHER_FORECAST_URL`                                                  | `https://api.open-meteo.com/v1/forecast`                            |                                                                         |
| `WEATHER_TIMEOUT_SECONDS`                                               | `5`                                                                 |                                                                         |
| `WEATHER_CACHE_SECONDS`                                                 | `1800`                                                              | Forecast cache per place and day                                        |
| `RATE_LIMIT_ENABLED`                                                    | `true`                                                              | Sign-in throttling per client address                                   |
| `RATE_LIMIT_LOGIN`                                                      | `60/60`                                                             | `<requests>/<seconds>`                                                  |
| `RATE_LIMIT_REGISTER`                                                   | `60/3600`                                                           |                                                                         |
| `RATE_LIMIT_REFRESH`                                                    | `60/60`                                                             |                                                                         |
| `RATE_LIMIT_PASSWORD_RESET_REQUEST`                                     | `5/3600`                                                            |                                                                         |
| `RATE_LIMIT_PASSWORD_RESET_CONFIRM`                                     | `10/3600`                                                           |                                                                         |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_PORT` | `postgres` / `postgres` / `gabayan` / `5433`                        | Read by `docker-compose.yml` only; keep `DATABASE_URL` in step          |

## 9. Troubleshooting

| Symptom                                                                                            | Cause and fix                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Signed in, but sent back to sign-in after a reload (local FastAPI)                                 | The app is open on `localhost` while the API is on `127.0.0.1`. Open http://127.0.0.1:5173 and start Vite with `--host 127.0.0.1`.                                                                                             |
| Signed in, but sent back to sign-in after a reload (online)                                        | The refresh cookie is not sent back. Use layout 1 or 2 from [7.1](#71-decide-how-the-app-reaches-the-api), or with layout 3 set `REFRESH_COOKIE_SAMESITE=none` and `REFRESH_COOKIE_SECURE=true`; Safari still blocks layout 3. |
| The browser console shows a CORS error                                                             | The app's exact origin (scheme, host and port) is missing from `CORS_ORIGINS`. Add it and restart the API.                                                                                                                     |
| `TypeError: connect() got an unexpected keyword argument 'sslmode'`                                | Change `sslmode=require` to `ssl=require` in `DATABASE_URL`.                                                                                                                                                                   |
| `RuntimeError: Set JWT_SECRET_KEY before running with ENVIRONMENT=production.`                     | Set a real `JWT_SECRET_KEY`.                                                                                                                                                                                                   |
| `REFRESH_COOKIE_SAMESITE=none needs REFRESH_COOKIE_SECURE=true`                                    | Set `REFRESH_COOKIE_SECURE=true` (and serve over HTTPS), or use `lax`.                                                                                                                                                         |
| `docker compose up` fails because port 5433 is in use                                              | Set `POSTGRES_PORT` to a free port in `.env` and change the port in `DATABASE_URL` to match.                                                                                                                                   |
| Connection refused on 5433                                                                         | Docker Desktop is not running, or the container is still starting. Run `docker compose ps` and wait until `gabayan-db` is healthy.                                                                                             |
| `seed-demo refuses to run in production`                                                           | By design. Seed only a non-production database.                                                                                                                                                                                |
| Home shows other tasks than the demo script, or none                                               | The mock's data belongs to 2026-09-23. Use setup B and seed on the demo day, or see the [demo guide](demo_guide.md#choose-the-backend).                                                                                        |
| Tilapia Harvest Demo says "The latest sample is N days old" instead of potentially ready (FastAPI) | Samples older than 14 days are not used for readiness. Reseed from a fresh database on the demo day, or record a new growth sample of 350 g or more first.                                                                     |
| "Continue with Google (demo)" fails                                                                | Expected with FastAPI: the button sends a mock-only token. Sign in with email and password.                                                                                                                                    |
| The password-reset email never arrives                                                             | No mail vendor yet; the link is in the API's console or log.                                                                                                                                                                   |
| Saving anything fails on a phone, but screens load                                                 | The phone opened the app over plain HTTP on the local network. See [6](#6-showing-it-on-a-phone).                                                                                                                              |
| `429 Too Many Requests` when signing in or registering                                             | The throttling window was reached. Wait for the time in the `Retry-After` header, or restart the API (the counters are in memory).                                                                                             |
| A reload on `/app/...` returns 404 (online)                                                        | The static host is missing the rewrite to `/index.html`.                                                                                                                                                                       |
| An old version of the app keeps loading                                                            | The service worker serves the cached build until you tap **Update**. In developer tools, **Application > Service workers > Update**, or clear the site data.                                                                   |
| The weather card says the forecast is unavailable                                                  | The API cannot reach Open-Meteo (no internet, or a timeout), or the place is not recognised. Check the farm's municipality and province, or use `WEATHER_PROVIDER=fixture`.                                                    |

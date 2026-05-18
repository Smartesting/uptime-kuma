# Uptime Kuma - Deployment, Smoke, and Mutation Notes

## Build

```bash
docker build -f Dockerfile.tester-env -t tester-env-uptime-kuma .
```

Custom `Dockerfile.tester-env` uses `node:22-bookworm-slim` and builds from source with:
- `npm ci --legacy-peer-deps` (peer dependency conflicts require this flag)
- `npm run build` (vite production build)

## Run

```bash
docker run -d --name tester-env-uptime-kuma \
  -p 3001:3001 \
  -v uptime-kuma-data:/app/data \
  -e UPTIME_KUMA_DB_TYPE=sqlite \
  tester-env-uptime-kuma
```

- Port: `3001`
- URL: `http://localhost:3001`
- Requires `UPTIME_KUMA_DB_TYPE=sqlite` to skip the database setup wizard

## First-Run Setup

Create the initial admin user via Socket.IO:

```bash
docker cp scripts/setup-user.js tester-env-uptime-kuma:/app/setup-user.js
docker exec tester-env-uptime-kuma node /app/setup-user.js
```

Credentials: `admin` / `admin12345`

## Seed Data

Populate realistic monitoring data:

```bash
docker cp scripts/seed.js tester-env-uptime-kuma:/app/seed.js
docker exec tester-env-uptime-kuma node /app/seed.js
```

Seeded entities:
- 10 monitors with mixed types (7 HTTP, 3 ping) and realistic names
- 2 paused monitors (Webhook Receiver, Backup Server)
- 1 status page ("Platform Status") with 2 groups
- 1 tag ("production")
- 1 notification ("Ops Email" via SMTP)

Monitor names: Production API, Checkout Service, Auth Service, Database Primary, CDN Edge Node, Webhook Receiver, Internal DNS, Backup Server, Staging API, Legacy Portal

## Reset

```bash
docker stop tester-env-uptime-kuma
docker rm tester-env-uptime-kuma
docker volume rm uptime-kuma-data
```

Then re-run the container, setup-user, and seed steps.

## Browser Verification

```bash
docker cp scripts/browser-verify.js tester-env-uptime-kuma:/app/browser-verify.js
docker exec tester-env-uptime-kuma node /app/browser-verify.js
```

Checks:
- Login succeeds
- Dashboard shows 10 monitors
- Mix of HTTP and ping types
- All expected monitor names present
- Status page "Platform Status" exists

## Mutation Smoke

Edit `index.html` title or any frontend source, rebuild image, restart container. The change is visible in the served HTML.

## Baseline

Pinned SHA: `f43087ac075387a29aa933881fdb2e7cb114d097` (tag `2.3.2`)

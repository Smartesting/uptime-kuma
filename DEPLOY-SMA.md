# Uptime Kuma - Deployment, Smoke, and Mutation Notes

## Quick Start

```bash
./tester-env deploy    # Build image, start container, create admin user
./tester-env seed      # Populate with deterministic seed data
./tester-env verify    # Check seeded state
./tester-env reset     # Clean slate (stop + remove container + volume)
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `deploy` | Build image, start container, create admin user |
| `seed` | Populate app with deterministic seed data |
| `verify` | Run browser verification against seeded state |
| `reset` | Stop container, remove container and data volume |
| `stop` | Stop container (preserves data) |
| `logs` | Tail container logs |
| `status` | Show container status |

Options:
- `--run-id <id>` isolates container, image, and volume names for parallel scenario runs.
- `--port <port>` binds the app to a specific host port.
- `--ref <git-ref>` checks out a ref before deployment for manual runs.

## Build

```bash
./tester-env deploy
```

Parallel scenario example:

```bash
./tester-env deploy --run-id run-001 --port 3101
./tester-env seed --run-id run-001
./tester-env reset --run-id run-001
```

Custom `Dockerfile.tester-env` uses `node:22-bookworm-slim` and builds from source with:
- `npm ci --legacy-peer-deps` (peer dependency conflicts require this flag)
- `npm run build` (vite production build)

- Port: `3001`
- URL: `http://localhost:3001`
- Requires `UPTIME_KUMA_DB_TYPE=sqlite` to skip the database setup wizard

## Credentials

- Username: `admin`
- Password: `admin12345`

## Seed Data

```bash
./tester-env seed
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
./tester-env reset
```

Then run `deploy` and `seed` to start fresh.

## Browser Verification

```bash
./tester-env verify
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

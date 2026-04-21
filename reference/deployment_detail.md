# ChronoFlow Frontend – Deployment Details

## Current GCP Project

- **GCP / Firebase Project ID:** `chronoflow-474410`
- Hardcoded in three places:
  1. `.github/workflows/main.yml` — env var `FIREBASE_PROJECT_ID: "chronoflow-474410"` (line 32)
  2. `.firebaserc` — `"default": "chronoflow-474410"`
  3. `.github/workflows/main.yml` — GCS bucket name `gs://chronoflow-frontend-dev/` (lines 509, 514, 519) — this bucket lives inside the GCP project

## Authentication (GitHub Actions → GCP)

Two different auth methods are used depending on the deploy target:

### Firebase Hosting (preview + live)
- Uses **Workload Identity Federation** (keyless, OIDC-based).
- GitHub Action: `google-github-actions/auth@v3`
- Secrets required:
  - `GCP_WORKLOAD_IDENTITY_PROVIDER` — the full WIF provider resource name (e.g. `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/<POOL>/providers/<PROVIDER>`)
  - `GCP_SERVICE_ACCOUNT_EMAIL` — the SA that Firebase CLI impersonates (e.g. `firebase-deployer@chronoflow-474410.iam.gserviceaccount.com`)
- After auth, `gcloud` and `firebase` CLI inherit the federated credentials automatically via `GOOGLE_APPLICATION_CREDENTIALS`.

### GCS Bucket Deploy
- Uses a **Service Account JSON key** (static credential).
- Secret required:
  - `GCP_SA_KEY` — the full JSON key blob for a service account with `roles/storage.objectAdmin` (or similar) on the target bucket.

## Pipeline Phases

```
Push to main / PR to main or dev / Manual dispatch
        │
        v
  PHASE 1: typecheck
        │
        ├─── PHASE 2: test (non-blocking, continue-on-error)
        ├─── PHASE 3a: lint (ESLint)
        ├─── PHASE 3b: semgrep (SAST)
        ├─── PHASE 3c: sca (Trivy – CRITICAL/HIGH vulns)
        └─── PHASE 3d: secret-scan (TruffleHog)
                │
                v
          PHASE 4: build (needs typecheck + lint + semgrep + sca + secret-scan)
                │
                v
          PHASE 5: dast (OWASP ZAP baseline scan against local preview)
                │
                ├─── PHASE 6a: firebase-preview  (PRs only)
                ├─── PHASE 6b: firebase-live      (push to main only)
                └─── PHASE 7:  gcs-deploy          (push to main only)
```

## Deploy Targets

### 1. Firebase Hosting – Preview Channel (PRs)
- **Trigger:** `pull_request` events
- **What it does:** Deploys to a temporary preview channel named `pr-<PR_NUMBER>`, expires after 7 days.
- **Command:** `firebase hosting:channel:deploy pr-${{ github.event.number }} --project chronoflow-474410 --expires 7d`
- **Permissions needed:** `contents: read`, `id-token: write`, `pull-requests: write`

### 2. Firebase Hosting – Live Deploy (main branch)
- **Trigger:** `push` to `main`
- **What it does:** Deploys the `dist/` folder to the live Firebase Hosting site.
- **Command:** `firebase deploy --only hosting --project chronoflow-474410`
- **Permissions needed:** `contents: read`, `id-token: write`

### 3. GCS Bucket Deploy (main branch)
- **Trigger:** `push` to `main`
- **Target bucket:** `gs://chronoflow-frontend-dev/`
- **What it does:** Syncs `dist/` to the bucket using `gsutil -m rsync -r -d`, then sets cache headers (immutable for hashed assets, must-revalidate for `index.html`).
- **Permissions needed:** `contents: read`, `id-token: write`

## Build-Time Environment Variables (Secrets & Vars)

These are injected during the Vite build step:

| Variable | Source | Purpose |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | secret | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | secret | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | secret | Firebase project ID (runtime) |
| `VITE_FIREBASE_STORAGE_BUCKET` | secret | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | secret | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | secret | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | secret | Google Analytics measurement ID |
| `VITE_FIREBASE_VAPID_KEY` | secret | Web Push VAPID key |
| `VITE_BACKEND_URL` | **vars** (not secret) | Backend API URL |

## What to Change When Switching GCP Projects

1. **`.firebaserc`** — update `"default"` to the new project ID.
2. **`.github/workflows/main.yml`** — update `FIREBASE_PROJECT_ID` env var (line 32).
3. **`.github/workflows/main.yml`** — update the GCS bucket name in `gcs-deploy` job (lines 509, 514, 519) if the bucket changes.
4. **GitHub repo secrets** — update these to match the new project:
   - `GCP_WORKLOAD_IDENTITY_PROVIDER` — must point to a WIF pool/provider in the **new** project.
   - `GCP_SERVICE_ACCOUNT_EMAIL` — must be a service account in the **new** project with Firebase Hosting Admin permissions.
   - `GCP_SA_KEY` — must be a JSON key for a service account in the **new** project with Storage Object Admin on the new bucket.
   - All `VITE_FIREBASE_*` secrets — must match the Firebase app registered in the **new** project.
5. **GitHub repo vars** — update `VITE_BACKEND_URL` if the backend also moves.

## Notable Details

- **Concurrency:** only one workflow run per branch at a time; in-progress runs are cancelled by newer pushes.
- **Node version:** 22
- **Build output:** `dist/` directory, uploaded as artifact `dist-<SHA>` with 9-level compression, retained 7 days.
- **`firebase.json`** configures: SPA rewrite (`** → /index.html`), security headers (HSTS, CSP, nosniff, referrer-policy, permissions-policy), and cache headers (immutable for static assets, no-cache for HTML).
- **Bug:** line 276 has `VITE_FIREBASE_VAPID_KE` (missing trailing `Y`) — the VAPID key secret name is truncated.
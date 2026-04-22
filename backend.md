# Backend CORS Fix Required

## Problem
The frontend has been migrated to a new Firebase Hosting deployment. The new origin `https://chronoflow-1.web.app` is not in the backend's CORS allowed origins list. This causes **preflight 403** errors for all API requests from the frontend.

## Errors Observed
```
Preflight response is not successful. Status code: 403
XMLHttpRequest cannot load https://api.chronoflow.site/users/auth/refresh due to access control checks.
XMLHttpRequest cannot load https://api.chronoflow.site/users/auth/firebase-login due to access control checks.
```

## What Needs to Change
Add `https://chronoflow-1.web.app` to the CORS allowed origins on the backend (`api.chronoflow.site`).

The previous origin was likely `https://chronoflow-474410.web.app` or `https://chronoflow-474410.firebaseapp.com` — those can be removed if the old project is decommissioned.

## Endpoints Affected
All endpoints under `https://api.chronoflow.site` — at minimum:
- `POST /users/auth/refresh`
- `POST /users/auth/firebase-login`

## Additional Origins to Allow
Depending on your setup, you may also want to allow:
- `https://chronoflow-1.firebaseapp.com` (alternate Firebase Hosting domain)
- `http://localhost:5173` (local dev, if not already allowed)

## Context
- The frontend GCP project changed from `chronoflow-474410` to `chronoflow-1`
- Firebase Hosting now serves from `chronoflow-1.web.app`
- The frontend code itself has not changed — only the hosting origin changed
- The backend must respond to `OPTIONS` preflight requests with `Access-Control-Allow-Origin` including the new origin
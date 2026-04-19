<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/caa10c7e-353e-4c8c-83a0-b49ae055b1ea

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

### Keep Localhost Data In Sync With Zeabur

If localhost and Zeabur show different data, they are usually connected to
different PostgreSQL databases.

Use this flow to make localhost read/write the same data as Zeabur:

1. Copy [/.env.example](.env.example) to `/.env.local`.
2. In `/.env.local`, set `DATABASE_URL` to the Zeabur PostgreSQL connection string.
3. Set `POSTGRES_SSL=true` for managed PostgreSQL.
4. Start local server with `npm run dev`.
5. Verify by creating data on localhost, then refresh Zeabur UI.

Notes:

- `server.ts` accepts either `DATABASE_URL` or `POSTGRES_CONNECTION_STRING`.
- If both are set, keep them pointing to the same database to avoid drift.

## Deploy on Zeabur

This repository includes [zeabur.json](zeabur.json) with the deployment commands.

- Install command: `npm install`
- Build command: `npm install`
- Start command: `npm run dev`

Required environment variables for backend startup:

- `DATABASE_URL` or `POSTGRES_CONNECTION_STRING`
- `GEMINI_API_KEY` (if AI features are enabled)

If Zeabur service settings already define commands, keep them consistent with
`zeabur.json` to avoid config drift.

## Recommended Workflow (Your Final Goal)

### 1) Update / modify code

- Run VS Code task: `auto push github`
- This script commits and pushes current branch to GitHub.
- If current branch is `master`, it also syncs `master -> main` for Zeabur.
- Zeabur deployment menu should track `main` for automatic redeploy.

### 2) Update website information (content/data)

- Keep localhost and Zeabur connected to the same PostgreSQL database.
- Use the same `DATABASE_URL` (or `POSTGRES_CONNECTION_STRING`) on both sides.
- Restart local server after env updates.

### 3) Verify localhost <-> Zeabur data sync

- Run VS Code task: `verify localhost-zeabur sync`
- This performs two-way writes/reads:
   - local write -> remote read
   - remote write -> local read
- `PASS` means both are synced to the same data source.

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

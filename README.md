# Maui Youth Sports website

The site for MauiYouthSports.com. It currently runs as a Cloudflare Worker at
https://maui-youth-sports.mauiyouthsports.workers.dev (test address).

## What's here
- `public/`: every file the website serves (pages, images, CSS, scripts, data). This is the whole site.
  These files were copied directly from the live site on Oct 13, 2026 (version "v40-1"), so the repo matches what's live.
- `wrangler.jsonc`: Cloudflare settings (Worker name, which folder to serve, how page addresses and 404s work).
- `notes/`: planning and review notes from earlier work. Not part of the website, never served.

## How it works
- It's a plain static site: no build step, no server code.
- The Submit and Contact forms send to Formspree (`public/assets/js/formspree.js`). Submissions arrive by email
  and are reviewed before anything is published. Photo/video uploads are turned off for now.
- Scores: the homepage reads `public/assets/data/scores.json`; the Scores page currently has scores written into its HTML.
  A Google Sheet will become the place scores are kept.

## How it deploys
Today the site is uploaded by hand in the Cloudflare dashboard. Later, Cloudflare can be connected to this repo so every
change merged into `main` publishes automatically (or run `npx wrangler deploy` from this folder).

## Never commit
Passwords, API keys, tokens or a `.dev.vars` / `.env` file. This repo is public.

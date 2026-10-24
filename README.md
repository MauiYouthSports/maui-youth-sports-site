# Maui Youth Sports website

The site for MauiYouthSports.com. It runs as a Cloudflare Worker at
https://mauiyouthsports.com.

## What's here
- `public/`: every file the website serves (pages, images, CSS, scripts, data). This is the whole site.
  These files were copied directly from the live site on Oct 13, 2026 (version "v40-1"), so the repo matches what's live.
- `wrangler.jsonc`: Cloudflare settings (Worker name, which folder to serve, how page addresses and 404s work).
- `notes/`: planning and review notes from earlier work. Not part of the website, never served.

## How it works
- It's a plain static site: no build step, no server code.
- The Submit and Contact forms send to Formspree (`public/assets/js/formspree.js`). Submissions arrive by email
  and are reviewed before anything is published. Photo/video uploads are turned off for now.
- Scores: the homepage and Scores + Stats page read approved rows from the live Scores sheet at load time, including rows that do not have a game page yet. They do not fall back to `public/assets/data/scores.json` or to scores baked into the HTML. If the sheet cannot be read, those sections say so instead of showing an old snapshot.

## How it deploys
Today the site is uploaded by hand in the Cloudflare dashboard. Later, Cloudflare can be connected to this repo so every
change merged into `main` publishes automatically (or run `npx wrangler deploy` from this folder).

## Deployment
The site auto-deploys to Cloudflare Workers on every push to main.

## Never commit
Passwords, API keys, tokens or a `.dev.vars` / `.env` file. This repo is public.

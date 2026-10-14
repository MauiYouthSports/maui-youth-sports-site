# v40 launch readiness — 2026-10-10

## Completed in ZIP
- Preserved baseline v39.4 assets and pages.
- Homepage score cards now read `assets/data/scores.json`, newest verified results first, up to five; updates still require publishing updated JSON.
- Contact form added at `/contact/`, linked in footers; public Gmail address is not exposed.
- Privacy, terms and media-policy **drafts** added; require operational review.
- Submission form retains its design and adds adult/permission confirmations; nothing auto-publishes.
- Basketball: 5 documented 2025–26 MIL Division I boys schools added to directory: Baldwin High School, King Kekaulike High School, Lahainaluna High School, Maui High School, Kamehameha Schools Maui. Basketball sport guide now links to MIL.
- Added footer Contact and policy links across 295 existing HTML files.

## CRITICAL: NOT READY TO DEPLOY AS OPERATIONAL SUBMISSION SYSTEM
This ZIP contains **static assets only**. `/api/contact` and `/api/submit` require a functioning Cloudflare Worker backend, protected storage, spam protection (Turnstile verified server-side), notification service, access controls, and production secrets. This package does **not** include a deployed backend or Gmail filter. Forms must not be advertised as working until end-to-end delivery tests pass.

## Sports audit limitations
Existing 295 directory listings were retained, plus 5 verified basketball DI boys listings. The available materials do not establish a complete 27-sport, middle-school and high-school participation matrix. Do not describe the directory as comprehensively verified. Remaining schools/divisions, especially girls and DII basketball and middle school, require verification before claiming complete coverage.

## Required launch gates
1. Inspect and implement Cloudflare backend and secure media storage; configure mail to mauiyouthsports@gmail.com, Gmail labels and alerts for removals.
2. Test contact, submission, attachments, spam defenses, permissions, and unpublished moderation state.
3. Reconcile privacy policy with real service providers, data retention and deletion procedures.
4. Audit 27 sports against verified research and current MIL/other school sources.
5. Check navigation, directory filters, links, mobile layout, and live deployment; verify rollback.

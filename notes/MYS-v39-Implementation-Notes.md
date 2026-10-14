# MYS v39 Implementation Notes

Baseline: v38 complete ZIP. No deployment performed.

- Scores: retained 9 original score cards and their game URLs; added 5 research verified score cards; duplicates excluded; pre-Oct-2 results in Past Results; Oct 2 onward in Latest Scores.
- All original site assets, pages and navigation retained.
- Research CSV copied verbatim to assets/data (contains provisional/unresolved records; only verified entries displayed).
- Score filters are Sport and school/team search. Both Latest Scores and Past Results use the same /scores/ URL.
- Directory: region filter uses only the card's displayed location label, not its description or mailing address. Cards without confidently mappable Maui location are excluded from region-specific filters but remain visible under All Locations. Multi-region labels map to multiple regions. Molokaʻi and Lānaʻi remain islandwide.
- Region matches: {'Central Maui': 34, 'North Shore': 5, 'East Maui': 4, 'South Maui': 17, 'West Maui': 17, 'Upcountry': 9}; Maui listings with no safe region match: 140. These should be reviewed manually as more venue details are verified.
- Static site: no automatic Scores Bot, Cloudflare database or scheduled ingestion yet.
- Score source links from research are preserved; existing game detail pages are preserved.

---
title: "Building wenxiao.link"
date: "2026-01-20"
summary: "How this site works: Next.js + Django, publications auto-synced from Google Scholar with CORE ranks, served through a Cloudflare Tunnel."
tags: ["meta", "engineering", "self-hosting"]
---

Welcome! This site is self-hosted, and this first post is a quick tour of how it works.

## The stack

- **Frontend:** Next.js (App Router) with Chakra UI and TypeScript, served by pm2.
- **Backend:** Django + DRF on PostgreSQL, running in Docker Compose, with Hasura alongside for GraphQL when I need it.
- **Edge:** a Cloudflare Tunnel routes `wenxiao.link/api/*` to Django and everything else to Next.js.
- **Deploys:** pushing to `main` triggers a GitHub Actions workflow on a self-hosted runner: it path-diffs the commit and redeploys only the side that changed.

## Publications that update themselves

The publications list on the home page is not hand-maintained. A daily job scrapes my Google Scholar profile, upserts every paper into Postgres, and annotates each one with its [CORE rank](https://portal.core.edu.au/conf-ranks/) using a verified venue-pattern table (with a manual-override escape hatch for the inevitable edge cases). The frontend re-fetches the list with a short revalidation window, so a new paper shows up on the site within a day of appearing on Scholar, citation counts tracking along with it.

## Q&A

The [Q&A page](/qa) is a small comment board: anyone can post (signed in or as a guest), and I can reply, edit, or moderate. It runs on the same cookie-JWT auth the rest of the API uses.

If you spot something broken, that's what the Q&A page is for.

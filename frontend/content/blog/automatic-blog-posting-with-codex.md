---
title: "Automatic Blog Posting with Codex"
date: "2026-06-14"
summary: "A short note on turning a blog idea into a published post through a Codex-assisted Markdown and API workflow."
tags: ["blog-authoring", "codex", "publishing"]
---

This site now has a small agent-friendly publishing loop: I can describe a post, let Codex turn it into Markdown, and have the post published through the site API without opening an admin dashboard.

The important part is not that the workflow is complicated. It is the opposite. The blog is backed by the database, and the API accepts a Markdown document with frontmatter for the title, date, summary, tags, slug, and published state. Once the document is uploaded, the frontend reads the stored post and the public blog updates shortly after the next revalidation.

## How it works

The flow has four steps:

1. Write the post as GitHub-flavoured Markdown.
2. Include a small frontmatter block for metadata.
3. Use an authenticated owner session to send the Markdown to the blog upload API.
4. Verify the returned slug through the public blog endpoint.

That is enough to make Codex act as a lightweight publishing assistant. The agent can draft the post, choose a concise summary, pick a few tags, upload the Markdown, and check that the resulting page exists.

The tags also drive the generated teaser image. There is no separate cover image upload step. A post about agents, automation, or infrastructure can get a stable visual identity just from its tag list, which keeps publishing simple and avoids another asset pipeline.

## What stays private

The public workflow description intentionally leaves out sensitive details. Credentials, session values, cookie contents, deployment secrets, and local environment paths are not part of the post. Codex only needs to use them transiently while publishing, and they should not be written into Markdown, committed to the repository, or echoed into logs.

That separation is the useful pattern: the blog post can explain the shape of the automation while the secrets remain operational details outside the content.

## Why this is useful

For a personal site, the biggest friction is often not writing a full CMS. It is reducing the distance between an idea and a published note. This workflow keeps the site implementation conventional, with Django as the source of truth and Next.js rendering the public pages, while letting Codex handle the repetitive publishing steps.

The result is a simple loop: describe the topic, generate a clean Markdown post, upload it through the owner-only API, and verify the page. That is enough automation to make publishing feel lightweight without turning the blog into a separate product.

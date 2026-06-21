---
title: "STIndex: One Idea, One Week, One WWW Demo"
date: "2026-02-18"
summary: "Pascal pitched a sharp idea about spatiotemporal grounding for LLMs. With his guidance it came together in about a week (system, paper, and all) and landed in the WWW 2026 demo track."
tags: ["stindex", "spatiotemporal", "rag", "llm", "www2026"]
---

Some projects drag on for months. This one didn't.

The idea came from **Pascal**. He had a clear, sharp intuition: a lot of unstructured text is implicitly *spatiotemporal* ("a fire near the river last Tuesday"), but downstream systems can't use it because the *where* and *when* are never pinned to coordinates and timestamps. If you could extract and index that reliably, you'd have a unified reference layer for retrieval and situational awareness. With his guidance shaping the scope, the rest fell into place fast.

## What STIndex does

STIndex is an end-to-end **spatiotemporal information extraction** system. It uses LLMs to pull locations and times out of free text, **resolves them to coordinates and time spans**, and exposes the result as a queryable index plus an **interactive map dashboard**. The point is to give downstream RAG and situational-awareness tools a single, consistent spatiotemporal reference instead of re-parsing raw text every time.

## A week, start to finish

What I'm still a little surprised by: from the first sketch to a working system *and* a written-up paper took roughly **a week**. Tight scope, a good idea to anchor on, and a lot of momentum. It paid off: STIndex was accepted to the **[WWW 2026](https://www2026.thewebconf.org/) demo track** (Companion proceedings).

Huge thanks to Pascal for the idea and the steady guidance throughout. This one was a genuinely fun sprint.

## Try it

There's a live demo at **[stindex.ai4wa.com](https://stindex.ai4wa.com/)**. The paper is on [Google Scholar](https://scholar.google.com/citations?view_op=view_citation&hl=en&user=Yf6xHJ4AAAAJ&citation_for_view=Yf6xHJ4AAAAJ:W7OEmFMy1HYC).

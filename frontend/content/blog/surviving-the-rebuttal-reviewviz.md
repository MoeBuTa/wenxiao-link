---
title: "Surviving the Rebuttal: Why I Built Reviewvizskill"
date: "2026-06-12"
summary: "Drowning in a wall of reviewer comments during a rebuttal, I couldn't hold the thread or see what actually mattered, so I built a tool that turns the mess into a prioritized plan."
tags: ["reviewviz", "peer-review", "research", "tools"]
---

If you've ever written a rebuttal, you know the moment. The decision lands, you open the reviews, and there it is: three or four reviewers, hundreds of lines, every concern (major, minor, and "have you considered") flattened into one undifferentiated wall of text.

The first time through, I was genuinely overwhelmed. Not because the comments were unfair, but because I couldn't *hold* them. Which sentences actually demand a response? Which are editorial nits I can fix silently? Which are framing remarks I should acknowledge but won't change? By the time I'd read Reviewer 3, I'd lost the thread of Reviewer 1. I kept re-reading the same paragraphs, copying fragments into a scratch doc, and still felt like I was missing the point. Missing points is exactly how a rebuttal loses a borderline paper.

The real problem wasn't writing the replies. It was **triage**: seeing the whole surface at once, deciding what each sentence needs, and making sure my response covered everything before I started drafting.

So I built [Reviewviz](https://github.com/MoeBuTa/Reviewviz).

## What it does

Reviewviz takes the raw review text and turns it into a single, self-contained interactive HTML page:

- The **original review stays intact**, but the sentences that need a reply are **highlighted in place**, so you never lose the context a comment lives in.
- Each highlight is **colour-coded by what to do about it**: must-answer, editorial fix, or framing-to-defer.
- Those points are then **grouped and ordered by priority**, each with an **editable draft reply**, so the page doubles as the skeleton of your actual author response.

At a glance you can see what must be answered, prove your rebuttal covers all of it, and stop holding the entire review tree in your head.

## How it's built

It ships two ways: as a [Claude Code](https://docs.claude.com/en/docs/claude-code/skills) skill, and as a tiny zero-dependency CLI:

```bash
npx reviewviz
```

It runs **fully offline** and produces **one HTML file** you can open, share with co-authors, or keep private. No accounts, no upload, no sending your unpublished reviews to a server.

Want to see it before installing anything? There's a **[live demo](https://reviewviz-deploy.vercel.app/)** you can poke at in the browser.

## Why share it

This started as a selfish tool: I just wanted to survive my own rebuttal. But the overwhelm is universal, and the fix turned out to be general. Separate *triage* from *writing*, make the whole surface visible, and let priority fall out of colour and order rather than willpower. If it saves you one frantic re-read of Reviewer 3, it did its job.

The code is on [GitHub](https://github.com/MoeBuTa/Reviewviz); issues and ideas welcome.

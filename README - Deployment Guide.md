# English Online Forum — Deployment Guide

This folder contains the complete, current website: 17 static HTML pages, ready to upload to any live web host. No build step, no database, no backend required — each page carries its own CSS, fonts, icons, and images inline.

## Important: this folder was specially prepared for going live

Two things needed fixing before these files were ready for a real host, both already done:

**Internal links.** The working copy of this site (published on Claude's Artifact hosting while it was being built and reviewed) had every internal link — every nav item, footer link, "back to home," button, and language toggle — pointing to `https://claude.ai/artifact/...` URLs rather than to the other page files. That's normal for how it was hosted during development, but it would have meant the site's own navigation kept bouncing visitors back to claude.ai instead of staying on your domain. All 498 of those links across all 17 pages were rewritten to point to the actual file names in this folder instead (for example, the FAQ page's "Home" link now points to `index.html` instead of a claude.ai address).

**Document structure.** Those same working files were built as HTML *fragments* — meant to be wrapped in a full document automatically by Claude's Artifact hosting at publish time, so they never had their own `<!DOCTYPE html>`, `<html>`, `<head>`, or `<body>` tags. Browsers are forgiving enough to still render fragments like that reasonably, but without an explicit `<!DOCTYPE html>` a browser falls back to "quirks mode" rendering, which can subtly change how spacing and sizing are calculated compared to the standards-compliant rendering the site was designed and tested in. Every page in this folder now opens with a proper `<!DOCTYPE html><html lang="en">` and closes with `</html>`, so it renders the same standards-compliant way everywhere.

Both fixes were tested end-to-end — the pages were served locally, `document.compatMode` was confirmed as standards mode (not quirks mode) on multiple pages, and every internal link was click-tested to confirm navigation stays entirely within these files. The site is now fully self-contained, standards-compliant, and portable.

**A later go-live check (Sep 24) found and fixed two more issues** before this folder was considered launch-ready:
- Two category/CTA icons (the FAQ page's "Privacy & Data" icon and the "Take the Placement Test" button icon on all 5 blog posts) referenced icon glyphs that weren't part of the icon font actually embedded in the page, so they were rendering as empty boxes. Both were swapped for icons that are already embedded and used nowhere else on the same page, so nothing collides visually.
- The homepage's contact form had no way to actually send anything — clicking "Send Message" did nothing at all, silently. It now opens the visitor's email app with a pre-filled message addressed to englishonlineforum@gmail.com (name, email, and message included), and a small note under the button ("Clicking Send opens your email app...") sets that expectation up front. See "About the contact form" below for the trade-offs and an upgrade path.

All 17 pages were then re-tested in a real browser (each one loaded, console-checked, and confirmed standards mode) after these fixes.

## What's in this folder

- **index.html** — the homepage (all three languages — English, Turkish, Russian — live in this one file; visitors switch languages with the toggle, there's no separate URL per language). This was renamed from the working file's original name specifically so it loads automatically at your domain's root (most hosts serve `index.html` by default).
- **eof-placement-test.html**, **eof-placement-quick-test.html**, **eof-placement-practice-test.html**, **eof-placement-full-test.html** — the placement test landing page and its three test variants with results pages.
- **eof-exam-quick.html**, **eof-exam-practice.html**, **eof-exam-full.html** — the live exam pages.
- **eof-faq.html**, **eof-privacy-policy.html**, **eof-terms-of-service.html** — standalone info pages.
- **eof-blog.html** — the blog hub, linking to 5 posts: **eof-blog-level-up-signs.html**, **eof-blog-ielts-speaking-4-weeks.html**, **eof-blog-common-mistakes.html**, **eof-blog-daily-practice-vs-cramming.html**, **eof-blog-general-vs-business-english.html**.

## How to go live

1. **Pick a host.** Since every page is a plain static HTML file, any static host works: Netlify, Vercel, GitHub Pages, Cloudflare Pages, or traditional shared hosting/cPanel via FTP. No Node, no PHP, no database needed anywhere.
2. **Upload every file in this folder to the site's web root**, keeping the filenames exactly as they are (the pages link to each other by these exact names).
3. **Point your domain at the host.** Once DNS resolves, your domain's root will automatically load `index.html` — the homepage — the same way any static site does.
4. **Test the live links after upload** — click through the nav, footer, and language toggle once on the live domain to confirm everything resolved the same way it did in local testing.

## Good to know before you launch

- **Page weight.** The homepage is about 5MB and every other page is roughly 850KB–2.3MB, almost entirely from images and fonts embedded directly in each file. This isn't a bug — it's the trade-off of a fully self-contained, no-backend site — but it's worth being aware of on very slow mobile connections. It was already improved in this round (image dimensions + lazy loading were added site-wide); further reduction would mean re-encoding images and de-duplicating shared assets like the logo, which is a separate follow-up if you want to pursue it.
- **About the contact form.** It currently works by opening the visitor's own email app with the message pre-filled (no backend, works on any host, zero setup) — reliable, but it depends on the visitor having an email app configured on their device, and you won't get a "form submitted" record anywhere. If you'd rather have submissions land in an inbox or spreadsheet automatically even from a phone with no mail app set up, the common no-backend upgrade is a form service like Formspree or Web3Forms (a few minutes to wire up, needs a free account), or Netlify's built-in form handling if you end up hosting there. Ask if you'd like this changed later.
- **Outstanding recommendations from the review.** A few small items were flagged during the full review and optimization pass — two dead social icons in the footer (LinkedIn and TikTok currently link nowhere — send the real profile URLs and they can be wired up in a minute), some Turkish/Russian wording worth a native-speaker check, and a decision on whether to publish pricing/policy details — none of which block going live. The full list and reasoning is in the final status report already delivered separately.
- **No backend means no built-in visitor analytics.** If you want to see visitor numbers or locations once live, add a script like Google Analytics, Plausible, or Cloudflare Web Analytics after deployment — this becomes possible precisely because you're moving off Claude's Artifact hosting, which didn't allow it. One `<script>` tag per page (or a shared include, if your host supports one) is all it takes.

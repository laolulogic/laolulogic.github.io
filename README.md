# Laolu Logic — website

Static, framework-free site (HTML, CSS, vanilla JS + GSAP/Lenis from a CDN). Deploys to Vercel as-is.

## Structure
- `src/pages/*.html` — page content (edit these)
- `build.ps1` — wraps pages with the shared layout, SEO tags, header and footer; also writes `sitemap.xml` and `robots.txt`
- `index.html`, `services.html`, `real-estate.html`, `work.html`, `about.html`, `contact.html` — generated, do not edit directly
- `css/style.css`, `js/main.js` — design system and interactions
- `js/config.js` — email, WhatsApp, booking hours and the backend URL
- `backend/` — Google Apps Script for the form + calendar booking (see `backend/SETUP.md`)
- `assets/` — portrait, logos, case study images, icons, OG image
- `llms.txt` — summary for AI answer engines

## Edit → build
```
powershell -ExecutionPolicy Bypass -File build.ps1
```

## Before going live
1. Deploy the backend (`backend/SETUP.md`) and paste the Web App URL into `js/config.js`.
2. If your domain is not `laolulogic.com`, change `$SITE` at the top of `build.ps1` and in `llms.txt`, then rebuild.

## Deploy (GitHub Pages)
Hosted from the repository `<username>.github.io` (must be served from the domain root, because links start with `/`).
1. Edit → build → `git add -A; git commit -m "update"; git push`. GitHub Pages republishes in about a minute.
2. `backend/` is git-ignored on purpose; it stays on this PC.
3. Custom domain: add a `CNAME` file containing `laolulogic.com`, set `$SITE` in `build.ps1` and `llms.txt` to match, rebuild, push, then point the domain's DNS at GitHub Pages (Settings → Pages → Custom domain).
4. Submit `https://yourdomain/sitemap.xml` in Google Search Console.

`vercel.json`, `.vercelignore` and `_headers` are only used by Vercel / Cloudflare; GitHub Pages ignores them.

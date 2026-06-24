# Improvement Plan — saf1.me

Code-anchored improvement plan for `saf1.me` — an Astro **v6** resume + blog, deployed to **Cloudflare Pages** (primary) with GitHub Pages kept as a backup. Originally produced via multi-agent audits (P0–P9); P0–P9 are now resolved and archived at the bottom. This file tracks **only open work** plus a compact record of what shipped.

**Build status (last verified 2026-06-21, `development` branch):** `astro check` 0 errors / 0 warnings / 1 hint (50 files) · `eslint src/` exit 0 · `astro build` 33 pages. All green. `development` is ahead of `main` by ~89 files (balloon easter egg, SearXNG post, header/404 changes, code-review batches O16–O17).

> **Consolidation note (2026-06-18):** This plan was collapsed from 670 lines. Resolved tiers P0–P9 and the P10–P13 batches are summarized in the Archive. Duplicate item numbers were merged so each task appears once: JSON-LD (old 12↔45, done), RSS (old 15↔44), fonts (old 24↔51↔83), import-aliases (old 23↔49, done). Full history lives in git.

---

## Open work

| # | Item | Tier | Sev | Effort | Status |
|---|------|------|-----|--------|--------|
| O1 | Markdown plugin deprecation (`remarkPlugins`/`rehypePlugins`/`remarkRehype`) — warned every build, would break next Astro major | code | MED-HIGH | M | ✅ done (2026-06-18) |
| O2 | Fonts → woff2 + preload — 257 KB TTF → 86 KB | perf | MED | M | ✅ done (2026-06-18) |
| O3 | RSS full-body rendering (trailing slash + sort already done) | seo | MED | M | ✅ done (2026-06-18) |
| O4 | Slugify tag URLs (`/tags/web development/` → hyphenated) | seo | MED | S–M | ✅ done (2026-06-18) |
| O5 | CSP header in `public/_headers` | sec | MED | M | ✅ done (2026-06-18) |
| O6 | `npm audit` — 8 transitive dev-tooling vulns | hygiene | MED | S–M | ⛔ blocked on upstream (re-checked 2026-06-18) |
| O7 | "Code Projects" section linking real GitHub repos | career | HIGH | M–L | 🟢 mostly done (2026-06-19) — engineering now leads the carousel via 3 new project posts |
| O8 | Tools-page content curation (or removal) | content | LOW | S–M | ✅ done (2026-06-19) |
| O9 | Misc owner decisions (twitter handle, social-card 1200×630 redraw) | content | LOW | S | 🟡 titles verified ≤60 (no action); rest owner decision |
| — | Cloudflare Polish (old item 54) | perf | LOW | S | ⏭️ won't do — needs CF Pro+, ~zero gain |
| O19 | Balloon easter egg on blog posts | fun | LOW | S | ✅ merged into `development` (2026-06-21) — ready to ship on next `main` merge |

---

### O1. Markdown plugin deprecation ✅ done (was P9 item 80)
- **Fix:** moved `markdown.remarkPlugins`/`rehypePlugins`/`remarkRehype` onto a single `markdown.processor: unified({...})` (the documented Astro 6 migration; `processor` is a first-class schema option defaulting to `unified()`). Added `@astrojs/markdown-remark@^7.2.0` as a direct devDependency — the hoisted top-level copy was 7.1.2 (pulled by `@astrojs/mdx`) which doesn't export `unified`; 7.2.0 matches Astro's nested copy and now dedupes with it.
- **Verified in built HTML:** deprecation warning gone; `astro check` 0/0/0; `astro build` 21 pages; lint exit 0. All four behaviors confirmed via a throwaway code+link+image post: reading time (`minutesRead`), external links (`rel="nofollow noopener noreferrer" target="_blank"`), expressive-code highlighting (proves integration-injected plugins still merge into the processor), and image unwrapping. `remarkRehype.footnoteLabelProperties` carried over unchanged.

### O2. Fonts → woff2 + preload ✅ done (was items 24 / 51 / 83)
- **Fix (manual woff2 path, chosen over `astro:fonts`):** converted both Satoshi variable TTFs → woff2 with local `woff2_compress` (**257 KB → 86 KB, −66%**); deleted the TTFs. Rewrote the two `@font-face` blocks in `app.css` with `format('woff2-variations')` + `font-weight: 300 900` (the real fvar `wght` axis range — previously **no weight range was declared, so every heading/`font-bold` was faux-bolded** off the 400 default). Added an upright-face `<link rel="preload" … crossorigin>` in `BaseHead.astro` to kill FOUT (italic still loads on demand).
- **Verified:** `astro build` 0/0, fonts emitted to `dist/fonts/` (86 KB), preload present in HTML, built CSS shows `woff2-variations` + `font-weight:300 900`, no dangling `.ttf` references. The existing `/fonts/*` immutable cache header still applies (glob, not exact filename).

### O3. RSS full-body rendering ✅ done (was items 15 / 44)
- **Fix:** `rss.xml.js` now renders each `post.body` → HTML via `markdown-it` + `sanitize-html` into the item's `content` field (added all four as devDeps). `<img>` is stripped from the allowed tags because body images use relative `./` paths that only resolve through Astro's on-site image pipeline (would 404 in readers). Trailing-slash links, `publishDate`-desc sort, and `<language>` were already in place.
- **Verified:** build emits 6 `<item>`s each with a `<content:encoded>` full body (escaped HTML, 102 block tags across the feed), zero `<img>`.

### O4. Slugify tag URLs ✅ done (was P9 item 81)
- **Fix:** added `slugifyTag()` (`src/utils/slugify.ts`, barrel-exported). The `[tag]/[...page].astro` route now sets `params: { tag: slugifyTag(tag) }` and passes the human-readable tag through `props` (used for display + meta). All four tag-link sites (`Hero`, blog list pill + "view all", `tags/index`) emit slugged hrefs. Added `public/_redirects` with 301s for the six space-containing tags (`custom development`, `page speed optimization`, `web design`, `web development`, `website recovery`, `website security`).
- **Verified:** no space-containing tag dirs in `dist/tags/`; a slug page (`/tags/web-development/`) shows "#web development" and lists its 3 posts; all built hrefs slugged.

### O5. CSP header ✅ done (was P9 item 82)
- **Investigation:** Astro 6's native `security.csp` (stable) auto-hashes inline scripts/styles, which cleanly covers the `is:inline` ThemeProvider + JSON-LD — **but it's incompatible with expressive-code**, which colors code tokens via inline `style=""` attributes (Shiki dual-theme). CSP can't hash style *attributes*, and Astro's auto-added `<style>` hashes neutralize `'unsafe-inline'` per spec — so code-block colors break. There's no toggle to disable style hashing.
- **Fix:** shipped a single header-based CSP in `public/_headers` instead: `default-src 'self'; script-src/style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests`. `'unsafe-inline'` is required for the theme script + EC token styles. For a static, zero-third-party-script, zero-user-input site this is solid defense-in-depth (blocks external origins, framing, plugin/base-uri hijack) without breaking anything. Astro native CSP was reverted to avoid double-CSP + the EC break.
- **Verified:** CSP present in `dist/_headers`, no `<meta>` CSP in HTML, build clean (no Shiki/CSP warning).

### O6. `npm audit` — 8 vulns ⛔ blocked (was item 32) — re-checked 2026-06-18
- `esbuild ≤0.28.0` (dev-server, Windows-only) via `astro`→`@astrojs/mdx`; `yaml 2.0.0–2.8.2` via the `@astrojs/check` type-checker chain. **Both dev-tooling only — no production exposure** (static Linux/Cloudflare build).
- Re-confirmed: `npm audit fix` (non-breaking) is a no-op; the only available fix is `npm audit fix --force`, which **downgrades** `@astrojs/check` to 0.9.2 (breaking, reverses the P3 modernization) — not run. Clear via manual patch bumps once upstream ships them.

### O7. "Code Projects" section 🟢 mostly done (was item 16 / P7 — highest *career* leverage)
The GitHub account `lubdhak7414` tells a stronger CS story than the site showed: `pacioli` (FastAPI double-entry ledger w/ CI), the KWin circular Alt+Tab switcher, PHP/MySQL apps, `cse425-proj`, etc. The on-site carousel is data-driven from posts tagged `"project"` and **used to surface only WordPress/SEO case studies** — hiding all the engineering work.
- **Done (2026-06-19):** rather than a separate `projects.ts` section, reused the existing carousel mechanism. Wrote **3 new engineering project posts** and gave them the top `homePageIdx` slots so engineering now *leads*:
  1. `pacioli/` (idx 1) — deterministic AI ledger; cover = screenshot of the live dashboard (ran via uvicorn, captured in Chrome).
  2. `circular-alt-tab/` (idx 2) — KDE Plasma 6 KWin switcher; cover + inline image reused from the repo's `assets/preview{1,2}.png`.
  3. `php-no-framework/` (idx 3) — the BrewQuery/ShelfAware/RepBase PHP-transactions cluster; cover = BrewQuery dashboard screenshot (ran via `docker compose`, captured in Chrome).
  - WordPress/SEO posts pushed to idx 4–9 (green-bangla 4, ni-driving 5, seo-success 6, custom-ecommerce 7, recovered-hacked 8, responsive-blog 9). Build green (36 pages).
  - **Screenshot how-to (repeatable):** Pacioli boots without a real key (`GOOGLE_API_KEY=dummy`, UI renders, AI calls fail closed); BrewQuery/ShelfAware ship `docker compose up` with auto-seeded MySQL + demo creds (`manager`/`cafe123`). Chrome capture delegated to a Sonnet subagent per the browser-on-Sonnet preference.
- **Still open (owner, off-codebase):** set pinned repos + descriptions/topics on the top ~7; rewrite the profile README; commit the uncommitted `INTERNAL_ARCHITECTURE.md` to the `pacioli` repo; consider posts for `cse425-proj`/`ai-customer-support-pipeline`; `ocr-using-llm` is local-only (no remote) and needs scratch-file cleanup before publishing; add a Machine Learning thread to the skills list (`index.astro`).
- **Sev/Effort:** HIGH (career) / M–L.

### O8. Tools-page curation ✅ done (was P11)
- **Fix (2026-06-19):** kept `src/pages/tools/index.astro` and curated to the actually-used toolset. Committed a prior uncommitted revamp (IntelliJ/Sublime icons → Claude/ChatGPT/Pi/Hoppscotch/Obsidian) that had drifted in the working tree, and added **Kitty** (terminal), **Bash** (shell), **Cloudflare** (deploy & DNS), **Ollama** (local AI) to Development + **Excalidraw** (diagrams) to Productivity, each with a brand-colored SVG in `src/icons/`. Removed the now-unreferenced `intellij.svg`/`sublime_text.svg`.
- **Caught during commit:** `github.svg` was missing from disk while the page still referenced it (GitHub Desktop) — `astro check` doesn't validate `astro-icon` paths, only `astro build` does. Restored from HEAD; full build now green (21 pages). Note: GitHub Desktop has no official Linux client — if it's not actually used on CachyOS, that entry is the one remaining aspirational item.

### O9. Misc owner decisions 🟡 (was item 84 / P12 note)
- **Post titles >60 chars — verified moot (2026-06-18):** longest title is 53 chars (`A SEO Optimized Website for Green Bangla Foundation`). No action needed. (Re-confirmed 2026-06-19: new `pacioli` title is 57 chars; the over-long `php-no-framework` working title was trimmed to 51.)
- `twitter:site`/`creator` unset (no public handle on file) — owner decision.

### O10. Blog TOC overhaul ✅ done (2026-06-19)
Sentence-style headings in the new project posts made the TOC sidebar wrap to 3–4 lines per entry — a wall of text. Fixed on four fronts:
- **Shorter headings (content):** trimmed the `##`/`###` headings across `pacioli`, `circular-alt-tab`, `php-no-framework` to scannable labels (e.g. "The premise: keep the LLM away from the arithmetic" → "The premise").
- **Clamp bug (`TOCHeading.astro`):** the link had `block line-clamp-2` — `block` forces `display:block` and silently defeats `line-clamp`'s required `display:-webkit-box`, so entries never clamped. Dropped `block`; added `title={text}` (hover tooltip) and `data-toc-slug`.
- **Top-level only (`TOC.astro`):** `generateToc(headings.filter(({ depth }) => depth <= 2))` — h3+ sub-items no longer clutter the sidebar.
- **Scroll-spy:** added an `IntersectionObserver` (`rootMargin: '-80px 0px -66% 0px'`) that sets `aria-current="true"` on the in-view section's link, styled via `aria-[current=true]:font-medium`. **Gotcha:** the site has **no `ClientRouter`**, so `astro:page-load`/`astro:after-swap` never fire (ThemeProvider's after-swap listener is dormant too). Init runs directly on load (like the to-top button), guarded idempotent via a `data-spy-init` flag on `#toc-list`. Verified in Chrome (Sonnet): auto-inits, highlight tracks scroll, only the 4 h2 entries show.
- **Known dev-only noise (not introduced here, prod unaffected):** `astro dev` throws `[vite] Internal server error: Unexpected semicolon — Plugin: @tailwindcss/vite … File: /_astro/ec.qwcc5.css` — the Tailwind v4 Vite plugin choking on expressive-code's generated CSS. `npm run build` is green; live site fine. Candidate future cleanup.
- Social-card source art is **1075×709**, not the universal 1200×630 (1.91:1). Meta tags report its real dims (accurate), but regenerating at 1200×630 would render larger/uncropped across platforms — a design task.

### O11. Blog voice pass across all 9 posts ✅ done (2026-06-19)
Ran the `blog-rewrite` skill, but scoped to its safe subset only (user-chosen "voice pass + light structure") — the full skill is built for SEO marketing articles and would have violated CLAUDE.md's "zero third-party scripts" rule (Pixabay/Unsplash images, YouTube embeds), failed `astro check` (new `lastUpdated`/`coverImageAlt`/`ogImage` frontmatter not in the Zod schema), fabricated statistics into first-person project narratives, and invoked nonexistent `scripts/*.py` render/preflight scaffolding. None of that was applied.
- **What was applied to all 9 posts:** removed em-dashes (→ commas/colons/periods), swapped AI-tell phrases ("in today's digital landscape", "crucial", "seamless(ly)", "robust", "leverage", "navigate the…", "breathed new life"), varied sentence rhythm, tightened section openers, added a concise **Key Takeaways** blockquote after each intro, and turned a few statement headings into questions where natural. The 6 older WordPress/SEO posts were heavier rewrites; the 3 new engineering posts (pacioli, circular-alt-tab, php-no-framework) were light em-dash + Key-Takeaways touches.
- **Deliberately untouched:** all frontmatter (titles, descriptions, **dates** — per explicit user instruction), `coverImage`/colocated images, internal links, and the literal em-dash inside pacioli's `text` code block (it's emitted output, not prose).
- **Verified:** `astro build` green, 36 pages, 0 `astro check` errors.

### O16. Code-review findings batch (development vs main) ✅ done (2026-06-21)
Cleared all 10 findings from `plans/code-review-findings.md` (the high-effort `development` vs `main` review), then re-ran `/code-review`. Build green, **28 pages**; the new redirect guard logged "All internal _redirects targets resolve to built pages."
- **#1 build deps** — moved `markdown-it` + `sanitize-html` from `devDependencies` → `dependencies` (imported at build time by `rss.xml.js`; a `--omit=dev` install would have crashed the deploy). `@types/*` stayed in devDeps. `npm install` synced the lockfile.
- **#7/#8 single source of truth** — added `url`, `bio`, `socials.{github,linkedin,email}` to `siteConfig` (+ `SiteConfig` type). `schema.ts` now derives `PERSON_ID`/origin/`mainEntityOfPage`/`sameAs`/`email`/`description` from config; `AuthorBox`, `Footer`, `about.astro` link hrefs, and the homepage description all read from it. Killed the bio-wording drift (AuthorBox said "working on", schema said "building" → one canonical bio) and collapsed 5+ hardcoded `https://saf1.me` literals. `astro.config.mjs` `site` now reads `siteConfig.url` too, closing the origin loop.
- **#9 OG format policy** — extracted `getCrawlerSafeOgImage(src, 'png'|'jpeg')` (`src/utils/ogImage.ts`, barrel-exported); `BaseHead` (default card → PNG) and `BlogPost` (cover → JPEG q80) both call it instead of duplicating the WebP-avoidance comment + `getImage` call.
- **#5 dead TOC code** — `generateToc` collapsed to a flat h2 filter (the `depth<=2` caller filter made the whole nesting tree, `diveChildren`, orphan-promotion, and `TocItem`/recursion unreachable). `TOCHeading` simplified to a single h2 `<li>`; `TocItem` export removed.
- **#2 tag slug collision** — `getStaticPaths` now throws a named-pair error if two tags slugify to the same value, instead of crashing opaquely on duplicate static paths.
- **#3 bare tag-index redirect** — added explicit exact `/tags/<space>/ → /tags/<hyphen>/` rules (listed before the splat) so the most-linked bare index form 301s, not just paginated children.
- **#4 redirect build guard** — new inline `validate-redirect-targets` integration (`astro:build:done`) asserts every internal non-splat `_redirects` target resolves to a built `index.html`; fails the build otherwise (catches "deleted the last post carrying a tag" regressions).
- **#6 prettier** — `npm run lint` cleaned `schema.ts` + `about.astro` (and all touched files).
- **#10 heavy covers** — resized `pacioli` (1.31 MB→33 KB) and `php-no-framework` (1.88 MB→104 KB) sources to 1600px WebP; frontmatter `src` → `./cover.webp`, old PNGs deleted. (`circular-alt-tab` cover.png 614 KB left as-is — under the multi-MB threshold.)
- **Verified in dist:** about Person JSON-LD (email/bio/sameAs from config), `BlogPosting.author` keeps `name`, default card → `.png` + post cover → `.jpeg`, `_redirects` carries bare+splat tag rules.

### O17. Second code-review pass — config-drift + empty-TOC fixes ✅ done (2026-06-21)
Re-review (development working tree) surfaced 8 candidates; fixed the 4 that matter, skipped 4 non-issues. Build green, **28 pages**.
- **Footer copyright** — `© … Safwan Usaid Lubdhak` literal → `{siteConfig.author}` (config already imported in O16; was the last hardcoded name).
- **about.astro "Open source" prose** — hardcoded GitHub `href` → `siteConfig.socials.github` (the contact list below already used config).
- **index.astro "Mail me"** — `href='mailto:hello@saf1.me'` → `href={`mailto:${siteConfig.socials.email}`}`.
- **Empty TOC sidebar** — `TOC.astro` now guards on `toc.length > 0`; BlogPost's `!!headings.length` check counts all depths, so a post with only h3s (no h2) would have rendered a visible but empty "TABLE OF CONTENTS" aside. Latent (current posts all have h2s).
- **Skipped (not issues):** og:url on noindex 404 (harmless, not an index signal); RSS links lose `rel` (by-design markdown-it feed; readers sanitize); homeDescription first-char lowercase (author-controlled config, correct today); `getCrawlerSafeOgImage` returns source dims (`getImage` only reformats, never resizes here — dims equal).

### O19. Balloon easter egg on blog posts ✅ done (2026-06-21)
A small balloon drifts into the bottom-left corner on ~35% of blog-post visits; clicking it releases a swarm. Built **without** an npm dependency: pulled `balloons-js` v0.0.3 (Artur Bień, MIT), vendored only the `balloons()` swarm into `src/scripts/balloons.ts` as readable typed TS, then `npm uninstall`ed the package. Deliberately dropped the upstream `textBalloons()` helper and its ~36 KB embedded base64 font (unused, pure bloat). MIT text preserved at `src/scripts/balloons.LICENSE`; attribution in the module header.
- `src/components/blog/BalloonSurprise.astro` — teaser button (inline SVG balloon, CSS bob animation) + bundled `<script>` that gates on `Math.random() < 0.35`, a 4–12 s random reveal delay, and `prefers-reduced-motion` (nothing shows if reduce). Wired into `BlogPost.astro`. Added `@/scripts/*` tsconfig alias.
- **CSP-safe:** library uses DOM `.style` assignment + inline SVG (no network image), works under the existing `_headers` policy. No ClientRouter in this project → script runs fresh on each full page load, so no view-transition teardown needed.
- Build green (33 pages, `astro check` clean). Merged into `development` (commit `f154819`); `feature/balloons` branch kept for reference. Ships to `main` on next merge.

### O18. New post — Self-Hosting a Private SearXNG Search Engine ✅ done (2026-06-21)
New technical post `src/content/post/self-hosting-searxng/index.md` (Docker Compose + Caddy reverse-proxy self-host writeup), sourced from the vault note `Linux/SearXNG.md` (see [[vault-publishable-content]]). Reframed from a dry "setup record" into narrative voice (em-dashes stripped per the established voice pass, Key Takeaways block added). **Sanitized:** the real secret key from the vault note replaced with `<your-generated-secret>` placeholder; home paths generalized to `~/searxng`. Tags `docker/self-hosting/linux/privacy/devops`; NOT tagged `project` (it's a self-host tutorial, not own-built software, so it stays out of the homepage carousel). Build green, **29 pages**; `env` code fence switched to `ini` to clear an expressive-code "language not found" warning.
- **Cover:** owner chose an architecture diagram over a live screenshot (instance was down). Hand-authored `cover.svg` (dark, site-palette: Browser → Caddy `:80` host-exposed → internal SearXNG core + Valkey inside a dashed Docker-network boundary → upstream engines; caption reinforces "only the proxy is exposed"). Rendered via `rsvg-convert -w 1600 -h 900` → `magick … -quality 82 cover.webp` (32 KB). Both `cover.svg` (editable source) and `cover.webp` live in the post folder; `coverImage` wired into frontmatter. Processed clean (webp display + jpeg OG card).
- **Other remaining vault candidates:** La Liga ML pipeline (CSE437); Linux power-management (merge PowerSave + Battery Check).

### O15. Name/entity SEO pass + deleted-post redirects ✅ done (2026-06-20)
Owner deleted 4 blog posts (`custom-ecommerce-site`, `recovered-hacked-wordpress-site`, `responsive-blog-redesign`, `seo-success-story`) and pushed. Ran a Haiku research subagent against credible sources (Google Search Central, Ahrefs, SEJ, schema.org) first — its report changed two of my planned moves, so the plan was **not** followed literally:
- **Deleted-post 301s (topical, not generic):** `public/_redirects` now 301s each removed post to its closest surviving tag hub (`/tags/seo/`, `/tags/wordpress/`, `/tags/web-development/`×2) — Google can treat a blanket redirect to `/blog` as a soft 404. Dropped the 4 now-orphaned space-tag redirects (`custom-development`, `web-design`, `website-recovery`, `website-security`); kept the 2 still backed by a post. Verified all targets build and all orphaned tag pages are gone.
- **Person entity, NOT site-wide (reversed name-seo-plan 1.2):** research says identical `Person` on every page = duplicate entity / wasted crawl. Instead added `src/utils/schema.ts` (`PERSON_ID = https://saf1.me/#person`, shared `personSchema`/`websiteSchema`, barrel-exported). Homepage + new `/about` both emit the full `Person` sharing that `@id`; `BlogPost.astro` now references the author by `@id` only (was re-emitting a full Person per post). Added `alternateName`, `knowsAbout`, `description`, `mainEntityOfPage` to the entity.
- **`/about` entity hub (1.5):** new `src/pages/about.astro` (`<h1>About Safwan Usaid Lubdhak</h1>`, photo, bio, OSS/KDE, GitHub/LinkedIn/email, links to blog+home) + `AboutPage` JSON-LD → the Person `@id`. ~~Added **About** to the Header nav.~~ **Update (per user request):** removed the **About** nav link from `Header.astro` — it read as "cringe" in the nav. The page still builds (28 pages) and stays reachable for E-E-A-T via the author byline (`Hero.astro`) and `AuthorBox.astro` links; only the prominent nav entry is gone.
- **E-E-A-T author signals (1.3/1.4):** visible byline ("By Safwan Usaid Lubdhak" → `/about/`) in `Hero.astro`; new `AuthorBox.astro` rendered at the foot of every post (name, bio, About/GitHub/LinkedIn links).
- **Homepage metadata (1.1):** title `Home •` → `Software Developer • Safwan Usaid Lubdhak`; name-rich meta description.
- **Deliberately skipped:** name-seo-plan `/now` (1.7, thin content) and `/projects` (1.6, duplicates the home carousel) — thin/duplicate pages don't help E-E-A-T.
- **Verified:** `astro build` green, **28 pages** (36 − 4 removed posts − their now-empty tag pages + `/about`); built HTML confirmed: homepage title, `Person`+`AboutPage` @id on `/about`, `"author":{"@id":"…#person"}` + byline + AuthorBox on posts, `_redirects` copied, targets exist.
- **Review-driven follow-up fixes (`/code-review`, same day):** (1) **author.name regression** — blog-post `BlogPosting.author`/`publisher` were `@id`-only, but no `Person` node exists on post pages (BaseHead emits none) and Google requires `author.name` once an author object is present → restored `name: siteConfig.author` alongside the `@id` (keeps entity consolidation, satisfies the rich-result requirement). (2) **trailing-slash mismatch** — `personSchema.mainEntityOfPage` + `about.astro` `aboutPageSchema.url` were `…/about` while the emitted canonical is `…/about/` → fixed to match. (3) **byline single source of truth** — `Hero.astro` hardcoded the name → now `{siteConfig.author}`. Independent review subagent re-verified all three in built HTML; build clean. (Open nit: `personSchema.url` is `https://saf1.me` vs homepage canonical `https://saf1.me/` — cosmetic, untouched.)

### O14. RepBase cover + inline shots + de-bold pass ✅ done (2026-06-20)
- Swapped `php-no-framework` cover from BrewQuery Reports (O13) to the **RepBase class schedule** screenshot; updated `alt` to match. Added 3 inline screenshots to the post body (BrewQuery reports, ShelfAware overdue, RepBase roster), colocated in the post folder.
- Deleted the throwaway `php-cover-candidates` draft gallery (+ its 13 images).
- De-bold pass across all 9 posts via a **Haiku** subagent (it hit a session limit mid-run, so I verified its work fully): removed gratuitous mid-prose `**bold**`, kept bold only as structural labels — `**Key Takeaways**` (present in all 9) and list-item lead labels (incl. ordered-list `1. **…**:` in seo-success-story).
- Verified mechanically: stripping `**` from HEAD vs working tree leaves the 8 non-php posts byte-identical (only `**` removed, zero word changes); php-no-framework's only extra diff is the intended alt + image lines.
- **Verified:** `astro build` green, 36 pages, new cover + inline images → hashed WebP.

### O13. Better cover for `php-no-framework` ✅ done (2026-06-20)
The old `cover.png` was the sparse BrewQuery "Our Menu" page (half-empty frame). Replaced it with a data-dense **BrewQuery Reports** screenshot (Low-Stock Alert + Daily Z-Report + Top Items) captured by running the app in Docker with injected dummy data. Stayed in the BrewQuery family so the existing `alt: 'BrewQuery café back-office dashboard'` is now accurate — no frontmatter change. New source is 2880×1800 (retina, same 16:10 as before); Astro emits a 107 kB WebP.
- Captured all 3 PHP repos (BrewQuery/ShelfAware/RepBase) via 3 parallel Opus subagents running each project's Docker Compose. Candidates kept in `/tmp/php-shots/` for now (not committed).
- Side find: `revenue.php` in **RepBase** throws under MySQL 8's default `ONLY_FULL_GROUP_BY` (selects `DATE_FORMAT(p.PaidAt,…)` while grouping by `yr, mo`). Real defect in that repo, noted for later.
- **Verified:** `astro build` green, 36 pages, cover → `/_astro/cover.*.webp` (107 kB).

### O12. Staging QA + footer external-link fix ✅ done (2026-06-20)
Ran two browser QA passes (Sonnet, Chrome DevTools MCP) against the `development` staging deploy (development.lubdhak.pages.dev) after the O11 voice pass: one content/visual/functional, one technical/network/security/perf. Result: zero broken issues. All 9 posts render their Key Takeaways blockquote correctly, no stray em-dashes in prose, code blocks/TOC/images all good; Lighthouse 100/100/100 (a11y/best-practices/SEO) desktop + mobile; all 6 security headers present; CSP correctly blocks the Cloudflare-injected `static.cloudflareinsights.com/beacon.min.js` (console-only noise — disable Web Analytics in the CF dashboard to silence, do **not** allowlist it).
- **Fixed:** footer LinkedIn + GitHub `<a>` in `src/components/layout/Footer.astro` were missing `target="_blank"`/`rel="noopener noreferrer"` (the `rehype-external-links` plugin only rewrites markdown, not Astro templates). Added both attributes; mailto link left as-is.
- **Verified:** `astro build` green, 36 pages, 0 `astro check` errors.

---

## <RECENT CHANGES> (2026-06-24 session)

Multi-agent website audit (6 parallel Explore agents: SEO, Performance, Code Quality, Content Strategy, Security, Design/UX) produced a unified 24-item improvement plan. Implemented in 3 waves (2 Sonnet workers + 1 Opus reviewer per wave). Build green after each wave: 33 pages, 0 errors.

### O20. SEO structured data enrichment ✅ done (2026-06-24)
- **BreadcrumbList** JSON-LD on all blog posts (`BlogPost.astro`): Home → Blog → Post Title, using canonical trailing-slash URLs (`postUrl`, `blogUrl`) per Opus review (not `Astro.url.href` which may lack trailing slash).
- **CollectionPage** JSON-LD on tag archive pages (`tags/[tag]/[...page].astro`): name/url/description, URL built via `new URL()` for canonical form.
- **`timeRequired`** added to BlogPosting schema: parsed from `remarkPluginFrontmatter.minutesRead`, emitted as ISO 8601 `PT${n}M`.
- **Person schema split**: `givenName: "Safwan"`, `familyName: "Lubdhak"` added to `schema.ts` (middle name "Usaid" correctly excluded from familyName).

### O21. DOM null-safety pass ✅ done (2026-06-24)
- **BlogPost.astro scroll-to-top**: removed `as HTMLButtonElement`/`as HTMLDivElement` casts, wrapped in IIFE with `if (!scrollBtn || !targetHeader) return` guard. Retained `scrollBtn!` inside callback closure (TS can't narrow past closure boundary; safe because guard runs before observer wires).
- **ProjectCarousel.astro constructor**: removed `!` non-null assertions on `querySelector` calls, replaced with typed generics + local const + early-return guard. Added `!:` definite-assignment assertions on class properties (assigned when constructor doesn't early-return).
- **BalloonSurprise.astro**: already null-safe (uses `as ... | null` + conditional guard). No change.

### O22. Contrast + caching + font preload ✅ done (2026-06-24)
- **Light-mode contrast**: `--muted-foreground` changed from `240 4% 40%` → `240 5% 30%` in `app.css` (dark theme untouched). Improves WCAG AA ratio for blog dates, breadcrumbs, metadata text.
- **Cache-Control headers**: added `Cache-Control: public, max-age=3600, must-revalidate` to the `/*` catch-all in `public/_headers`. Opus review caught that separate `/blog/*` and `/tags/*` rules would have **dropped all security headers** on those routes (Cloudflare Pages applies only the winning rule, no merge) — reverted to catch-all only.
- **Italic font preload**: added `<link rel="preload" ... Satoshi-VariableItalic.woff2>` in `BaseHead.astro` after the existing upright preload.

### O23. DRY 404 + observer leak + ThemeProvider typing ✅ done (2026-06-24)
- **DRY 404 excuses**: created `src/data/excuses.ts` (22 unique excuses, merged+deduped from both arrays). `404.astro` frontmatter imports it; inline script reads via `<script is:inline type="application/json" id="excuses-data">` + `JSON.parse(dataEl?.textContent)` (null-safe per Opus review). Uses `var` in inline script (cautious for `is:inline` context).
- **TOC observer leak**: moved `activeObserver?.disconnect()` + `activeObserver = null` before the early-return guard in `TOC.astro:initTocScrollSpy()`. Previously, if `list` was null on re-init, the function returned without disconnecting the prior observer.
- **ThemeProvider typing**: added JSDoc `@param {string | null} newTheme` on `setTheme()` (TS annotations would break `is:inline`). Changed `e.detail.theme` → `e.detail?.theme` for null safety.

### O24. ESLint rules + devDeps + reduced-motion ✅ done (2026-06-24)
- **ESLint**: added `no-console: 'warn'` and `@typescript-eslint/no-unused-vars: ['warn', { argsIgnorePattern: '^_' }]` to `eslint.config.js`. Note: lint script targets `src/` so config files won't warn.
- **Build deps to devDeps**: moved `markdown-it` and `sanitize-html` from `dependencies` to `devDependencies` (only used at build time by `rss.xml.js`). `sharp` left in dependencies. Lockfile updated.
- **Carousel reduced-motion**: added `motion-reduce:transition-none` to both nav button class lists in `ProjectCarousel.astro` (JS auto-scroll was already gated; this covers the CSS opacity transitions).

### O25. code-review (high) follow-up fixes ✅ done (2026-06-24)
- **JSON-LD `</script>` hardening**: added `jsonLdScript()` (`src/utils/jsonLd.ts`, barrel-exported) that escapes `<` → `<`. Replaced all 8 inline `set:html={JSON.stringify(...)}` sinks (`BlogPost` ×2, tags archive, `about` ×2, `index` ×2, 404 excuses JSON) so an author title/tag containing `</script>` can't break out of the inline script. Valid JSON, parses identically.
- **TOC observer ordering reverted**: O23 had moved `activeObserver?.disconnect()` *before* the `spyInit` guard; restored it to *after* the guard so a repeat same-DOM `initTocScrollSpy()` call can't tear down a live observer without rebuilding it.
- **Italic font preload removed**: O22 added an unconditional `<link rel=preload>` for `Satoshi-VariableItalic.woff2`; removed it (wasted first-paint bandwidth on the many pages with no italics). Italic is back to load-on-demand. CLAUDE.md gotcha + comment updated.
- **Lint regressions fixed (caught re-running `npm run lint`, which the build's `astro check` does not run)**: O23's 404 inline script used `var` ×6 — `no-var` errored now that O24 tightened ESLint; reverted to `const`/`let`. O20 added an unused `import { siteConfig }` to the tag route (schema uses `Astro.site`); removed it.
- **Verified**: `astro check` 0 errors, `astro build` 33 pages, `eslint src/` exit 0, redirect targets resolve.

### O26. Mobile TOC ✅ done (2026-06-24)
- **Fix:** Added a native `<details>` disclosure inside `<article>` (after hero, before prose) with `lg:hidden` — visible only on mobile/tablet where the sidebar TOC is hidden. Wraps in `<nav aria-label='Table of contents'>` for SR landmark consistency. Reuses existing `TOCHeading` component. Desktop sidebar TOC unchanged.
- **Verified:** build green, 33 pages. Details element is collapsible, keyboard-accessible, hidden on `lg+`.

### O27. Related posts ✅ done (2026-06-24)
- **Fix:** Added `getRelatedPosts()` to `src/utils/post.ts` (barrel-exported): scores posts by shared-tag count, tie-breaks by `updatedDate ?? publishDate` (matching site's canonical sort), returns top 3. New `RelatedPosts.astro` renders after `AuthorBox` in `BlogPost.astro` — guards on empty array (renders nothing if no related posts). `[slug].astro` computes related posts at build time in `getStaticPaths`. Share buttons deliberately excluded per user preference.
- **Verified:** build green, 33 pages. Posts with shared tags show related posts; isolated posts show nothing.

### O28. Hover state consistency ✅ done (2026-06-24)
- **Fix:** All interactive elements now hover toward MORE prominence (not less):
  - **PostPreview**: `hover:text-muted-foreground` (dimming) → `hover:underline underline-offset-2` (additive affordance)
  - **Header nav**: `hover:text-foreground/75` (dimming) → `hover:underline underline-offset-4`
  - **Footer icons**: `hover:text-muted-foreground/75` (dimming) → `hover:text-foreground` (brightens)
  - **AuthorBox links**: `hover:text-foreground/75` (dimming) → `hover:underline underline-offset-2`
- Pattern: text links use underline on hover; icon links use color intensification; buttons use bg change; cards use border+shadow. All now consistent.

### Still open (from audit — content/design, not code-automatable)
| # | Item | Category | Notes |
|---|------|----------|-------|
| O25 | Homepage bio refresh | content | Reflect Ireland, specialization, add CTA above fold |
| O29 | About page professional depth | content | Timeline, metrics, testimonials, certifications |
| O30 | Dedicated `/projects` page | content | Live demos, repo links, tech stack, outcomes |
| O31 | 4 foundational blog posts | content | DevOps 101, AWS guide, ML in production, Linux sysadmin |

---

## Archive — completed work

> Detail for every item below is in git history (PLAN.md before the 2026-06-18 consolidation). Build was re-verified green after each batch.

**P0 — production fixes:** CNAME, all Open Graph image paths (default + per-post via `coverImage` fallback, absolutized with `Astro.site`), PWA manifest icon paths, nested-anchor header fix, template-default metadata personalization. *(CI `check` job and Vercel-dep removal skipped — see P4.)*

**P1 — high value:** reduced-motion guards (Header + carousel), `data-theme` sync for code blocks, a11y skip-link + focus-visible, image `loading="lazy"` on below-fold images, `robots.txt`→sitemap, `theme-color` meta + manifest colors, projects section auto-populated from posts tagged `"project"`.

**P2 — maintainability:** `ProjectCarousel.astro` rewrite (rAF auto-scroll, a11y buttons, IntersectionObserver teardown), `Props` interfaces on 6 components, `BackButton.astro` extraction + `ProjectCard.astro` deletion, dead-code/asset purge, typed `remarkReadingTime`. *(Resume-data extraction, woff2 fonts, and some import-aliasing skipped/deferred.)*

**P3 — platform modernization:** Astro 4.16 → **6.4.8** (Content Layer API, `glob` loader, `slug`→`id`, `render(entry)`); Tailwind 3 → **4** (CSS-first `@theme inline`, `@tailwindcss/vite`); ESLint 8 → **9** flat config; removed vestigial Vercel/Tailwind/jsx-a11y deps.

**P4 — correctness/hygiene:** Cloudflare migration (`public/_headers` added; GH-Pages kept as backup per owner); fixed the **"Lubhdak"→"Lubdhak"** brand typo site-wide; finished `package.json`/README/LICENSE cleanup + `check` script; unified contact email to `hello@saf1.me`; removed dead `console.log`/`X-UA-Compatible`/empty `class=''`. *(`ocs-site-verification` meta KEPT intentionally — opendesktop.org verification, owner decision.)*

**P5 — quality/a11y/SEO:** deleted 7 unused assets + shrank `face.png` (397 KB→19 KB); fixed heading hierarchy (one `<h1>` per page); Footer icons → Lucide strokes; descriptive `aria-label`s + decorative-SVG `aria-hidden` + non-interactive skill pills; `rel="noopener noreferrer"` on external links + `rehype-external-links` rel array; JSON-LD `Person` + `BlogPosting`; pagination/label/title nits.

**P6 — DX/platform:** pinned Node (`engines.node` + `.nvmrc`); `check` script + widened lint glob to `.mjs`/`.cjs`; added `@/styles`,`@/content`,`@/utils/*` aliases; conditional `data-astro-prefetch` on `Button`.

**P8 — performance:** `/fonts/*` immutable cache headers; moved `social-card.png` into `src/assets/` + `getImage()` (125 kB→31 kB WebP). *(Markdown collection images confirmed already sharp-processed — no work needed; CF Polish declined.)*

**P9 — multi-agent re-audit (24 items):** verified bugs (double-nested `<li>`, real `og:image` dims, non-mutating sort, `generateToc` orphan-heading guard, undefined `text-bgColor` class, nav trailing slashes); SEO/metadata (blog-list + tools descriptions, 404 `noindex`, `BlogPosting` `publisher` + correct `published`/`modified` times, Twitter `name=` tags + `WebSite` schema, RSS `<language>`, PWA `start_url`/`scope`); security headers (`X-Frame-Options`, `Permissions-Policy`, HSTS); dead-code/a11y/DX sweep (`menuLinks`, `iconBgColour`, Pagefind attrs, `Card` glob, decorative-SVG `aria-hidden`, `TagIcon.astro` dedup, landmark restructure, `generator` meta). Followed by a 3-agent review pass that hardened the `generateToc` guard and gated `getImage()`.

**P10/P13 — mobile + tap targets:** `SkillLayout` width gating, `w-screen`→`w-full` (phantom-scrollbar fix), enlarged pill/footer-icon hit areas to ~WCAG 2.5.5. Verified via live chrome-devtools audit at 375/768/1280 — no overflow, no console errors.

**P12 — OG format hardening:** forced OG images off WebP (default card → PNG, per-post cover → JPEG q80) for reliable LinkedIn/legacy-crawler previews; de-fragilized `Card.astro` logo glob (moved logos to `src/assets/logos/`, glob by extension).

**ONBOARDING.md:** rewritten 2503→467 lines, ~30 technical inaccuracies fixed, every example verified against source.

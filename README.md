# rmlgrowth-site

Marketing website for **RML Growth Partners LLC** (rmlgrowth.com). Version 2.

Plain static HTML, one CSS file, and a small vanilla JS file. No build step and no dependencies: GitHub Pages serves the repo as it is from the `main` branch root.

* Live: https://rmlgrowth.com (launched October 11, 2026)
* The old preview URL https://ryanlein43-max.github.io/rmlgrowth-site/ now redirects to the domain.

## Structure

```
index.html            Home: hero, how we work, services, who we serve, closing call to action
book/index.html       /book: book a call form (phone required, preferred call times)
contact/index.html    /contact: inquiry form (phone optional)
404.html              Not found page (root absolute paths, because it is served at any URL depth)
styles.css            All styles, including the self hosted @font-face rules
main.js               Header blur on scroll, mobile menu, scroll reveal, loop videos, form handling
assets/favicon.svg    RML monogram (also used as the header and footer logo mark)
assets/fonts/         Inter and Source Serif 4, latin subset, variable woff2 (SIL Open Font License)
assets/img/           WebP images, 800w and 1400w versions for srcset
assets/video/         Loop videos: 720p (default) and 1080p (wide screens), plus WebP posters
```

Home page anchors: `#how-we-work`, `#services`, `#multi-channel`, `#seo`, `#meta-ads`, `#lead-gen`, `#who-we-serve`.

## Editing

1. Copy comes from `copy-v2.md` (Marketing). Change wording there first, then mirror it in the HTML. Visible copy must not contain em dashes, en dashes, or hyphens used as dashes.
2. **Keep every link and asset path relative** (`./book/`, `../styles.css`, and so on). The preview runs under the `/rmlgrowth-site/` subpath, and relative paths let the same files work there and at the domain root later. Do not use root absolute paths like `/styles.css`. The one exception is `404.html`, which GitHub serves at any URL depth, so it uses root absolute paths.
3. The header and footer are repeated in `index.html`, `book/index.html`, `contact/index.html`, and `404.html`. Update all four when nav items change.
4. Preview locally: run `python3 -m http.server 8000` in the repo, then open http://localhost:8000/.
5. Commit and push to `main`. GitHub Pages redeploys automatically, usually within a minute.

Palette (see `:root` in `styles.css`): deep green `#0B3D2E`, mid green `#145C43`, gold `#C4A35A` (small accents only), text `#1A1F1C`, background `#F7F6F2`, neutral `#E8E6E1`, white cards. Type: Source Serif 4 for large headings, Inter for everything else.

Content rules: no About, Impact, or team pages; no invented metrics, testimonials, client logos, stock team photos, or response time promises.

## Brand and v3 notes

* Logo: R mark (direction 4). Header and footer use `assets/logo/r-mark-lockup-on-light.svg` (coordinates rounded, viewBox cropped to the artwork). Favicons: `assets/favicon.svg`, `assets/favicon-32.png`, `assets/favicon-16.png`, and `assets/apple-touch-icon.png` (180 px, rendered from the icon SVG on the site background).
* No share image exists yet, so pages carry no og:image or twitter:image. Add one at `assets/og-image.png` (1200 x 630) and reference it with an absolute https://rmlgrowth.com/ URL.
* AI search optimization: card `#ai-search` (spans both columns at 960 px and up) and explainer `#ai-search-explained`. The card image ships at 800 px only.
* The home page carries JSON-LD Organization schema listing the five services.

## Media notes

Source files and masters live outside this repo (`rml-site-v2/assets`). Placement follows `shot-list.md`.

* **Images** are WebP, resized to 800px and 1400px wide versions for `srcset`. All have `width`/`height`, `decoding="async"`, and `loading="lazy"` (nothing above the fold is an `<img>`; the hero is a video poster that gets preloaded).
* **Example work label:** every mockup of an ad, site, form, or search result carries a visible "Example work" corner tag. These are sample creative, never client results. Keep the tag on any new mockup.
* **Videos** (hero: homes with roofing and HVAC; services band; Who we serve: golf fairway feature and the roofing and HVAC card) are decorative, muted, `playsinline`, `preload="none"`, with WebP posters. The HTML default source is the 720p file. `main.js` switches to the 1080p file on wide screens (viewport 1024px or more and at least 1600 device pixels wide, unless Data Saver is on). Smaller slots (cards and the golf feature) only switch on high density screens.
* Playback starts only when a video scrolls into view (IntersectionObserver) and pauses when it leaves or the tab is hidden.
* **Loop crossfade:** the clips are 5 seconds and not seamless, so `main.js` stacks two `<video>` elements and crossfades between them over 0.4s at each loop point. The clip is downloaded once (fetch, then a blob URL shared by both elements), so the second element costs no extra bandwidth.
* **Hero exception:** the hero clip (`hero-homes-roofing-hvac-loop`) is a ping pong edit whose last frame matches its first, so it uses a plain native `loop` on a single element (`data-native-loop`). A crossfade on that clip would blend frames moving in opposite directions and soften roof edges for no benefit.
* The hero scrim is brand green, weighted to the left on desktop (behind the headline) and an even top to bottom wash on mobile.
* **Reduced motion:** with `prefers-reduced-motion: reduce`, videos never load or play (the poster still shows), and scroll animations are off.
* Each video has a small pause and play button.
* To re-encode a 1080p loop: `ffmpeg -i master.mp4 -an -c:v libx264 -preset slow -crf 23 -maxrate 6000k -bufsize 12000k -pix_fmt yuv420p -movflags +faststart name-1080p.mp4`

## Form backend: FormSubmit

Both forms post with `fetch` to `https://formsubmit.co/ajax/ryanlein@rmlgrowth.com` (free, no account). That address forwards to Ryan's Gmail.

* Hidden fields: `_subject` ("New call request from rmlgrowth.com" or "New inquiry from rmlgrowth.com"), `_template=table`, `_captcha=false`, a `Form source` value, and a `_honey` honeypot for spam.
* The visitor's `email` field becomes the reply to address.
* **Activation required:** the first submission to a new address makes FormSubmit send an activation email to **ryanlein@rmlgrowth.com**. Nothing is delivered until Ryan clicks the confirmation link in that email. After launch, do one test submission from the live site, confirm the activation email, then submit again to check delivery. (Any earlier activation for a different address does not carry over.)
* After activation, FormSubmit may offer a random alias for the address. You can swap it into the form `action` to keep the address out of the page source.
* Success replaces the form with the page's thank you message. If sending fails, a message offers the email address instead.

## Launch and DNS: rmlgrowth.com on Porkbun (live)

Launched October 11, 2026.

* **Porkbun DNS** (applied by the Project Lead):
  * Apex `A`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  * Apex `AAAA`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
  * `www` `CNAME` to `ryanlein43-max.github.io`
  * Porkbun parking ALIAS and wildcard records removed
  * Email records left as they were: MX `fwd1.porkbun.com` and `fwd2.porkbun.com`, SPF TXT `v=spf1 include:_spf.porkbun.com ~all`. Keep them, or ryanlein@rmlgrowth.com forwarding (and the form emails) will stop.
* **GitHub Pages:** the `CNAME` file in the repo root contains `rmlgrowth.com`, and the Pages custom domain is set to the same value. Do not delete the `CNAME` file; it removes the custom domain.
* **HTTPS:** GitHub issued a certificate for `rmlgrowth.com` and `www.rmlgrowth.com`, and Enforce HTTPS is on. GitHub renews it automatically, as long as DNS keeps pointing at GitHub.
* **Redirects (handled by GitHub):** `www.rmlgrowth.com` goes to the apex, `http` goes to `https`, and the old github.io preview URL goes to the domain.
* **Optional hardening:** verify `rmlgrowth.com` under GitHub account settings, Pages, Verified domains. This adds a `_github-pages-challenge-ryanlein43-max` TXT record at Porkbun and prevents domain takeover. It has not been done yet.
* **Forms:** FormSubmit activation for ryanlein@rmlgrowth.com still needs the first real submission and Ryan's confirmation click (see the Form backend section).

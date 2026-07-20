# Ethan Fong Coaching — Landing Page & Inquiry Quiz

A static, self-contained landing page for Ethan Fong, a Division I triple jump &
long jump athlete and youth jumps coach at San José State University. It is plain
HTML, CSS, and vanilla JavaScript — no build step, no frameworks, no
dependencies. The design is mobile-first and progressively enhanced: core content
works without JavaScript, and the multi-step inquiry quiz emails leads directly to
the coach via [Web3Forms](https://web3forms.com).

## Run locally

From the repo root:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser. You can also just open
`index.html` directly in a browser — everything is self-contained, so no server is
strictly required (a server just gives you clean URLs and avoids `file://` quirks).

## Set up lead-capture email (Web3Forms)

The inquiry quiz sends submissions through Web3Forms, which forwards them to your
email. It is free and requires no backend.

1. Sign up for a free account at <https://web3forms.com>.
2. Create an access key (Web3Forms ties each key to a destination email address —
   inquiries will be emailed to whatever address you register).
3. Open `js/quiz.js` and replace the `[YOUR_WEB3FORMS_ACCESS_KEY]` constant near
   the top of the file with your real access key.

Until you add a real key, quiz submissions fail on purpose — the placeholder key is
invalid, so no data goes anywhere.

## Replace the placeholders

Every fact the site can't yet confirm is shown as visible `[placeholder]` text or
graphics, so nothing looks final until you fill it in. Search the project for
`placeholder` to find them all. They live in:

- **Hero & bio copy** — `index.html` hero section and `#bio` section: the bio
  paragraph, triple/long jump PRs (`[PR placeholder]`), and accolades
  (`[accolade placeholder]`).
- **Program format** — `#program` section: `[format placeholder]`.
- **Testimonials** — `#testimonials` section: quote text, athlete/parent names.
- **Results** — `#results` section: before/after captions and the highlight tiles
  (mark improvement, weeks of commitment, athletes coached).
- **Footer** — email address (`[email placeholder]`) and social links
  (`[social placeholder]`) in the footer and the `<noscript>` fallback.
- **Image placeholders** — the three SVGs in `assets/`
  (`hero-action.svg`, `headshot.svg`, `before-after.svg`). Swap in real photos by
  either replacing the SVG file with an image of the same name, or updating the
  `<img src>` in `index.html` to point at your new file.

## Deploy

No build command is needed — the output is simply the repo root. Pick any free
host:

- **GitHub Pages** — push the repo to GitHub, then in Settings → Pages select the
  branch and the `/ (root)` folder. Your site publishes at the Pages URL.
- **Netlify** — drag-and-drop the project folder onto the Netlify dashboard, or
  connect the Git repo. Leave the build command empty and set the publish
  directory to the repo root.
- **Vercel** — import the repo, choose framework preset **Other**, leave the build
  command empty, and set the output/root directory to the repo root.

## Project structure

```
.
├── index.html          # Page markup and all copy
├── css/
│   └── styles.css      # All styles (mobile-first)
├── js/
│   ├── main.js         # Nav, sticky header, smooth scroll, scroll-reveal
│   └── quiz.js         # Multi-step inquiry quiz + Web3Forms submission
├── assets/
│   ├── hero-action.svg     # Hero backdrop placeholder
│   ├── headshot.svg        # Portrait placeholder
│   └── before-after.svg    # Results before/after placeholder
└── README.md
```

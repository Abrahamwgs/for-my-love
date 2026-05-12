# For My Love — a handmade site

A single-page, scroll-driven love letter for someone studying medicine.
Built with vanilla HTML / CSS / JS and Three.js (WebGL) — no build step.

## What's inside
- **Beating 3D heart** in the hero (Three.js, physical material, particle aura, cursor parallax)
- **Rotating DNA double helix** with glowing nucleotides
- **Animated love letter** styled as a prescription pad with a hand-drawn signature
- **"Differential diagnosis" cards** with med-themed reasons she's loved
- **Scroll-driven timeline** of your story
- **Our Song** — live Spotify embed with a spinning vinyl record and custom play button
- **Confetti burst** on the closing button
- Custom cursor, floating petals, ECG pulse, smooth scroll, fully responsive
- Respects `prefers-reduced-motion`

## Personalize it
Open **`config.js`** and edit the values. Everything personal lives in one file:
her name, the letter, the six diagnoses, the timeline entries, your signature,
the song. Save, refresh, done.

---

# Deploy to GitHub Pages (manual, ~3 minutes)

You're going to:
1. Create a new GitHub repository.
2. Drag-and-drop all files in this folder into it.
3. Turn on Pages in the repo settings.

## Step 1 — Create the repository

1. Go to **https://github.com/new** (sign in if needed).
2. **Repository name**: pick anything — e.g. `for-my-love` or `dandelion`.
   The site will live at `https://<your-username>.github.io/<repo-name>/`.
3. **Visibility**: choose **Public** (GitHub Pages on free accounts requires this).
4. Leave everything else unchecked (no README, no .gitignore — we already have them).
5. Click **Create repository**.

## Step 2 — Upload the files

On the empty repository page you'll see a link near the top that says
**"uploading an existing file"**. Click it.

1. **Drag every file from this folder into the upload area**:
   ```
   index.html
   styles.css
   script.js
   config.js
   heart.js
   dna.js
   README.md
   .nojekyll      ← important, makes Pages serve files as-is
   .gitignore
   ```
   > **macOS Finder tip**: press <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>.</kbd> to show hidden files (`.nojekyll`, `.gitignore`).
   > **Windows Explorer tip**: View → Show → "Hidden items".
   > **Linux file managers**: <kbd>Ctrl</kbd>+<kbd>H</kbd>.

2. At the bottom, write a commit message ("initial commit" is fine) and click **Commit changes**.

## Step 3 — Turn on GitHub Pages

1. In your new repository, click **Settings** (top right).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment** → **Source**, choose **Deploy from a branch**.
4. Under **Branch**, pick **main** and **/ (root)**. Click **Save**.
5. Wait about 30–60 seconds. Refresh the Pages settings page.
6. You'll see: **"Your site is live at https://<username>.github.io/<repo-name>/"**

Click the link. Send it to her.

## If something doesn't look right

- **CSS / JS not loading** → make sure `.nojekyll` got uploaded (it's a hidden file).
- **Heart or DNA missing** → check the browser console (F12). If you see
  `Failed to load 'three'`, you're offline — Three.js is loaded from a CDN.
- **Spotify embed blank** → the embed needs `open.spotify.com` reachable.
  The "open in Spotify ↗" link always works as a fallback.
- **Site at `/`'d URL doesn't load** → wait another minute. GitHub Pages can take
  up to 10 minutes on the *first* deploy. Subsequent updates are near-instant.

## Update the site later

Edit any file on github.com (pencil icon) and commit. Pages re-deploys
automatically within ~30 seconds.

---

## File map
```
index.html     ← page structure
styles.css     ← all visuals & animations
config.js      ← YOUR personal content (edit this!)
script.js      ← scroll reveals, cursor, Spotify control, confetti
heart.js       ← Three.js beating heart scene
dna.js         ← Three.js DNA helix scene
.nojekyll      ← tells GitHub Pages to serve files as-is
.gitignore     ← junk-file exclusions
README.md      ← this file
```

Made with care. The lub-dub of the heart is timed to ~72 bpm — a calm,
resting rate. Tell her that.

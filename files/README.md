# Project Ascension — Static Site

This folder contains the static split of the Project Ascension demo.

- `index.html` — main HTML file
- `styles.css` — extracted CSS
- `script.js` — extracted JavaScript
- `vercel.json` — Vercel static hosting config

Quick deploy (using Vercel CLI):

1. Install Vercel CLI (if you don't have it):

```bash
npm i -g vercel
```

2. From this folder run:

```bash
vercel login
vercel --prod
```

Alternatively, create a Git repository for this folder and connect it to Vercel via the dashboard; Vercel will deploy automatically.

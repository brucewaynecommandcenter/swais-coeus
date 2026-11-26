# SWAIS COEUS website (confidential demo)

Static site for SWAIS COEUS (Saraf Worldsphere AI Services), hosted on GitHub Pages.

- `index.html` is a password screen. The page content inside it is encrypted (AES-256-GCM, key derived from the login with PBKDF2), so it can't be read from the source without the credentials.
- `assets/css/styles.css`, `assets/js/main.js`: styles (light and dark mode), animations, chat assistant.
- `assets/fonts`: self-hosted Sora and Inter (no Google Fonts calls).
- `robots.txt` and a `noindex` tag keep the demo out of search engines.
- No cookies or trackers. The contact form opens the visitor's email app.

The readable page source and the build script are kept outside this repo; edit those and rebuild rather than editing `index.html` here.

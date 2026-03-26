# Snake Game

This project includes a browser version (`index.html`) and an Electron wrapper so you can build a Windows `.exe` installer.

## Run in browser

```bash
python -m http.server 4173
```

Open `http://127.0.0.1:4173/index.html`.

## Build Windows `.exe` (on Windows)

1. Install Node.js LTS.
2. Install dependencies:

```bash
npm install
```

3. Run locally as desktop app:

```bash
npm start
```

4. Build Windows installer (`.exe`):

```bash
npm run dist:win
```

Build output will be in `dist/`.

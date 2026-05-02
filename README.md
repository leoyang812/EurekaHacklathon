# Scroll Court

Scroll Court is a Chrome extension and landing site for interrupting YouTube Shorts doomscrolling with comedy, attention checks, Wisdom Rating changes, and a final philosopher roast receipt.

## Local Setup

1. Install dependencies:

```powershell
npm install
```

2. Create `.env.local` from `.env.example`:

```env
OPENAI_API_KEY=your_openai_api_key_here
DEMO_PASSWORD=choose_a_private_demo_password
```

3. Run the Next.js app:

```powershell
npm run dev
```

## Load the Chrome Extension

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Click `Load unpacked`.
4. Select the `extension` folder.
5. Open `https://www.youtube.com/shorts/*`.

The extension injects a floating Scroll Court panel directly into YouTube Shorts.

## Security Notes

- Do not commit `.env.local`.
- Do not put `OPENAI_API_KEY` in `extension/`.
- The extension calls `/api/generate-receipt`; only the Next.js server route calls OpenAI.
- If `OPENAI_API_KEY` is missing or OpenAI fails, the API returns a hardcoded fallback receipt.
- The extension stores only local demo stats and the demo access code in `chrome.storage.local`.

## Extension Files

- `extension/manifest.json`: Manifest V3 config.
- `extension/content.js`: YouTube Shorts panel, URL tracking, quizzes, receipt request.
- `extension/background.js`: Calls the local/deployed Next.js receipt API from the extension context.
- `extension/styles.css`: Isolated panel styling.
- `extension/popup.html`: Popup dashboard.
- `extension/popup.js`: Popup storage controls.

## API

`POST /api/generate-receipt`

Expected JSON:

```json
{
  "demoPassword": "your_demo_password",
  "watchedCount": 12,
  "wisdom": 38,
  "rank": "Court Jester of Focus",
  "quizCount": 4
}
```

Response:

```json
{
  "receipt": "SCROLL COURT RECEIPT...",
  "source": "openai"
}
```

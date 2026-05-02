# The Recall Trial

The Recall Trial is a Chrome extension and landing site for interrupting YouTube Shorts doomscrolling with comedy, attention checks, Recall Score changes, and a final philosopher roast receipt.

## Local Setup

1. Install dependencies:

```powershell
npm install
```

2. Create `.env.local` from `.env.example`:

```env
OPENAI_API_KEY=your_openai_api_key_here
DEMO_PASSWORD=choose_a_private_demo_password
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
```

Use that same demo password in the extension popup. The OpenAI key stays only in `.env.local` and is never placed in `extension/`.

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

The extension injects floating Recall Trial panels directly into YouTube Shorts. Trial summons are intentionally randomized, so the UI does not reveal the next interruption count. Use **End Session** to generate the final receipt.

## Security Notes

- Do not commit `.env.local`.
- Do not put `OPENAI_API_KEY` in `extension/`.
- The extension calls `/api/generate-quiz`, `/api/generate-receipt`, and `/api/analyze-frame`; only Next.js API routes call OpenAI.
- All API routes require `DEMO_PASSWORD`; enter it in the extension popup before using AI receipts/attention checks.
- The evidence system uses captions when available, one temporary visible-frame screenshot per Short, and metadata. Screenshots are sent only to `/api/analyze-frame` and are not stored.
- The extension does not receive YouTube video files, full transcripts, audio, comments, cookies, accounts, emails, or browsing history.
- If `OPENAI_API_KEY` is missing or OpenAI fails, the API returns a hardcoded fallback receipt.
- The extension stores local demo stats, recent text evidence, settings, and the user-entered demo access code in `chrome.storage.local`.

## Extension Files

- `extension/manifest.json`: Manifest V3 config.
- `extension/content.js`: YouTube Shorts panel, URL tracking, randomized court attention checks, caption buffer, evidence selection, topic detection, receipt request.
- `extension/background.js`: Calls the local/deployed Next.js APIs from the extension context and performs temporary visible-frame capture on YouTube Shorts only.
- `extension/assets/`: Optional philosopher portraits. Add `socrates.png`, `plato.png`, `diogenes.png`, or `aristotle.png` to show real images in the animated court popup.
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
  "courtMood": "Deeply suspicious",
  "quizCount": 4
}
```

`POST /api/analyze-frame`

Accepts a temporary `imageDataUrl` plus metadata and returns:

```json
{
  "summary": "appears to show broad visual context",
  "topics": ["fitness"],
  "confidence": "medium"
}
```

`POST /api/generate-quiz`

Accepts `selectedEvidence` and returns the existing quiz shape. Caption evidence is treated as strongest, frame summaries as medium, and metadata as weak.

Response:

```json
{
  "question": "What detail did the Short focus on?",
  "answers": [
    { "text": "A specific detail supported by the evidence", "correct": true },
    { "text": "A plausible but incorrect near-miss", "correct": false },
    { "text": "Another distinct near-miss", "correct": false },
    { "text": "A fourth distinct near-miss", "correct": false }
  ]
}
```

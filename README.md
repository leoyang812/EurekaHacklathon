# The Recall Trial

A Chrome extension that interrupts your YouTube Shorts sessions, quizzes what you actually watched, and has ancient philosophers roast you with an AI receipt.

## Setup

1. Install dependencies:

```powershell
npm install
```

2. Copy `.env.example` to `.env.local` and fill it in:

```env
OPENAI_API_KEY=your_openai_api_key_here
DEMO_PASSWORD=choose_a_private_demo_password
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
```

The demo password is what you'll enter in the extension popup. Keep the OpenAI key out of the `extension/` folder entirely.

3. Run the dev server:

```powershell
npm run dev
```

## Loading the Extension

1. Go to `chrome://extensions`
2. Turn on Developer mode
3. Click `Load unpacked`
4. Select the `extension` folder
5. Open any `youtube.com/shorts/` URL

The summons timing is randomized on purpose so the extension doesn't feel predictable. Hit **End Session** when you want the final receipt.

## Security

- Don't commit `.env.local`
- Don't put your `OPENAI_API_KEY` anywhere inside `extension/`
- The extension never touches video files, audio, transcripts, cookies, or your account. It reads captions, grabs one temporary frame screenshot per Short, and uses metadata. Screenshots go to `/api/analyze-frame` and are not stored
- If OpenAI fails or the key is missing, the API falls back to a hardcoded receipt
- Everything else (stats, evidence, your demo password) lives in `chrome.storage.local`

## File Overview

| File | What it does |
|---|---|
| `extension/manifest.json` | Manifest V3 config |
| `extension/content.js` | Injects the trial panel, tracks URLs, buffers captions, picks evidence, fires quiz and receipt requests |
| `extension/background.js` | Handles API calls from the extension context, captures temporary frame screenshots |
| `extension/assets/` | Philosopher portraits and the jumpscare sound |
| `extension/popup.html` / `popup.js` | The extension popup and its storage controls |

## API Routes

**`POST /api/generate-receipt`**

```json
{
  "demoPassword": "your_demo_password",
  "watchedCount": 12,
  "wisdom": 38,
  "courtMood": "Deeply suspicious",
  "quizCount": 4
}
```

**`POST /api/analyze-frame`**

Takes an `imageDataUrl` plus metadata, returns:

```json
{
  "summary": "appears to show broad visual context",
  "topics": ["fitness"],
  "confidence": "medium"
}
```

**`POST /api/generate-quiz`**

Takes `selectedEvidence` and returns a 4-option quiz. Captions are weighted highest, frame summaries medium, metadata lowest.

```json
{
  "question": "What detail did the Short focus on?",
  "answers": [
    { "text": "...", "correct": true },
    { "text": "...", "correct": false },
    { "text": "...", "correct": false },
    { "text": "...", "correct": false }
  ]
}
```
# Setup

The pipeline needs these credentials as **GitHub Actions secrets** on the
`pixelsqueeze` repo (Settings → Secrets and variables → Actions → New
repository secret). Nothing below needs to touch your local machine except
the one YouTube OAuth step, which requires an interactive browser.

## 1. Anthropic API key (required — writes the script/title/description/tags)

1. Go to https://console.anthropic.com → Settings → API Keys → Create Key.
2. Add it as secret `ANTHROPIC_API_KEY`.

## 2. Stock media key (required — you said you already have one)

Use whichever you have:

- Pexels: https://www.pexels.com/api/ → add as secret `PEXELS_API_KEY`.
- Pixabay: https://pixabay.com/api/docs/ → add as secret `PIXABAY_API_KEY`.

Both can be set; Pexels is tried first, Pixabay as a fallback/extra variety.

## 3. Voiceover (optional — a free voice works with nothing set)

By default the pipeline uses `edge-tts`, a free Microsoft voice, no key
needed. If you want a more premium/expressive voice instead:

1. Create an account at https://elevenlabs.io and grab an API key.
2. Add secret `ELEVENLABS_API_KEY` (and optionally `ELEVENLABS_VOICE_ID` —
   defaults to a standard voice if omitted).

## 4. YouTube upload (required to actually publish — this is the one that takes real setup)

YouTube's API needs an OAuth app plus a one-time authorization against your
channel. This only has to be done once; after that the pipeline runs
unattended.

1. **Create a Google Cloud project**: https://console.cloud.google.com/projectcreate
2. **Enable the YouTube Data API v3** for that project:
   https://console.cloud.google.com/apis/library/youtube.googleapis.com
3. **Create OAuth credentials**:
   - Go to "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID".
   - If prompted, configure the OAuth consent screen first — choose
     "External", fill in the app name (e.g. "San Antonio Travel Automation"),
     add your own Google account under "Test users" (this keeps the app in
     testing mode, which is fine — testing-mode refresh tokens still work
     indefinitely as long as you re-consent every ~7 days *unless* you
     publish the app, which for a single-channel personal tool you usually
     don't need to do).
   - Application type: **Desktop app**.
   - Save the generated **Client ID** and **Client Secret**.
4. **Mint a refresh token** (run this locally, once, on your own machine —
   it opens a browser window to log into the YouTube channel's Google
   account):
   ```bash
   cd san-antonio-travel-automation
   pip install google-auth-oauthlib
   python setup/get_youtube_refresh_token.py <client_id> <client_secret>
   ```
   Log in with the Google account that owns/manages the San Antonio Travel
   channel, approve access, and copy the refresh token it prints.
5. Add three secrets:
   - `YOUTUBE_CLIENT_ID`
   - `YOUTUBE_CLIENT_SECRET`
   - `YOUTUBE_REFRESH_TOKEN`

## 5. Choose the default privacy status

By default uploaded videos are set to **`unlisted`** (not `private` or
`public`) so you can review the first few runs on the actual video page
before anyone sees them in search/subscriptions. Once you're happy with the
output, switch it to `public`:

- Repo → Settings → Secrets and variables → Actions → **Variables** tab →
  New repository variable → `YOUTUBE_PRIVACY_STATUS` = `public`.

## Testing before you trust it with real uploads

From the Actions tab, run the **"Publish San Antonio Travel video"** workflow
manually ("Run workflow") with `dry_run` set to `true`. This runs the full
pipeline — script, voiceover, footage, video, thumbnail — and skips only the
actual YouTube upload, so you can download the artifacts (final_video.mp4,
thumbnail.jpg) from the workflow run and check them before going live.

You can also force a specific topic instead of the automatic rotation by
filling in the `topic` input with a subject from `data/topics.yaml` (or any
custom one-off subject).

## Running locally (optional)

```bash
cd san-antonio-travel-automation
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...
export PEXELS_API_KEY=...
export DRY_RUN=true   # skips the real YouTube upload
python src/pipeline.py
```

Output lands in `output/current_run/` (`final_video.mp4`, `thumbnail.jpg`).

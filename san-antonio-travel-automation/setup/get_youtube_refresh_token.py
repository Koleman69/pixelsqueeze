"""One-time, run-on-your-own-machine helper: opens a browser to authorize
this app against YOUR YouTube channel and prints a refresh token to paste
into the YOUTUBE_REFRESH_TOKEN GitHub secret. Never run this in CI — it
needs an interactive browser.

Usage:
    pip install google-auth-oauthlib
    python setup/get_youtube_refresh_token.py <client_id> <client_secret>
"""

import sys

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
]


def main() -> None:
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    client_id, client_secret = sys.argv[1], sys.argv[2]

    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }

    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    credentials = flow.run_local_server(port=0)

    print("\nSuccess! Add this as the YOUTUBE_REFRESH_TOKEN GitHub secret:\n")
    print(credentials.refresh_token)


if __name__ == "__main__":
    main()

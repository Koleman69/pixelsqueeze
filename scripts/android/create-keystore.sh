#!/usr/bin/env bash
# Creates the PixelSqueeze Android upload keystore and wires it into Gradle.
# Run this ONCE, on your own machine. Requires JDK 21 (keytool).
#
#   bash scripts/android/create-keystore.sh
#
# Outputs:
#   ~/.pixelsqueeze/pixelsqueeze-upload.jks   (NEVER commit, NEVER lose)
#   android/keystore.properties               (git-ignored)
# Then prints the SHA-256 fingerprint of the upload certificate.
set -euo pipefail

command -v keytool >/dev/null || { echo "keytool not found — install JDK 21 first."; exit 1; }

KEY_DIR="${PS_KEYSTORE_DIR:-$HOME/.pixelsqueeze}"
KEYSTORE="$KEY_DIR/pixelsqueeze-upload.jks"
ALIAS="${PS_KEY_ALIAS:-upload}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

mkdir -p "$KEY_DIR"
chmod 700 "$KEY_DIR"

if [ -f "$KEYSTORE" ]; then
  echo "Keystore already exists at $KEYSTORE — reusing it (never regenerate an uploaded key)."
else
  # Password prompt: never passed on the command line, never echoed, never logged.
  read -r -s -p "Choose a keystore password (min 6 chars): " PS_PASS; echo
  read -r -s -p "Confirm password: " PS_PASS2; echo
  [ "$PS_PASS" = "$PS_PASS2" ] || { echo "Passwords do not match."; exit 1; }
  [ ${#PS_PASS} -ge 6 ] || { echo "Password too short."; exit 1; }

  keytool -genkeypair -v \
    -keystore "$KEYSTORE" \
    -storetype PKCS12 \
    -alias "$ALIAS" \
    -keyalg RSA -keysize 4096 -validity 10000 \
    -dname "CN=PixelSqueeze, OU=Mobile, O=PixelSqueeze, L=, ST=, C=US" \
    -storepass "$PS_PASS" -keypass "$PS_PASS"
  chmod 600 "$KEYSTORE"
  echo "Created $KEYSTORE"
fi

if [ ! -f "$REPO_ROOT/android/keystore.properties" ]; then
  read -r -s -p "Keystore password (to write android/keystore.properties): " PS_PASS3; echo
  umask 077
  cat > "$REPO_ROOT/android/keystore.properties" <<EOF
storeFile=$KEYSTORE
storePassword=$PS_PASS3
keyAlias=$ALIAS
keyPassword=$PS_PASS3
EOF
  echo "Wrote android/keystore.properties (git-ignored)."
fi

echo
echo "Upload certificate fingerprint (SHA-256):"
keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" 2>/dev/null | grep -i "SHA256:" || \
  echo "  (re-run with the password prompt to list: keytool -list -v -keystore \"$KEYSTORE\" -alias $ALIAS)"

cat <<'NEXT'

NEXT STEPS
1. Upload the keystore to Codemagic as the code-signing identity named
   `pixelsqueeze_keystore` (Teams -> Code signing identities -> Android keystores).
2. Create the app in Play Console with Play App Signing ENABLED.
3. After the first AAB upload, copy the SHA-256 from
   Play Console -> Setup -> App signing -> "App signing key certificate"
   (that is the key Play uses to sign what users install — App Links must
   trust it, not only your upload key) and run:

     node scripts/android/set-assetlinks-fingerprint.mjs <PLAY_SHA256> [UPLOAD_SHA256]

4. Publish the web app so /.well-known/assetlinks.json serves the new value.
NEXT

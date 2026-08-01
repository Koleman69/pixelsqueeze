#!/usr/bin/env bash
# Builds the signed Play Store artifact for PixelSqueeze.
#
#   bash scripts/android/build-aab.sh          # AAB for Play upload
#   bash scripts/android/build-aab.sh apk      # APK for device sideloading
#
# Requires: JDK 21, Android SDK (Platform 36 + Build Tools 36) with
# ANDROID_HOME/ANDROID_SDK_ROOT set, and android/keystore.properties present
# (see scripts/android/create-keystore.sh).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

TARGET="${1:-aab}"

command -v java >/dev/null || { echo "JDK 21 not found."; exit 1; }
[ -n "${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}" ] || echo "WARNING: ANDROID_HOME/ANDROID_SDK_ROOT unset — Gradle may fail to locate the SDK."

if [ ! -f android/keystore.properties ] && [ -z "${PS_KEYSTORE_PATH:-}" ]; then
  echo "No signing config. Run: bash scripts/android/create-keystore.sh"
  exit 1
fi

if grep -q "REPLACE_WITH" public/.well-known/assetlinks.json; then
  echo "WARNING: public/.well-known/assetlinks.json still holds a placeholder fingerprint."
  echo "         App Links will NOT verify until you run set-assetlinks-fingerprint.mjs."
fi

echo "==> Building web bundle"
npm run build

echo "==> Syncing Capacitor Android"
npx cap sync android

cd android
if [ "$TARGET" = "apk" ]; then
  echo "==> assembleRelease"
  ./gradlew --no-daemon assembleRelease
  echo "APK: android/app/build/outputs/apk/release/app-release.apk"
else
  echo "==> bundleRelease"
  ./gradlew --no-daemon bundleRelease
  echo "AAB: android/app/build/outputs/bundle/release/app-release.aab"
  echo "Mapping (upload to Play for readable crashes): android/app/build/outputs/mapping/release/mapping.txt"
fi

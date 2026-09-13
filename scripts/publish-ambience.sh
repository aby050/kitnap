#!/usr/bin/env bash
# Encode the focus-room loops and publish them to Cloudflare R2.
#
# Why R2 and not the app bundle: ten loops are ~24 MB raw and every user would
# download all of them to use one. Why R2 and not S3/CloudFront: R2 charges
# nothing for egress, and egress is the whole cost of serving video. Why not
# Cloudflare Stream: these are 6–20s silent loops, not adaptive-bitrate
# long-form — Stream bills per minute stored AND delivered and needs an HLS
# player for no benefit here.
#
# Prerequisites (once):
#   brew install ffmpeg
#   npx wrangler login
#   npx wrangler r2 bucket create byre-ambience
#   # then in the Cloudflare dashboard: R2 → byre-ambience → Settings →
#   # Public access → connect a custom domain, e.g. cdn.byre.app
#
# Usage:  scripts/publish-ambience.sh
set -euo pipefail

SRC="assets/ambience"
OUT="build/ambience"
BUCKET="byre-ambience"

command -v ffmpeg >/dev/null || { echo "ffmpeg not installed — brew install ffmpeg"; exit 1; }
mkdir -p "$OUT"

for f in "$SRC"/*.mp4; do
  key=$(basename "$f" .mp4)
  # 720x1280 cap, CRF 28, no audio track at all (the ambient track is a
  # separate file), faststart so the first frame decodes before the whole file
  # has arrived. Typically takes 3–5 MB down to under 1 MB.
  ffmpeg -y -loglevel error -i "$f" \
    -an -vf "scale=720:-2:flags=lanczos" \
    -c:v libx264 -profile:v high -crf 28 -preset slow \
    -movflags +faststart -pix_fmt yuv420p \
    "$OUT/$key.mp4"
  cp "$SRC/$key-poster.jpg" "$OUT/$key-poster.jpg" 2>/dev/null || true
  printf '%-12s %6sK -> %6sK\n' "$key" \
    $(( $(stat -f%z "$f") / 1024 )) $(( $(stat -f%z "$OUT/$key.mp4") / 1024 ))
done

echo
echo "Uploading to r2://$BUCKET …"
for f in "$OUT"/*; do
  name=$(basename "$f")
  # Loops never change under a given name — if one is re-cut, publish it under
  # a new name rather than invalidating a year-long cache everywhere.
  npx wrangler r2 object put "$BUCKET/$name" \
    --file "$f" --remote \
    --cache-control "public, max-age=31536000, immutable"
done

echo
echo "Done. Files are at https://<your-r2-domain>/<name>"

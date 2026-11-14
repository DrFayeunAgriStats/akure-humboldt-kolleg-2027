#!/usr/bin/env bash
# Downloads the official logos into public/branding/. Run from the repo root on a machine
# with normal internet access, then verify the files visually before committing.
set -euo pipefail
mkdir -p public/branding
# Alexander von Humboldt Foundation — official RGB/web logo (Corporate Design page)
curl -fsSL -o public/branding/avh-logo-rgb.svg \
  https://www.humboldt-foundation.de/fileadmin/Entdecken/Organisation/Styleguide/Logo/AvH_Logo_rgb.svg
# FUTA — no direct official download URL could be verified from the build environment.
# Save the crest from https://futa.edu.ng/ (or a file supplied by FUTA) as:
#   public/branding/futa-logo.png   (square, transparent background, >= 256 px)
[ -f public/branding/futa-logo.png ] || echo "MISSING: public/branding/futa-logo.png (add the official FUTA crest manually)"
node scripts/check-assets.mjs

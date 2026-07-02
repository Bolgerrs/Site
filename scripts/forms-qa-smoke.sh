#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8093}"

ROUTE_SLUGS=(
  "vision-max-premium"
  "vision-max-lux"
  "living-glass-oled"
  "hologram-vitrine"
  "pictorial-canvas"
  "exhibition-wall"
  "exhibition-table"
  "exhibition-rail"
  "monolith-reference"
  "nexus-reference-hub"
  "prism-reference-dac"
  "vela-integrated-amplifier"
  "prima-materia-lux-speaker"
)

LOCALES=("ru" "en" "es" "fr" "zh" "ja" "de")

for slug in "${ROUTE_SLUGS[@]}"; do
  url="${BASE_URL}/en/request/${slug}"
  echo "forms-qa-smoke: GET ${url}"
  curl -fsS "${url}" >/dev/null
done

for locale in "${LOCALES[@]}"; do
  url="${BASE_URL}/${locale}/request/vision-max-premium"
  echo "forms-qa-smoke: GET ${url}"
  curl -fsS "${url}" >/dev/null
done

echo "forms-qa-smoke: ok routes=${#ROUTE_SLUGS[@]} locales=${#LOCALES[@]}"

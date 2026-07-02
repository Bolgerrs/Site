#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8093}"
PUBLIC_BASE="${2:-http://89.150.34.66:8093}"

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local context="$3"

  if ! printf '%s' "$haystack" | rg -F -q "$needle"; then
    echo "i18n-seo-smoke: missing ${context}: ${needle}" >&2
    exit 1
  fi
}

assert_matches() {
  local haystack="$1"
  local pattern="$2"
  local context="$3"

  if ! printf '%s' "$haystack" | rg -q "$pattern"; then
    echo "i18n-seo-smoke: missing ${context}: ${pattern}" >&2
    exit 1
  fi
}

page_url="${BASE_URL}/en/products/monolith-reference"
page_html="$(curl -fsS "$page_url")"

echo "i18n-seo-smoke: GET ${page_url}"
assert_matches "$page_html" "<html[^>]*lang=\"en\"" "html lang"
assert_contains "$page_html" "<link rel=\"canonical\" href=\"${PUBLIC_BASE}/en/products/monolith-reference\"" "canonical"
assert_contains "$page_html" "<link rel=\"alternate\" hrefLang=\"ru\" href=\"${PUBLIC_BASE}/ru/products/monolith-reference\"" "ru hreflang"
assert_contains "$page_html" "<link rel=\"alternate\" hrefLang=\"de\" href=\"${PUBLIC_BASE}/de/products/monolith-reference\"" "de hreflang"
assert_contains "$page_html" "<link rel=\"alternate\" hrefLang=\"x-default\" href=\"${PUBLIC_BASE}/en/products/monolith-reference\"" "x-default hreflang"

contact_url="${BASE_URL}/ru/contact"
contact_html="$(curl -fsS "$contact_url")"

echo "i18n-seo-smoke: GET ${contact_url}"
assert_matches "$contact_html" "<html[^>]*lang=\"ru\"" "ru html lang"
assert_contains "$contact_html" "<link rel=\"alternate\" hrefLang=\"en\" href=\"${PUBLIC_BASE}/en/contact\"" "ru page en hreflang"
assert_contains "$contact_html" "<link rel=\"alternate\" hrefLang=\"x-default\" href=\"${PUBLIC_BASE}/en/contact\"" "ru page x-default hreflang"

request_url="${BASE_URL}/en/request/monolith-reference"
request_html="$(curl -fsS "$request_url")"

echo "i18n-seo-smoke: GET ${request_url}"
assert_contains "$request_html" "<link rel=\"canonical\" href=\"${PUBLIC_BASE}/en/products/monolith-reference\"" "request canonical to product"
assert_contains "$request_html" "<meta name=\"robots\" content=\"noindex, follow\"" "request robots noindex"

sitemap_url="${BASE_URL}/sitemap.xml"
sitemap_xml="$(curl -fsS "$sitemap_url")"

echo "i18n-seo-smoke: GET ${sitemap_url}"
assert_contains "$sitemap_xml" "<loc>${PUBLIC_BASE}/en/products/monolith-reference</loc>" "sitemap product loc"
assert_contains "$sitemap_xml" "<xhtml:link rel=\"alternate\" hreflang=\"ru\" href=\"${PUBLIC_BASE}/ru/products/monolith-reference\" />" "sitemap ru alternate"
assert_contains "$sitemap_xml" "<xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"${PUBLIC_BASE}/en/products/monolith-reference\" />" "sitemap x-default alternate"
assert_contains "$sitemap_xml" "<loc>${PUBLIC_BASE}/en/contact</loc>" "sitemap contact loc"
assert_contains "$sitemap_xml" "<xhtml:link rel=\"alternate\" hreflang=\"ja\" href=\"${PUBLIC_BASE}/ja/contact\" />" "sitemap contact ja alternate"

if printf '%s' "$sitemap_xml" | rg -F -q "${PUBLIC_BASE}/en/request/monolith-reference"; then
  echo "i18n-seo-smoke: request route leaked into sitemap" >&2
  exit 1
fi

robots_url="${BASE_URL}/robots.txt"
robots_txt="$(curl -fsS "$robots_url")"

echo "i18n-seo-smoke: GET ${robots_url}"
assert_contains "$robots_txt" "Allow: /" "robots allow root"
assert_contains "$robots_txt" "Disallow: /request/" "robots disallow request"
assert_contains "$robots_txt" "Disallow: /en/admin-preview" "robots disallow localized admin preview"

echo "i18n-seo-smoke: ok"

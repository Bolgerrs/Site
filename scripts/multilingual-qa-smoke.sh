#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8093}"
PUBLIC_BASE="${2:-http://89.150.34.66:8093}"

locales=(ru en es fr zh ja de)

declare -A locale_labels=(
  [ru]="Язык"
  [en]="Language"
  [es]="Idioma"
  [fr]="Langue"
  [zh]="语言"
  [ja]="言語"
  [de]="Sprache"
)

declare -A home_titles=(
  [ru]="Montelar | Архитектура изображения, звука и AI дизайна."
  [en]="Montelar | Architecture of image, sound and AI design."
  [es]="Montelar | Arquitectura de imagen, sonido y diseño con IA."
  [fr]="Montelar | Architecture de l&#x27;image, du son et du design."
  [zh]="Montelar | 图像、声音与 AI 设计的架构。"
  [ja]="Montelar | 画像、音、AIデザインのアーキテクチャ。"
  [de]="Montelar | Architektur von Bild, Klang und KI-Design."
)

declare -A contact_ctas=(
  [ru]="Форматы консультации"
  [en]="Consultation modes"
  [es]="Modos de consulta"
  [fr]="Modes de consultation"
  [zh]="咨询形式"
  [ja]="相談形式"
  [de]="Beratungsformate"
)

declare -A request_titles=(
  [ru]="Сконфигурировать Vision MAX Premium"
  [en]="Configure Vision MAX Premium"
  [es]="Configurar Vision MAX Premium"
  [fr]="Configurer Vision MAX Premium"
  [zh]="配置 Vision MAX Premium"
  [ja]="Vision MAX Premium を構成する"
  [de]="Vision MAX Premium konfigurieren"
)

declare -A request_canonical_targets=(
  [ru]="http://89.150.34.66:8093/ru/products/vision-max-premium"
  [en]="http://89.150.34.66:8093/en/products/vision-max-premium"
  [es]="http://89.150.34.66:8093/es/products/vision-max-premium"
  [fr]="http://89.150.34.66:8093/fr/products/vision-max-premium"
  [zh]="http://89.150.34.66:8093/zh/products/vision-max-premium"
  [ja]="http://89.150.34.66:8093/ja/products/vision-max-premium"
  [de]="http://89.150.34.66:8093/de/products/vision-max-premium"
)

declare -A request_consent_labels=(
  [ru]="Я согласен(а) на проверку приватности и дальнейшую консультацию."
  [en]="I agree to the privacy review and advisory follow-up."
  [es]="Acepto la revisión de privacidad y el seguimiento de asesoría."
  [fr]="J’accepte la vérification de confidentialité et le suivi de conseil."
  [zh]="我同意隐私审核以及后续顾问沟通。"
  [ja]="プライバシー確認とその後のアドバイザリー連絡に同意します。"
  [de]="Ich stimme der Datenschutzprüfung und der weiteren Beratung zu."
)

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local context="$3"

  if ! printf '%s' "$haystack" | rg -F -q "$needle"; then
    echo "multilingual-qa-smoke: missing ${context}: ${needle}" >&2
    exit 1
  fi
}

assert_matches() {
  local haystack="$1"
  local pattern="$2"
  local context="$3"

  if ! printf '%s' "$haystack" | rg -q "$pattern"; then
    echo "multilingual-qa-smoke: missing ${context}: ${pattern}" >&2
    exit 1
  fi
}

get_switch_target() {
  local locale="$1"

  if [ "$locale" = "en" ]; then
    printf 'ru'
    return
  fi

  printf 'en'
}

check_homepage() {
  local locale="$1"
  local sibling="$2"
  local html
  local url="${BASE_URL}/${locale}"

  html="$(curl -fsS "$url")"

  echo "multilingual-qa-smoke: GET ${url}"
  assert_matches "$html" "<html[^>]*lang=\"${locale}\"" "${locale} homepage html lang"
  assert_contains "$html" "<link rel=\"canonical\" href=\"${PUBLIC_BASE}/${locale}\"" "${locale} homepage canonical"
  assert_matches "$html" "aria-current=\"page\"[^>]*class=\"locale-switcher-pill is-current\"[^>]*lang=\"${locale}\"|class=\"locale-switcher-pill is-current\"[^>]*lang=\"${locale}\"[^>]*aria-current=\"page\"" "${locale} homepage current locale link"
  assert_contains "$html" "<p class=\"locale-switcher-label\">${locale_labels[$locale]}</p>" "${locale} homepage locale label"
  assert_contains "$html" "<title>${home_titles[$locale]}</title>" "${locale} homepage title"
  assert_contains "$html" "href=\"/${sibling}\"" "${locale} homepage sibling locale switch"
}

check_contact() {
  local locale="$1"
  local sibling="$2"
  local html
  local url="${BASE_URL}/${locale}/contact"

  html="$(curl -fsS "$url")"

  echo "multilingual-qa-smoke: GET ${url}"
  assert_matches "$html" "<html[^>]*lang=\"${locale}\"" "${locale} contact html lang"
  assert_contains "$html" "<link rel=\"canonical\" href=\"${PUBLIC_BASE}/${locale}/contact\"" "${locale} contact canonical"
  assert_matches "$html" "aria-current=\"page\"[^>]*class=\"locale-switcher-pill is-current\"[^>]*lang=\"${locale}\"|class=\"locale-switcher-pill is-current\"[^>]*lang=\"${locale}\"[^>]*aria-current=\"page\"" "${locale} contact current locale link"
  assert_contains "$html" "${contact_ctas[$locale]}" "${locale} contact cta"
  assert_contains "$html" "href=\"/${sibling}/contact\"" "${locale} contact sibling locale switch"
}

check_request_route() {
  local locale="$1"
  local sibling="$2"
  local html
  local url="${BASE_URL}/${locale}/request/vision-max-premium"

  html="$(curl -fsS "$url")"

  echo "multilingual-qa-smoke: GET ${url}"
  assert_matches "$html" "<html[^>]*lang=\"${locale}\"" "${locale} request html lang"
  assert_contains "$html" "<link rel=\"canonical\" href=\"${request_canonical_targets[$locale]}\"" "${locale} request canonical"
  assert_matches "$html" "aria-current=\"page\"[^>]*class=\"locale-switcher-pill is-current\"[^>]*lang=\"${locale}\"|class=\"locale-switcher-pill is-current\"[^>]*lang=\"${locale}\"[^>]*aria-current=\"page\"" "${locale} request current locale link"
  assert_contains "$html" "${request_titles[$locale]}" "${locale} request title"
  assert_contains "$html" "${request_consent_labels[$locale]}" "${locale} request consent label"
  assert_contains "$html" "<meta name=\"robots\" content=\"noindex, follow\"" "${locale} request robots"
  assert_contains "$html" "href=\"/${sibling}/request/vision-max-premium\"" "${locale} request sibling locale switch"
}

for locale in "${locales[@]}"; do
  sibling="$(get_switch_target "$locale")"
  check_homepage "$locale" "$sibling"
  check_contact "$locale" "$sibling"
  check_request_route "$locale" "$sibling"
done

bash "$(dirname "$0")/i18n-seo-smoke.sh" "$BASE_URL" "$PUBLIC_BASE"

echo "multilingual-qa-smoke: ok locales=${#locales[@]} routes=3 hreflang=delegated"

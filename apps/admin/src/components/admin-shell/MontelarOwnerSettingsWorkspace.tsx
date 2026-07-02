"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import React from "react";

import type {
  OwnerSettingsEditableFields,
  OwnerSettingsLocaleOption,
  OwnerSettingsSocialLink,
  OwnerSettingsWorkspaceSnapshot,
} from "@/lib/payload/owner-settings-workspace.ts";
import { hasAdminRole } from "@/lib/payload/roles.ts";

const emptySnapshot: OwnerSettingsWorkspaceSnapshot = {
  canPublish: false,
  canRead: false,
  canUpdate: false,
  generatedAt: "",
  localeOptions: [],
  previewHref: "",
  secondLayerCards: [],
  selectedLocale: "ru",
  selectedRecordHref: "",
  settings: {
    addressShort: "",
    brandName: "",
    brandShortName: "",
    contactEmail: "",
    contactFallbackLocale: "",
    contactHeadline: "",
    contactPhoneDisplay: "",
    contactPhoneE164: "",
    contactPrimaryHref: "",
    contactPrimaryLabel: "",
    contactTelegramUrl: "",
    contactWhatsappLabel: "",
    contactWhatsappUrl: "",
    footerCopyright: "",
    footerLegalName: "",
    internalCode: "",
    locale: "ru",
    primaryLocale: "en",
    recordId: "",
    showroomCity: "",
    showroomCountry: "",
    showroomLabel: "",
    siteConcept: "",
    siteTagline: "",
    socialLinks: [],
    status: "draft",
    updatedAt: "",
    visitNote: "",
  },
};

type FieldDefinition = {
  help: string;
  id: keyof OwnerSettingsEditableFields;
  label: string;
  placeholder?: string;
  type?: "email" | "text" | "textarea";
};

const brandFields: readonly FieldDefinition[] = [
  {
    id: "brandName",
    label: "Название бренда",
    help: "Как бренд виден на сайте и в общих контактах.",
    placeholder: "Montelar",
  },
  {
    id: "brandShortName",
    label: "Короткое имя",
    help: "Сокращение для компактных мест, если оно реально используется.",
    placeholder: "MNTL",
  },
  {
    id: "siteTagline",
    label: "Слоган",
    help: "Короткая основная формулировка под брендом.",
    type: "textarea",
  },
  {
    id: "siteConcept",
    label: "Концепция",
    help: "Одно короткое определение, которое держит тональность сайта.",
  },
];

const contactFields: readonly FieldDefinition[] = [
  {
    id: "contactHeadline",
    label: "Заголовок контакта",
    help: "Основная фраза в формах и контактных блоках.",
  },
  {
    id: "contactEmail",
    label: "Email",
    help: "Публичный email для сайта и обратной связи.",
    type: "email",
  },
  {
    id: "contactPhoneDisplay",
    label: "Телефон для показа",
    help: "Видимый телефон на сайте.",
  },
  {
    id: "contactPhoneE164",
    label: "Телефон для ссылок",
    help: "Номер для телефонной ссылки без пробелов и скобок.",
    placeholder: "+31205550100",
  },
  {
    id: "showroomLabel",
    label: "Название шоурума",
    help: "Как подписывать точку приема или private showroom.",
  },
  {
    id: "showroomCity",
    label: "Город",
    help: "Город показа или основной локации.",
  },
  {
    id: "showroomCountry",
    label: "Страна",
    help: "Страна для контактов внизу сайта и географического контекста.",
  },
  {
    id: "addressShort",
    label: "Короткий адрес",
    help: "Краткая строка адреса для footer и контактных блоков.",
  },
  {
    id: "visitNote",
    label: "Примечание о визите",
    help: "Короткое пояснение о визите, встрече или showroom flow.",
    type: "textarea",
  },
];

const ctaFields: readonly FieldDefinition[] = [
  {
    id: "contactPrimaryLabel",
    label: "Главная кнопка",
    help: "Основной текст кнопки для связи или запроса консультации.",
  },
  {
    id: "contactPrimaryHref",
    label: "Ссылка главной кнопки",
    help: "Путь внутри сайта, куда ведет основная кнопка.",
    placeholder: "/contact",
  },
  {
    id: "contactFallbackLocale",
    label: "Резервная локаль",
    help: "Какую языковую версию показывать, если для контакта нет локального текста.",
  },
  {
    id: "footerLegalName",
    label: "Юридическое имя",
    help: "Название компании внизу сайта и в обязательных текстах.",
  },
  {
    id: "footerCopyright",
    label: "Строка copyright",
    help: "Текст copyright внизу сайта.",
  },
];

const messengerFields: readonly FieldDefinition[] = [
  {
    id: "contactWhatsappLabel",
    label: "Подпись WhatsApp",
    help: "Как назвать кнопку или ссылку WhatsApp на текущем языке.",
  },
  {
    id: "contactWhatsappUrl",
    label: "Ссылка WhatsApp",
    help: "Полная ссылка `https://wa.me/...` или другой рабочий адрес.",
  },
  {
    id: "contactTelegramUrl",
    label: "Ссылка Telegram",
    help: "Полная ссылка на Telegram-аккаунт или канал.",
  },
];

const settingsCoverageCards = [
  {
    description: "Основной блок ниже: название, слоган, концепция, телефоны, email, showroom, кнопки и соцсети.",
    href: "",
    id: "direct-fields",
    label: "Можно изменить здесь",
  },
  {
    description: "Логотип, favicon, шапка, меню, низ сайта и языковой переключатель ведутся в соседнем разделе настроек.",
    href: "/admin/site-admin?section=header-footer",
    id: "brand-assets",
    label: "Логотип и шапка",
  },
  {
    description: "Видео, постер и главный визуал редактируются на главной странице, рядом с текущим изображением.",
    href: "/admin/site?focus=media",
    id: "home-media",
    label: "Видео главной",
  },
  {
    description: "Popup, thank-you тексты и уведомления ведутся в разделе форм, чтобы владелец видел весь путь заявки.",
    href: "/admin/site-admin?section=forms",
    id: "forms-feedback",
    label: "Формы и уведомления",
  },
] as const;

function resolveAdminHref(adminRoute: string, href: string) {
  if (href.startsWith("/admin")) {
    const [rawPath, rawSearch = ""] = href.replace(/^\/admin/, "").split("?", 2);
    const path = (rawPath || "/") as `/${string}`;
    const resolved = formatAdminURL({ adminRoute, path });
    return rawSearch ? `${resolved}?${rawSearch}` : resolved;
  }

  return href;
}

function getStatusTone(status: string) {
  switch (status) {
    case "published":
      return "steady";
    case "review":
      return "attention";
    default:
      return "planned";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "published":
      return "Опубликовано";
    case "review":
      return "На проверке";
    default:
      return "Черновик";
  }
}

function createDraftFromSnapshot(snapshot: OwnerSettingsWorkspaceSnapshot): OwnerSettingsEditableFields {
  return {
    addressShort: snapshot.settings.addressShort,
    brandName: snapshot.settings.brandName,
    brandShortName: snapshot.settings.brandShortName,
    contactEmail: snapshot.settings.contactEmail,
    contactFallbackLocale: snapshot.settings.contactFallbackLocale,
    contactHeadline: snapshot.settings.contactHeadline,
    contactPhoneDisplay: snapshot.settings.contactPhoneDisplay,
    contactPhoneE164: snapshot.settings.contactPhoneE164,
    contactPrimaryHref: snapshot.settings.contactPrimaryHref,
    contactPrimaryLabel: snapshot.settings.contactPrimaryLabel,
    contactTelegramUrl: snapshot.settings.contactTelegramUrl,
    contactWhatsappLabel: snapshot.settings.contactWhatsappLabel,
    contactWhatsappUrl: snapshot.settings.contactWhatsappUrl,
    footerCopyright: snapshot.settings.footerCopyright,
    footerLegalName: snapshot.settings.footerLegalName,
    showroomCity: snapshot.settings.showroomCity,
    showroomCountry: snapshot.settings.showroomCountry,
    showroomLabel: snapshot.settings.showroomLabel,
    siteConcept: snapshot.settings.siteConcept,
    siteTagline: snapshot.settings.siteTagline,
    socialLinks: snapshot.settings.socialLinks,
    visitNote: snapshot.settings.visitNote,
  };
}

function LocalePill({
  active,
  locale,
  onClick,
}: {
  active: boolean;
  locale: OwnerSettingsLocaleOption;
  onClick: (code: string) => void;
}) {
  return (
    <button
      className={active ? "montelar-settings-locale is-active" : "montelar-settings-locale"}
      onClick={() => onClick(locale.code)}
      type="button"
    >
      <strong>{locale.label}</strong>
      <span>{locale.code.toUpperCase()}</span>
    </button>
  );
}

function SettingsField({
  definition,
  onChange,
  value,
}: {
  definition: FieldDefinition;
  onChange: (value: string) => void;
  value: string;
}) {
  const inputClassName = definition.type === "textarea" ? "montelar-settings-field__textarea" : "montelar-settings-field__input";

  return (
    <label className="montelar-settings-field">
      <span>{definition.label}</span>
      <small>{definition.help}</small>
      {definition.type === "textarea" ? (
        <textarea
          className={inputClassName}
          onChange={(event) => onChange(event.target.value)}
          placeholder={definition.placeholder}
          value={value}
        />
      ) : (
        <input
          className={inputClassName}
          onChange={(event) => onChange(event.target.value)}
          placeholder={definition.placeholder}
          type={definition.type ?? "text"}
          value={value}
        />
      )}
    </label>
  );
}

function SocialLinkRow({
  index,
  onChange,
  onRemove,
  value,
}: {
  index: number;
  onChange: (next: OwnerSettingsSocialLink) => void;
  onRemove: () => void;
  value: OwnerSettingsSocialLink;
}) {
  return (
    <div className="montelar-settings-social">
      <label className="montelar-settings-field">
        <span>Подпись ссылки {index + 1}</span>
        <small>Например `Instagram`, `YouTube` или `Telegram`.</small>
        <input
          className="montelar-settings-field__input"
          onChange={(event) => onChange({ ...value, label: event.target.value })}
          value={value.label}
        />
      </label>
      <label className="montelar-settings-field">
        <span>Адрес ссылки {index + 1}</span>
        <small>Полный публичный URL без служебных параметров.</small>
        <input
          className="montelar-settings-field__input"
          onChange={(event) => onChange({ ...value, href: event.target.value })}
          value={value.href}
        />
      </label>
      <button className="montelar-settings-inline-button is-danger" onClick={onRemove} type="button">
        Убрать
      </button>
    </div>
  );
}

export function MontelarOwnerSettingsWorkspace() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedLocale = searchParams.get("locale") ?? "ru";
  const [snapshot, setSnapshot] = React.useState<OwnerSettingsWorkspaceSnapshot>(emptySnapshot);
  const [draft, setDraft] = React.useState<OwnerSettingsEditableFields>(createDraftFromSnapshot(emptySnapshot));
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const canReachWorkspace = hasAdminRole(user, ["owner", "admin", "developer"]);

  React.useEffect(() => {
    if (!canReachWorkspace) {
      setIsLoading(false);
      setError("У вашей роли нет доступа к owner-friendly настройкам.");
      return;
    }

    let cancelled = false;

    async function loadSnapshot() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/internal/owner-settings-workspace?locale=${encodeURIComponent(selectedLocale)}`, {
          credentials: "include",
          headers: {
            "Cache-Control": "no-store",
          },
        });
        const payload = (await response.json()) as OwnerSettingsWorkspaceSnapshot & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Не удалось загрузить раздел настроек.");
        }

        if (!cancelled) {
          setSnapshot(payload);
          setDraft(createDraftFromSnapshot(payload));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Не удалось загрузить раздел настроек.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [canReachWorkspace, selectedLocale]);

  function pushLocale(locale: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("locale", locale);
    router.push(`/admin/settings?${next.toString()}`);
  }

  function updateField<K extends keyof OwnerSettingsEditableFields>(key: K, value: OwnerSettingsEditableFields[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateSocialLink(index: number, value: OwnerSettingsSocialLink) {
    setDraft((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((entry, entryIndex) => (entryIndex === index ? value : entry)),
    }));
  }

  function addSocialLink() {
    setDraft((current) => ({
      ...current,
      socialLinks: [...current.socialLinks, { href: "", label: "" }],
    }));
  }

  function removeSocialLink(index: number) {
    setDraft((current) => ({
      ...current,
      socialLinks: current.socialLinks.filter((_, entryIndex) => entryIndex !== index),
    }));
  }

  async function submit(mode: "publish" | "save") {
    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/internal/owner-settings-workspace", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: draft,
          locale: snapshot.selectedLocale,
          mode,
        }),
      });
      const payload = (await response.json()) as OwnerSettingsWorkspaceSnapshot & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось сохранить настройки.");
      }

      setSnapshot(payload);
      setDraft(createDraftFromSnapshot(payload));
      setNotice(
        mode === "publish"
          ? "Изменения сохранены и помечены как опубликованные для текущей локали."
          : "Изменения сохранены. Статус публикации не менялся.",
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось сохранить настройки.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!canReachWorkspace) {
    return (
      <section className="montelar-settings-workspace montelar-settings-workspace--empty">
        <h1>Настройки</h1>
        <p>Первый слой настроек доступен только ролям, которые отвечают за сайт.</p>
      </section>
    );
  }

  return (
    <section className="montelar-settings-workspace">
      <div className="montelar-settings-workspace__hero">
        <div className="montelar-settings-workspace__hero-copy">
          <span className="montelar-admin-shell__eyebrow">Настройки</span>
          <h1>Контакты, кнопки и бренд на одном понятном экране</h1>
          <p>
            Здесь владелец меняет публичные контакты, главную кнопку, базовую бренд-подачу и ссылки. Логотип,
            favicon, видео главной, popup, thank-you и уведомления ведут в понятные соседние редакторы, без таблиц данных.
          </p>
        </div>
        <div className="montelar-settings-workspace__hero-rail">
          <div>
            <dt>Язык сайта</dt>
            <dd>{snapshot.selectedLocale.toUpperCase()}</dd>
          </div>
          <div>
            <dt>Статус</dt>
            <dd>
              <span className={`montelar-admin-state montelar-admin-state--${getStatusTone(snapshot.settings.status)}`}>
                {getStatusLabel(snapshot.settings.status)}
              </span>
            </dd>
          </div>
          <div>
            <dt>Поведение</dt>
            <dd>Сохранить здесь, проверить на сайте, редкие поля открыть в расширенном разделе.</dd>
          </div>
        </div>
        <div className="montelar-settings-workspace__hero-actions">
          <button className="montelar-settings-primary-button" disabled={isSaving} onClick={() => void submit("save")} type="button">
            {isSaving ? "Сохраняю…" : "Сохранить"}
          </button>
          <button className="montelar-settings-secondary-button" disabled={isSaving} onClick={() => void submit("publish")} type="button">
            Опубликовать
          </button>
          <Link href={snapshot.previewHref || "#"} target="_blank">
            Проверить на сайте
          </Link>
          <Link href={resolveAdminHref(adminRoute, "/admin/site-admin")}>
            Настройки сайта
          </Link>
        </div>
      </div>

      <section className="montelar-settings-panel">
        <div className="montelar-settings-panel__topline">
          <span>Что здесь настраивается</span>
          <span>Прямое редактирование и понятные соседние редакторы</span>
        </div>
        <div className="montelar-settings-coverage">
          {settingsCoverageCards.map((card) =>
            card.href ? (
              <Link href={resolveAdminHref(adminRoute, card.href)} key={card.id}>
                <strong>{card.label}</strong>
                <span>{card.description}</span>
              </Link>
            ) : (
              <article key={card.id}>
                <strong>{card.label}</strong>
                <span>{card.description}</span>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="montelar-settings-panel">
        <div className="montelar-settings-panel__topline">
          <span>Языки</span>
          <span>Выберите язык сайта, который редактируете сейчас</span>
        </div>
        <div className="montelar-settings-locales">
          {snapshot.localeOptions.map((locale) => (
            <LocalePill
              active={locale.code === snapshot.selectedLocale}
              key={locale.code}
              locale={locale}
              onClick={pushLocale}
            />
          ))}
        </div>
      </section>

      {isLoading ? <p className="montelar-settings-status">Загружаю настройки…</p> : null}
      {error ? <p className="montelar-settings-status is-error">{error}</p> : null}
      {notice ? <p className="montelar-settings-status is-success">{notice}</p> : null}

      {!isLoading ? (
        <div className="montelar-settings-workspace__layout">
          <div className="montelar-settings-workspace__main">
            <section className="montelar-settings-panel">
              <div className="montelar-settings-panel__topline">
                <span>Бренд</span>
                <span>Название, слоган и концепция</span>
              </div>
              <div className="montelar-settings-grid">
                {brandFields.map((definition) => (
                  <SettingsField
                    definition={definition}
                    key={definition.id}
                    onChange={(value) => updateField(definition.id, value)}
                    value={String(draft[definition.id] ?? "")}
                  />
                ))}
              </div>
            </section>

            <section className="montelar-settings-panel">
              <div className="montelar-settings-panel__topline">
                <span>Контакты</span>
                <span>Email, телефон, showroom и короткий адрес</span>
              </div>
              <div className="montelar-settings-grid">
                {contactFields.map((definition) => (
                  <SettingsField
                    definition={definition}
                    key={definition.id}
                    onChange={(value) => updateField(definition.id, value)}
                    value={String(draft[definition.id] ?? "")}
                  />
                ))}
              </div>
            </section>

            <section className="montelar-settings-panel">
              <div className="montelar-settings-panel__topline">
                <span>Кнопки и подвал</span>
                <span>Главная кнопка, адрес и обязательные подписи</span>
              </div>
              <div className="montelar-settings-grid">
                {ctaFields.map((definition) => (
                  <SettingsField
                    definition={definition}
                    key={definition.id}
                    onChange={(value) => updateField(definition.id, value)}
                    value={String(draft[definition.id] ?? "")}
                  />
                ))}
              </div>
            </section>

            <section className="montelar-settings-panel">
              <div className="montelar-settings-panel__topline">
                <span>Мессенджеры и соцсети</span>
                <span>Публичные ссылки без правил уведомлений</span>
              </div>
              <div className="montelar-settings-grid">
                {messengerFields.map((definition) => (
                  <SettingsField
                    definition={definition}
                    key={definition.id}
                    onChange={(value) => updateField(definition.id, value)}
                    value={String(draft[definition.id] ?? "")}
                  />
                ))}
              </div>
              <div className="montelar-settings-social-list">
                {draft.socialLinks.map((link, index) => (
                  <SocialLinkRow
                    index={index}
                    key={`${index}-${link.label}-${link.href}`}
                    onChange={(value) => updateSocialLink(index, value)}
                    onRemove={() => removeSocialLink(index)}
                    value={link}
                  />
                ))}
                <button className="montelar-settings-inline-button" onClick={addSocialLink} type="button">
                  Добавить соцсеть
                </button>
              </div>
            </section>
          </div>

          <aside className="montelar-settings-workspace__side">
            <section className="montelar-settings-panel">
              <div className="montelar-settings-panel__topline">
                <span>Публикация</span>
                <span>Что означает каждая кнопка</span>
              </div>
              <div className="montelar-settings-note-list">
                <article>
                  <strong>Сохранить</strong>
                  <p>Сохраняет правки текущей локали и не меняет статус публикации настроек.</p>
                </article>
                <article>
                  <strong>Опубликовать</strong>
                  <p>Сохраняет правки и делает текущую версию активной на сайте.</p>
                </article>
                <article>
                  <strong>Проверить на сайте</strong>
                  <p>Открывает внешний preview, чтобы сразу проверить контакты, кнопки и подвал в живом интерфейсе.</p>
                </article>
              </div>
            </section>

            <section className="montelar-settings-panel">
              <div className="montelar-settings-panel__topline">
                <span>Соседние настройки</span>
                <span>То, что лучше открыть в профильном редакторе</span>
              </div>
              <div className="montelar-settings-link-list">
                {snapshot.secondLayerCards.map((card) => (
                  <Link href={resolveAdminHref(adminRoute, card.href)} key={card.id}>
                    <strong>{card.label}</strong>
                    <span>{card.description}</span>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

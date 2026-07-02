"use client";

import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react";
import type { SiteLocale } from "@/config/i18n";
import type { CmsProductInquiryField } from "@/lib/cms/types";
import {
  validateInquiryField,
  validateProductInquiryForm,
} from "@/lib/forms/product-inquiry-validation";
import { getInquiryUiCopy } from "@/lib/forms/product-inquiry-copy";

type ProductInquiryFormProps = {
  productSlug: string;
  locale: SiteLocale;
  fields: CmsProductInquiryField[];
  submitLabel: string;
  stagedTitle: string;
  stagedMessage: string;
};

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; referenceCode: string }
  | { status: "error"; message: string };

function fieldInputId(productSlug: string, fieldKey: string) {
  return `${productSlug}-${fieldKey}`;
}

function buildDescribedBy(inputId: string, hasHint: boolean, hasError: boolean) {
  const ids = [];

  if (hasHint) {
    ids.push(`${inputId}-hint`);
  }

  if (hasError) {
    ids.push(`${inputId}-error`);
  }

  return ids.length ? ids.join(" ") : undefined;
}

function getAutocomplete(fieldKey: string) {
  if (fieldKey === "fullName") {
    return "name";
  }

  if (fieldKey === "email") {
    return "email";
  }

  if (fieldKey === "phone") {
    return "tel";
  }

  if (fieldKey === "city") {
    return "address-level2";
  }

  return undefined;
}

function renderField(
  field: CmsProductInquiryField,
  locale: SiteLocale,
  productSlug: string,
  error?: string,
) {
  const uiCopy = getInquiryUiCopy(locale);
  const inputId = fieldInputId(productSlug, field.fieldKey);
  const widthClass = `product-form-field width-${field.width ?? "full"}`;
  const describedBy = buildDescribedBy(inputId, Boolean(field.helperText), Boolean(error));
  const helper = field.helperText ? (
    <p id={`${inputId}-hint`} className="product-form-hint">
      {field.helperText}
    </p>
  ) : null;
  const errorNode = error ? (
    <p id={`${inputId}-error`} className="product-form-error">
      {error}
    </p>
  ) : null;
  const commonProps = {
    id: inputId,
    name: field.fieldKey,
    required: field.required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  };

  if (field.fieldType === "hidden-context") {
    return null;
  }

  if (field.fieldType === "textarea") {
    return (
      <label key={field.fieldKey} className={widthClass} htmlFor={inputId}>
        <span className="product-form-label">
          {field.label}
          {field.required ? <span className="product-form-required"> *</span> : null}
        </span>
        <textarea
          {...commonProps}
          className="product-form-control product-form-textarea"
          placeholder={field.placeholder}
          rows={5}
        />
        {helper}
        {errorNode}
      </label>
    );
  }

  if (field.fieldType === "select" || field.fieldType === "multi-select") {
    return (
      <label key={field.fieldKey} className={widthClass} htmlFor={inputId}>
        <span className="product-form-label">
          {field.label}
          {field.required ? <span className="product-form-required"> *</span> : null}
        </span>
        <select
          {...commonProps}
          className="product-form-control"
          defaultValue={field.fieldType === "select" ? "" : undefined}
          multiple={field.fieldType === "multi-select"}
          size={
            field.fieldType === "multi-select"
              ? Math.max(field.options?.length ?? 3, 3)
              : undefined
          }
        >
          {field.fieldType === "select" ? <option value="">{uiCopy.selectPlaceholder}</option> : null}
          {field.options?.map((option) => (
            <option key={`${field.fieldKey}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helper}
        {errorNode}
      </label>
    );
  }

  if (field.fieldType === "radio") {
    return (
      <fieldset key={field.fieldKey} className={`${widthClass} product-form-fieldset`}>
        <legend className="product-form-label">
          {field.label}
          {field.required ? <span className="product-form-required"> *</span> : null}
        </legend>
        <div className={`product-form-choice-group${error ? " invalid" : ""}`}>
          {field.options?.map((option) => (
            <label key={`${field.fieldKey}-${option.value}`} className="product-form-choice">
              <input
                {...commonProps}
                id={`${inputId}-${option.value}`}
                type="radio"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {helper}
        {errorNode}
      </fieldset>
    );
  }

  if (field.fieldType === "checkbox" || field.fieldType === "consent") {
    return (
      <label
        key={field.fieldKey}
        className={`${widthClass} product-form-choice product-form-consent${error ? " invalid" : ""}`}
      >
        <input {...commonProps} type="checkbox" value="true" />
        <span>
          {field.label}
          {field.required ? <span className="product-form-required"> *</span> : null}
        </span>
        {helper}
        {errorNode}
      </label>
    );
  }

  if (field.fieldType === "file-placeholder") {
    return (
      <div key={field.fieldKey} className={widthClass}>
        <span className="product-form-label">{field.label}</span>
        <div className="product-form-placeholder product-form-upload-placeholder">
          {uiCopy.filePlaceholderNote}
        </div>
        {helper}
      </div>
    );
  }

  const inputType =
    field.fieldType === "email" ||
    field.fieldType === "number" ||
    field.fieldType === "date"
      ? field.fieldType
      : field.fieldType === "phone"
        ? "tel"
        : "text";

  return (
    <label key={field.fieldKey} className={widthClass} htmlFor={inputId}>
      <span className="product-form-label">
        {field.label}
        {field.required ? <span className="product-form-required"> *</span> : null}
      </span>
      <input
        {...commonProps}
        autoComplete={getAutocomplete(field.fieldKey)}
        className="product-form-control"
        placeholder={field.placeholder}
        type={inputType}
      />
      {helper}
      {errorNode}
    </label>
  );
}

export function ProductInquiryForm({
  productSlug,
  locale,
  fields,
  submitLabel,
  stagedTitle,
  stagedMessage,
}: ProductInquiryFormProps) {
  const uiCopy = getInquiryUiCopy(locale);
  const [startedAt] = useState(() => Date.now());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLocallyValidated, setIsLocallyValidated] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    status: "idle",
  });

  function isFieldElement(
    target: EventTarget | null,
  ): target is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    );
  }

  function focusFirstInvalidField(
    form: HTMLFormElement,
    nextFieldErrors: Record<string, string>,
  ) {
    const [firstFieldKey] = Object.keys(nextFieldErrors);
    if (!firstFieldKey) {
      return;
    }

    const target = form.querySelector<HTMLElement>(`[name="${firstFieldKey}"]`);
    target?.focus();
  }

  function updateFieldState(
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  ) {
    const fieldKey = element.name;

    if (!fieldKey) {
      return;
    }

    if (isLocallyValidated) {
      setIsLocallyValidated(false);
    }

    if (submissionState.status !== "idle") {
      setSubmissionState({ status: "idle" });
    }

    if (!fieldErrors[fieldKey]) {
      return;
    }

    const form = element.form;
    if (!form) {
      return;
    }

    const field = fields.find((candidate) => candidate.fieldKey === fieldKey);
    if (!field) {
      return;
    }

    const nextError = validateInquiryField(field, new FormData(form), locale);
    setFieldErrors((current) => {
      const nextFieldErrors = { ...current };

      if (nextError) {
        nextFieldErrors[fieldKey] = nextError;
      } else {
        delete nextFieldErrors[fieldKey];
      }

      return nextFieldErrors;
    });
  }

  function handleFormChange(event: ChangeEvent<HTMLFormElement>) {
    if (!isFieldElement(event.target)) {
      return;
    }

    updateFieldState(event.target);
  }

  function handleFormBlur(event: FocusEvent<HTMLFormElement>) {
    if (!isFieldElement(event.target)) {
      return;
    }

    updateFieldState(event.target);
  }

  function serializeSubmission(formData: FormData) {
    return Object.fromEntries(
      fields
        .filter(
          (field) =>
            field.fieldType !== "hidden-context" && field.fieldType !== "file-placeholder",
        )
        .map((field) => {
          if (field.fieldType === "checkbox" || field.fieldType === "consent") {
            return [field.fieldKey, formData.has(field.fieldKey)];
          }

          if (field.fieldType === "multi-select") {
            return [
              field.fieldKey,
              formData
                .getAll(field.fieldKey)
                .filter((value): value is string => typeof value === "string")
                .map((value) => value.trim())
                .filter(Boolean),
            ];
          }

          const value = formData.get(field.fieldKey);
          return [field.fieldKey, typeof value === "string" ? value.trim() : ""];
        }),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const validation = validateProductInquiryForm(fields, formData, locale);

    setFieldErrors(validation.fieldErrors);
    setIsLocallyValidated(validation.isValid);

    if (!validation.isValid) {
      focusFirstInvalidField(form, validation.fieldErrors);
      return;
    }

    setSubmissionState({ status: "submitting" });

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productSlug,
          locale,
          values: serializeSubmission(formData),
          meta: {
            honeypot:
              typeof formData.get("companyWebsite") === "string"
                ? formData.get("companyWebsite")?.toString().trim() ?? ""
                : "",
            startedAt,
          },
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
        lead?: { referenceCode?: string };
      };

      if (!response.ok || !payload.ok) {
        const nextFieldErrors = payload.fieldErrors ?? {};
        setFieldErrors(nextFieldErrors);
        setSubmissionState({
          status: "error",
          message: payload.error ?? uiCopy.requestSaveUnavailable,
        });

        if (Object.keys(nextFieldErrors).length) {
          focusFirstInvalidField(form, nextFieldErrors);
        }

        return;
      }

      form.reset();
      setFieldErrors({});
      setIsLocallyValidated(false);
      setSubmissionState({
        status: "success",
        referenceCode: payload.lead?.referenceCode ?? "Pending reference",
      });
    } catch {
      setSubmissionState({
        status: "error",
        message: uiCopy.requestServiceUnavailable,
      });
    }
  }

  const errorSummaryEntries = Object.entries(fieldErrors);

  return (
    <form
      className="product-inquiry-form"
      action="#"
      method="post"
      noValidate
      onBlur={handleFormBlur}
      onChange={handleFormChange}
      onSubmit={handleSubmit}
    >
      <div aria-hidden="true" className="product-form-honeypot">
        <label htmlFor={`${productSlug}-companyWebsite`}>{uiCopy.honeypotLabel}</label>
        <input
          id={`${productSlug}-companyWebsite`}
          name="companyWebsite"
          autoComplete="off"
          tabIndex={-1}
          type="text"
        />
      </div>
      {errorSummaryEntries.length ? (
        <div className="product-form-error-summary" aria-live="polite">
          <p className="product-form-postscript-title">{uiCopy.errorSummaryTitle}</p>
          <ul className="status-list">
            {errorSummaryEntries.map(([fieldKey, message]) => (
              <li key={fieldKey}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="product-inquiry-grid">
        {fields.map((field) => renderField(field, locale, productSlug, fieldErrors[field.fieldKey]))}
      </div>
      <div className="product-form-footer">
        <button
          className="product-form-button"
          disabled={submissionState.status === "submitting"}
          type="submit"
        >
          {submissionState.status === "submitting" ? uiCopy.submittingButton : submitLabel}
        </button>
        <div className="product-form-postscript" aria-live="polite">
          <p className="product-form-postscript-title">
            {submissionState.status === "success"
              ? stagedTitle
              : submissionState.status === "error"
                ? uiCopy.submissionUnavailableTitle
                : submissionState.status === "submitting"
                  ? uiCopy.submittingTitle
                  : isLocallyValidated
                    ? uiCopy.validationPassedTitle
                    : stagedTitle}
          </p>
          <p>
            {submissionState.status === "success"
              ? `${stagedMessage} ${uiCopy.successReferenceLabel}: ${submissionState.referenceCode}.`
              : submissionState.status === "error"
                ? submissionState.message
                : submissionState.status === "submitting"
                  ? uiCopy.submittingDescription
                  : isLocallyValidated
                    ? uiCopy.validationPassedDescription
                    : stagedMessage}
          </p>
        </div>
      </div>
    </form>
  );
}

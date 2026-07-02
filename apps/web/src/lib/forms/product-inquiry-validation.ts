import type { SiteLocale } from "@/config/i18n";
import type { CmsProductInquiryField } from "@/lib/cms/types";
import { getInquiryUiCopy } from "@/lib/forms/product-inquiry-copy";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d\s().-]+$/;

export type ProductInquiryValidationResult = {
  isValid: boolean;
  fieldErrors: Record<string, string>;
};

function normalizeLabel(field: CmsProductInquiryField) {
  return field.label.toLowerCase();
}

function getSingleValue(formData: FormData, fieldKey: string) {
  const value = formData.get(fieldKey);
  return typeof value === "string" ? value.trim() : "";
}

function getMultiValue(formData: FormData, fieldKey: string) {
  return formData
    .getAll(fieldKey)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getRequiredMessage(field: CmsProductInquiryField, locale: SiteLocale) {
  const uiCopy = getInquiryUiCopy(locale);

  if (field.fieldType === "consent") {
    return uiCopy.requiredConsent;
  }

  if (
    field.fieldType === "select" ||
    field.fieldType === "radio" ||
    field.fieldType === "multi-select"
  ) {
    return uiCopy.chooseField(normalizeLabel(field));
  }

  return uiCopy.requiredField(normalizeLabel(field));
}

export function validateInquiryField(
  field: CmsProductInquiryField,
  formData: FormData,
  locale: SiteLocale = "en",
) {
  const uiCopy = getInquiryUiCopy(locale);

  if (field.fieldType === "hidden-context" || field.fieldType === "file-placeholder") {
    return null;
  }

  if (field.fieldType === "checkbox" || field.fieldType === "consent") {
    const checked = formData.has(field.fieldKey);
    if (field.required && !checked) {
      return getRequiredMessage(field, locale);
    }

    return null;
  }

  if (field.fieldType === "multi-select") {
    const values = getMultiValue(formData, field.fieldKey);
    if (field.required && values.length === 0) {
      return getRequiredMessage(field, locale);
    }

    return null;
  }

  const value = getSingleValue(formData, field.fieldKey);

  if (field.required && value.length === 0) {
    return getRequiredMessage(field, locale);
  }

  if (value.length === 0) {
    return null;
  }

  if (field.fieldType === "email" && !emailPattern.test(value)) {
    return uiCopy.invalidEmail;
  }

  if (field.fieldType === "phone") {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 7 || !phonePattern.test(value)) {
      return uiCopy.invalidPhone;
    }
  }

  if (field.fieldType === "number" && Number.isNaN(Number(value))) {
    return uiCopy.invalidNumber;
  }

  if (field.fieldType === "date" && Number.isNaN(Date.parse(value))) {
    return uiCopy.invalidDate;
  }

  return null;
}

export function validateProductInquiryForm(
  fields: CmsProductInquiryField[],
  formData: FormData,
  locale: SiteLocale = "en",
): ProductInquiryValidationResult {
  const fieldErrors: Record<string, string> = {};

  for (const field of fields) {
    const error = validateInquiryField(field, formData, locale);
    if (error) {
      fieldErrors[field.fieldKey] = error;
    }
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

# 89. Internationalization (i18n) — Timezone, Currency, RTL Support

## Coverage Level
**Partial** — You have some locale handling in the stack, but a full i18n pipeline covering timezone-aware date storage, locale-specific currency formatting, and RTL (right-to-left) layout support is not visible. For a multi-tenant SaaS, i18n at the tenant level is a significant enterprise feature.

## What It Is
Internationalization (i18n) is the process of designing and building software so that it can be adapted to different languages, regions, and cultures without engineering changes. Localization (l10n) is the actual adaptation to a specific locale. Most developers treat i18n as "translate the text strings" — but full i18n covers six distinct concerns: text translation, date and time formatting, number and currency formatting, RTL (right-to-left) text layout for Arabic/Hebrew/Persian, locale-specific sort orders, and timezone handling.

For a multi-tenant SaaS, timezone handling is the most commonly botched concern. The correct approach is to store all timestamps in UTC in the database, derive the tenant or user's timezone from their settings, and convert only at display time — never at storage time. Converting at storage time means you cannot change a user's timezone setting without re-processing all their historical data, and it makes cross-tenant queries impossible. The second most common issue is currency formatting: `$1,234.56` in the US becomes `1.234,56 $` in Germany and `¥1,234` in Japan — using JavaScript's `Intl.NumberFormat` with a locale and currency code handles this correctly; rolling your own currency formatting does not.

RTL support is the most architecturally involved concern. Arabic and Hebrew read right-to-left, which means the entire page layout mirrors: navigation is on the right, text aligns right, icons for "back" and "forward" flip meaning, and CSS properties that use left/right (margin-left, padding-right, text-align: left) must be replaced with their logical equivalents (margin-inline-start, padding-inline-end, text-align: start) so they flip automatically based on the document direction. For a SaaS with plans to expand into Middle Eastern markets, implementing CSS logical properties from the start is a one-time cost that prevents an expensive refactor later.

## Key Concepts
- **UTC-only storage**: All `timestamp` columns store UTC; the `timezone` column belongs in the user or tenant settings table, not in every timestamp column
- **`Intl.DateTimeFormat`**: The built-in JavaScript API for locale-aware date formatting; handles calendar systems, month names, and time format (12h vs 24h) automatically
- **`Intl.NumberFormat`**: Built-in API for locale-aware number and currency formatting; handles decimal separators, thousands separators, and currency symbols per locale
- **LTR vs RTL (`dir` attribute)**: `<html dir="rtl">` or per-element `dir="rtl"` tells the browser to mirror the layout; must be set dynamically based on the locale
- **CSS logical properties**: `margin-inline-start` instead of `margin-left`, `padding-inline-end` instead of `padding-right` — these respect the `dir` attribute automatically
- **ICU message format**: The standard format for i18n strings that handles pluralization, gender, and variable interpolation correctly across languages (e.g., "1 item" vs "3 items" — English uses count 1 = singular, all others = plural; Arabic has 6 plural forms)
- **Tenant-level locale settings**: In a multi-tenant SaaS, locale (language, timezone, currency) belongs in the tenant settings table, not hardcoded; each tenant may have different defaults
- **`next-intl` for Next.js**: The most mature i18n library for Next.js App Router; handles routing, message loading, and timezone-aware formatting with React Server Components support

## Example Code or Template

```typescript
// Tenant locale settings schema addition
// Add to your tenant_setting entity

interface TenantLocaleSettings {
  language: string;        // BCP 47 tag: 'en-US', 'de-DE', 'ar-SA', 'tr-TR'
  timezone: string;        // IANA timezone: 'Europe/Istanbul', 'America/New_York'
  currency: string;        // ISO 4217: 'USD', 'EUR', 'TRY', 'AED'
  dateFormat: string;      // 'MM/DD/YYYY' | 'DD.MM.YYYY' | 'YYYY-MM-DD'
  direction: 'ltr' | 'rtl'; // derived from language, but overridable
}

// ============================================================
// TIMEZONE-AWARE DATE DISPLAY
// ============================================================

/**
 * Format a UTC timestamp for display in a specific tenant's timezone.
 * NEVER store the formatted string — format only for display.
 */
export function formatDateForTenant(
  utcDate: Date,
  tenantSettings: Pick<TenantLocaleSettings, 'language' | 'timezone'>
): string {
  return new Intl.DateTimeFormat(tenantSettings.language, {
    timeZone: tenantSettings.timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(utcDate);
}

// Usage:
// formatDateForTenant(subscription.createdAt, { language: 'tr-TR', timezone: 'Europe/Istanbul' })
// → "4 Mayıs 2026 09:23"


// ============================================================
// CURRENCY FORMATTING
// ============================================================

export function formatCurrency(
  amountInCents: number,
  currency: string,
  locale: string
): string {
  // Always store amounts in smallest unit (cents); convert for display only
  const amount = amountInCents / 100;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2, // JPY has no cents
  }).format(amount);
}

// Usage:
// formatCurrency(1999, 'USD', 'en-US') → "$19.99"
// formatCurrency(1999, 'EUR', 'de-DE') → "19,99 €"
// formatCurrency(1999, 'TRY', 'tr-TR') → "₺19,99"


// ============================================================
// RTL DETECTION AND DOCUMENT DIRECTION
// ============================================================

const RTL_LOCALES = new Set([
  'ar', 'ar-SA', 'ar-AE', 'ar-EG',
  'he', 'he-IL',
  'fa', 'fa-IR',
  'ur', 'ur-PK',
]);

export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  const language = locale.split('-')[0];
  return RTL_LOCALES.has(locale) || RTL_LOCALES.has(language) ? 'rtl' : 'ltr';
}

// In your root layout:
// const dir = getTextDirection(tenant.settings.language);
// <html lang={tenant.settings.language} dir={dir}>


// ============================================================
// CSS LOGICAL PROPERTIES — use these in Tailwind custom classes
// ============================================================

// Instead of:        Use:
// ml-4               ms-4   (margin-inline-start)
// pr-2               pe-2   (padding-inline-end)
// text-left          text-start
// border-l           border-s
// left-0             start-0
// rounded-l-md       rounded-s-md

// In tailwind.config.js — ensure logical properties are available:
// The 'ms', 'me', 'ps', 'pe', 'text-start', 'text-end', 'rounded-s', 'rounded-e'
// utilities are built into Tailwind CSS v3.3+


// ============================================================
// PLURALIZATION WITH ICU FORMAT (next-intl)
// ============================================================

// messages/en.json
// {
//   "item_count": "{count, plural, =0 {No items} one {# item} other {# items}}"
// }

// messages/ar.json (Arabic has 6 plural forms)
// {
//   "item_count": "{count, plural, =0 {لا عناصر} one {عنصر واحد} two {عنصران} few {# عناصر} many {# عنصرًا} other {# عنصر}}"
// }

// Component usage with next-intl:
// const t = useTranslations();
// t('item_count', { count: 3 }) → "3 items" (en) | "3 عناصر" (ar)
```

## When to Use
- Before building any UI that displays dates — establish the UTC storage + timezone display pattern at project start; retrofitting is expensive
- When a client operates in multiple countries or time zones — tenant-level locale settings are a billable feature that enterprise clients expect
- When pricing plans for international markets — currency formatting must be correct from day one; showing "$" to users who pay in euros creates distrust
- When targeting Arabic, Hebrew, or Persian-speaking markets — audit CSS for physical properties (left/right) and replace with logical properties before writing any RTL-specific code
- When evaluating whether `next-intl` is worth adding — if you have more than two languages or one RTL locale, yes; the alternative (manual string management) does not scale

## Common Mistakes
- **Storing dates in local timezone**: A subscription created at "midnight" for a user in Tokyo stored as local time becomes a different UTC day — every cross-timezone query is wrong; always store UTC, always
- **Rolling your own currency formatting**: `"$" + (amount / 100).toFixed(2)` is incorrect for non-USD currencies, produces wrong decimal separators in many locales, and fails for currencies without cents; use `Intl.NumberFormat` and never touch it again
- **Adding RTL as an afterthought**: Trying to mirror a layout built with physical CSS properties (left, right, float) after the fact requires touching every stylesheet rule; CSS logical properties cost nothing to use from the start and pay back when RTL support is needed
- **Single global locale**: In a multi-tenant SaaS, two tenants may use different languages, timezones, and currencies; locale must be a per-tenant (and optionally per-user) setting, not a single application-level configuration

## Further Reading
- **`next-intl` documentation (next-intl.dev)** — The most complete i18n solution for Next.js App Router; covers routing, message loading, timezone-aware formatting, and RTL; read the "Getting Started" and "Formatting" sections first
- **MDN Web Docs: Intl (developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)** — The canonical reference for JavaScript's built-in internationalization API; every method you need for dates, numbers, and currencies is here
- **"Internationalization Best Practices for Spec Developers" — W3C (w3.org/International)** — The authoritative guide to i18n in web standards; the "Authoring HTML and CSS" section covers RTL, logical properties, and bidirectional text handling

# @plainfold/i18n

i18n provider for Plainfold apps wrapping i18next + react-i18next.

## Architecture

- `PfI18nProvider` - React provider that initializes i18next with language detection and store persistence
- `useLocale` - Hook returning `{ locale, setLocale, languages }` for programmatic locale control
- `PfLanguageSwitcher` - Plain HTML `<select>` dropdown (no @plainfold/ui dependency to avoid circular deps)
- Store key: `pf:i18n:locale` via `@plainfold/store` Settings

## Commands

- `npm test` - Run tests with vitest
- `npm run build` - Build with vite (lib mode, outputs ESM + CJS)
- `npm run typecheck` - TypeScript type checking
- `npm run lint` - ESLint

## Conventions

- All CSS custom properties use `--pf-*` prefix
- Uses `i18n.createInstance()` for isolation between provider instances
- Detection order: querystring -> navigator -> htmlTag
- `load: 'languageOnly'` maps region tags (e.g. es-419) to base language (es)
- Re-exports `useTranslation` from react-i18next for app convenience

import type { i18n as I18nInstance } from 'i18next'

/** Instances whose language the person has picked; a saved language arriving late never overrides these. */
export const pickedInstances = new WeakSet<I18nInstance>()

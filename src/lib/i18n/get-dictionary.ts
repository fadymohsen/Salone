import type { Locale } from "./config";

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  ar: () => import("./dictionaries/ar.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

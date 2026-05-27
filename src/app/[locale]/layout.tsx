import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { DictionaryProvider } from "@/lib/i18n/DictionaryContext";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dictionary = await getDictionary(locale as Locale);

  return (
    <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <LocaleProvider locale={locale}>
        <DictionaryProvider dictionary={dictionary}>
          {children}
        </DictionaryProvider>
      </LocaleProvider>
    </div>
  );
}

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

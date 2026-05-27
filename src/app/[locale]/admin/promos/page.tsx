import PromoManager from "@/components/admin/PromoManager";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export default async function PromosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getDictionary(locale as Locale);

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-glam-text">{t.admin.promosPage.title}</h1>
        <p className="text-sm text-glam-text/50 mt-0.5">{t.admin.promosPage.subtitle}</p>
      </div>
      <PromoManager />
    </div>
  );
}

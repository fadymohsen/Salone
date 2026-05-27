import GalleryManager from "@/components/admin/GalleryManager";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getDictionary(locale as Locale);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-glam-text">{t.admin.galleryPage.title}</h1>
        <p className="text-sm text-muted mt-0.5">{t.admin.galleryPage.subtitle}</p>
      </div>
      <GalleryManager />
    </div>
  );
}

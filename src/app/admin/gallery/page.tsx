import GalleryManager from "@/components/admin/GalleryManager";

export default function GalleryPage() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-glam-text">Gallery</h1>
        <p className="text-sm text-muted mt-0.5">Manage the &quot;Our Work&quot; section on the homepage</p>
      </div>
      <GalleryManager />
    </div>
  );
}

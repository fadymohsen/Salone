import TestimonialManager from "@/components/admin/TestimonialManager";

export default function FeedbacksPage() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-glam-text">Feedbacks</h1>
        <p className="text-sm text-muted mt-0.5">Manage client testimonials shown on the homepage</p>
      </div>
      <TestimonialManager />
    </div>
  );
}

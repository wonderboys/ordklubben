import { AdminPage, AdminPanel } from "@/components/admin/admin-ui";

export default function AdminQueuePage() {
  return (
    <AdminPage
      title="Arbetskö"
      description="Central granskningskö för nyckelförslag och contentuppgifter."
    >
      <AdminPanel title="Kommer snart">
        <p className="text-sm text-print-muted">
          Arbetskö planeras som nästa steg i admin 2.0. Tills dess kan du granska förslag
          under Förslag eller direkt på respektive ord.
        </p>
      </AdminPanel>
    </AdminPage>
  );
}

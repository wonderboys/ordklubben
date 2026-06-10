import { AdminPanel } from "@/components/admin/admin-ui";

export function WordPlaceholderSection({ message }: { message: string }) {
  return (
    <AdminPanel>
      <p className="text-sm text-print-muted">{message}</p>
    </AdminPanel>
  );
}

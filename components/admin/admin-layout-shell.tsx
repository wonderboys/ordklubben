import { AdminSidebar } from "@/components/admin/admin-sidebar";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-ui flex min-h-screen flex-col bg-[#f4f3ef] md:flex-row">
      <AdminSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

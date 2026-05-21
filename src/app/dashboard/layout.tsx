import DashboardSidebar from '@/components/layout/DashboardSidebar';
import DashboardTopbar from '@/components/layout/DashboardTopbar';
import AdminPanelRedirect from '@/components/layout/AdminPanelRedirect';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 15% 15%, rgba(230,57,70,0.07) 0%, transparent 45%), radial-gradient(ellipse at 85% 85%, rgba(230,57,70,0.05) 0%, transparent 45%), var(--color-bg-primary)',
      }}
    >
      <AdminPanelRedirect />
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardTopbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

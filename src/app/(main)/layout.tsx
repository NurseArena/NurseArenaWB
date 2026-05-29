import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Navbar } from '@/components/layout/Navbar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

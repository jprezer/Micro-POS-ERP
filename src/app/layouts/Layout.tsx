import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 min-w-0 w-full max-w-[calc(100vw-16rem)]">
        <Outlet />
      </main>
    </div>
  );
}
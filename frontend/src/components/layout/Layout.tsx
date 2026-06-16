import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      <Navbar />
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-5 py-8 lg:px-8 lg:py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

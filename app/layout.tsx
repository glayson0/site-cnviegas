import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { LibraryProvider } from '../context/LibraryContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ToastContainer } from '../components/Toast';
import { createClient } from '../lib/supabase/server';
import { fetchProfile } from '../lib/profile';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Biblioteca Coletivo Negro Viegas D'Abreu",
  description:
    "Sistema de gestão, consulta e circulação de livros da Biblioteca Comunitária do Coletivo Negro Viegas D'Abreu.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const initialUser = user ? await fetchProfile(supabase, user.id) : null;

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-black text-black dark:text-white selection:bg-red-900 selection:text-white">
        <AuthProvider initialUser={initialUser}>
          <LibraryProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
            <ToastContainer />
          </LibraryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import {
  BookOpen,
  Library,
  PlusCircle,
  History,
  Users,
  LogIn,
  LogOut,
  UserPlus,
  Menu,
  X,
  Shield,
  User as UserIcon,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, role, isAuthenticated, logout } = useAuth();
  const { getUserActiveLoans } = useLibrary();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeLoans = currentUser ? getUserActiveLoans(currentUser.id) : [];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-black/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-red-900 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base sm:text-lg tracking-tight text-black dark:text-white flex items-center gap-1.5">
                  Biblioteca Coletivo
                  <span className="hidden xs:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-red-900 text-white rounded">
                    Negro Viegas D&apos;Abreu
                  </span>
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                  Acervo Comunitário & Aberto
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            

            {/* Reader Authenticated Links */}
            {role === 'reader' && (
              <Link
                href="/readers"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/readers')
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-400 font-bold border border-red-200 dark:border-red-900'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-red-900 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <UserIcon className="w-4 h-4 text-red-900" />
                Painel do Leitor
                {activeLoans.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-red-900 text-white rounded-full">
                    {activeLoans.length}
                  </span>
                )}
              </Link>
            )}

            {/* Admin Authenticated Links */}
            {role === 'admin' && (
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname === '/admin'
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-red-900 font-bold border border-red-900/30'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-red-900 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Shield className="w-4 h-4 text-red-900" />
                  Painel Admin
                </Link>

                <Link
                  href="/admin/add"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname === '/admin/add'
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-red-900 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-red-900 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-red-900" />
                  + Novo Livro
                </Link>

                <Link
                  href="/admin/historico"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname === '/admin/historico'
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-red-900 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-red-900 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <History className="w-4 h-4" />
                  Empréstimos
                </Link>

                <Link
                  href="/admin/readers"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname === '/admin/readers'
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-red-900 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-red-900 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Leitores
                </Link>
              </div>
            )}
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            {isAuthenticated && currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-base">{currentUser.avatar || '👤'}</span>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-black dark:text-white leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-none">
                      {currentUser.role === 'admin' ? 'Coordenador / Admin' : 'Membro Leitor'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sair da conta"
                  className="p-2 rounded-xl text-zinc-500 hover:text-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900 transition-all"
                  aria-label="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-xl text-sm font-bold bg-red-900 hover:bg-red-800 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-4 pt-2 pb-6 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
              pathname === '/' || pathname === '/books'
                ? 'text-red-900 font-bold bg-zinc-100 dark:bg-zinc-900'
                : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Library className="w-4 h-4" />
            Acervo Geral
          </Link>

          {role === 'reader' && (
            <Link
              href="/readers"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-bold text-red-900 bg-red-50 dark:bg-red-950/40"
            >
              Painel do Leitor (Empréstimos e Histórico)
            </Link>
          )}

          {role === 'admin' && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Módulos do Administrador
              </span>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-bold text-red-900"
              >
                Painel Geral & Métricas
              </Link>
              <Link
                href="/admin/add"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-800 dark:text-zinc-200"
              >
                + Adicionar Livro
              </Link>
              <Link
                href="/admin/historico"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-800 dark:text-zinc-200"
              >
                Empréstimos & Histórico
              </Link>
              <Link
                href="/admin/readers"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-800 dark:text-zinc-200"
              >
                Leitores do Coletivo
              </Link>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
            {isAuthenticated && currentUser ? (
              <div className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                <div className="flex items-center gap-2">
                  <span>{currentUser.avatar || '👤'}</span>
                  <div>
                    <p className="text-sm font-bold text-black dark:text-white">{currentUser.name}</p>
                    <p className="text-xs text-zinc-500">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-900 hover:bg-red-100 dark:hover:bg-red-950"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-semibold text-black dark:text-white"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl bg-red-900 hover:bg-red-800 text-sm font-bold text-white shadow"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useLibrary } from '../../../context/LibraryContext';
import {
  BookOpen,
  LogIn,
  UserCheck,
  Shield,
  Eye,
  Lock,
  Mail,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsDemo } = useAuth();
  const { addToast } = useLibrary();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível entrar.');
      return;
    }
    addToast('Bem-vindo!', `Login efetuado com sucesso para ${email}.`);
    router.push('/');
  };

  const handleDemoLogin = async (demoRole: 'reader' | 'admin') => {
    setError(null);
    setLoading(true);
    const result = await loginAsDemo(demoRole);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível entrar com a conta demo.');
      return;
    }
    if (demoRole === 'admin') {
      addToast('Modo Admin', 'Conectado como Coordenação da Biblioteca.');
    } else {
      addToast('Modo Leitor', 'Conectado como Leitor Comunitário (Membro Leitor).');
    }
    router.push('/');
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black text-black dark:text-white">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-950/30 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
            Acesso à Biblioteca
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Coletivo Negro Viegas D&apos;Abreu • Gestão e Empréstimos
          </p>
        </div>

        {/* 1-CLICK DEMO ACCESS CARDS */}
        <div className="p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            Acesso Rápido de Demonstração (1 Clique)
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('reader')}
              disabled={loading}
              className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-600 hover:shadow-md transition-all text-left group flex flex-col justify-between gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600">
                  <UserCheck className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded">
                  Leitor
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-black dark:text-white group-hover:text-red-600 transition-colors">
                  Leitor Comunitário
                </p>
                <p className="text-[11px] text-zinc-500">Membro Comum</p>
              </div>
            </button>

            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-600 hover:shadow-md transition-all text-left group flex flex-col justify-between gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white">
                  <Shield className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold text-black dark:text-white bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Admin
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-black dark:text-white group-hover:text-red-600 transition-colors">
                  Coordenação da Biblioteca
                </p>
                <p className="text-[11px] text-zinc-500">Gestor do Coletivo</p>
              </div>
            </button>
          </div>
        </div>

        {/* Traditional Credentials Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
              Entrar com E-mail
            </span>
            <Link
              href="/register"
              className="text-xs font-bold text-red-600 hover:text-red-700"
            >
              Criar conta nova →
            </Link>
          </div>

          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Endereço de E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: leitor@cnviegas.org ou seu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md shadow-red-950/20 transition-all flex items-center justify-center gap-2 hover:scale-101"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>

          {/* Visitor link */}
          <div className="pt-2 text-center border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-red-600 inline-flex items-center gap-1 font-semibold"
            >
              <Eye className="w-3.5 h-3.5" />
              Apenas consultar o acervo sem autenticação
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

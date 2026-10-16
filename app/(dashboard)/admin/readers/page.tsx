'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLibrary } from '../../../../context/LibraryContext';
import {
  Users,
  ArrowLeft,
  Search,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

export default function AdminReadersPage() {
  const { users, loans } = useLibrary();
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 bg-white dark:bg-black text-black dark:text-white">
      
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-red-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Painel Geral
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-red-600" />
            Leitores & Membros Cadastrados
          </h1>
          <p className="text-xs text-zinc-500">
            Biblioteca Coletivo Negro Viegas D&apos;Abreu • Controle de associados e histórico de leituras
          </p>
        </div>

        <Link
          href="/register"
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          + Cadastrar Novo Leitor
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar leitor por nome ou e-mail..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-red-600"
        />
      </div>

      {/* Members Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => {
          const userActiveLoans = loans.filter(
            (l) => l.userId === user.id && l.status !== 'returned'
          );
          const userPastLoans = loans.filter(
            (l) => l.userId === user.id && l.status === 'returned'
          );

          return (
            <div
              key={user.id}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col justify-between gap-5 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-3xl shadow-xs">
                    {user.avatar || '👤'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-black dark:text-white">
                      {user.name}
                    </h3>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-red-600" />
                      {user.email}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    user.role === 'admin'
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {user.role === 'admin' ? 'Admin' : 'Leitor'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                {user.phone && (
                  <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Cadastrado em {user.joinedAt}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <BookOpen className="w-3.5 h-3.5 text-red-600" />
                  <span>
                    Livros em posse: <strong>{userActiveLoans.length}</strong> (Limite: {user.maxLoansAllowed || 3})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <CheckCircle className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Total já lidos: <strong>{userPastLoans.length}</strong> livros</span>
                </div>
              </div>

              {user.bio && (
                <p className="text-xs text-zinc-500 italic bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  &quot;{user.bio}&quot;
                </p>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLibrary } from '../../../../context/LibraryContext';
import { LoanModal } from '../../../../components/LoanModal';
import { Book } from '../../../../types/library';
import {
  History,
  ArrowLeft,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
} from 'lucide-react';

export default function AdminHistoricoPage() {
  const { loans, books, returnBook, renewLoan } = useLibrary();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');
  const [loanBook, setLoanBook] = useState<Book | null>(null);

  const filteredLoans = loans.filter((loan) => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchBook = loan.bookTitle.toLowerCase().includes(q) || loan.bookAuthor.toLowerCase().includes(q);
      const matchUser = loan.userName.toLowerCase().includes(q) || loan.userEmail.toLowerCase().includes(q);
      if (!matchBook && !matchUser) return false;
    }

    const isReturned = loan.status === 'returned';
    const isOverdue = loan.status === 'overdue' || (!isReturned && new Date(loan.dueDate) < new Date());

    if (statusFilter === 'active' && (isReturned || isOverdue)) return false;
    if (statusFilter === 'overdue' && !isOverdue) return false;
    if (statusFilter === 'returned' && !isReturned) return false;

    return true;
  });

  const activeCount = loans.filter((l) => l.status !== 'returned').length;
  const overdueCount = loans.filter((l) => l.status !== 'returned' && new Date(l.dueDate) < new Date()).length;
  const returnedCount = loans.filter((l) => l.status === 'returned').length;

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 bg-white dark:bg-black text-black dark:text-white">
      
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-red-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Painel Geral
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white flex items-center gap-2">
            <History className="w-7 h-7 text-red-900" />
            Histórico & Controle de Empréstimos
          </h1>
          <p className="text-xs text-zinc-500">
            Biblioteca Coletivo Negro Viegas D&apos;Abreu • Gestão de circulação e prazos
          </p>
        </div>

        <button
          onClick={() => {
            if (books.length > 0) setLoanBook(books[0]);
          }}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow"
        >
          <Shield className="w-4 h-4" />
          + Registrar Novo Empréstimo
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950 text-red-900">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-black dark:text-white">
              {activeCount}
            </span>
            <p className="text-xs text-zinc-500">Empréstimos em Aberto</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950 text-red-900">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-red-900">
              {overdueCount}
            </span>
            <p className="text-xs text-zinc-500">Devoluções Atrasadas</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white">
            <CheckCircle className="w-5 h-5 text-red-900" />
          </div>
          <div>
            <span className="text-xl font-black text-black dark:text-white">
              {returnedCount}
            </span>
            <p className="text-xs text-zinc-500">Devoluções Concluídas</p>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por livro, leitor ou e-mail..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-red-600"
          />
        </div>

        <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 text-xs font-medium border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Todos ({loans.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'active'
                ? 'bg-red-600 text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Em Aberto ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'overdue'
                ? 'bg-red-700 text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Atrasados ({overdueCount})
          </button>
          <button
            onClick={() => setStatusFilter('returned')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'returned'
                ? 'bg-zinc-800 text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Devolvidos ({returnedCount})
          </button>
        </div>
      </div>

      {/* Loans Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white font-bold uppercase text-[11px] border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Livro</th>
                <th className="py-3.5 px-4">Leitor / Membro</th>
                <th className="py-3.5 px-4">Data Retirada</th>
                <th className="py-3.5 px-4">Prazo Devolução</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Observações</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    Nenhum registro de empréstimo corresponde ao filtro atual.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const isReturned = loan.status === 'returned';
                  const isOverdue = loan.status === 'overdue' || (!isReturned && new Date(loan.dueDate) < new Date());

                  return (
                    <tr key={loan.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="py-3.5 px-4">
                        <strong className="text-black dark:text-white text-sm block">
                          {loan.bookTitle}
                        </strong>
                        <span className="text-zinc-500">{loan.bookAuthor}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-black dark:text-white">{loan.userName}</div>
                        <div className="text-zinc-500 text-[11px]">{loan.userEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">{loan.borrowedDate}</td>
                      <td className="py-3.5 px-4 font-mono">
                        {isReturned ? (
                          <span className="text-zinc-500">Devolvido ({loan.returnedDate})</span>
                        ) : (
                          <span className={isOverdue ? 'text-red-900 font-bold' : ''}>
                            {loan.dueDate}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isReturned
                              ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
                              : isOverdue
                              ? 'bg-red-600 text-white'
                              : 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-400 border border-red-200 dark:border-red-900'
                          }`}
                        >
                          {isReturned ? 'Devolvido' : isOverdue ? 'Atrasado' : 'Em Aberto'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-zinc-500">
                        {loan.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isReturned ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => renewLoan(loan.id, 7)}
                              className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-black dark:text-white text-[11px] font-bold"
                            >
                              +7 Dias
                            </button>
                            <button
                              onClick={() => returnBook(loan.id)}
                              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold"
                            >
                              Devolver
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">Concluído</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LoanModal
        book={loanBook}
        isOpen={!!loanBook}
        onClose={() => setLoanBook(null)}
      />

    </div>
  );
}

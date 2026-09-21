'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLibrary } from '../../../context/LibraryContext';
import { BookCard } from '../../../components/BookCard';
import { BookDetailModal } from '../../../components/BookDetailModal';
import { LoanModal } from '../../../components/LoanModal';
import { EditBookModal } from '../../../components/EditBookModal';
import { Book, BookCategory } from '../../../types/library';
import {
  Shield,
  BookOpen,
  PlusCircle,
  History,
  Users,
  LayoutDashboard,
  Clock,
  Search,
  Database,
  Layers,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const {
    books,
    loans,
    users,
    returnBook,
    renewLoan,
    addBook,
    refreshData,
    isLoading,
    isSupabaseConnected,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'database' | 'add-book' | 'loans' | 'readers'
  >('overview');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loanBook, setLoanBook] = useState<Book | null>(null);
  const [editBook, setEditBook] = useState<Book | null>(null);

  // New book inline form state
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPublisher, setNewPublisher] = useState('');
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [newIsbn, setNewIsbn] = useState('');
  const [newCopies, setNewCopies] = useState(2);
  const [newDescription, setNewDescription] = useState('');
  const newCoverColor = 'bg-red-600';

  // Metrics
  const totalTitles = books.length;
  const totalCopies = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const availableCopiesTotal = books.reduce((acc, b) => acc + b.availableCopies, 0);
  const activeLoans = loans.filter((l) => l.status !== 'returned');
  const overdueLoans = activeLoans.filter((l) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(l.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  });
  const readersCount = users.filter((u) => u.role === 'reader').length;

  const handleAddNewBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) return;

    await addBook({
      title: newTitle.trim(),
      author: newAuthor.trim(),
      category: newCategory,
      publisher: newPublisher.trim(),
      year: newYear,
      isbn: newIsbn.trim(),
      location: newLocation.trim(),
      totalCopies: newCopies,
      availableCopies: newCopies,
      description: newDescription.trim() || 'Obra catalogada no acervo comunitário.',
      coverColor: newCoverColor,
      status: 'available',
      tags: [newCategory.split(' ')[0], 'Acervo Viegas D\'Abreu'],
      featured: false,
    });

    // Clear form
    setNewTitle('');
    setNewAuthor('');
    setNewPublisher('');
    setNewIsbn('');
    setNewDescription('');
    setActiveTab('database');
  };

  const filteredBooks = books.filter((b) => {
    if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 bg-white dark:bg-black text-black dark:text-white">
      
      {/* Header Admin Banner (Solid Black) */}
      <div className="rounded-3xl bg-black text-white p-6 sm:p-8 border border-zinc-900 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center text-white text-3xl shadow-lg border border-red-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight">
                Painel da Coordenação & Gestão
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                Administrador
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isSupabaseConnected
                    ? 'bg-zinc-900 text-red-400 border-red-600/30'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                }`}
              >
                {isSupabaseConnected ? '● Supabase Conectado' : '○ Modo Local'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Biblioteca Coletivo Negro Viegas D&apos;Abreu • Controle total de acervo, circulação e comunidade
            </p>
          </div>
        </div>

        {/* Action shortcut */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5 border border-zinc-800 transition-all"
            title="Recarregar e sincronizar dados com o Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-red-900 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Sincronizando...' : 'Sincronizar'}
          </button>

          <button
            onClick={() => setActiveTab('add-book')}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <PlusCircle className="w-4 h-4" />
            + Cadastrar Livro
          </button>

          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5 border border-zinc-800"
          >
            <BookOpen className="w-4 h-4" />
            Ver Acervo Público
          </Link>
        </div>
      </div>

      {/* DASHBOARD TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-200 dark:border-zinc-800">
        
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Visão Geral & Métricas
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'database'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <Database className="w-4 h-4" />
          Banco de Dados do Acervo ({books.length})
        </button>

        <button
          onClick={() => setActiveTab('add-book')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'add-book'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Adicionar Novo Livro
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'loans'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <History className="w-4 h-4" />
          Empréstimos & Histórico ({loans.length})
          {overdueLoans.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-black text-white">
              {overdueLoans.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('readers')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'readers'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Leitores & Membros ({readersCount})
        </button>

      </div>

      {/* TAB 1: VISÃO GERAL & MÉTRICAS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Títulos no Acervo
              </span>
              <p className="text-2xl sm:text-3xl font-black text-black dark:text-white mt-1">
                {totalTitles}
              </p>
              <span className="text-[10px] text-red-900 font-bold mt-1 block">
                Total de títulos catalogados
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Exemplares Físicos
              </span>
              <p className="text-2xl sm:text-3xl font-black text-black dark:text-white mt-1">
                {totalCopies}
              </p>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                {availableCopiesTotal} livres na estante
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Empréstimos Ativos
              </span>
              <p className="text-2xl sm:text-3xl font-black text-red-900 mt-1">
                {activeLoans.length}
              </p>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Livros com a comunidade
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Devoluções Atrasadas
              </span>
              <p className={`text-2xl sm:text-3xl font-black mt-1 ${overdueLoans.length > 0 ? 'text-red-900' : 'text-black dark:text-white'}`}>
                {overdueLoans.length}
              </p>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                {overdueLoans.length > 0 ? 'Requer aviso ao leitor' : 'Nenhuma pendência'}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs col-span-2 lg:col-span-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Membros Leitores
              </span>
              <p className="text-2xl sm:text-3xl font-black text-black dark:text-white mt-1">
                {readersCount}
              </p>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Registrados no coletivo
              </span>
            </div>

          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Urgent Alerts / Active Loans */}
            <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-900" />
                  Circulação Recente & Pendências de Devolução
                </h3>
                <button
                  onClick={() => setActiveTab('loans')}
                  className="text-xs font-bold text-red-900 hover:underline"
                >
                  Ver todos os {loans.length} →
                </button>
              </div>

              {activeLoans.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-4">Nenhum empréstimo ativo no momento.</p>
              ) : (
                <div className="space-y-3">
                  {activeLoans.slice(0, 4).map((loan) => (
                    <div
                      key={loan.id}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <strong className="text-black dark:text-white block">{loan.bookTitle}</strong>
                        <span className="text-zinc-500">{loan.userName} ({loan.userEmail})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-500">Prazo: {loan.dueDate}</span>
                        <button
                          onClick={() => returnBook(loan.id)}
                          className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-[11px] hover:bg-red-700"
                        >
                          Devolver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category breakdown */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-900" />
                Acervo por Categoria
              </h3>

            </div>

          </div>

        </div>
      )}

      {/* TAB 2: GESTÃO DO BANCO DE DADOS (CARDS & TABELA) */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por título, autor, estante..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('add-book')}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                + Novo Livro
              </button>
            </div>
          </div>

          {/* Cards Grid with Edit & Delete Admin actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={(b) => setSelectedBook(b)}
                onEdit={(b) => setEditBook(b)}
                onLoan={(b) => setLoanBook(b)}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ADICIONAR NOVO LIVRO */}
      {activeTab === 'add-book' && (
        <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h2 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-red-900" />
              Cadastrar Nova Obra no Acervo
            </h2>
            <p className="text-xs text-zinc-500">
              Preencha os dados bibliográficos para catalogação no acervo comunitário.
            </p>
          </div>

          <form onSubmit={handleAddNewBook} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Título da Obra *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Memórias Póstumas de Brás Cubas"
                  required
                  className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Autor(a) / Organizador(a) *
                </label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Ex: Machado de Assis"
                  required
                  className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Categoria / Seção *
                </label>
                
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Editora
                </label>
                <input
                  type="text"
                  value={newPublisher}
                  onChange={(e) => setNewPublisher(e.target.value)}
                  placeholder="Ex: Companhia das Letras, Boitempo..."
                  className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Ano de Publicação
                </label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(parseInt(e.target.value) || 2024)}
                  className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                />
              </div>


              <div className="space-y-1">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Quantidade de Exemplares
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newCopies}
                  onChange={(e) => setNewCopies(parseInt(e.target.value) || 1)}
                  className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Sinopse / Resumo da Obra
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Escreva um breve resumo sobre os temas tratados no livro..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('database')}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-black dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Salvar e Catalogar Livro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: EMPRÉSTIMOS & HISTÓRICO */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">
                Histórico Geral de Circulação & Empréstimos
              </h2>
              <p className="text-xs text-zinc-500">
                Controle de todos os empréstimos ativos, prazos prorrogados e devoluções.
              </p>
            </div>

            <button
              onClick={() => {
                if (books.length > 0) setLoanBook(books[0]);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Shield className="w-4 h-4" />
              + Novo Empréstimo Manual
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white font-bold uppercase text-[11px] border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4">Livro</th>
                    <th className="py-3.5 px-4">Leitor</th>
                    <th className="py-3.5 px-4">Retirada</th>
                    <th className="py-3.5 px-4">Devolução Prevista</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {loans.map((loan) => {
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
                          <div className="text-zinc-500">{loan.userEmail}</div>
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
                        <td className="py-3.5 px-4 text-right">
                          {!isReturned ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => renewLoan(loan.id, 7)}
                                className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-black dark:text-white text-[11px] font-semibold"
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LEITORES & MEMBROS */}
      {activeTab === 'readers' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white">
              Membros & Leitores Cadastrados
            </h2>
            <p className="text-xs text-zinc-500">
              Gestão de associados e histórico de participação comunitária.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => {
              const userActiveLoans = loans.filter(
                (l) => l.userId === user.id && l.status !== 'returned'
              );

              return (
                <div
                  key={user.id}
                  className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-2xl">
                        {user.avatar || '👤'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-black dark:text-white">
                          {user.name}
                        </h4>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        user.role === 'admin'
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Leitor'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
                    {user.phone && (
                      <p className="text-zinc-700 dark:text-zinc-300">
                        📞 <strong>Telefone:</strong> {user.phone}
                      </p>
                    )}
                    <p className="text-zinc-700 dark:text-zinc-300">
                      📅 <strong>Membro desde:</strong> {user.joinedAt}
                    </p>
                    <p className="text-zinc-700 dark:text-zinc-300">
                      📚 <strong>Livros em posse:</strong>{' '}
                      <span className="font-bold text-red-900">
                        {userActiveLoans.length}
                      </span>{' '}
                      livro(s)
                    </p>
                  </div>

                  {user.bio && (
                    <p className="text-[11px] text-zinc-500 line-clamp-2 italic">
                      &quot;{user.bio}&quot;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODALS */}
      <BookDetailModal
        book={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onLoanRequest={(b) => setLoanBook(b)}
        onEdit={(b) => setEditBook(b)}
      />

      <LoanModal
        book={loanBook}
        isOpen={!!loanBook}
        onClose={() => setLoanBook(null)}
      />

      <EditBookModal
        book={editBook}
        isOpen={!!editBook}
        onClose={() => setEditBook(null)}
      />

    </div>
  );
}

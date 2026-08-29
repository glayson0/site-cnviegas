'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { BookCard } from '../../components/BookCard';
import { BookDetailModal } from '../../components/BookDetailModal';
import { LoanModal } from '../../components/LoanModal';
import { Book } from '../../types/library';
import {
  BookOpen,
  Package,
  History,
  Bookmark,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCw,
  Search,
  Sparkles,
  ShieldCheck,
  UserX,
} from 'lucide-react';

export default function ReaderDashboardPage() {
  const { currentUser } = useAuth();
  const {
    books,
    wishlist,
    getUserActiveLoans,
    getUserPastLoans,
    renewLoan,
    returnBook,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<
    'catalog' | 'active-loans' | 'history' | 'wishlist' | 'membership-card'
  >('active-loans');

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loanBook, setLoanBook] = useState<Book | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!currentUser) {
    return (
      <div className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full bg-white dark:bg-black text-black dark:text-white">
        <div className="py-16 text-center rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-800 p-8 space-y-4">
          <UserX className="w-12 h-12 text-zinc-400 mx-auto" />
          <h1 className="text-lg font-bold text-black dark:text-white">
            Não foi possível carregar seu perfil de leitor
          </h1>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Sua sessão pode ter expirado ou seu perfil ainda não foi sincronizado. Entre novamente para acessar seus empréstimos e seu cartão de leitor.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow hover:bg-red-700 transition-all"
          >
            Ir para o Login
          </Link>
        </div>
      </div>
    );
  }

  const currentUserId = currentUser.id;
  const activeLoans = getUserActiveLoans(currentUserId);
  const pastLoans = getUserPastLoans(currentUserId);
  const wishlistedBooks = books.filter((b) => wishlist.includes(b.id));

  // Filter for the catalog tab
  const filteredCatalog = books.filter((b) => {
    if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const calculateDaysRemaining = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 bg-white dark:bg-black text-black dark:text-white">
      
      {/* Header Profile Bar (Solid Colors) */}
      <div className="rounded-3xl bg-black text-white p-6 sm:p-8 border border-zinc-900 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center text-3xl shadow-lg border border-red-500/30">
            {currentUser?.avatar || '📚'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight">
                Olá, {currentUser.name}!
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-900 text-red-400 border border-red-600/40">
                Membro Ativo
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {currentUser.email} • Biblioteca Coletivo Negro Viegas D&apos;Abreu
            </p>
          </div>
        </div>

        {/* Quota & Quick metrics */}
        <div className="flex items-center gap-3 bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 text-xs">
          <div className="text-center px-3 border-r border-zinc-800">
            <span className="block text-lg font-black text-red-600">
              {activeLoans.length} / 3
            </span>
            <span className="text-[11px] text-zinc-400">Livros Retirados</span>
          </div>
          <div className="text-center px-3 border-r border-zinc-800">
            <span className="block text-lg font-black text-white">
              {pastLoans.length}
            </span>
            <span className="text-[11px] text-zinc-400">Lidos no Coletivo</span>
          </div>
          <div className="text-center px-3">
            <span className="block text-lg font-black text-white">
              {wishlistedBooks.length}
            </span>
            <span className="text-[11px] text-zinc-400">Salvos</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-200 dark:border-zinc-800">
        
        <button
          onClick={() => setActiveTab('active-loans')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'active-loans'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <Package className="w-4 h-4" />
          Meus Empréstimos Ativos
          {activeLoans.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'active-loans' ? 'bg-white text-black' : 'bg-red-600 text-white'
            }`}>
              {activeLoans.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Explorar Acervo & Reservar
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <History className="w-4 h-4" />
          Histórico de Leituras ({pastLoans.length})
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'wishlist'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Lista de Desejos ({wishlistedBooks.length})
        </button>

        <button
          onClick={() => setActiveTab('membership-card')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'membership-card'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Cartão do Leitor & Regras
        </button>

      </div>

      {/* TAB 1: MEUS EMPRÉSTIMOS ATIVOS */}
      {activeTab === 'active-loans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">
                Livros Atualmente em Sua Posse
              </h2>
              <p className="text-xs text-zinc-500">
                Você pode renovar seu prazo por mais 7 dias a qualquer momento antes do vencimento.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('catalog')}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              Pegar Outro Livro
            </button>
          </div>

          {activeLoans.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-800 p-8 space-y-4">
              <Package className="w-12 h-12 text-zinc-400 mx-auto" />
              <h3 className="text-base font-bold text-black dark:text-white">
                Você não possui nenhum livro emprestado no momento
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Explore o acervo comunitário e retire até 3 obras simultâneas na sede do coletivo!
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow hover:bg-red-700 transition-all"
              >
                Explorar Acervo Agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeLoans.map((loan) => {
                const daysRemaining = calculateDaysRemaining(loan.dueDate);
                const isOverdue = daysRemaining < 0;
                const isDueSoon = daysRemaining >= 0 && daysRemaining <= 3;

                return (
                  <div
                    key={loan.id}
                    className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col justify-between gap-5 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                          {loan.bookCategory || 'Empréstimo Ativo'}
                        </span>
                        <h3 className="text-lg font-black text-black dark:text-white leading-tight">
                          {loan.bookTitle}
                        </h3>
                        <p className="text-xs text-zinc-500 font-medium">{loan.bookAuthor}</p>
                      </div>

                      {/* Status pill */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                          isOverdue
                            ? 'bg-red-600 text-white border border-red-700'
                            : isDueSoon
                            ? 'bg-zinc-900 text-white border border-red-600/40'
                            : 'bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {isOverdue ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-white" />
                            Atrasado ({Math.abs(daysRemaining)}d)
                          </>
                        ) : isDueSoon ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-red-600" />
                            Vence em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-red-600" />
                            Em dia ({daysRemaining}d restantes)
                          </>
                        )}
                      </span>
                    </div>

                    {/* Timeline dates */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Retirado em</span>
                        <strong className="text-black dark:text-white font-mono">
                          {loan.borrowedDate}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Devolução prevista</span>
                        <strong className={`font-mono ${isOverdue ? 'text-red-600 font-black' : 'text-black dark:text-white'}`}>
                          {loan.dueDate}
                        </strong>
                      </div>
                    </div>

                    {loan.notes && (
                      <p className="text-xs text-zinc-500 italic bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        Obs: {loan.notes}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        onClick={() => renewLoan(loan.id, 7)}
                        className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-black dark:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        Renovar Prazo (+7 dias)
                      </button>

                      <button
                        onClick={() => returnBook(loan.id)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Confirmar Devolução
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPLORAR ACERVO & RESERVAR */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar livros para pegar emprestado..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">
                {filteredCatalog.length} livros encontrados
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCatalog.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={(b) => setSelectedBook(b)}
                onLoan={(b) => setLoanBook(b)}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HISTÓRICO DE LEITURAS */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white">
              Seu Histórico de Leituras no Coletivo
            </h2>
            <p className="text-xs text-zinc-500">
              Registro das obras que você já leu e devolveu à nossa biblioteca.
            </p>
          </div>

          {pastLoans.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-800 p-8 space-y-3">
              <History className="w-12 h-12 text-zinc-400 mx-auto" />
              <h3 className="text-base font-bold text-black dark:text-white">
                Nenhum empréstimo concluído ainda
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Assim que você devolver seus primeiros livros, seu histórico de leitura aparecerá listado aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                      {loan.bookCategory || 'Literatura'}
                    </span>
                    <h3 className="text-base font-bold text-black dark:text-white">
                      {loan.bookTitle}
                    </h3>
                    <p className="text-xs text-zinc-500">{loan.bookAuthor}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="text-zinc-400 block text-[10px]">Devolvido em</span>
                      <strong className="text-black dark:text-white font-mono">
                        {loan.returnedDate || loan.dueDate}
                      </strong>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white text-xs font-bold flex items-center gap-1 border border-zinc-200 dark:border-zinc-800">
                      <CheckCircle className="w-3.5 h-3.5 text-red-600" />
                      Concluído
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LISTA DE DESEJOS / FAVORITOS */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white">
              Minha Lista de Leituras Desejadas
            </h2>
            <p className="text-xs text-zinc-500">
              Livros que você marcou com o ícone para ler futuramente.
            </p>
          </div>

          {wishlistedBooks.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-800 p-8 space-y-3">
              <Bookmark className="w-12 h-12 text-zinc-400 mx-auto" />
              <h3 className="text-base font-bold text-black dark:text-white">
                Sua lista de favoritos está vazia
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Ao navegar pelo acervo, clique no ícone de marcador para salvar livros na sua lista pessoal.
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                Ver Livros do Acervo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistedBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onSelect={(b) => setSelectedBook(b)}
                  onLoan={(b) => setLoanBook(b)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CARTÃO DO LEITOR & REGRAS */}
      {activeTab === 'membership-card' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Virtual Membership Card (Solid Black) */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-3xl bg-black text-white shadow-2xl border border-zinc-800 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-red-600 text-white">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">
                      Cartão Comunitário
                    </h4>
                    <p className="text-[10px] text-zinc-400">Coletivo Negro Viegas D&apos;Abreu</p>
                  </div>
                </div>
                <span className="text-2xl">{currentUser?.avatar || '🌱'}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-red-400 uppercase tracking-widest block font-bold">
                  Nome do Leitor
                </span>
                <p className="text-xl font-black text-white">{currentUser.name}</p>
                <p className="text-xs text-zinc-400">{currentUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-zinc-800 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Membro Desde</span>
                  <strong className="font-mono">{currentUser?.joinedAt || '2023-03-10'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Status do Cartão</span>
                  <strong className="text-red-600 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Regular / Ativo
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Collective Rules & Charter */}
          <div className="lg:col-span-2 space-y-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-600" />
              Carta de Princípios e Regras da Biblioteca
            </h3>
            
            <div className="space-y-3 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <strong className="text-black dark:text-white block font-bold">1. Cuidado Coletivo do Acervo</strong>
                <p>Os livros pertencem a toda a comunidade. Cuide das capas e páginas para que outras pessoas também possam usufruir da leitura.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <strong className="text-black dark:text-white block font-bold">2. Limite e Prazos</strong>
                <p>Cada leitor pode retirar até <strong>3 livros simultâneos</strong> por um prazo inicial de <strong>14 dias</strong>, com renovação garantida caso não haja fila de espera.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <strong className="text-black dark:text-white block font-bold">3. Devoluções & Doações</strong>
                <p>As devoluções podem ser feitas presencialmente na sede do coletivo ou combinadas diretamente com os coordenadores em dias de evento e oficinas.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* MODALS */}
      <BookDetailModal
        book={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onLoanRequest={(b) => setLoanBook(b)}
      />

      <LoanModal
        book={loanBook}
        isOpen={!!loanBook}
        onClose={() => setLoanBook(null)}
      />

    </div>
  );
}

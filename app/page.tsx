'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { BookCard } from '../components/BookCard';
import { BookDetailModal } from '../components/BookDetailModal';
import { LoanModal } from '../components/LoanModal';
import { EditBookModal } from '../components/EditBookModal';
import { Book } from '../types/library';
import {
  BookOpen,
  Library,
  Search,
  PlusCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function AcervoGeralPage() {
  const { role } = useAuth();
  const { books, isLoading, refreshData } = useLibrary();

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loanBook, setLoanBook] = useState<Book | null>(null);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Busca simples apenas por título e autor (sem filtros complexos)
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const q = searchQuery.toLowerCase().trim();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
    );
  }, [books, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Header simples e direto */}
      <section className="bg-black text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-zinc-900">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 mb-2">
                <Library className="w-3.5 h-3.5 text-red-900" />
                Biblioteca Coletivo Negro Viegas D&apos;Abreu
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Acervo Geral
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 mt-1">
                {books.length} {books.length === 1 ? 'obra cadastrada' : 'obras cadastradas'} no catálogo comunitário
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refreshData()}
                disabled={isLoading}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-zinc-800"
                title="Sincronizar acervo com o banco de dados"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-red-900 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Sincronizando...' : 'Atualizar'}
              </button>

              {role === 'admin' && (
                <Link
                  href="/admin/add"
                  className="px-4 py-2.5 rounded-xl bg-red-900 hover:bg-red-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <PlusCircle className="w-4 h-4" />
                  Cadastrar Livro
                </Link>
              )}
            </div>
          </div>

          {/* Campo de busca simples */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar livro por título ou autor..."
              className="w-full pl-11 pr-16 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-red-900 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white px-2 py-1"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Listagem de Livros do Banco de Dados */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {isLoading && books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-900" />
            <p className="text-sm">Carregando acervo do banco de dados...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <BookOpen className="w-12 h-12 text-zinc-400 mx-auto" />
            <h3 className="text-lg font-bold text-black dark:text-white">
              {searchQuery ? 'Nenhum livro encontrado para esta busca.' : 'Nenhum livro cadastrado no momento.'}
            </h3>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-red-900 hover:underline font-semibold"
              >
                Limpar busca
              </button>
            ) : (
              <p className="text-xs text-zinc-500">
                Os livros cadastrados no Supabase aparecerão aqui.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={(b) => setSelectedBook(b)}
                onLoan={(b) => setLoanBook(b)}
                onEdit={(b) => setEditBook(b)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modais de Ação */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
          onLoanRequest={(b: Book) => {
            setSelectedBook(null);
            setLoanBook(b);
          }}
          onEdit={(b: Book) => {
            setSelectedBook(null);
            setEditBook(b);
          }}
        />
      )}

      {loanBook && (
        <LoanModal
          book={loanBook}
          isOpen={!!loanBook}
          onClose={() => setLoanBook(null)}
        />
      )}

      {editBook && (
        <EditBookModal
          book={editBook}
          isOpen={!!editBook}
          onClose={() => setEditBook(null)}
        />
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { Book } from '../types/library';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import {
  BookOpen,
  Bookmark,
  MapPin,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onEdit?: (book: Book) => void;
  onLoan?: (book: Book) => void;
}

export function BookCard({ book, onSelect, onEdit, onLoan }: BookCardProps) {
  const { role, isAuthenticated } = useAuth();
  const { isWishlisted, toggleWishlist, deleteBook } = useLibrary();

  const isFav = isWishlisted(book.id);
  const isAvailable = book.availableCopies > 0;

  const solidBg = book.coverColor && !book.coverColor.includes('from-')
    ? book.coverColor
    : 'bg-red-900';

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-red-900/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      
      {/* Book Cover / Header Visual (Solid Color) */}
      <div className={`relative h-48 ${solidBg} p-5 flex flex-col justify-between overflow-hidden text-white`}>
        {/* Book Spine bar */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/40 border-r border-white/10" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-start justify-between gap-2">

          <div className="flex items-center gap-1.5">
            {book.featured && (
              <span className="p-1 rounded-full bg-black text-white shadow-sm" title="Destaque do Acervo">
                <Sparkles className="w-3.5 h-3.5 text-red-900" />
              </span>
            )}
            {isAuthenticated && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(book.id);
                }}
                className={`p-1.5 rounded-full transition-all ${
                  isFav
                    ? 'bg-white text-black font-bold'
                    : 'bg-black/50 text-white/80 hover:text-white hover:bg-black'
                }`}
                title={isFav ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                aria-label="Favoritar livro"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-black' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Cover Spine Title & Author */}
        <div className="relative z-10 pl-2">
          <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest truncate">
            {book.author}
          </p>
          <h3 className="text-lg font-black text-white leading-tight line-clamp-2 mt-0.5 drop-shadow-sm">
            {book.title}
          </h3>
          {book.year && (
            <span className="text-[11px] text-white/70 font-mono">
              {book.year} {book.publisher ? `• ${book.publisher}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Book Body Details */}
      <div className="flex-1 p-5 flex flex-col justify-between gap-4">
        
        {/* Availability and Shelf Location */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-[11px] ${
                isAvailable
                  ? 'bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {isAvailable ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-red-900" />
                  {book.availableCopies} {book.availableCopies === 1 ? 'exemplar livre' : 'exemplares livres'}
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Emprestado (0/{book.totalCopies})
                </>
              )}
            </span>

            <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
              Total: {book.totalCopies} {book.totalCopies === 1 ? 'ex.' : 'exs.'}
            </span>
          </div>


          <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
            {book.description}
          </p>
        </div>

        {/* Tags */}
        {book.tags && book.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {book.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 font-medium border border-zinc-200/50 dark:border-zinc-800"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons depending on role */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
          
          <button
            onClick={() => onSelect(book)}
            className="text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-red-900 dark:hover:text-red-900 flex items-center gap-1 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Detalhes
          </button>

          <div className="flex items-center gap-1.5">
            {/* Admin Actions */}
            {role === 'admin' && (
              <>
                {onEdit && (
                  <button
                    onClick={() => onEdit(book)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Editar informações do livro"
                    aria-label="Editar livro"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => deleteBook(book.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Excluir livro do catálogo"
                  aria-label="Excluir livro"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Loan or Action Button */}
            {role === 'admin' ? (
              <button
                onClick={() => (onLoan ? onLoan(book) : onSelect(book))}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-red-900 dark:hover:bg-red-900 dark:hover:text-white transition-all shadow-sm"
              >
                Emprestar
              </button>
            ) : role === 'reader' ? (
              <button
                onClick={() => (onLoan ? onLoan(book) : onSelect(book))}
                disabled={!isAvailable}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isAvailable
                    ? 'bg-red-900 hover:bg-red-800 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {isAvailable ? 'Pegar Emprestado' : 'Indisponível'}
              </button>
            ) : (
              <button
                onClick={() => onSelect(book)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-red-900 dark:hover:bg-red-900 dark:hover:text-white transition-all flex items-center gap-1 shadow-sm"
              >
                Ver Ficha
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

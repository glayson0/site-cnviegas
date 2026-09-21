'use client';

import React, { useState } from 'react';
import { Book } from '../types/library';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import {
  X,
  BookOpen,
  MapPin,
  Calendar,
  Bookmark,
  CheckCircle,
  Clock,
  Star,
  MessageSquare,
  Shield,
  Send,
} from 'lucide-react';
import Link from 'next/link';

interface BookDetailModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onLoanRequest?: (book: Book) => void;
  onEdit?: (book: Book) => void;
}

export function BookDetailModal({
  book,
  isOpen,
  onClose,
  onLoanRequest,
  onEdit,
}: BookDetailModalProps) {
  const { currentUser, role, isAuthenticated } = useAuth();
  const {
    isWishlisted,
    toggleWishlist,
    getBookReviews,
    addReview,
    borrowBook,
  } = useLibrary();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (!isOpen || !book) return null;

  const isFav = isWishlisted(book.id);
  const isAvailable = book.availableCopies > 0;
  const reviews = getBookReviews(book.id);

  const solidBg = book.coverColor && !book.coverColor.includes('from-')
    ? book.coverColor
    : 'bg-red-900';

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addReview(
      book.id,
      currentUser?.id || 'anon',
      currentUser?.name || 'Leitor do Coletivo',
      rating,
      comment
    );
    setComment('');
    setShowReviewForm(false);
  };

  const handleQuickBorrow = async () => {
    if (role === 'reader' && currentUser) {
      await borrowBook(book.id, currentUser.id, 14);
      onClose();
    } else if (onLoanRequest) {
      onLoanRequest(book);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-black rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (Solid Color) */}
        <div className={`relative p-6 sm:p-8 ${solidBg} text-white`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/70 text-white border border-white/20">
              {book.category}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isAvailable ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {isAvailable ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-red-900" />
                  {book.availableCopies} de {book.totalCopies} disponíveis
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  Todos os exemplares emprestados
                </>
              )}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            {book.title}
          </h2>
          <p className="text-white/80 font-bold text-base mt-1">
            {book.author}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-white/90 mt-4 pt-4 border-t border-white/20">
            {book.year && (
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-white" />
                Ano: {book.year}
              </span>
            )}
            {book.publisher && (
              <span>Editora: {book.publisher}</span>
            )}
            {book.isbn && (
              <span className="font-mono">ISBN: {book.isbn}</span>
            )}
            {book.pages && (
              <span>{book.pages} páginas</span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Location Callout */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950 text-red-900">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-black dark:text-white">Localização na Sede</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{book.location}</p>
              </div>
            </div>

            {isAuthenticated && (
              <button
                onClick={() => toggleWishlist(book.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isFav
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-900 border-red-200 dark:border-red-900'
                    : 'bg-white dark:bg-zinc-900 text-black dark:text-white border-zinc-200 dark:border-zinc-800 hover:border-red-900'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-red-900' : ''}`} />
                {isFav ? 'Salvo nos Favoritos' : 'Salvar nos Favoritos'}
              </button>
            )}
          </div>

          {/* Synopsis */}
          <div className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
              Sinopse & Apresentação
            </h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              {book.description}
            </p>
          </div>

          {/* Tags */}
          {book.tags && book.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Temas & Palavras-Chave
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {book.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-300 font-semibold border border-zinc-200/60 dark:border-zinc-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Community Reviews Section */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-red-900" />
                <h3 className="text-sm font-bold text-black dark:text-white">
                  Comentários dos Leitores ({reviews.length})
                </h3>
              </div>

              {isAuthenticated && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="text-xs font-bold text-red-900 hover:text-red-800"
                >
                  + Deixar avaliação
                </button>
              )}
            </div>

            {/* Review form */}
            {showReviewForm && (
              <form onSubmit={handleReviewSubmit} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Sua nota:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        className="p-1 text-red-900 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-4 h-4 ${rating >= s ? 'fill-red-900' : 'text-zinc-300 dark:text-zinc-700'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Compartilhe sua impressão de leitura com o coletivo..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-900"
                  required
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-black dark:hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-red-900 text-white text-xs font-bold flex items-center gap-1.5 shadow hover:bg-red-800"
                  >
                    <Send className="w-3 h-3" />
                    Publicar
                  </button>
                </div>
              </form>
            )}

            {/* Review list */}
            {reviews.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-2">
                Nenhum leitor registrou avaliação para este livro ainda. Seja o primeiro!
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black dark:text-white">
                        {rev.userName}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rev.rating ? 'text-red-900 fill-red-900' : 'text-zinc-300 dark:text-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-zinc-400 ml-1">{rev.date}</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-6 bg-zinc-50 dark:bg-black border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            {role === 'admin' ? (
              <>
                {onEdit && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(book);
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-bold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-black dark:text-white"
                  >
                    Editar Dados
                  </button>
                )}
                <button
                  onClick={() => {
                    onClose();
                    if (onLoanRequest) onLoanRequest(book);
                  }}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-red-900 hover:bg-red-800 text-white shadow flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4" />
                  Registrar Empréstimo
                </button>
              </>
            ) : role === 'reader' ? (
              <button
                onClick={handleQuickBorrow}
                disabled={!isAvailable}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow flex items-center gap-2 ${
                  isAvailable
                    ? 'bg-red-900 hover:bg-red-800 text-white'
                    : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                {isAvailable ? 'Confirmar Empréstimo (14 dias)' : 'Exemplar Indisponível'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-red-900 hover:bg-red-800 text-white shadow"
                >
                  Entrar para Pegar Emprestado
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

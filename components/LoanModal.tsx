'use client';

import React, { useState } from 'react';
import { Book } from '../types/library';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { X, BookOpen, AlertTriangle, UserCheck } from 'lucide-react';

interface LoanModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LoanModal({ book, isOpen, onClose }: LoanModalProps) {
  const { currentUser, role } = useAuth();
  const { users, borrowBook } = useLibrary();

  const [selectedUserId, setSelectedUserId] = useState<string>(
    role === 'reader' && currentUser ? currentUser.id : users[1]?.id || ''
  );
  const [loanDays, setLoanDays] = useState<number>(14);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen || !book) return null;

  const isAvailable = book.availableCopies > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable) return;

    const targetUserId = role === 'reader' && currentUser ? currentUser.id : selectedUserId;
    const res = await borrowBook(book.id, targetUserId, loanDays, notes);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-black rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950 text-red-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-black dark:text-white">
                {role === 'admin' ? 'Registrar Novo Empréstimo' : 'Solicitar Empréstimo de Livro'}
              </h3>
              <p className="text-xs text-zinc-500">Biblioteca Coletivo Negro Viegas D&apos;Abreu</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-black dark:hover:text-white"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Selected Book Summary */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
              Livro Selecionado
            </span>
            <h4 className="text-base font-black text-black dark:text-white">{book.title}</h4>
            <p className="text-xs text-zinc-500">{book.author} • {book.category}</p>
            <p className="text-xs text-zinc-400 pt-1">
              Disponibilidade atual: <strong>{book.availableCopies}</strong> de {book.totalCopies} cópias
            </p>
          </div>

          {!isAvailable && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Atenção: Todos os exemplares deste livro já estão emprestados no momento.</span>
            </div>
          )}

          {/* Reader selection (if admin) */}
          {role === 'admin' ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-black dark:text-white">
                Membro / Leitor Destinatário:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                required
              >
                {users
                  .filter((u) => u.role === 'reader')
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Leitor Requisitante:
              </label>
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-xs text-black dark:text-white flex items-center gap-2 font-semibold">
                <UserCheck className="w-4 h-4 text-red-600" />
                {currentUser?.name} ({currentUser?.email})
              </div>
            </div>
          )}

          {/* Loan Duration */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-black dark:text-white">
              Prazo Inicial de Empréstimo:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '7 Dias', val: 7 },
                { label: '14 Dias (Padrão)', val: 14 },
                { label: '30 Dias', val: 30 },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setLoanDays(opt.val)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    loanDays === opt.val
                      ? 'bg-red-600 border-red-600 text-white shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-red-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-black dark:text-white">
              Observações / Finalidade (Opcional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Leitura para oficina do coletivo, grupo de estudos, etc."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isAvailable}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow transition-all ${
                isAvailable
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Confirmar Empréstimo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

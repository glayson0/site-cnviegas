'use client';

import React, { useState } from 'react';
import { Book } from '../types/library';
import { useLibrary } from '../context/LibraryContext';
import { X, Edit, Save } from 'lucide-react';

interface EditBookModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

const SOLID_COLORS = [
  { label: 'Vermelho Coletivo', value: 'bg-red-900' },
  { label: 'Preto Sólido', value: 'bg-black' },
  { label: 'Cinza Escuro', value: 'bg-zinc-900' },
  { label: 'Vermelho Escuro', value: 'bg-red-950' },
];

function EditBookModalContent({ book, onClose }: { book: Book; onClose: () => void }) {
  const { updateBook } = useLibrary();

  const [formData, setFormData] = useState<Partial<Book>>({
    title: book.title,
    author: book.author,
    publisher: book.publisher || '',
    year: book.year || new Date().getFullYear(),
    isbn: book.isbn || '',
    pages: book.pages || 100,
    totalCopies: book.totalCopies,
    availableCopies: book.availableCopies,
    coverColor: book.coverColor && !book.coverColor.includes('from-') ? book.coverColor : 'bg-red-900',
    tags: book.tags || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBook(book.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-black rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950 text-red-900">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-black dark:text-white">
                Editar Dados do Livro
              </h3>
              <p className="text-xs text-zinc-500">ID: {book.id}</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Título da Obra *
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white focus:ring-2 focus:ring-red-900"
              />
            </div>

            {/* Author */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Autor(a) / Organizador(a) *
              </label>
              <input
                type="text"
                value={formData.author || ''}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
                className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
              />
            </div>

            

            {/* Publisher */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Editora
              </label>
              <input
                type="text"
                value={formData.publisher || ''}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
              />
            </div>

            {/* Year */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Ano de Publicação
              </label>
              <input
                type="number"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || undefined })}
                className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
              />
            </div>

            {/* Location */}
            

            {/* ISBN */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                ISBN
              </label>
              <input
                type="text"
                value={formData.isbn || ''}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
              />
            </div>

            {/* Total Copies */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Exemplares Totais
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalCopies || 1}
                onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 1 })}
                className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
              />
            </div>

            {/* Available Copies */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Exemplares Disponíveis
              </label>
              <input
                type="number"
                min="0"
                max={formData.totalCopies || 10}
                value={formData.availableCopies ?? 1}
                onChange={(e) => setFormData({ ...formData, availableCopies: parseInt(e.target.value) || 0 })}
                className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
              />
            </div>

            {/* Color Theme (Solid Colors) */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Cor da Capa (Sólida)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SOLID_COLORS.map((col) => (
                  <button
                    type="button"
                    key={col.value}
                    onClick={() => setFormData({ ...formData, coverColor: col.value })}
                    className={`h-10 rounded-xl ${col.value} text-white text-[11px] font-bold flex items-center justify-center border-2 transition-all ${
                      formData.coverColor === col.value
                        ? 'border-white ring-2 ring-red-900 scale-102'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-900 hover:bg-red-800 text-white text-xs font-bold shadow flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditBookModal({ book, isOpen, onClose }: EditBookModalProps) {
  if (!isOpen || !book) return null;
  return <EditBookModalContent key={book.id} book={book} onClose={onClose} />;
}

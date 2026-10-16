'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLibrary } from '../../../../context/LibraryContext';
import { BookCategory } from '../../../../types/library';
import {
  PlusCircle,
  ArrowLeft,
  Save,
  CheckCircle2,
} from 'lucide-react';


const SOLID_COLORS = [
  { label: 'Vermelho Sólido', value: 'bg-red-600' },
  { label: 'Preto Sólido', value: 'bg-black' },
  { label: 'Cinza Grafite', value: 'bg-zinc-900' },
  { label: 'Vermelho Escuro', value: 'bg-red-950' },
];

export default function AdminAddBookPage() {
  const router = useRouter();
  const { addBook } = useLibrary();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isbn, setIsbn] = useState('');
  const [location, setLocation] = useState('Estante A - Prateleira 1');
  const [copies, setCopies] = useState(2);
  const [description, setDescription] = useState('');
  const [coverColor, setCoverColor] = useState('bg-red-600');
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    await addBook({
      title: title.trim(),
      author: author.trim(),
      category,
      publisher: publisher.trim(),
      year,
      isbn: isbn.trim(),
      location: location.trim(),
      totalCopies: copies,
      availableCopies: copies,
      description: description.trim() || 'Obra catalogada no acervo comunitário.',
      coverColor,
      status: 'available',
      tags: tags.length > 0 ? tags : [category.split(' ')[0]],
      featured: false,
    });

    router.push('/admin');
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8 bg-white dark:bg-black text-black dark:text-white">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-red-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel Admin
        </Link>
        <span className="text-xs text-red-600 font-bold">
          Módulo de Catalogação
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Form */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-black dark:text-white flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-red-600" />
              Adicionar Novo Livro ao Acervo
            </h1>
            <p className="text-xs text-zinc-500">
              Insira os dados do exemplar doado ou adquirido para a biblioteca comunitária.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              
              <div className="space-y-1">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Título da Obra *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Vidas Secas"
                  required
                  className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-black dark:text-white">
                    Autor(a) / Escritor(a) *
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Ex: Graciliano Ramos"
                    required
                    className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-black dark:text-white">
                    Seção / Categoria *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BookCategory)}
                    className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-black dark:text-white">
                    Editora
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="Ex: Record"
                    className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-black dark:text-white">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
                    className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-black dark:text-white">
                    Exemplares
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={copies}
                    onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                    className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-black dark:text-white">
                    Localização Física (Estante / Prateleira) *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Estante A - Prateleira 2"
                    required
                    className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-black dark:text-white">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-85..."
                    className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Palavras-chave / Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Ex: Sertão, Romance, Clássico Brasileiro"
                  className="w-full text-sm p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                />
              </div>

              {/* Solid Color Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Cor da Capa (Sólida)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SOLID_COLORS.map((col) => (
                    <button
                      type="button"
                      key={col.value}
                      onClick={() => setCoverColor(col.value)}
                      className={`h-9 rounded-xl ${col.value} text-white text-[11px] font-bold flex items-center justify-center border-2 transition-all ${
                        coverColor === col.value
                          ? 'border-white ring-2 ring-red-600 scale-102'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Sinopse / Descrição da Obra
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Apresente brevemente o contexto da obra..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
                />
              </div>

            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
              <Link
                href="/admin"
                className="px-4 py-2.5 text-xs font-medium text-zinc-600 hover:text-black dark:hover:text-white"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Catalogar Obra no Sistema
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Pré-visualização do Card
          </span>

          <div className="rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden flex flex-col">
            <div className={`h-44 ${coverColor} p-5 flex flex-col justify-between text-white relative`}>
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/70 self-start border border-white/20">
                {category}
              </span>
              <div>
                <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest truncate">
                  {author || 'Nome do Autor'}
                </p>
                <h3 className="text-lg font-black text-white leading-tight line-clamp-2 mt-0.5">
                  {title || 'Título do Livro'}
                </h3>
              </div>
            </div>

            <div className="p-4 space-y-2 text-xs">
              <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {copies} {copies === 1 ? 'exemplar disponível' : 'exemplares disponíveis'}
              </span>
              <p className="text-zinc-500">📍 {location || 'Localização na estante'}</p>
              <p className="text-zinc-700 dark:text-zinc-300 line-clamp-2">
                {description || 'A sinopse do livro aparecerá aqui...'}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

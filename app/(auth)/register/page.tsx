'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useLibrary } from '../../../context/LibraryContext';
import {
  BookOpen,
  UserPlus,
  User,
  Mail,
  Lock,
  Phone,
  Sparkles,
  LogIn,
} from 'lucide-react';


export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { addToast } = useLibrary();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setError(null);
    setLoading(true);
    const result = await register(name, email, password, phone, bio, selectedInterests);
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível concluir o cadastro.');
      return;
    }

    addToast(
      'Bem-vindo(a) ao Coletivo!',
      `Cadastro realizado com sucesso para ${name}. Seu cartão de leitor está ativo!`,
      'success'
    );
    router.push('/');
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black text-black dark:text-white">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <div className="w-12 h-12 rounded-2xl bg-red-900 flex items-center justify-center text-white shadow-lg shadow-red-950/30 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
            Cadastro de Novo Leitor
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Junte-se à Biblioteca do Coletivo Negro Viegas D&apos;Abreu • Acesso comunitário livre
          </p>
        </div>

        {/* Card Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-900" />
              Ficha de Inscrição Comunitária
            </span>
            <Link
              href="/login"
              className="text-xs font-bold text-red-900 hover:text-red-900"
            >
              Já tenho conta →
            </Link>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-black dark:text-white focus:ring-2 focus:ring-red-900"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Endereço de E-mail *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-black dark:text-white focus:ring-2 focus:ring-red-900"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-black dark:text-white focus:ring-2 focus:ring-red-900"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Telefone / WhatsApp (Para avisos de devolução)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-black dark:text-white focus:ring-2 focus:ring-red-900"
                />
              </div>
            </div>


            {/* Bio / Motivation */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-black dark:text-white">
                Como você conheceu o coletivo ou o que busca ler? (Opcional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ex: Sou morador do bairro e participo das oficinas culturais..."
                rows={2}
                className="w-full text-xs p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white focus:ring-2 focus:ring-red-900"
              />
            </div>

            {error && (
              <p className="text-sm text-red-900 dark:text-red-400" role="alert">
                {error}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-900 hover:bg-red-800 text-white text-sm font-bold shadow-md shadow-red-950/20 transition-all flex items-center justify-center gap-2 hover:scale-101"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Criando Conta...' : 'Concluir Cadastro & Ativar Cartão'}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href="/login"
              className="text-xs text-zinc-500 hover:text-red-900 inline-flex items-center gap-1 font-semibold"
            >
              <LogIn className="w-3.5 h-3.5" />
              Já tem cadastro? Faça login aqui
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

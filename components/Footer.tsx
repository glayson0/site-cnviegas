'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Heart, MapPin, Clock, Mail, Shield, AtSign } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black text-zinc-300 border-t border-zinc-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Manifesto */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-900 flex items-center justify-center text-white shadow">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-lg text-white">
                Biblioteca Coletivo Negro Viegas D&apos;Abreu
              </span>
            </div>
            <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
              Um espaço autônomo, comunitário e compartilhado de circulação de saberes,
              pensamento crítico, literatura periférica e saberes insurgentes. O conhecimento é livre e transformador.
            </p>
            
          </div>

          {/* Collective Info & Location */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Informações do Coletivo
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-900 shrink-0 mt-0.5" />
                <span>Faculdade de Engenharia Elétrica e de Computação (FEEC) - Unicamp</span>
              </li>
              <li className="flex items-start gap-2">
                <AtSign className="w-4 h-4 text-red-900 shrink-0 mt-0.5" />
                <span>cn.viegasdabreufeec</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-red-900 shrink-0 mt-0.5" />
                <span>cnviegas@unicamp.br</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p suppressHydrationWarning>© {new Date().getFullYear()} Biblioteca Coletivo Negro Viegas D&apos;Abreu. Todos os direitos compartilhados.</p>
        </div>
      </div>
    </footer>
  );
}

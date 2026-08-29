'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '../types/library';
import { createClient } from '../lib/supabase/client';
import { fetchProfile } from '../lib/profile';

export interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  loginAsDemo: (role: 'reader' | 'admin') => Promise<AuthResult>;
  logout: () => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
    bio?: string,
    interests?: string[],
  ) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Seeded fixtures from supabase/seed.sql. The password is public by design.
const DEMO_CREDENTIALS = {
  admin: { email: 'admin@cnviegas.org', password: 'demo123456' },
  reader: { email: 'leitor@cnviegas.org', password: 'demo123456' },
};

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (message.includes('User already registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (message.includes('Password should be at least')) {
    return 'A senha deve ter ao menos 6 caracteres.';
  }
  if (message.toLowerCase().includes('rate limit')) {
    return 'Muitas tentativas. Tente novamente em alguns minutos.';
  }
  return 'Não foi possível completar a ação. Tente novamente.';
}

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  // Seeded by the server layout, so there is no logged-out flash on load.
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setCurrentUser(null);
        return;
      }
      setCurrentUser(await fetchProfile(supabase, session.user.id));
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    router.refresh();
    return { ok: true };
  };

  const loginAsDemo = (demoRole: 'reader' | 'admin'): Promise<AuthResult> => {
    const { email, password } = DEMO_CREDENTIALS[demoRole];
    return login(email, password);
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.refresh();
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string,
    bio?: string,
    interests: string[] = [],
  ): Promise<AuthResult> => {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
          phone: phone?.trim() ?? '',
          bio: bio?.trim() ?? '',
          interests,
        },
      },
    });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    router.refresh();
    return { ok: true };
  };

  const role: UserRole = currentUser ? currentUser.role : 'visitor';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated: !!currentUser,
        login,
        loginAsDemo,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

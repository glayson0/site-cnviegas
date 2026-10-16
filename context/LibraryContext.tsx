'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Book, Loan, ReadingReview, User, ToastMessage } from '../types/library';
import { createClient } from '../lib/supabase/client';
import {
  fetchBooksFromSupabase,
  fetchLoansFromSupabase,
  fetchProfilesFromSupabase,
  insertBookToSupabase,
  updateBookInSupabase,
  deleteBookFromSupabase,
  insertLoanToSupabase,
  returnLoanInSupabase,
  renewLoanInSupabase,
} from '../lib/database';

interface LibraryContextType {
  books: Book[];
  loans: Loan[];
  users: User[];
  reviews: ReadingReview[];
  wishlist: string[];
  toasts: ToastMessage[];
  isLoading: boolean;
  isSupabaseConnected: boolean;
  refreshData: () => Promise<void>;
  addToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  addBook: (bookData: Omit<Book, 'id' | 'addedAt'>) => Promise<Book>;
  updateBook: (id: string, updatedFields: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  borrowBook: (bookId: string, userId: string, days?: number, notes?: string) => Promise<{ success: boolean; message: string }>;
  returnBook: (loanId: string, notes?: string) => Promise<{ success: boolean; message: string }>;
  renewLoan: (loanId: string, extraDays?: number) => Promise<{ success: boolean; message: string }>;
  toggleWishlist: (bookId: string) => void;
  isWishlisted: (bookId: string) => boolean;
  addReview: (bookId: string, userId: string, userName: string, rating: number, comment: string) => void;
  getBookReviews: (bookId: string) => ReadingReview[];
  getUserLoans: (userId: string) => Loan[];
  getUserActiveLoans: (userId: string) => Loan[];
  getUserPastLoans: (userId: string) => Loan[];
  resetToDefaultData: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BOOKS: 'cnviegas_library_books',
  LOANS: 'cnviegas_library_loans',
  USERS: 'cnviegas_library_users',
  REVIEWS: 'cnviegas_library_reviews',
  WISHLIST: 'cnviegas_library_wishlist',
};

function getInitialStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore JSON parse errors on SSR/hydration
  }
  return defaultValue;
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<ReadingReview[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);

  const supabase = useMemo(() => createClient(), []);

  const addToast = useCallback(
    (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastMessage = { id, title, message, type };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save helpers
  const saveBooks = useCallback((newBooks: Book[]) => {
    setBooks(newBooks);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(newBooks));
    }
  }, []);

  const saveLoans = useCallback((newLoans: Loan[]) => {
    setLoans(newLoans);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(newLoans));
    }
  }, []);

  const saveUsers = useCallback((newUsers: User[]) => {
    setUsers(newUsers);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
    }
  }, []);

  const saveReviews = useCallback((newReviews: ReadingReview[]) => {
    setReviews(newReviews);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(newReviews));
    }
  }, []);

  const saveWishlist = useCallback((newWishlist: string[]) => {
    setWishlist(newWishlist);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(newWishlist));
    }
  }, []);

  // Fetch all library data from Supabase
  const refreshData = useCallback(async () => {
    try {
      const [dbBooks, dbProfiles] = await Promise.all([
        fetchBooksFromSupabase(supabase),
        fetchProfilesFromSupabase(supabase),
      ]);

      // Set books directly from Supabase
      const activeBooks = dbBooks || [];
      setBooks(activeBooks);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(activeBooks));
      }

      // Use profiles from Supabase when available
      let activeUsers = users;
      if (dbProfiles && dbProfiles.length > 0) {
        const mergedUsers = [...dbProfiles];
        saveUsers(mergedUsers);
        activeUsers = mergedUsers;
      }

      // Fetch loans with mapped books and users
      const dbLoans = await fetchLoansFromSupabase(supabase, activeBooks, activeUsers);
      if (dbLoans && dbLoans.length > 0) {
        setLoans(dbLoans);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(dbLoans));
        }
      }

      setIsSupabaseConnected(true);
    } catch (err) {
      console.warn('Conexão ao Supabase falhou, usando cache local:', err);
      setIsSupabaseConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, users, saveUsers]);

  // Initial load from Supabase on mount & realtime subscription
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setBooks(getInitialStorage(STORAGE_KEYS.BOOKS, []));
        setLoans(getInitialStorage(STORAGE_KEYS.LOANS, []));
        setUsers(getInitialStorage(STORAGE_KEYS.USERS, []));
        setReviews(getInitialStorage(STORAGE_KEYS.REVIEWS, []));
        setWishlist(getInitialStorage(STORAGE_KEYS.WISHLIST, []));

        const [dbBooks, dbProfiles] = await Promise.all([
          fetchBooksFromSupabase(supabase),
          fetchProfilesFromSupabase(supabase),
        ]);

        if (!isMounted) return;

        const activeBooks = dbBooks || [];
        setBooks(activeBooks);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(activeBooks));
        }

        let activeUsers = getInitialStorage(STORAGE_KEYS.USERS, []);
        if (dbProfiles && dbProfiles.length > 0) {
          const mergedUsers = [...dbProfiles];
          saveUsers(mergedUsers);
          activeUsers = mergedUsers;
        }

        const dbLoans = await fetchLoansFromSupabase(supabase, activeBooks, activeUsers);
        if (!isMounted) return;

        if (dbLoans && dbLoans.length > 0) {
          setLoans(dbLoans);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(dbLoans));
          }
        }

        setIsSupabaseConnected(true);
      } catch (err) {
        console.warn('Conexão ao Supabase falhou, usando cache local:', err);
        if (isMounted) setIsSupabaseConnected(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialData();

    // Subscribe to realtime database changes
    const channel = supabase
      .channel('public_library_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
        loadInitialData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, () => {
        loadInitialData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadInitialData();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, saveUsers]);

  const addBook = async (bookData: Omit<Book, 'id' | 'addedAt'>): Promise<Book> => {
    const tempId = `book-${Date.now()}`;
    const newBook: Book = {
      ...bookData,
      id: tempId,
      addedAt: new Date().toISOString().split('T')[0],
      status: bookData.availableCopies > 0 ? 'available' : 'borrowed',
    };

    const updated = [newBook, ...books];
    saveBooks(updated);
    addToast('Livro Cadastrado!', `"${newBook.title}" foi adicionado com sucesso ao acervo.`);

    // Persist to Supabase
    try {
      const res = await insertBookToSupabase(supabase, bookData);
      if (res.success && res.data?.id) {
        const persistedId = String(res.data.id);
        const fixedBooks = updated.map((b) => (b.id === tempId ? { ...b, id: persistedId } : b));
        saveBooks(fixedBooks);
        return { ...newBook, id: persistedId };
      }
    } catch (e) {
      console.warn('Erro ao sincronizar livro com o Supabase:', e);
    }

    return newBook;
  };

  const updateBook = async (id: string, updatedFields: Partial<Book>) => {
    const updated = books.map((b) => {
      if (b.id === id) {
        const next = { ...b, ...updatedFields };
        if (next.availableCopies !== undefined) {
          next.status = next.availableCopies > 0 ? 'available' : 'borrowed';
        }
        return next;
      }
      return b;
    });

    saveBooks(updated);
    addToast('Acervo Atualizado', 'As informações do livro foram salvas.');

    // Persist to Supabase
    try {
      await updateBookInSupabase(supabase, id, updatedFields);
    } catch (e) {
      console.warn('Erro ao atualizar livro no Supabase:', e);
    }
  };

  const deleteBook = async (id: string) => {
    const target = books.find((b) => b.id === id);
    const updated = books.filter((b) => b.id !== id);
    saveBooks(updated);
    addToast('Livro Removido', `O livro "${target?.title || id}" foi removido do catálogo.`, 'info');

    // Persist to Supabase
    try {
      await deleteBookFromSupabase(supabase, id);
    } catch (e) {
      console.warn('Erro ao excluir livro no Supabase:', e);
    }
  };

  const borrowBook = async (
    bookId: string,
    userId: string,
    days: number = 14,
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    const book = books.find((b) => b.id === bookId);
    if (!book) {
      addToast('Erro', 'Livro não encontrado no acervo.', 'error');
      return { success: false, message: 'Livro não encontrado' };
    }

    if (book.availableCopies <= 0) {
      addToast('Indisponível', 'Todos os exemplares deste livro já estão emprestados.', 'warning');
      return { success: false, message: 'Sem exemplares disponíveis' };
    }

    const user = users.find((u) => u.id === userId) || {
      id: userId,
      name: 'Leitor Convidado',
      email: 'membro@cnviegas.org',
      role: 'reader' as const,
      joinedAt: new Date().toISOString().split('T')[0],
    };

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + days);

    const tempLoanId = `loan-${Date.now()}`;
    const newLoan: Loan = {
      id: tempLoanId,
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookCategory: book.category,
      bookCoverColor: book.coverColor,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      borrowedDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'active',
      notes: notes || 'Empréstimo comunitário regular.',
      renewCount: 0,
    };

    // Update book copies
    const updatedBooks = books.map((b) => {
      if (b.id === bookId) {
        const nextAvail = Math.max(0, b.availableCopies - 1);
        return {
          ...b,
          availableCopies: nextAvail,
          status: (nextAvail > 0 ? 'available' : 'borrowed') as Book['status'],
        };
      }
      return b;
    });

    saveBooks(updatedBooks);
    saveLoans([newLoan, ...loans]);

    addToast(
      'Empréstimo Concluído!',
      `"${book.title}" emprestado para ${user.name}. Devolução até ${newLoan.dueDate}.`,
      'success'
    );

    // Persist to Supabase
    try {
      const res = await insertLoanToSupabase(supabase, {
        bookId: book.id,
        userId: user.id,
        borrowedAt: today.toISOString(),
        dueDate: dueDate.toISOString(),
        notes: notes || 'Empréstimo comunitário regular.',
      });
      if (res.success && res.data?.id) {
        const realId = String(res.data.id);
        const fixedLoans = [newLoan, ...loans].map((l) => (l.id === tempLoanId ? { ...l, id: realId } : l));
        saveLoans(fixedLoans);
      }
    } catch (e) {
      console.warn('Erro ao salvar empréstimo no Supabase:', e);
    }

    return { success: true, message: 'Empréstimo realizado com sucesso' };
  };

  const returnBook = async (
    loanId: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) {
      addToast('Erro', 'Registro de empréstimo não localizado.', 'error');
      return { success: false, message: 'Empréstimo não encontrado' };
    }

    if (loan.status === 'returned') {
      addToast('Aviso', 'Este empréstimo já foi dado como devolvido.', 'info');
      return { success: false, message: 'Já devolvido' };
    }

    const returnDate = new Date().toISOString().split('T')[0];

    // Update loan
    const updatedLoans = loans.map((l) => {
      if (l.id === loanId) {
        return {
          ...l,
          status: 'returned' as const,
          returnedDate: returnDate,
          notes: notes ? `${l.notes || ''} | ${notes}` : l.notes,
        };
      }
      return l;
    });

    // Restore book copy
    const updatedBooks = books.map((b) => {
      if (b.id === loan.bookId) {
        const nextAvail = Math.min(b.totalCopies, b.availableCopies + 1);
        return {
          ...b,
          availableCopies: nextAvail,
          status: 'available' as const,
        };
      }
      return b;
    });

    saveLoans(updatedLoans);
    saveBooks(updatedBooks);

    addToast('Devolução Confirmada!', `O livro "${loan.bookTitle}" foi devolvido ao acervo.`);

    // Persist to Supabase
    try {
      await returnLoanInSupabase(supabase, loanId, loan.bookId, notes);
    } catch (e) {
      console.warn('Erro ao atualizar devolução no Supabase:', e);
    }

    return { success: true, message: 'Livro devolvido com sucesso' };
  };

  const renewLoan = async (
    loanId: string,
    extraDays: number = 7
  ): Promise<{ success: boolean; message: string }> => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) {
      addToast('Erro', 'Empréstimo não encontrado.', 'error');
      return { success: false, message: 'Empréstimo não encontrado' };
    }

    if (loan.status === 'returned') {
      addToast('Aviso', 'Não é possível renovar um empréstimo já devolvido.', 'warning');
      return { success: false, message: 'Empréstimo já devolvido' };
    }

    const currentDue = new Date(loan.dueDate);
    currentDue.setDate(currentDue.getDate() + extraDays);
    const newDueDate = currentDue.toISOString().split('T')[0];

    const updatedLoans = loans.map((l) => {
      if (l.id === loanId) {
        return {
          ...l,
          dueDate: newDueDate,
          status: 'active' as const,
          renewCount: (l.renewCount || 0) + 1,
        };
      }
      return l;
    });

    saveLoans(updatedLoans);
    addToast('Prazo Renovado!', `Data de devolução prorrogada para ${newDueDate}.`);

    // Persist to Supabase
    try {
      await renewLoanInSupabase(supabase, loanId, newDueDate, loan.userId, loan.dueDate);
    } catch (e) {
      console.warn('Erro ao renovar empréstimo no Supabase:', e);
    }

    return { success: true, message: 'Renovado com sucesso' };
  };

  const toggleWishlist = (bookId: string) => {
    const exists = wishlist.includes(bookId);
    const updated = exists ? wishlist.filter((id) => id !== bookId) : [...wishlist, bookId];
    saveWishlist(updated);

    const book = books.find((b) => b.id === bookId);
    if (exists) {
      addToast('Removido dos Favoritos', `"${book?.title || 'Livro'}" foi removido da sua lista.`, 'info');
    } else {
      addToast('Adicionado aos Favoritos!', `"${book?.title || 'Livro'}" foi salvo na sua lista de desejos.`);
    }
  };

  const isWishlisted = (bookId: string) => wishlist.includes(bookId);

  const addReview = (bookId: string, userId: string, userName: string, rating: number, comment: string) => {
    const newRev: ReadingReview = {
      id: `review-${Date.now()}`,
      bookId,
      userId,
      userName,
      rating,
      comment: comment.trim(),
      date: new Date().toISOString().split('T')[0],
    };

    const updated = [newRev, ...reviews];
    saveReviews(updated);
    addToast('Avaliação Publicada!', 'Obrigado por compartilhar suas impressões de leitura com o coletivo.');
  };

  const getBookReviews = (bookId: string) => {
    return reviews.filter((r) => r.bookId === bookId);
  };

  const getUserLoans = (userId: string) => {
    return loans.filter((l) => l.userId === userId);
  };

  const getUserActiveLoans = (userId: string) => {
    return loans.filter((l) => l.userId === userId && l.status !== 'returned');
  };

  const getUserPastLoans = (userId: string) => {
    return loans.filter((l) => l.userId === userId && l.status === 'returned');
  };

  const resetToDefaultData = () => {
    refreshData();
    addToast('Dados Atualizados', 'O acervo foi sincronizado com o banco de dados.', 'info');
  };

  return (
    <LibraryContext.Provider
      value={{
        books,
        loans,
        users,
        reviews,
        wishlist,
        toasts,
        isLoading,
        isSupabaseConnected,
        refreshData,
        addToast,
        removeToast,
        addBook,
        updateBook,
        deleteBook,
        borrowBook,
        returnBook,
        renewLoan,
        toggleWishlist,
        isWishlisted,
        addReview,
        getBookReviews,
        getUserLoans,
        getUserActiveLoans,
        getUserPastLoans,
        resetToDefaultData,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}

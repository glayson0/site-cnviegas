import type { SupabaseClient } from '@supabase/supabase-js';
import { Book, Loan, User, BookCategory, BookStatus } from '../types/library';
import { profileToUser, ProfileRow } from './profile';


export function parseNumericBookId(id: string | number): number | string {
  if (typeof id === 'number') return id;
  const cleaned = id.replace(/\D/g, '');
  if (cleaned.length > 0) {
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return id;
}

export interface DbBookRow {
  id: string | number;
  title?: string | null;
  author?: string | null;
  available?: boolean | null;
  notes?: string | null;
  category?: string | null;
  isbn?: string | null;
  year?: number | null;
  publisher?: string | null;
  pages?: number | null;
  cover_color?: string | null;
  coverColor?: string | null;
  description?: string | null;
  location?: string | null;
  total_copies?: number | null;
  totalCopies?: number | null;
  available_copies?: number | null;
  availableCopies?: number | null;
  status?: string | null;
  tags?: string[] | null;
  added_at?: string | null;
  created_at?: string | null;
  featured?: boolean | null;
}

export interface DbLoanRow {
  id: string | number;
  book_id?: string | number | null;
  bookId?: string | number | null;
  book_title?: string | null;
  bookTitle?: string | null;
  book_author?: string | null;
  bookAuthor?: string | null;
  book_category?: string | null;
  book_cover_color?: string | null;
  user_id?: string | number | null;
  userId?: string | number | null;
  user_name?: string | null;
  userName?: string | null;
  user_email?: string | null;
  userEmail?: string | null;
  borrowed_at?: string | null;
  borrowed_date?: string | null;
  due_date?: string | null;
  returned_at?: string | null;
  returned_date?: string | null;
  notes?: string | null;
  renew_count?: number | null;
  renewCount?: number | null;
}

export function mapDbBookToBook(row: DbBookRow, fallback?: Partial<Book>): Book {
  const totalCopies = row.total_copies ?? row.totalCopies ?? fallback?.totalCopies ?? 1;
  const availableCopies =
    row.available_copies ??
    row.availableCopies ??
    (row.available === false ? 0 : (fallback?.availableCopies ?? (row.available ? 1 : 1)));
  const status: BookStatus =
    (row.status as BookStatus) || (availableCopies > 0 ? 'available' : 'borrowed');

  return {
    id: String(row.id),
    title: row.title || fallback?.title || 'Título Desconhecido',
    author: row.author || fallback?.author || 'Autor Desconhecido',
    isbn: row.isbn || fallback?.isbn || undefined,
    year: row.year || (row.created_at ? new Date(row.created_at).getFullYear() : fallback?.year || 2024),
    publisher: row.publisher || fallback?.publisher || undefined,
    pages: row.pages || fallback?.pages || undefined,
    coverColor: row.cover_color || row.coverColor || fallback?.coverColor || 'bg-red-600',
    description: row.description || row.notes || fallback?.description || 'Obra cadastrada no acervo comunitário.',
    location: row.location || fallback?.location || 'Estante A - Prateleira 1',
    totalCopies,
    availableCopies,
    status,
    addedAt: row.added_at
      ? row.added_at.slice(0, 10)
      : row.created_at
      ? row.created_at.slice(0, 10)
      : fallback?.addedAt || new Date().toISOString().slice(0, 10),
    featured: row.featured ?? fallback?.featured ?? false,
  };
}

export function mapDbLoanToLoan(
  row: DbLoanRow,
  booksMap: Map<string, Book>,
  usersMap: Map<string, User>
): Loan {
  const book = booksMap.get(String(row.book_id || row.bookId));
  const user = usersMap.get(String(row.user_id || row.userId));

  const borrowedDate = row.borrowed_at
    ? row.borrowed_at.slice(0, 10)
    : row.borrowed_date
    ? row.borrowed_date.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const dueDate = row.due_date
    ? row.due_date.slice(0, 10)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const returnedDate = row.returned_at
    ? row.returned_at.slice(0, 10)
    : row.returned_date
    ? row.returned_date.slice(0, 10)
    : undefined;

  const isReturned = !!returnedDate;
  const isOverdue = !isReturned && new Date(dueDate) < new Date();
  const status = isReturned ? 'returned' : isOverdue ? 'overdue' : 'active';

  return {
    id: String(row.id),
    bookId: String(row.book_id || row.bookId || book?.id || ''),
    bookTitle: book?.title || row.book_title || row.bookTitle || 'Livro do Acervo',
    bookAuthor: book?.author || row.book_author || row.bookAuthor || 'Autor',
    bookCoverColor: book?.coverColor || row.book_cover_color || 'bg-red-600',
    userId: String(row.user_id || row.userId || user?.id || ''),
    userName: user?.name || row.user_name || row.userName || 'Leitor Comunitário',
    userEmail: user?.email || row.user_email || row.userEmail || 'leitor@cnviegas.org',
    borrowedDate,
    dueDate,
    returnedDate,
    status,
    notes: row.notes || 'Empréstimo comunitário regular.',
    renewCount: row.renew_count ?? row.renewCount ?? 0,
  };
}

export async function fetchBooksFromSupabase(supabase: SupabaseClient): Promise<Book[]> {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao consultar tabela books no Supabase:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return (data as DbBookRow[]).map((row) => {
      const fallback = {
        id: String(row.id),
        title: row.title || 'Título Desconhecido',
        author: row.author || 'Autor Desconhecido',
        coverColor: row.coverColor || 'bg-red-700',
      };
      return mapDbBookToBook(row, fallback);
    });
  } catch (err) {
    console.error('Falha na requisição de livros do Supabase:', err);
    return [];
  }
}

export async function fetchLoansFromSupabase(
  supabase: SupabaseClient,
  books: Book[],
  users: User[]
): Promise<Loan[]> {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('borrowed_at', { ascending: false });

    if (error) {
      console.warn('Erro ao consultar tabela loans no Supabase:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const booksMap = new Map(books.map((b) => [b.id, b]));
    const usersMap = new Map(users.map((u) => [u.id, u]));

    return (data as DbLoanRow[]).map((row) => mapDbLoanToLoan(row, booksMap, usersMap));
  } catch (err) {
    console.error('Falha na requisição de empréstimos do Supabase:', err);
    return [];
  }
}

export async function fetchProfilesFromSupabase(supabase: SupabaseClient): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao consultar tabela profiles no Supabase:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return (data as ProfileRow[]).map((row) => profileToUser(row));
  } catch (err) {
    console.error('Falha na requisição de perfis do Supabase:', err);
    return [];
  }
}

export async function insertBookToSupabase(
  supabase: SupabaseClient,
  bookData: Omit<Book, 'id' | 'addedAt'>
): Promise<{ success: boolean; data?: DbBookRow; error?: string }> {
  try {
    const payload: Record<string, string | number | boolean | null> = {
      title: bookData.title,
      author: bookData.author,
      available: bookData.availableCopies > 0,
      notes: bookData.description,
    };

    const { data, error } = await supabase
      .from('books')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as DbBookRow };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de rede ao salvar livro no Supabase';
    return { success: false, error: msg };
  }
}

export async function updateBookInSupabase(
  supabase: SupabaseClient,
  id: string,
  updatedFields: Partial<Book>
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: Record<string, string | number | boolean | null | undefined> = {};
    if (updatedFields.title !== undefined) payload.title = updatedFields.title;
    if (updatedFields.author !== undefined) payload.author = updatedFields.author;
    if (updatedFields.availableCopies !== undefined) {
      payload.available = updatedFields.availableCopies > 0;
    }
    if (updatedFields.description !== undefined) payload.notes = updatedFields.description;

    const bookId = parseNumericBookId(id);
    const { error } = await supabase.from('books').update(payload).eq('id', bookId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar livro no Supabase';
    return { success: false, error: msg };
  }
}

export async function deleteBookFromSupabase(
  supabase: SupabaseClient,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const bookId = parseNumericBookId(id);
    const { error } = await supabase.from('books').delete().eq('id', bookId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao remover livro no Supabase';
    return { success: false, error: msg };
  }
}

export async function insertLoanToSupabase(
  supabase: SupabaseClient,
  loanData: {
    bookId: string;
    userId: string;
    borrowedAt: string;
    dueDate: string;
    notes?: string;
  }
): Promise<{ success: boolean; data?: DbLoanRow; error?: string }> {
  try {
    const bookId = parseNumericBookId(loanData.bookId);
    const payload: Record<string, string | number | boolean | null> = {
      book_id: bookId,
      user_id: loanData.userId,
      borrowed_at: loanData.borrowedAt,
      due_date: loanData.dueDate,
      notes: loanData.notes || 'Empréstimo regular',
    };

    const { data, error } = await supabase
      .from('loans')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) return { success: false, error: error.message };

    // Also mark book as unavailable in books table
    await supabase.from('books').update({ available: false }).eq('id', bookId);

    return { success: true, data: data as DbLoanRow };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao registrar empréstimo no Supabase';
    return { success: false, error: msg };
  }
}

export async function returnLoanInSupabase(
  supabase: SupabaseClient,
  loanId: string,
  bookId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: Record<string, string | number | boolean | null | undefined> = {
      returned_at: new Date().toISOString(),
    };
    if (notes) payload.notes = notes;

    const { error } = await supabase.from('loans').update(payload).eq('id', loanId);
    if (error) return { success: false, error: error.message };

    // Restore book availability
    const parsedBookId = parseNumericBookId(bookId);
    await supabase.from('books').update({ available: true }).eq('id', parsedBookId);

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar devolução no Supabase';
    return { success: false, error: msg };
  }
}

export async function renewLoanInSupabase(
  supabase: SupabaseClient,
  loanId: string,
  newDueDate: string,
  userId?: string,
  previousDueDate?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('loans')
      .update({ due_date: newDueDate })
      .eq('id', loanId);

    if (error) return { success: false, error: error.message };

    // Optionally record in renewals table
    if (userId) {
      await supabase.from('renewals').insert({
        loan_id: loanId,
        user_id: userId,
        renewed_at: new Date().toISOString(),
        previous_due_date: previousDueDate || new Date().toISOString(),
        new_due_date: newDueDate,
      });
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao prorrogar empréstimo no Supabase';
    return { success: false, error: msg };
  }
}

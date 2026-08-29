export type UserRole = 'visitor' | 'reader' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  joinedAt: string;
  phone?: string;
  bio?: string;
  interests?: string[];
  activeLoansCount?: number;
  maxLoansAllowed?: number;
}

export type BookStatus = 'available' | 'borrowed' | 'reserved' | 'maintenance';

export type BookCategory = 
  | 'Literatura Brasileira'
  | 'Teoria Social & Crítica'
  | 'Filosofia'
  | 'História & Política'
  | 'Feminismo & Gênero'
  | 'Lutas Antirracistas'
  | 'Ecologia & Saberes Indígenas'
  | 'Poesia & Artes'
  | 'Fanzines & Revistas'
  | 'Outros';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  isbn?: string;
  year?: number;
  publisher?: string;
  pages?: number;
  coverColor?: string; // Gradient or background color style
  description: string;
  location: string; // Ex: 'Estante A - Prateleira 2'
  totalCopies: number;
  availableCopies: number;
  status: BookStatus;
  tags?: string[];
  addedAt: string;
  featured?: boolean;
}

export type LoanStatus = 'active' | 'returned' | 'overdue' | 'extended';

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCategory?: BookCategory;
  bookCoverColor?: string;
  userId: string;
  userName: string;
  userEmail: string;
  borrowedDate: string; // YYYY-MM-DD
  dueDate: string;      // YYYY-MM-DD
  returnedDate?: string;
  status: LoanStatus;
  notes?: string;
  renewCount: number;
}

export interface ReadingReview {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

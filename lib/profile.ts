import type { SupabaseClient } from '@supabase/supabase-js';
import type { User, UserRole } from '../types/library';

export interface ProfileRow {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: Exclude<UserRole, 'visitor'> | string | null;
  avatar?: string | null;
  phone?: string | null;
  bio?: string | null;
  interests?: string[] | null;
  joined_at?: string | null;
  created_at?: string | null;
  max_loans_allowed?: number | null;
}

export function profileToUser(row: ProfileRow): User {
  const role = (row.role === 'admin' ? 'admin' : 'reader') as Exclude<UserRole, 'visitor'>;
  const joinedDate = row.joined_at || row.created_at || new Date().toISOString();

  return {
    id: row.id,
    name: row.name || 'Leitor Comunitário',
    email: row.email || '',
    role,
    avatar: row.avatar ?? (role === 'admin' ? '🛡️' : '📚'),
    phone: row.phone ?? undefined,
    bio: row.bio ?? undefined,
    interests: row.interests ?? [],
    joinedAt: joinedDate.slice(0, 10),
    maxLoansAllowed: row.max_loans_allowed ?? (role === 'admin' ? 10 : 3),
  };
}

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return profileToUser(data as ProfileRow);
}

export async function fetchAllProfiles(
  supabase: SupabaseClient,
): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row) => profileToUser(row as ProfileRow));
}

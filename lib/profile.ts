import type { SupabaseClient } from '@supabase/supabase-js';
import type { User, UserRole } from '../types/library';

const PROFILE_COLUMNS =
  'id, name, email, role, avatar, phone, bio, interests, joined_at, max_loans_allowed';

export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: Exclude<UserRole, 'visitor'>;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  interests: string[] | null;
  joined_at: string;
  max_loans_allowed: number;
}

export function profileToUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar ?? undefined,
    phone: row.phone ?? undefined,
    bio: row.bio ?? undefined,
    interests: row.interests ?? [],
    joinedAt: row.joined_at.slice(0, 10),
    maxLoansAllowed: row.max_loans_allowed,
  };
}

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return profileToUser(data as ProfileRow);
}

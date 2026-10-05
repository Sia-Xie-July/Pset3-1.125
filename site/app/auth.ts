import { database, ensureSeed } from './data';

export async function registeredAccount(userId: string) {
  await ensureSeed();
  return database().prepare('SELECT id,role,team_id,registered_at FROM users WHERE authenticated_user_id=?')
    .bind(userId).first<{ id: number; role: string; team_id: number | null; registered_at: string }>();
}

import { database, ensureSeed } from './data';
import { env } from 'cloudflare:workers';
import { provisionInitialAdmin } from '../lib/admin-bootstrap.mjs';

export async function registeredAccount(userId: string) {
  await ensureSeed();
  await provisionInitialAdmin(database(),userId,env.INITIAL_ADMIN_IDENTITY);
  return database().prepare('SELECT id,role,team_id,registered_at FROM users WHERE authenticated_user_id=?')
    .bind(userId).first<{ id: number; role: string; team_id: number | null; registered_at: string }>();
}

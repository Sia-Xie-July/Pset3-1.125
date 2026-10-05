import { ensureSeed, database, refreshSource, snapshot } from '../../data';
import { registeredAccount } from '../../auth';
import { getChatGPTUser } from '../../chatgpt-auth';
import { access } from '../../../lib/core.mjs';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!['register', 'refresh', 'adviser'].includes(action)) return json({ error: 'Not found' }, 404);
  const url = new URL(request.url);
  if (url.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(url.hostname)) return json({ error: 'HTTPS is required.' }, 403);
  if (request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({ error: 'Invalid request origin.' }, 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'JSON request required.' }, 415);
  const user = await getChatGPTUser();
  if (!user) return json({ error: 'Sign in with ChatGPT to continue.' }, 401);
  let body: any;
  try {
    const text = await request.text();
    if (text.length > 5000) return json({ error: 'Request is too large.' }, 413);
    body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error();
  } catch { return json({ error: 'Invalid JSON request.' }, 400); }
  try {
    await ensureSeed();
    if (action === 'register') {
      // Only the platform identity is trusted; browser-supplied roles and identities are ignored.
      await database().prepare("INSERT INTO users(authenticated_user_id,role,registered_at) VALUES(?,'viewer',?) ON CONFLICT(authenticated_user_id) DO NOTHING")
        .bind(user.userId, new Date().toISOString()).run();
      return json({ registered: true });
    }
    const account = await registeredAccount(user.userId), status = access(user, account, action === 'refresh');
    if (status !== 200) return json({ error: !account ? 'Complete website registration to continue.' : 'Project editor access is required.' }, status);
    if (action === 'refresh') {
      if (!Number.isInteger(body.source_id) || ![6, 7, 8, 11].includes(body.source_id)) return json({ error: 'Select an enabled source.' }, 400);
      return json({ updated_records: await refreshSource(body.source_id) });
    }
    if (typeof body.question !== 'string' || !body.question.trim() || body.question.length > 2000) return json({ error: 'Enter a question of 1–2,000 characters.' }, 400);
    // Authentication is active; model calls remain disabled pending server-side credentials.
    const data = await snapshot();
    return json({ error: 'The AI adviser is not connected yet. Your account is active; current evidence is available on the Evidence page.', available_source_count: data.sources.length }, 503);
  } catch { return json({ error: 'The service is temporarily unavailable. Saved data is retained.' }, 503); }
}

import { ensureSeed, database, refreshSource } from '../../data';
import { registeredAccount } from '../../auth';
import { getChatGPTUser } from '../../chatgpt-auth';
import { access } from '../../../lib/core.mjs';
import { advise } from '../../adviser';
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
    if (text.length > 16000) return json({ error: 'Request is too large.' }, 413);
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
    return json(await advise(account!.id,body.question.trim(),body.history));
  } catch(error:any) {
    const messages:Record<string,[number,string]>={
      invalid_history:[400,'Conversation history is invalid or too large. Start a new conversation.'],
      adviser_not_configured:[503,'The adviser is temporarily unavailable: its server credential is not configured.'],
      adviser_rate_limit:[429,'Please wait before asking again. Limits: one active request, 6 requests per 10 minutes and 40 per day. The site also has a shared daily limit.'],
      openai_quota_or_rate_limit:[503,'The AI provider is temporarily rate-limited or has insufficient credit. Please try later.'],
      openai_authentication_failed:[503,'The server AI credential needs attention. Please contact the project team.'],
    };
    const [status,message]=messages[error.message]||[503,'The adviser could not complete a verified answer. Please try again. Saved data is retained.'];
    return Response.json({error:message},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(status===429?{'Retry-After':'60'}:{})}});
  }
}

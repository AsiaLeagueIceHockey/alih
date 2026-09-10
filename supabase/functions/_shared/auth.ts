import { createClient, User } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const allowedOrigins = new Set([
  'https://alhockey.fans',
  'http://localhost:8080',
  'http://localhost:5173',
]);

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  return {
    ...(origin && allowedOrigins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function bearerToken(req: Request): string | null {
  const authorization = req.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export async function requireUser(req: Request): Promise<User> {
  const token = bearerToken(req);
  if (!token) throw new Error('Unauthorized');

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error('Unauthorized');
  return data.user;
}

export async function requireAdmin(req: Request): Promise<User> {
  const user = await requireUser(req);
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await admin.rpc('is_admin_user', { p_user_id: user.id });
  if (error || data !== true) throw new Error('Forbidden');
  return user;
}

const encoder = new TextEncoder();

async function secretsMatch(expected: string, received: string): Promise<boolean> {
  const [expectedHash, receivedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
    crypto.subtle.digest('SHA-256', encoder.encode(received)),
  ]);
  const expectedBytes = new Uint8Array(expectedHash);
  const receivedBytes = new Uint8Array(receivedHash);
  let difference = expectedBytes.length ^ receivedBytes.length;
  const length = Math.max(expectedBytes.length, receivedBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (expectedBytes[index] ?? 0) ^ (receivedBytes[index] ?? 0);
  }
  return difference === 0;
}

export async function requireCron(req: Request): Promise<void> {
  const expected = Deno.env.get('CRON_SECRET') ?? '';
  const received = req.headers.get('x-cron-secret') ?? '';
  if (!expected || !received || !await secretsMatch(expected, received)) throw new Error('Forbidden');
}

export async function requireCronOrAdmin(req: Request): Promise<void> {
  const expected = Deno.env.get('CRON_SECRET') ?? '';
  const received = req.headers.get('x-cron-secret') ?? '';
  if (expected && received && await secretsMatch(expected, received)) return;
  await requireAdmin(req);
}

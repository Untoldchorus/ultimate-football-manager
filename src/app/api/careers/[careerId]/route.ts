import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServerSupabase(authHeader?: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ careerId: string }> }
) {
  try {
    const { careerId } = await context.params;
    const userId = request.headers.get('x-user-id');
    const authHeader = request.headers.get('authorization');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      careerName?: string;
      expectedVersionEtag?: number;
      stateJson?: unknown;
    };

    const supabase = getServerSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({
        mode: 'local_indexeddb',
        updated: true,
        versionEtag: (body.expectedVersionEtag ?? 1) + 1,
        savedAtIso: new Date().toISOString(),
      });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('careers')
      .select('id, user_id, version_etag')
      .eq('id', careerId)
      .single();

    if (fetchErr || !existing || existing.user_id !== userId) {
      return NextResponse.json({ error: 'Career not found or access denied.' }, { status: 404 });
    }

    if (
      typeof body.expectedVersionEtag === 'number' &&
      existing.version_etag !== body.expectedVersionEtag
    ) {
      return NextResponse.json(
        {
          conflict: true,
          serverVersionEtag: existing.version_etag,
          error: 'Save conflict detected: a newer cloud save exists.',
        },
        { status: 409 }
      );
    }

    const nextVersion = (existing.version_etag ?? 1) + 1;
    const updates: Record<string, unknown> = {
      version_etag: nextVersion,
      saved_at: new Date().toISOString(),
    };
    if (body.careerName?.trim()) updates.career_name = body.careerName.trim();
    if (body.stateJson) updates.state_json = body.stateJson;

    const { error: updateErr } = await supabase
      .from('careers')
      .update(updates)
      .eq('id', careerId)
      .eq('user_id', userId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      mode: 'supabase_cloud',
      updated: true,
      versionEtag: nextVersion,
      savedAtIso: updates.saved_at,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update career.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ careerId: string }> }
) {
  const { careerId } = await context.params;
  const userId = request.headers.get('x-user-id');
  const authHeader = request.headers.get('authorization');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServerSupabase(authHeader);
  if (!supabase) {
    return NextResponse.json({ mode: 'local_indexeddb', deleted: true });
  }

  const { error } = await supabase
    .from('careers')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', careerId)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: 'supabase_cloud', deleted: true });
}

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

export interface CareerMetadataRecord {
  careerId: string;
  userId: string;
  slotId: string;
  careerName: string;
  careerType: 'real_club' | 'original_team';
  managerName: string;
  clubName: string;
  seasonYear: number;
  currentWeek: number;
  difficulty: string;
  versionEtag: number;
  savedAtIso: string;
}

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id');
  const authHeader = request.headers.get('authorization');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized: missing user identity.' }, { status: 401 });
  }

  const supabase = getServerSupabase(authHeader);
  if (!supabase) {
    return NextResponse.json({
      mode: 'local_indexeddb',
      careers: [] as CareerMetadataRecord[],
    });
  }

  const { data, error } = await supabase
    .from('careers')
    .select(
      'id, user_id, slot_id, career_name, career_type, manager_name, club_name, season_year, current_week, difficulty, version_etag, saved_at'
    )
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('saved_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const careers: CareerMetadataRecord[] = (data ?? []).map((row) => ({
    careerId: row.id,
    userId: row.user_id,
    slotId: row.slot_id,
    careerName: row.career_name || `${row.club_name} Career`,
    careerType: row.career_type === 'original_team' ? 'original_team' : 'real_club',
    managerName: row.manager_name,
    clubName: row.club_name,
    seasonYear: row.season_year,
    currentWeek: row.current_week,
    difficulty: row.difficulty ?? 'standard',
    versionEtag: row.version_etag ?? 1,
    savedAtIso: row.saved_at,
  }));

  return NextResponse.json({ mode: 'supabase_cloud', careers });
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const authHeader = request.headers.get('authorization');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: missing user identity.' }, { status: 401 });
    }

    const body = (await request.json()) as {
      slotId?: string;
      careerName?: string;
      careerType?: 'real_club' | 'original_team';
      managerName?: string;
      clubName?: string;
      seasonYear?: number;
      currentWeek?: number;
      difficulty?: string;
      idempotencyKey?: string;
      stateJson?: unknown;
    };

    if (!body.slotId || !body.managerName?.trim() || !body.clubName?.trim() || !body.stateJson) {
      return NextResponse.json(
        { error: 'Invalid career payload: slotId, managerName, clubName, and stateJson are required.' },
        { status: 400 }
      );
    }

    const careerType = body.careerType === 'original_team' ? 'original_team' : 'real_club';
    const supabase = getServerSupabase(authHeader);

    if (!supabase) {
      return NextResponse.json({
        mode: 'local_indexeddb',
        saved: true,
        versionEtag: 1,
        savedAtIso: new Date().toISOString(),
      });
    }

    const { data, error } = await supabase
      .from('careers')
      .upsert(
        {
          user_id: userId,
          slot_id: body.slotId,
          career_name: body.careerName?.trim() || `${body.clubName.trim()} Career`,
          career_type: careerType,
          manager_name: body.managerName.trim(),
          club_name: body.clubName.trim(),
          season_year: body.seasonYear ?? 2026,
          current_week: body.currentWeek ?? 1,
          difficulty: body.difficulty ?? 'standard',
          idempotency_key: body.idempotencyKey ?? null,
          state_json: body.stateJson,
          saved_at: new Date().toISOString(),
          is_deleted: false,
        },
        { onConflict: 'user_id,slot_id' }
      )
      .select('id, version_etag, saved_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      mode: 'supabase_cloud',
      saved: true,
      careerId: data.id,
      versionEtag: data.version_etag,
      savedAtIso: data.saved_at,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create career.' },
      { status: 500 }
    );
  }
}

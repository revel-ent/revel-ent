import { getSupabaseAdminClient } from '@/lib/supabase-server';
import { getCoordinationFeedByEvent as getMockFeed } from '@/lib/mock-ops';

export interface CoordinationItem {
  id: string;
  eventId: string;
  owner: string;
  role: 'planner' | 'ops' | 'vendor' | 'admin' | 'couple';
  status: 'pending' | 'acknowledged' | 'executed';
  timestamp: string;
  update: string;
}

export async function getCoordinationFeed(eventId: string): Promise<{ items: CoordinationItem[]; source: 'database' | 'mock' }> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { items: getMockFeed(eventId) as CoordinationItem[], source: 'mock' };
  }

  const { data, error } = await supabase
    .from('coordination_feed')
    .select('id, event_id, author_name, author_role, message, status, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error || !data) {
    return { items: getMockFeed(eventId) as CoordinationItem[], source: 'mock' };
  }

  // If the real table is empty for this event, fall back to mock so new events
  // aren't shown a blank feed during the transition period.
  if (data.length === 0) {
    const mockItems = getMockFeed(eventId) as CoordinationItem[];
    if (mockItems.length > 0) {
      return { items: mockItems, source: 'mock' };
    }
  }

  return {
    items: data.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      owner: row.author_name,
      role: row.author_role as CoordinationItem['role'],
      status: row.status as CoordinationItem['status'],
      timestamp: row.created_at,
      update: row.message,
    })),
    source: 'database',
  };
}

export async function postCoordinationUpdate(opts: {
  eventId: string;
  authorName: string;
  authorRole: CoordinationItem['role'];
  message: string;
}): Promise<{ id: string } | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('coordination_feed')
    .insert({
      event_id: opts.eventId,
      author_name: opts.authorName,
      author_role: opts.authorRole,
      message: opts.message,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data) return null;
  return { id: data.id };
}

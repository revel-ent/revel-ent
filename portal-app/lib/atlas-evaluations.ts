import type { AtlasEvaluation, AtlasStatus, AtlasTriggerKey } from '@/lib/atlas-types';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

type ActiveEvaluationStatus = Extract<AtlasStatus, 'active' | 'needs_review' | 'snoozed'>;

export interface AtlasRecommendationListResult {
  eventId: string;
  activeStatuses: ActiveEvaluationStatus[];
  source: 'database' | 'fallback';
  items: AtlasEvaluation[];
}

interface AtlasEvaluationRow {
  id: string;
  event_id: string;
  venue_id: string;
  trigger_key: AtlasTriggerKey;
  grouped_recommendation_key: string;
  fingerprint: string;
  severity: AtlasEvaluation['severity'];
  confidence: number;
  status: AtlasEvaluation['status'];
  evidence: Record<string, unknown>;
  recommendation_payload: Record<string, unknown>;
  missing_fields: string[];
  evaluated_by_source: AtlasEvaluation['evaluatedBySource'];
  created_at: string;
  updated_at: string;
}

function mapEvaluationRow(row: AtlasEvaluationRow): AtlasEvaluation {
  return {
    id: row.id,
    eventId: row.event_id,
    venueId: row.venue_id,
    triggerKey: row.trigger_key,
    groupedRecommendationKey: row.grouped_recommendation_key,
    fingerprint: row.fingerprint,
    severity: row.severity,
    confidence: Number(row.confidence ?? 0),
    status: row.status,
    evidence: row.evidence ?? {},
    recommendationPayload: row.recommendation_payload ?? {},
    missingFields: Array.isArray(row.missing_fields) ? row.missing_fields : [],
    evaluatedBySource: row.evaluated_by_source,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listActiveAtlasRecommendations(params: {
  eventId: string;
  limit?: number;
}): Promise<AtlasRecommendationListResult> {
  const activeStatuses: ActiveEvaluationStatus[] = ['active', 'needs_review', 'snoozed'];
  const supabase = getSupabaseAdminClient();
  const safeLimit = Math.min(20, Math.max(1, Math.floor(params.limit ?? 6)));

  if (!supabase) {
    return {
      eventId: params.eventId,
      activeStatuses,
      source: 'fallback',
      items: []
    };
  }

  const { data, error } = await supabase
    .from('atlas_evaluations')
    .select(
      'id,event_id,venue_id,trigger_key,grouped_recommendation_key,fingerprint,severity,confidence,status,evidence,recommendation_payload,missing_fields,evaluated_by_source,created_at,updated_at'
    )
    .eq('event_id', params.eventId)
    .in('status', activeStatuses)
    .order('updated_at', { ascending: false })
    .limit(safeLimit);

  if (error || !data) {
    return {
      eventId: params.eventId,
      activeStatuses,
      source: 'fallback',
      items: []
    };
  }

  return {
    eventId: params.eventId,
    activeStatuses,
    source: 'database',
    items: (data as AtlasEvaluationRow[]).map(mapEvaluationRow)
  };
}
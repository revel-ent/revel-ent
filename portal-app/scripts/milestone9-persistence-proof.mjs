import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*=/.test(line)) continue;
  const idx = line.indexOf('=');
  process.env[line.slice(0, idx)] = line.slice(idx + 1);
}

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const eventId = process.env.PROOF_EVENT_ID || 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0';
const mode = process.argv[2] || 'apply';

const proofValues = {
  mitigationNote: 'Milestone 9 durability proof note',
  equipmentNote: 'Milestone 9 durability proof equipment note',
  cueNote: 'Milestone 9 durability proof cue note',
  cueStatus: 'in_progress'
};

const proofTargets = {
  riskId: 'risk-curfew-compression',
  equipmentItemId: 'equip-audio-line-array',
  cueId: 'cue-baraat-stack'
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function loginAndGetCookie() {
  const body = new URLSearchParams({
    email: 'events@amtopmplanners.com',
    inviteCode: 'ATLAS-PLN-AMTOPM-2026',
    next: '/portal'
  });

  const response = await fetch(`${baseUrl}/api/auth/mock-login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    redirect: 'manual'
  });

  const rawCookie = response.headers.get('set-cookie') || '';
  const cookie = rawCookie.split(';')[0];
  assert(cookie.startsWith('revel_session='), 'Mock login did not return revel_session cookie');
  return cookie;
}

async function fetchWorkspace(cookie) {
  const response = await fetch(`${baseUrl}/api/events/production/workspace`, {
    headers: { cookie }
  });
  assert(response.ok, `Workspace request failed: ${response.status}`);
  const payload = await response.json();
  return payload.workspace;
}

async function patchRisk(cookie, riskId) {
  const response = await fetch(`${baseUrl}/api/events/venue-intelligence/risks/${riskId}`, {
    method: 'PATCH',
    headers: {
      cookie,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ acknowledged: true, mitigationNote: proofValues.mitigationNote })
  });
  assert(response.ok, `Risk PATCH failed: ${response.status}`);
  return response.json();
}

async function patchEquipment(cookie, itemId) {
  const response = await fetch(`${baseUrl}/api/events/equipment/${itemId}`, {
    method: 'PATCH',
    headers: {
      cookie,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ status: 'ready', note: proofValues.equipmentNote })
  });
  assert(response.ok, `Equipment PATCH failed: ${response.status}`);
  return response.json();
}

async function patchCue(cookie, cueId) {
  const response = await fetch(`${baseUrl}/api/events/run-of-show/${cueId}`, {
    method: 'PATCH',
    headers: {
      cookie,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ status: proofValues.cueStatus, note: proofValues.cueNote })
  });
  assert(response.ok, `Cue PATCH failed: ${response.status}`);
  return response.json();
}

async function verifyTableWritable() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const rowResult = await supabase
    .from('atlas_operational_state')
    .select('event_id,risk_overrides,equipment_overrides,cue_overrides,updated_at')
    .eq('event_id', eventId)
    .maybeSingle();

  assert(!rowResult.error, `Table read failed: ${rowResult.error?.message || 'unknown'}`);
  assert(rowResult.data, 'No atlas_operational_state row found for proof event');

  const upsertResult = await supabase.from('atlas_operational_state').upsert(
    {
      event_id: eventId,
      risk_overrides: rowResult.data.risk_overrides,
      equipment_overrides: rowResult.data.equipment_overrides,
      cue_overrides: rowResult.data.cue_overrides
    },
    { onConflict: 'event_id' }
  );

  assert(!upsertResult.error, `Table write failed: ${upsertResult.error?.message || 'unknown'}`);

  return rowResult.data;
}

function pickTargets(workspace) {
  const risk = workspace.venue.riskFlags.find((r) => r.id === proofTargets.riskId);
  const item = workspace.equipment.items.find((i) => i.id === proofTargets.equipmentItemId);
  const cue = workspace.cueBoard.cues.find((c) => c.id === proofTargets.cueId);

  assert(risk, `Target risk not found: ${proofTargets.riskId}`);
  assert(item, `Target equipment item not found: ${proofTargets.equipmentItemId}`);
  assert(cue, `Target cue not found: ${proofTargets.cueId}`);

  return { risk, item, cue };
}

function findById(workspace, ids) {
  return {
    risk: workspace.venue.riskFlags.find((r) => r.id === ids.risk.id),
    item: workspace.equipment.items.find((i) => i.id === ids.item.id),
    cue: workspace.cueBoard.cues.find((c) => c.id === ids.cue.id)
  };
}

async function main() {
  const cookie = await loginAndGetCookie();
  const workspaceBefore = await fetchWorkspace(cookie);
  const ids = pickTargets(workspaceBefore);

  if (mode === 'apply') {
    await patchRisk(cookie, ids.risk.id);
    await patchEquipment(cookie, ids.item.id);
    await patchCue(cookie, ids.cue.id);
  }

  const workspaceAfter = await fetchWorkspace(cookie);
  const targetsAfter = findById(workspaceAfter, ids);

  assert(targetsAfter.risk, 'Updated risk not found after changes');
  assert(targetsAfter.item, 'Updated equipment item not found after changes');
  assert(targetsAfter.cue, 'Updated cue not found after changes');

  assert(targetsAfter.risk.status === 'acknowledged', 'Risk status did not persist as acknowledged');
  assert(targetsAfter.risk.mitigationNote === proofValues.mitigationNote, 'Risk mitigation note mismatch');
  assert(targetsAfter.item.status === 'ready', 'Equipment status did not persist as ready');
  assert(targetsAfter.item.note === proofValues.equipmentNote, 'Equipment note mismatch');
  assert(targetsAfter.cue.status === proofValues.cueStatus, 'Cue status mismatch');
  assert(targetsAfter.cue.note === proofValues.cueNote, 'Cue note mismatch');

  const tableRow = await verifyTableWritable();

  console.log(
    JSON.stringify(
      {
        mode,
        baseUrl,
        eventId,
        targets: {
          riskId: ids.risk.id,
          equipmentItemId: ids.item.id,
          cueId: ids.cue.id
        },
        persisted: {
          risk: { status: targetsAfter.risk.status, mitigationNote: targetsAfter.risk.mitigationNote },
          equipment: { status: targetsAfter.item.status, note: targetsAfter.item.note },
          cue: { status: targetsAfter.cue.status, note: targetsAfter.cue.note }
        },
        tableCheck: {
          exists: true,
          writable: true,
          updatedAt: tableRow.updated_at
        }
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

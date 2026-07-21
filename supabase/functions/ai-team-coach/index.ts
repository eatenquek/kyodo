// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const teamCoachSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    simulation: {
      type: 'array',
      minItems: 3,
      maxItems: 8,
      items: { type: 'string' }
    },
    coachingNotes: {
      type: 'array',
      minItems: 2,
      maxItems: 5,
      items: { type: 'string' }
    },
    roleSuggestions: {
      type: 'array',
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          member: { type: 'string' },
          role: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['member', 'role', 'reason']
      }
    },
    riskWarnings: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: { type: 'string' }
    },
    workingAgreement: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: { type: 'string' }
    },
    firstMeetingPlan: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: { type: 'string' }
    }
  },
  required: [
    'summary',
    'simulation',
    'coachingNotes',
    'roleSuggestions',
    'riskWarnings',
    'workingAgreement',
    'firstMeetingPlan'
  ]
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const authorization = req.headers.get('Authorization');
  if (!authorization) {
    return jsonResponse({ error: 'Sign in before asking the AI coach.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4.1-mini';

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Supabase function environment is not configured.' }, 500);
  }

  if (!apiKey) {
    return jsonResponse({ error: 'OPENAI_API_KEY is not configured in Supabase secrets.' }, 500);
  }

  const payload = await req.json();
  const validationError = validatePayload(payload);
  if (validationError) {
    return jsonResponse({ error: validationError }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false }
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const {
    data: { user },
    error: userError
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: 'Sign in before asking the AI coach.' }, 401);
  }

  const { data: membership, error: membershipError } = await serviceClient
    .from('team_members')
    .select('team_id')
    .eq('team_id', payload.team.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) return jsonResponse({ error: membershipError.message }, 500);
  if (!membership) return jsonResponse({ error: 'Only team members can access this AI coach advice.' }, 403);

  const cacheKey = {
    team_id: payload.team.id,
    target_group_size: payload.cache.targetGroupSize,
    formation_signature: payload.cache.formationSignature
  };

  if (!payload.refresh) {
    const { data: cachedAdvice, error: cacheError } = await serviceClient
      .from('ai_coach_advice')
      .select('advice')
      .match(cacheKey)
      .maybeSingle();

    if (cacheError) return jsonResponse({ error: cacheError.message }, 500);
    if (cachedAdvice?.advice) {
      return jsonResponse({
        ...cachedAdvice.advice,
        cached: true
      });
    }
  }

  let advice;
  try {
    advice = await createOpenAiAdvice({ apiKey, model, payload });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'AI coach generation failed.' }, 502);
  }
  const now = new Date().toISOString();
  const { error: upsertError } = await serviceClient.from('ai_coach_advice').upsert(
    {
      ...cacheKey,
      advice,
      input_summary: payload,
      model,
      created_by: user.id,
      updated_at: now
    },
    { onConflict: 'team_id,target_group_size,formation_signature' }
  );

  if (upsertError) return jsonResponse({ error: upsertError.message }, 500);

  return jsonResponse({
    ...advice,
    cached: false
  });
});

async function createOpenAiAdvice({
  apiKey,
  model,
  payload
}: {
  apiKey: string;
  model: string;
  payload: unknown;
}) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'You are KyodoAI, a practical team coach. Explain and coach based only on the provided matching data. Do not invent private personality traits, diagnoses, emotions, or facts outside the data. The deterministic algorithm has already chosen/scored teams; you explain the reasoning, simulate likely collaboration signals, and suggest working agreements. Keep the tone warm, concise, and useful for students.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify(payload)
            }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'kyodo_ai_team_coach_advice',
          strict: true,
          schema: teamCoachSchema
        }
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message ?? 'OpenAI request failed.');
  }

  const outputText = extractOutputText(data);
  if (!outputText) throw new Error('OpenAI returned no readable coach advice.');

  try {
    return JSON.parse(outputText);
  } catch {
    throw new Error('AI coach advice was not valid JSON.');
  }
}

function validatePayload(payload: unknown) {
  if (!payload || payload.version !== 'kyodo-ai-coach-v1') return 'Invalid AI coach payload.';
  if (!payload.team?.id || typeof payload.team.id !== 'string') return 'Missing team id.';
  if (!payload.cache?.formationSignature || typeof payload.cache.formationSignature !== 'string') {
    return 'Missing formation signature.';
  }
  if (!Number.isInteger(payload.cache.targetGroupSize) || payload.cache.targetGroupSize < 2) {
    return 'Invalid target group size.';
  }
  return '';
}

function extractOutputText(response: unknown) {
  if (typeof response?.output_text === 'string') return response.output_text;

  const output = Array.isArray(response?.output) ? response.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (part?.type === 'output_text' && typeof part.text === 'string') return part.text;
      if (typeof part?.text === 'string') return part.text;
    }
  }

  return '';
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

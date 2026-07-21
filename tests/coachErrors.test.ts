import { describe, expect, it } from 'vitest';
import { describeCoachError } from '@/services/ai/coachErrors';

describe('describeCoachError', () => {
  it('handles the offline / not-configured client error', () => {
    const message = describeCoachError(new Error('Supabase must be configured before generating AI coach advice.'));
    expect(message).toMatch(/online|connection/i);
  });

  it('handles auth errors', () => {
    expect(describeCoachError(new Error('Sign in before asking the AI coach.'))).toMatch(/sign in/i);
  });

  it('handles membership errors', () => {
    expect(describeCoachError(new Error('Only team members can access this AI coach advice.'))).toMatch(/member/i);
  });

  it('handles server-not-configured errors', () => {
    expect(describeCoachError(new Error('OPENAI_API_KEY is not configured in Supabase secrets.'))).toMatch(/set up|admin/i);
  });

  it('handles network fetch failures', () => {
    expect(describeCoachError(new Error('Failed to fetch'))).toMatch(/connection|reach/i);
  });

  it('falls back to a generic retry message for unknown errors', () => {
    expect(describeCoachError('boom')).toMatch(/try again/i);
  });
});

import { describe, expect, it } from 'vitest';
import { buildInvitePath, isValidJoinCode, normalizeJoinCode, parseInviteInput } from '@/services/teams/inviteLink';

describe('normalizeJoinCode', () => {
  it('uppercases and trims', () => {
    expect(normalizeJoinCode('  gb2l78 ')).toBe('GB2L78');
  });

  it('strips separators people add by hand', () => {
    expect(normalizeJoinCode('gb2-l78')).toBe('GB2L78');
    expect(normalizeJoinCode('GB2 L78')).toBe('GB2L78');
  });
});

describe('isValidJoinCode', () => {
  it('accepts a six-character alphanumeric code', () => {
    expect(isValidJoinCode('GB2L78')).toBe(true);
  });

  it('rejects wrong lengths and stray characters', () => {
    expect(isValidJoinCode('GB2L7')).toBe(false);
    expect(isValidJoinCode('GB2L789')).toBe(false);
    expect(isValidJoinCode('GB2L7!')).toBe(false);
    expect(isValidJoinCode('')).toBe(false);
  });
});

describe('parseInviteInput', () => {
  it('accepts a bare code', () => {
    expect(parseInviteInput('gb2l78')).toBe('GB2L78');
  });

  it('accepts a deep link', () => {
    expect(parseInviteInput('kyodoai://join/GB2L78')).toBe('GB2L78');
  });

  it('accepts an https link', () => {
    expect(parseInviteInput('https://kyodo.app/join/GB2L78')).toBe('GB2L78');
  });

  it('accepts a link with a trailing slash or query string', () => {
    expect(parseInviteInput('kyodoai://join/GB2L78/')).toBe('GB2L78');
    expect(parseInviteInput('https://kyodo.app/join/GB2L78?ref=chat')).toBe('GB2L78');
  });

  it('ignores surrounding chat noise', () => {
    expect(parseInviteInput('  join us! kyodoai://join/GB2L78  ')).toBe('GB2L78');
  });

  it('returns null when there is no usable code', () => {
    expect(parseInviteInput('https://kyodo.app/join/')).toBeNull();
    expect(parseInviteInput('hello there')).toBeNull();
    expect(parseInviteInput('')).toBeNull();
  });
});

describe('buildInvitePath', () => {
  it('builds the canonical join path', () => {
    expect(buildInvitePath('gb2l78')).toBe('/join/GB2L78');
  });

  it('round-trips with parseInviteInput', () => {
    expect(parseInviteInput(`kyodoai:/${buildInvitePath('GB2L78')}`)).toBe('GB2L78');
  });
});

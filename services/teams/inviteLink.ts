// parses join codes out of whatever shape they arrive in - bare code, deep link, https link, etc

const CODE_LENGTH = 6;
const codePattern = new RegExp(`^[A-Z0-9]{${CODE_LENGTH}}$`);

export function normalizeJoinCode(input: string) {
  return input.trim().toUpperCase().replace(/[\s-]/g, '');
}

export function isValidJoinCode(input: string) {
  return codePattern.test(normalizeJoinCode(input));
}

export function buildInvitePath(code: string) {
  return `/join/${normalizeJoinCode(code)}`;
}

// pulls a code out of a bare string or a /join/<code> link, null if nothing usable
export function parseInviteInput(input: string): string | null {
  if (!input) return null;

  const fromLink = input.match(/\/join\/([A-Za-z0-9\s-]+)/);
  const candidate = fromLink ? fromLink[1].split(/[?#/]/)[0] : input;
  const normalized = normalizeJoinCode(candidate);

  return codePattern.test(normalized) ? normalized : null;
}

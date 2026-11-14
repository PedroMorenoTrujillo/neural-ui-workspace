interface MentionToken {
  readonly start: number;
  readonly end: number;
  readonly query: string;
}

const queryChar = /[\p{L}\p{N}\p{M}_.-]/u;
const tokenBeforeCaret = /(?:^|[\s(\[{])@([\p{L}\p{N}\p{M}_.-]*)$/u;
const tokenAfterCaret = /^[\p{L}\p{N}\p{M}_.-]*/u;

export function mentionToken(value: string, start: number, end: number): MentionToken | null {
  if (start !== end) return null;
  const prefix = value.slice(0, start).match(tokenBeforeCaret);
  if (!prefix) return null;
  const query = prefix[1];
  return { start: start - query.length - 1, end: start + (value.slice(start).match(tokenAfterCaret)?.[0].length ?? 0), query };
}

export function isMentionValue(value: string): boolean {
  return value.length > 0 && Array.from(value).every(character => queryChar.test(character));
}

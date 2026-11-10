import { resolveCordSocketBaseUrl } from 'sdk/client/core/socketBaseUrl.ts';

const FALLBACK_HOST = 'api.cord-test.datapeople.io';
const FALLBACK = `wss://${FALLBACK_HOST}`;

describe('resolveCordSocketBaseUrl', () => {
  test('uses the compiled host when no override is provided', () => {
    expect(resolveCordSocketBaseUrl(undefined, FALLBACK_HOST)).toBe(FALLBACK);
    expect(resolveCordSocketBaseUrl('', FALLBACK_HOST)).toBe(FALLBACK);
  });

  test('uses a wss origin, ignoring path and trailing slash', () => {
    expect(
      resolveCordSocketBaseUrl('wss://local.cord.com:8161', FALLBACK_HOST),
    ).toBe('wss://local.cord.com:8161');
    expect(
      resolveCordSocketBaseUrl('wss://local.cord.com:8161/', FALLBACK_HOST),
    ).toBe('wss://local.cord.com:8161');
    expect(
      resolveCordSocketBaseUrl(
        'wss://local.cord.com:8161/gql/app',
        FALLBACK_HOST,
      ),
    ).toBe('wss://local.cord.com:8161');
  });

  test('ignores non-wss URLs', () => {
    expect(
      resolveCordSocketBaseUrl('https://local.cord.com:8161', FALLBACK_HOST),
    ).toBe(FALLBACK);
    expect(
      resolveCordSocketBaseUrl('ws://local.cord.com:8161', FALLBACK_HOST),
    ).toBe(FALLBACK);
    expect(
      resolveCordSocketBaseUrl('http://localhost:8080', FALLBACK_HOST),
    ).toBe(FALLBACK);
    expect(resolveCordSocketBaseUrl('not a url', FALLBACK_HOST)).toBe(
      FALLBACK,
    );
  });
});

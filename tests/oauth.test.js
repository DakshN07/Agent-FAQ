const oauthState = require('../services/oauthState');
const { prepareForStorage, readCredentials, toPublicJSON } = require('../services/integrationCredentials');
const providers = require('../services/oauthProviders');

const SECRET = 'test-jwt-secret-for-oauth-state';
const OTHER_SECRET = 'a-completely-different-secret';

describe('oauthState — issue/consume', () => {
  beforeEach(() => oauthState._reset());

  it('round-trips the payload it was given', () => {
    const state = oauthState.issue(
      { eventId: 'evt-1', userId: 'usr-1', platform: 'discord', pkceVerifier: 'verifier-abc' },
      SECRET
    );

    const result = oauthState.consume(state, SECRET, { expectedPlatform: 'discord' });

    expect(result.ok).toBe(true);
    expect(result.data.e).toBe('evt-1');
    expect(result.data.u).toBe('usr-1');
    expect(result.data.p).toBe('discord');
    expect(result.data.v).toBe('verifier-abc');
  });

  it('rejects a state signed with a different secret', () => {
    const state = oauthState.issue(
      { eventId: 'evt-1', userId: 'usr-1', platform: 'slack' },
      SECRET
    );

    const result = oauthState.consume(state, OTHER_SECRET, { expectedPlatform: 'slack' });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/invalid state/i);
  });

  it('rejects a tampered payload', () => {
    const state = oauthState.issue(
      { eventId: 'evt-1', userId: 'usr-1', platform: 'discord' },
      SECRET
    );

    // Swap the event id in the payload but keep the original signature — this
    // is the exact attack the signature exists to stop: attaching the
    // attacker's server to a victim's event.
    const dot = state.lastIndexOf('.');
    const payload = JSON.parse(Buffer.from(state.slice(0, dot), 'base64url').toString('utf8'));
    payload.e = 'victim-event';
    const forged = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}${state.slice(dot)}`;

    const result = oauthState.consume(forged, SECRET, { expectedPlatform: 'discord' });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/invalid state/i);
  });

  it('enforces single use', () => {
    const state = oauthState.issue(
      { eventId: 'evt-1', userId: 'usr-1', platform: 'discord' },
      SECRET
    );

    expect(oauthState.consume(state, SECRET, { expectedPlatform: 'discord' }).ok).toBe(true);

    // Replaying a captured callback URL must not work.
    const replay = oauthState.consume(state, SECRET, { expectedPlatform: 'discord' });
    expect(replay.ok).toBe(false);
    expect(replay.error).toMatch(/already used/i);
  });

  it('issues a distinct nonce per request, so two flows never collide', () => {
    const a = oauthState.issue({ eventId: 'e', userId: 'u', platform: 'slack' }, SECRET);
    const b = oauthState.issue({ eventId: 'e', userId: 'u', platform: 'slack' }, SECRET);

    expect(a).not.toBe(b);
    // Both are independently consumable.
    expect(oauthState.consume(a, SECRET, { expectedPlatform: 'slack' }).ok).toBe(true);
    expect(oauthState.consume(b, SECRET, { expectedPlatform: 'slack' }).ok).toBe(true);
  });

  it('rejects a state minted for a different platform', () => {
    const state = oauthState.issue(
      { eventId: 'evt-1', userId: 'usr-1', platform: 'discord' },
      SECRET
    );

    const result = oauthState.consume(state, SECRET, { expectedPlatform: 'slack' });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/does not match/i);
  });

  it('rejects missing and malformed states without throwing', () => {
    expect(oauthState.consume(undefined, SECRET).ok).toBe(false);
    expect(oauthState.consume('', SECRET).ok).toBe(false);
    expect(oauthState.consume('not-a-real-token', SECRET).ok).toBe(false);
    expect(oauthState.consume('no-signature-here', SECRET).ok).toBe(false);
  });

  it('rejects a state that has expired', () => {
    const state = oauthState.issue(
      { eventId: 'evt-1', userId: 'usr-1', platform: 'discord' },
      SECRET
    );

    // Reach into the payload and backdate it past the TTL, then re-sign so the
    // only thing wrong with it is its age.
    const crypto = require('crypto');
    const dot = state.lastIndexOf('.');
    const payload = JSON.parse(Buffer.from(state.slice(0, dot), 'base64url').toString('utf8'));
    payload.t = Date.now() - oauthState.TTL_MS - 1000;
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
    const expired = `${payloadB64}.${sig}`;

    const result = oauthState.consume(expired, SECRET, { expectedPlatform: 'discord' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/expired/i);
  });
});

describe('integrationCredentials', () => {
  it('never returns the token in the public JSON shape', () => {
    const { bundle, meta } = prepareForStorage('discord', {
      token: 'super-secret-bot-token',
      guildId: 'g1',
      guildName: 'My Server',
    });

    const publicShape = toPublicJSON({
      platform: 'discord',
      isActive: true,
      meta,
      connectedAt: new Date(),
    });

    const serialised = JSON.stringify(publicShape);
    expect(serialised).not.toContain('super-secret-bot-token');
    expect(publicShape.label).toBe('My Server');
    // The encrypted bundle exists and is not the raw token.
    expect(bundle.ciphertext).toBeTruthy();
    expect(bundle.ciphertext).not.toContain('super-secret-bot-token');
  });

  it('round-trips credentials through encryption', () => {
    const { bundle, meta } = prepareForStorage('slack', {
      token: 'xoxb-1234-abc',
      teamId: 'T1',
      teamName: 'Acme',
    });

    const read = readCredentials({
      platform: 'slack',
      eventId: 'e1',
      encryptedCredentials: bundle,
      meta,
    });

    expect(read.token).toBe('xoxb-1234-abc');
    expect(read.teamName).toBe('Acme');
  });

  it('strips fields the adapter does not need', () => {
    const { bundle } = prepareForStorage('telegram', {
      token: '123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      botUsername: 'mybot',
      // Slack/Discord-only noise that must not be persisted.
      guildId: 'should-not-survive',
    });

    const read = readCredentials({
      platform: 'telegram',
      eventId: 'e1',
      encryptedCredentials: bundle,
    });

    expect(read.guildId).toBeUndefined();
    expect(read.botUsername).toBe('mybot');
  });

  it('maps a provider access_token onto `token`', () => {
    const { bundle } = prepareForStorage('discord', { access_token: 'discord-token' });
    const read = readCredentials({ platform: 'discord', eventId: 'e', encryptedCredentials: bundle });
    expect(read.token).toBe('discord-token');
  });

  it('returns null (and does not throw) when there is nothing stored', () => {
    expect(readCredentials({ platform: 'slack', eventId: 'e' })).toBeNull();
    expect(readCredentials({ platform: 'slack', eventId: 'e', encryptedCredentials: {} })).toBeNull();
    // A bundle that can't be decrypted (e.g. JWT_SECRET was rotated).
    expect(
      readCredentials({
        platform: 'slack',
        eventId: 'e',
        encryptedCredentials: { ciphertext: 'garbage', iv: 'x', tag: 'y' },
      })
    ).toBeNull();
  });
});

describe('oauthProviders — authorization URLs', () => {
  it('requests minimal Discord permissions, not Administrator', () => {
    const url = new URL(
      providers.buildAuthorizeUrl('discord', {
        clientId: 'cid',
        redirectUri: 'https://api.example.com/api/oauth/discord/callback',
        state: 'state-token',
        codeChallenge: 'challenge',
      })
    );

    const permissions = Number(url.searchParams.get('permissions'));

    // The previous implementation asked for 8 (Administrator), which grants
    // full control of the server — kicking members, deleting channels, editing
    // roles. Anything below bit 8 must not be set.
    expect(permissions & 8).toBe(0);
    // ViewChannel + SendMessages + ReadMessageHistory.
    expect(permissions & 1024).toBeTruthy();
    expect(permissions & 2048).toBeTruthy();
    expect(permissions & 65536).toBeTruthy();
  });

  it('only requests the `bot` scope on Discord (never the user identity)', () => {
    const url = new URL(
      providers.buildAuthorizeUrl('discord', {
        clientId: 'cid',
        redirectUri: 'https://api.example.com/api/oauth/discord/callback',
        state: 's',
      })
    );

    const scope = url.searchParams.get('scope');
    expect(scope).toContain('bot');
    expect(scope).not.toContain('identify');
    expect(scope).not.toContain('email');
    expect(url.searchParams.get('integration_type')).toBe('0');
  });

  it('sends PKCE parameters for Discord', () => {
    const verifier = providers.pkceVerifier();
    const url = new URL(
      providers.buildAuthorizeUrl('discord', {
        clientId: 'cid',
        redirectUri: 'https://api.example.com/api/oauth/discord/callback',
        state: 's',
        codeChallenge: providers.pkceChallenge(verifier),
      })
    );

    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBe(providers.pkceChallenge(verifier));
    // The verifier itself must never travel in the URL.
    expect(url.searchParams.get('code_verifier')).toBeNull();
  });

  it('uses bot_scopes for Slack, not legacy top-level scopes', () => {
    const url = new URL(
      providers.buildAuthorizeUrl('slack', {
        clientId: 'cid',
        redirectUri: 'https://api.example.com/api/oauth/slack/callback',
        state: 's',
      })
    );

    expect(url.searchParams.get('bot_scopes')).toContain('chat:write');
    expect(url.searchParams.get('scope')).toBeNull();
  });

  it('refuses to build a URL for an unsupported platform', () => {
    expect(() =>
      providers.buildAuthorizeUrl('myspace', { clientId: 'c', redirectUri: 'r', state: 's' })
    ).toThrow(/unsupported/i);
  });
});

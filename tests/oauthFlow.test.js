const request = require('supertest');
const mongoose = require('mongoose');

/**
 * End-to-end test of the channel connection flow over real HTTP.
 *
 * The provider (Discord/Slack) is never actually contacted: these tests assert
 * everything we control — that the right redirect is produced, that the state
 * token survives the round trip, and that a replayed or forged callback is
 * rejected. The token exchange itself is only reachable with real credentials.
 */

process.env.DISCORD_CLIENT_ID = 'test-discord-client-id';
process.env.DISCORD_CLIENT_SECRET = 'test-discord-client-secret';
process.env.SLACK_CLIENT_ID = 'test-slack-client-id';
process.env.SLACK_CLIENT_SECRET = 'test-slack-client-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';

const app = require('../server');

// Every request here crosses the auth middleware, does a Mongo round trip, and
// (for event creation) fires starter-FAQ seeding. The suite shares one owner
// account and one event so the whole file stays fast.
let owner; // { auth, eventId }
let stranger; // { auth } — a second user, for the permission checks

/** Register a user and return an Authorization header. */
async function registerUser(tag) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      username: `oauth${tag}${Date.now().toString(36)}`,
      email: `oauth-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
      password: 'Test1234!',
    });
  return { Authorization: `Bearer ${res.body.token}` };
}

/** Register a user and create one event they own. */
async function makeUserAndEvent(tag) {
  const auth = await registerUser(tag);
  const created = await request(app).post('/api/events').set(auth).send({ name: `OAuth ${tag}` });
  return { auth, eventId: created.body.event._id };
}

/** Start a Discord flow and return the state the provider would echo back. */
async function startDiscordFlow() {
  const res = await request(app)
    .post('/api/oauth/discord/connect')
    .set(owner.auth)
    .send({ eventId: owner.eventId });
  return new URL(res.body.authorizeUrl).searchParams.get('state');
}

describe('Channel connection flow', () => {
  // server.js deliberately does NOT call connectDB() when NODE_ENV=test, so a
  // test that actually writes has to open its own connection. Use a separate
  // database and skip cleanly when MongoDB isn't reachable.
  let connected = false;

  beforeAll(async () => {
    try {
      // Deliberately NOT process.env.MONGO_URI: that points at the development
      // database, and the dropDatabase() below would delete the user's data.
      await mongoose.connect(process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/agent-faq-oauth-test');
      connected = true;
      await mongoose.connection.db.dropDatabase();
    } catch {
      connected = false;
    }

    if (!connected) return;

    owner = await makeUserAndEvent('owner');
    stranger = { auth: await registerUser('stranger') };
  }, 60000);

  afterAll(async () => {
    if (connected) await mongoose.connection.close();
  });

  /**
   * Runs the body only when MongoDB is reachable.
   *
   * The check must live inside the test body, not around it: Jest *collects*
   * the suite before `beforeAll` runs, so `connected` is still false at that
   * point and `it.skip` would skip the whole file unconditionally.
   */
  const itDb = (name, fn, timeout) =>
    it(
      name,
      async function (...args) {
        if (!connected) {
          console.warn(`[skipped — no MongoDB] ${name}`);
          return;
        }
        return fn.apply(this, args);
      },
      timeout
    );

  // --- Step 1: mint the redirect ------------------------------------------

  describe('POST /api/oauth/:platform/connect', () => {
    itDb('returns a Discord authorize URL carrying a signed state token', async () => {
      const res = await request(app)
        .post('/api/oauth/discord/connect')
        .set(owner.auth)
        .send({ eventId: owner.eventId });

      expect(res.statusCode).toBe(200);
      expect(res.body.authorizeUrl).toContain('https://discord.com/oauth2/authorize');

      const url = new URL(res.body.authorizeUrl);
      expect(url.searchParams.get('client_id')).toBe('test-discord-client-id');
      expect(url.searchParams.get('state')).toBeTruthy();
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('redirect_uri')).toContain('/api/oauth/discord/callback');
    });

    itDb('returns a Slack authorize URL carrying a signed state token', async () => {
      const res = await request(app)
        .post('/api/oauth/slack/connect')
        .set(owner.auth)
        .send({ eventId: owner.eventId });

      expect(res.statusCode).toBe(200);
      const url = new URL(res.body.authorizeUrl);
      expect(url.searchParams.get('bot_scopes')).toContain('chat:write');
      expect(url.searchParams.get('state')).toBeTruthy();
    });

    itDb('never puts the access token in the redirect URL', async () => {
      // A token in a URL ends up in browser history, proxy logs and referrers.
      const res = await request(app)
        .post('/api/oauth/discord/connect')
        .set(owner.auth)
        .send({ eventId: owner.eventId });

      const url = new URL(res.body.authorizeUrl);
      expect(url.searchParams.get('access_token')).toBeNull();
      expect(url.searchParams.get('token')).toBeNull();
    });

    itDb('requires authentication', async () => {
      const res = await request(app)
        .post('/api/oauth/discord/connect')
        .send({ eventId: owner.eventId });
      expect(res.statusCode).toBe(401);
    });

    itDb('rejects an unknown platform', async () => {
      const res = await request(app)
        .post('/api/oauth/myspace/connect')
        .set(owner.auth)
        .send({ eventId: owner.eventId });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/unsupported platform/i);
    });

    itDb('refuses when the caller does not manage the event', async () => {
      const res = await request(app)
        .post('/api/oauth/discord/connect')
        .set(stranger.auth)
        .send({ eventId: owner.eventId });

      expect(res.statusCode).toBe(403);
    });
  });

  // --- Step 2/3: the callback ---------------------------------------------

  describe('GET /api/oauth/:platform/callback', () => {
    itDb('sends the user back to the dashboard with a reason when state is bogus', async () => {
      const res = await request(app)
        .get('/api/oauth/discord/callback')
        .query({ code: 'x', state: 'forged' });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toContain('/dashboard/integrations');
      expect(res.headers.location).toContain('connected=none');
      expect(res.headers.location).toContain('reason=invalid_state');
    });

    itDb('sends the user back with `declined` when the provider reports access_denied', async () => {
      const res = await request(app).get('/api/oauth/discord/callback').query({ error: 'access_denied' });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toContain('reason=declined');
    });

    itDb('accepts a genuine state token and gets as far as the token exchange', async () => {
      // A real state passes validation, so the failure must come from talking
      // to Discord (bogus code) — reported as exchange_failed rather than
      // invalid_state. This proves the state survived the HTTP round trip.
      const state = await startDiscordFlow();

      const res = await request(app)
        .get('/api/oauth/discord/callback')
        .query({ code: 'bogus-authorization-code', state });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toContain('reason=exchange_failed');
      expect(res.headers.location).not.toContain('invalid_state');
    }, 30000);

    itDb('rejects a replayed state token', async () => {
      const state = await startDiscordFlow();

      const first = await request(app)
        .get('/api/oauth/discord/callback')
        .query({ code: 'bogus', state });
      expect(first.headers.location).toContain('reason=exchange_failed');

      // Second use of the same callback URL must be refused.
      const second = await request(app)
        .get('/api/oauth/discord/callback')
        .query({ code: 'bogus', state });
      expect(second.headers.location).toContain('reason=invalid_state');
    }, 30000);

    itDb('refuses to reuse a Discord state against Slack', async () => {
      const state = await startDiscordFlow();

      const res = await request(app)
        .get('/api/oauth/slack/callback')
        .query({ code: 'bogus', state });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toContain('reason=invalid_state');
    });
  });

  // --- Telegram ------------------------------------------------------------

  describe('Telegram (token-based, no OAuth)', () => {
    itDb('reports itself as configured without server-side app credentials', async () => {
      const res = await request(app).get('/api/oauth/telegram/status').set(owner.auth);
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({ platform: 'telegram', configured: true, usesOauth: false });
    });

    itDb('is not shadowed by the generic /:platform routes', async () => {
      // Regression guard: `POST /:platform/connect` used to be registered first
      // and would have rejected telegram as an "unsupported platform".
      const res = await request(app)
        .post('/api/oauth/telegram/connect')
        .set(owner.auth)
        .send({ eventId: owner.eventId, token: 'not-a-real-token' });

      // It must reach the Telegram-specific validation, not the generic
      // "Unsupported platform" branch.
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/telegram bot token/i);
      expect(res.body.error).not.toMatch(/unsupported platform/i);
    });

    itDb('rejects a malformed token before contacting Telegram', async () => {
      const res = await request(app)
        .post('/api/oauth/telegram/connect')
        .set(owner.auth)
        .send({ eventId: owner.eventId, token: 'nope' });

      expect(res.statusCode).toBe(400);
      expect(res.body.hint).toMatch(/BotFather/);
    });

    itDb('requires authentication', async () => {
      const res = await request(app)
        .post('/api/oauth/telegram/verify')
        .send({ token: '123456:AAEaaaaaaaaaaaaaaaaaaaaaa' });
      expect(res.statusCode).toBe(401);
    });
  });

  // --- Status is credential-free -------------------------------------------

  describe('GET /api/events/:eventId/integrations', () => {
    itDb('returns a per-platform map with no credential material', async () => {
      const res = await request(app).get(`/api/events/${owner.eventId}/integrations`).set(owner.auth);

      expect(res.statusCode).toBe(200);
      expect(Object.keys(res.body).sort()).toEqual(['discord', 'slack', 'telegram', 'web']);
      expect(res.body.discord).toEqual({ connected: false, running: false });

      // The old implementation returned whole Integration documents, which
      // included the bot token in `credentials`.
      const serialised = JSON.stringify(res.body);
      expect(serialised).not.toContain('credentials');
      expect(serialised).not.toContain('token');
    });

    itDb('refuses non-managers', async () => {
      const res = await request(app)
        .get(`/api/events/${owner.eventId}/integrations`)
        .set(stranger.auth);
      expect(res.statusCode).toBe(403);
    });

    itDb('404s for an event that does not exist', async () => {
      const res = await request(app)
        .get('/api/events/6abf2ce005d9d5b932d7317f/integrations')
        .set(owner.auth);
      expect(res.statusCode).toBe(404);
    });
  });

  // --- FAQ import ----------------------------------------------------------

  describe('FAQ import', () => {
    itDb('explains why Telegram cannot import instead of failing obscurely', async () => {
      const res = await request(app)
        .get(`/api/events/${owner.eventId}/integrations/telegram/import-sources`)
        .set(owner.auth);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/cannot read chat history/i);
    });

    itDb('asks the user to connect first for Discord', async () => {
      const res = await request(app)
        .get(`/api/events/${owner.eventId}/integrations/discord/import-sources`)
        .set(owner.auth);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/no discord connection/i);
    });

    itDb('refuses non-managers', async () => {
      const res = await request(app)
        .post(`/api/events/${owner.eventId}/integrations/discord/import-faqs`)
        .set(stranger.auth)
        .send({ sourceIds: ['1'] });
      expect(res.statusCode).toBe(403);
    });
  });
});

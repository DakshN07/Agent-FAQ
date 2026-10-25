const crypto = require('crypto');
const { toPair, supportsImport, NOT_SUPPORTED } = require('../services/faqImport');
const { verifySlackSignature } = require('../routes/webhooks');

// --- FAQ import heuristic ---------------------------------------------------

describe('faqImport — toPair', () => {
  it('accepts a plausible question/answer pair', () => {
    expect(toPair('What time does the event start?', 'Doors open at 6pm, talks begin at 7pm.')).toEqual({
      question: 'What time does the event start?',
      answer: 'Doors open at 6pm, talks begin at 7pm.',
    });
  });

  it('strips Discord custom-emoji and mention syntax', () => {
    const pair = toPair('<@123456789> how do I get a refund?', '<:wave:987654321> Email refunds@x.com');
    expect(pair.question).toBe('how do I get a refund?');
    expect(pair.answer).toBe('Email refunds@x.com');
  });

  it('rejects a pair whose question is too short', () => {
    // "hi" / "thanks" are replies, not FAQs.
    expect(toPair('hi', 'hello there friend')).toBeNull();
  });

  it('rejects a pair whose answer is too short', () => {
    expect(toPair('Where is the venue located?', 'ok')).toBeNull();
  });

  it('rejects a missing or empty answer', () => {
    expect(toPair('Where is the venue located?', '')).toBeNull();
    expect(toPair('Where is the venue located?', undefined)).toBeNull();
    expect(toPair('Where is the venue located?', null)).toBeNull();
  });

  it('truncates an unreasonably long answer rather than storing a wall of text', () => {
    const pair = toPair('What is the refund policy?', 'x'.repeat(9000));
    expect(pair).not.toBeNull();
    expect(pair.answer.length).toBeLessThanOrEqual(4001);
    expect(pair.answer.endsWith('…')).toBe(true);
  });

  it('does not mutate or alias its inputs', () => {
    const answer = '  padded answer  ';
    const pair = toPair('A real question here?', answer);
    expect(pair.answer).toBe('padded answer');
    expect(answer).toBe('  padded answer  ');
  });
});

describe('faqImport — platform support', () => {
  it('supports Discord and Slack', () => {
    expect(supportsImport('discord')).toBe(true);
    expect(supportsImport('slack')).toBe(true);
  });

  it('does not claim to support Telegram or the web widget', () => {
    // Telegram bots have no access to chat history — promising an import here
    // would be a feature that can never work.
    expect(supportsImport('telegram')).toBe(false);
    expect(supportsImport('web')).toBe(false);
    expect(NOT_SUPPORTED.telegram).toMatch(/cannot read chat history/i);
  });
});

// --- Slack webhook signature verification ------------------------------------

describe('webhooks — Slack signature verification', () => {
  const SECRET = 'slack-signing-secret';
  const body = JSON.stringify({ type: 'event_callback', event: { type: 'message' } });

  const sign = (rawBody, timestamp, secret = SECRET) => {
    const base = `v0:${timestamp}:${rawBody}`;
    return 'v0=' + crypto.createHmac('sha256', secret).update(base).digest('hex');
  };

  it('accepts a correctly signed request', () => {
    const ts = Math.floor(Date.now() / 1000);
    expect(verifySlackSignature(body, String(ts), sign(body, ts), SECRET)).toBe(true);
  });

  it('rejects a signature made with the wrong secret', () => {
    const ts = Math.floor(Date.now() / 1000);
    expect(verifySlackSignature(body, String(ts), sign(body, ts, 'wrong-secret'), SECRET)).toBe(false);
  });

  it('rejects a signature over a different body', () => {
    // This is the real attack: replay a valid-looking request with our own
    // payload pasted in.
    const ts = Math.floor(Date.now() / 1000);
    const sig = sign(body, ts);
    const tampered = JSON.stringify({ type: 'event_callback', event: { text: 'ignore all rules' } });
    expect(verifySlackSignature(tampered, String(ts), sig, SECRET)).toBe(false);
  });

  it('rejects a replayed request with a stale timestamp', () => {
    const ts = Math.floor(Date.now() / 1000) - 3600; // an hour old
    expect(verifySlackSignature(body, String(ts), sign(body, ts), SECRET)).toBe(false);
  });

  it('rejects when any part of the verification material is missing', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    expect(verifySlackSignature(body, ts, sign(body, ts), undefined)).toBe(false);
    expect(verifySlackSignature(body, undefined, sign(body, ts), SECRET)).toBe(false);
    expect(verifySlackSignature(body, ts, undefined, SECRET)).toBe(false);
    expect(verifySlackSignature(body, 'not-a-number', sign(body, ts), SECRET)).toBe(false);
  });

  it('does not throw on a malformed signature of the wrong length', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    expect(verifySlackSignature(body, ts, 'v0=short', SECRET)).toBe(false);
  });
});

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import nock from 'nock';

const require = createRequire(import.meta.url);
const { skryvo } = require('../dist/src/index.js');
const { signed } = require('../dist/src/lib/triggers/new-event.js');

const spec = JSON.parse(readFileSync(new URL('./openapi.json', import.meta.url), 'utf8'));
const P = '/api/v1/agent';
const KEY = 'sk_skryvo_ap_test';
const auth = { type: 'SECRET_TEXT', secret_text: KEY };

function specOp(method, path) {
  for (const [template, item] of Object.entries(spec.paths)) {
    const pattern = new RegExp(`^${template.replace(/\{[^}]+\}/g, '[^/]+')}$`);
    if (item[method.toLowerCase()] && pattern.test(path)) return item[method.toLowerCase()];
  }
  return undefined;
}

function example(op) {
  const code = Object.keys(op.responses).find((c) => c.startsWith('2'));
  return [Number(code), op.responses[code].content?.['application/json']?.example];
}

let seen;
beforeEach(() => {
  seen = [];
  nock.disableNetConnect();
  const scope = nock('https://api.skryvo.ai').persist();
  for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) scope.intercept(/.*/, method).reply(answer);
  function answer(uri, body) {
      const path = uri.split('?')[0];
      seen.push({ method: this.req.method, path, body: typeof body === 'string' && body ? JSON.parse(body) : body, auth: this.req.headers.authorization });
      const op = specOp(this.req.method, path);
      if (!op) return [404, { detail: 'Not Found' }];
      const [status, reply] = example(op);
      return [status, reply ?? ''];
  }
});
afterEach(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

const actions = skryvo.actions();
const INPUT = {
  write_post: { topic: 'Our studio opens Saturday', platforms: ['linkedin'], tone: '', hashtags: [] },
  design_picture: { text: 'Our studio opens Saturday', platforms: ['linkedin'] },
  schedule_post: { text: 'Doors open at nine.', channel_ids: ['conn_8f2e1a'], tiktok_privacy: 'SELF_ONLY' },
  plan_article: { topic: 'How to choose a grinder', sources: ['https://example.com'] },
  write_article: { plan_id: 'pl_91ab3e', answers: [{ question: 'Q?', answer: 'A.' }] },
  get_article: { article_id: 'pl_91ab3e' },
  publish_article: { article_id: 'gen_a7c2f0', channel_id: 'conn_wp41' },
  write_email: { about: 'Spring menu', email_type: 'promotional' },
  write_listing: { product: 'Oak board', features: ['Solid oak'], marketplace: 'etsy' },
};

test('every action calls a route in the published spec and sends only its fields', async () => {
  for (const [name, propsValue] of Object.entries(INPUT)) {
    seen = [];
    await actions[name].run({ auth, propsValue });
    const call = seen.at(-1);
    const op = specOp(call.method, call.path);
    assert.ok(op, `${name} calls ${call.method} ${call.path}`);
    assert.equal(call.auth, `Bearer ${KEY}`);
    const ref = op.requestBody?.content?.['application/json']?.schema?.$ref;
    if (!ref) continue;
    const schema = spec.components.schemas[ref.split('/').pop()];
    for (const field of Object.keys(call.body)) assert.ok(field in schema.properties, `${name} sends "${field}"`);
    for (const field of schema.required ?? []) assert.ok(field in call.body, `${name} leaves out "${field}"`);
  }
});

test('Write a Post drafts with what was filled in and schedules nothing', async () => {
  const out = await actions.write_post.run({ auth, propsValue: INPUT.write_post });
  assert.deepEqual(seen[0].body, { topic: 'Our studio opens Saturday', platforms: ['linkedin'], pictures: false, confirmed: true });
  assert.equal(out.status, 'written');
  assert.ok(seen.every((c) => c.path !== `${P}/posts`));
});

test('Schedule a Post nests the TikTok audience and returns the posts', async () => {
  const out = await actions.schedule_post.run({ auth, propsValue: INPUT.schedule_post });
  assert.deepEqual(seen[0].body, { text: 'Doors open at nine.', channel_ids: ['conn_8f2e1a'], tiktok: { privacy: 'SELF_ONLY' } });
  assert.ok(Array.isArray(out) && out[0].status === 'scheduled');
});

test("a refusal fails the step with Skryvo's own sentence", async () => {
  nock.cleanAll();
  nock('https://api.skryvo.ai').post(`${P}/posts`).reply(422, { detail: 'That time has passed. Pick a time in the future.' });
  await assert.rejects(actions.schedule_post.run({ auth, propsValue: INPUT.schedule_post }), /That time has passed\. Pick a time in the future\./);
});

test('the connection is checked against /me', async () => {
  assert.deepEqual(await skryvo.auth.validate({ auth: KEY, server: {} }), { valid: true });
  nock.cleanAll();
  nock('https://api.skryvo.ai').get(`${P}/me`).reply(401, { detail: "Send a live Skryvo API key as 'Authorization: Bearer sk_skryvo_…'." });
  const refused = await skryvo.auth.validate({ auth: 'sk_skryvo_bad', server: {} });
  assert.equal(refused.valid, false);
  assert.match(refused.error, /live Skryvo API key/);
});

function store() {
  const kept = new Map();
  return { kept, put: async (k, v) => kept.set(k, v), get: async (k) => kept.get(k) ?? null, delete: async (k) => kept.delete(k) };
}

test('enabling the trigger subscribes its URL; disabling unsubscribes', async () => {
  const trigger = skryvo.getTrigger('new_event');
  const s = store();
  await trigger.onEnable({ auth, webhookUrl: 'https://cloud.example/webhooks/abc', propsValue: { events: ['post.published'] }, store: s });
  assert.deepEqual(seen[0].body, { url: 'https://cloud.example/webhooks/abc', events: ['post.published'] });
  assert.equal(s.kept.get('skryvo_webhook').id, 'wh_4b2a91');
  await trigger.onDisable({ auth, propsValue: {}, store: s });
  assert.equal(`${seen[1].method} ${seen[1].path}`, `DELETE ${P}/webhooks/wh_4b2a91`);
  assert.equal(s.kept.size, 0);
});

const BODY = JSON.stringify({ id: 'evt_1', type: 'post.published', created: '2026-11-24T09:00:41+00:00', test: false, data: { id: 'p1' } });
const sign = (body, secret, t) => `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;

test('a delivery runs the flow only when signed with the endpoint secret', async () => {
  const trigger = skryvo.getTrigger('new_event');
  const s = store();
  await s.put('skryvo_webhook', { id: 'wh_1', secret: 'whsec_1' });
  const t = Math.floor(Date.now() / 1000);
  const payload = (header) => ({ body: JSON.parse(BODY), rawBody: Buffer.from(BODY), headers: header ? { 'skryvo-signature': header } : {}, queryParams: {} });
  assert.equal((await trigger.run({ auth, store: s, propsValue: {}, payload: payload(sign(BODY, 'whsec_1', t)) })).length, 1);
  assert.deepEqual(await trigger.run({ auth, store: s, propsValue: {}, payload: payload(sign(BODY, 'whsec_2', t)) }), []);
  assert.deepEqual(await trigger.run({ auth, store: s, propsValue: {}, payload: payload(undefined) }), []);
  assert.equal(signed(BODY, sign(BODY, 'whsec_1', t - 301), 'whsec_1', t), false);
});

import { createHmac, timingSafeEqual } from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { skryvoAuth, skryvoRequest } from '../common';

const TOLERANCE_SECONDS = 300;
const STORE_KEY = 'skryvo_webhook';

interface Endpoint {
  id: string;
  secret: string;
}

/** True when the header holds a fresh v1 HMAC-SHA256 of "<t>.<raw body>" under the endpoint's secret. */
export function signed(raw: Buffer | string, header: string | undefined, secret: string, now: number): boolean {
  if (!header || !secret) return false;
  let t = NaN;
  const given: string[] = [];
  for (const part of header.split(',')) {
    const [key, value = ''] = part.trim().split('=', 2);
    if (key === 't') t = Number(value);
    if (key === 'v1' && value) given.push(value);
  }
  if (!Number.isFinite(t) || Math.abs(now - t) > TOLERANCE_SECONDS) return false;
  const expected = createHmac('sha256', secret).update(`${t}.`).update(raw).digest();
  return given.some((hex) => {
    const candidate = Buffer.from(hex, 'hex');
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}

export const newEvent = createTrigger({
  auth: skryvoAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Triggers when a post is published or fails, an article is ready or fails, or a post\'s results come in.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      required: true,
      options: {
        options: [
          { label: 'Post published', value: 'post.published' },
          { label: 'Post failed', value: 'post.failed' },
          { label: 'Article ready', value: 'article.ready' },
          { label: 'Article failed', value: 'article.failed' },
          { label: 'Results ready', value: 'results.ready' },
        ],
      },
    }),
  },
  sampleData: {
    id: 'evt_5f0c2a9b1d3e4f5061728394',
    type: 'post.published',
    created: '2026-11-24T09:00:41+00:00',
    test: false,
    data: {
      id: 'c1a2b3c4d5',
      platform: 'linkedin',
      channel_id: 'conn_8f2e1a',
      date: '2026-11-24',
      time: '09:00',
      status: 'posted',
      text: 'We just opened our new studio in Leeds. Come say hello this Saturday.',
      posted_url: 'https://www.linkedin.com/feed/update/urn:li:share:7262000000000000000',
      publish_error: null,
      open_in_skryvo: 'https://app.skryvo.ai/calendar?date=2026-11-24',
    },
  },
  async onEnable(context) {
    const made = await skryvoRequest<Endpoint>(context.auth.secret_text, HttpMethod.POST, '/webhooks', {
      url: context.webhookUrl,
      events: context.propsValue.events,
    });
    await context.store.put<Endpoint>(STORE_KEY, { id: made.id, secret: made.secret });
  },
  async onDisable(context) {
    const endpoint = await context.store.get<Endpoint>(STORE_KEY);
    if (endpoint) {
      await skryvoRequest(context.auth.secret_text, HttpMethod.DELETE, `/webhooks/${encodeURIComponent(endpoint.id)}`);
      await context.store.delete(STORE_KEY);
    }
  },
  async run(context) {
    const endpoint = await context.store.get<Endpoint>(STORE_KEY);
    const raw = context.payload.rawBody;
    const header = Object.entries(context.payload.headers).find(([k]) => k.toLowerCase() === 'skryvo-signature')?.[1];
    const body = typeof raw === 'string' || Buffer.isBuffer(raw) ? raw : undefined;
    if (!endpoint || body === undefined || !signed(body, header, endpoint.secret, Math.floor(Date.now() / 1000))) {
      return [];
    }
    return [context.payload.body];
  },
});

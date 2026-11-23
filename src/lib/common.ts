import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://api.skryvo.ai/api/v1/agent';

export const skryvoAuth = PieceAuth.SecretText({
  displayName: 'API key',
  description:
    'Create a key in Skryvo under Settings › API & agents (https://app.skryvo.ai/settings/agents). It starts with sk_skryvo_ and is shown once.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await skryvoRequest(auth, HttpMethod.GET, '/me');
      return { valid: true };
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  },
});

type Query = Record<string, string | number | undefined>;

/** Drops what the person left empty, so Skryvo applies the brand's own defaults. */
export function given<T extends Record<string, unknown>>(fields: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(fields).filter(
      ([, value]) =>
        value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0),
    ),
  ) as Partial<T>;
}

function said(error: HttpError): string {
  const { status, body } = error.response;
  const answer = (body ?? {}) as { detail?: unknown; details?: { field: string; message: string }[]; message?: string };
  if (typeof answer.detail === 'string') return answer.detail;
  if (Array.isArray(answer.details)) {
    return `Check the request: ${answer.details.map((d) => `${d.field}: ${d.message}`).join('; ')}.`;
  }
  return answer.message ?? `Skryvo answered ${status}.`;
}

/** One agent API call with the key; a refusal throws with Skryvo's own sentence. */
export async function skryvoRequest<T>(
  key: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  query?: Query,
): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      body,
      queryParams: query
        ? Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
        : undefined,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: key },
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) throw new Error(said(error));
    throw error;
  }
}

type Listed = { id: string; name: string | null; platform: string; kind: string; needs_reconnect: boolean };

const choose = (placeholder: string) => ({ disabled: true, options: [], placeholder });

export const brandProp = Property.Dropdown({
  auth: skryvoAuth,
  displayName: 'Brand',
  description: "The brand to write as. Left empty, the account's default brand.",
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) return choose('Connect Skryvo first');
    const { brands } = await skryvoRequest<{ brands: { id: string; name: string }[] }>(
      auth.secret_text,
      HttpMethod.GET,
      '/brands',
    );
    return { disabled: false, options: brands.map((b) => ({ label: b.name, value: b.id })) };
  },
});

async function channels(key: string, kind: 'social' | 'blog') {
  const { channels } = await skryvoRequest<{ channels: Listed[] }>(key, HttpMethod.GET, '/channels');
  return channels
    .filter((c) => c.kind === kind && !c.needs_reconnect)
    .map((c) => ({ label: `${c.name ?? c.platform} (${c.platform})`, value: c.id }));
}

export const channelsProp = Property.MultiSelectDropdown({
  auth: skryvoAuth,
  displayName: 'Channels',
  description: 'Connected social channels to post to.',
  required: true,
  refreshers: [],
  options: async ({ auth }) =>
    auth ? { disabled: false, options: await channels(auth.secret_text, 'social') } : choose('Connect Skryvo first'),
});

export const blogProp = Property.Dropdown({
  auth: skryvoAuth,
  displayName: 'Blog',
  description: 'A connected blog.',
  required: true,
  refreshers: [],
  options: async ({ auth }) =>
    auth ? { disabled: false, options: await channels(auth.secret_text, 'blog') } : choose('Connect Skryvo first'),
});

export const platformsProp = (displayName: string, description: string) =>
  Property.MultiSelectDropdown({
    auth: skryvoAuth,
    displayName,
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return choose('Connect Skryvo first');
      const { platforms } = await skryvoRequest<{ platforms: Listed[] }>(auth.secret_text, HttpMethod.GET, '/platforms');
      return {
        disabled: false,
        options: platforms.filter((p) => p.kind === 'social').map((p) => ({ label: p.name ?? p.platform, value: p.platform })),
      };
    },
  });

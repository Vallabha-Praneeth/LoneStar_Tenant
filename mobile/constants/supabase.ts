import type {
  ResolveLoginContextRequest,
  ResolveLoginContextResponse,
  TenantBootstrapRequest,
  TenantBootstrapResponse,
} from '../../shared/tenant-types';

interface PasswordSignInResponse {
  access_token: string;
  refresh_token: string;
}

interface ErrorResponse {
  error?: string;
  msg?: string;
  message?: string;
  error_description?: string;
}

export interface CampaignPhotoRecord {
  id: string;
  organization_id: string;
  campaign_id: string;
  uploaded_by: string;
  storage_path: string;
  note: string | null;
  submitted_at: string;
  captured_at: string | null;
  is_hidden: boolean;
}

export interface CreateCampaignProofUploadInput {
  accessToken: string;
  organizationId: string;
  campaignId: string;
  uploadedBy: string;
  photoUri: string;
  location: string;
  notes?: string;
  mimeType?: string | null;
  fileName?: string | null;
  capturedAt?: string | null;
}

const env = (
  globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }
).process?.env ?? {};

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const CAMPAIGN_PROOFS_BUCKET = 'campaign-proofs';
export const MAX_PROOF_UPLOAD_BYTES = 15 * 1024 * 1024;

function requireConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase mobile config is missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
}

async function readErrorMessage(response: Response, fallback: string) {
  const raw = await response.text();
  if (!raw) {
    return fallback;
  }

  try {
    const body = JSON.parse(raw) as ErrorResponse;
    return body.error_description ?? body.error ?? body.message ?? body.msg ?? fallback;
  } catch {
    return raw || fallback;
  }
}

function encodeStoragePath(path: string) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function createObjectUrl(
  bucket: string,
  storagePath: string,
  kind: 'object' | 'object/authenticated' = 'object/authenticated',
) {
  requireConfig();
  return `${SUPABASE_URL}/storage/v1/${kind}/${bucket}/${encodeStoragePath(storagePath)}`;
}

function buildProofNote(location: string, notes?: string) {
  const trimmedLocation = location.trim();
  const trimmedNotes = notes?.trim() ?? '';
  return trimmedNotes ? `${trimmedLocation} | ${trimmedNotes}` : trimmedLocation;
}

function createPhotoId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).slice(2, 14).padEnd(12, '0');
  return `${timestamp.slice(0, 8)}-${timestamp.slice(8, 12).padEnd(4, '0')}-4${random.slice(0, 3)}-a${random.slice(3, 6)}-${random.slice(6, 18).padEnd(12, '0')}`;
}

function sanitizeExtension(extension: string | null | undefined) {
  if (!extension) {
    return null;
  }

  const normalized = extension.toLowerCase().replace(/^\./, '');
  if (!normalized || !/^[a-z0-9]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function deriveProofExtension(fileName?: string | null, mimeType?: string | null, photoUri?: string) {
  const fromFileName = sanitizeExtension(fileName?.split('.').pop());
  if (fromFileName) {
    return fromFileName;
  }

  const byMimeType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };

  if (mimeType && mimeType in byMimeType) {
    return byMimeType[mimeType];
  }

  const fromUri = sanitizeExtension(photoUri?.split('?')[0]?.split('.').pop());
  return fromUri ?? 'jpg';
}

async function deleteStorageObject(accessToken: string, bucket: string, storagePath: string) {
  const response = await fetch(createObjectUrl(bucket, storagePath, 'object'), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to remove failed proof upload.'));
  }
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  fallbackError: string,
): Promise<T> {
  requireConfig();
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallbackError));
  }

  return (await response.json()) as T;
}

export async function fetchSupabaseRows<T>(
  table: string,
  params: Record<string, string>,
  accessToken: string,
): Promise<T[]> {
  const query = new URLSearchParams(params).toString();
  return requestJson<T[]>(
    `/rest/v1/${table}?${query}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    `Unable to load ${table} rows.`,
  );
}

export function getCampaignProofImageSource(accessToken: string, storagePath: string) {
  return {
    uri: createObjectUrl(CAMPAIGN_PROOFS_BUCKET, storagePath, 'object/authenticated'),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  };
}

export async function resolveLoginContext(
  request: ResolveLoginContextRequest,
): Promise<ResolveLoginContextResponse> {
  return requestJson<ResolveLoginContextResponse>(
    '/functions/v1/resolve-login-context',
    {
      method: 'POST',
      body: JSON.stringify({
        org_slug: request.orgSlug,
        login_identifier: request.loginIdentifier,
      }),
    },
    'Organization or login could not be resolved.',
  );
}

export async function signInWithPassword(email: string, password: string) {
  return requestJson<PasswordSignInResponse>(
    '/auth/v1/token?grant_type=password',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    'Unable to sign in with the provided credentials.',
  );
}

export async function bootstrapTenantSession(
  accessToken: string,
  request: TenantBootstrapRequest,
): Promise<TenantBootstrapResponse> {
  return requestJson<TenantBootstrapResponse>(
    '/functions/v1/bootstrap-tenant-session',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        expected_org_slug: request.expectedOrgSlug,
      }),
    },
    'Tenant session bootstrap could not be resolved.',
  );
}

export async function createCampaignProofUpload(
  input: CreateCampaignProofUploadInput,
): Promise<CampaignPhotoRecord> {
  requireConfig();

  const photoId = createPhotoId();
  const extension = deriveProofExtension(input.fileName, input.mimeType, input.photoUri);
  const storagePath = `${input.organizationId}/campaigns/${input.campaignId}/proofs/${photoId}.${extension}`;
  const sourceResponse = await fetch(input.photoUri);

  if (!sourceResponse.ok) {
    throw new Error('Unable to read the selected photo.');
  }

  const payload = await sourceResponse.blob();
  if (payload.size > MAX_PROOF_UPLOAD_BYTES) {
    throw new Error('Selected photo is too large. Keep uploads under 15 MB.');
  }

  const contentType = input.mimeType || payload.type || 'image/jpeg';
  const uploadResponse = await fetch(createObjectUrl(CAMPAIGN_PROOFS_BUCKET, storagePath, 'object'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': contentType,
      'x-upsert': 'false',
    },
    body: payload,
  });

  if (!uploadResponse.ok) {
    throw new Error(await readErrorMessage(uploadResponse, 'Unable to upload the proof photo.'));
  }

  try {
    const inserted = await requestJson<CampaignPhotoRecord[]>(
      '/rest/v1/campaign_photos?select=id,organization_id,campaign_id,uploaded_by,storage_path,note,submitted_at,captured_at,is_hidden',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify([
          {
            id: photoId,
            organization_id: input.organizationId,
            campaign_id: input.campaignId,
            uploaded_by: input.uploadedBy,
            storage_path: storagePath,
            note: buildProofNote(input.location, input.notes),
            captured_at: input.capturedAt ?? null,
            is_hidden: false,
          },
        ]),
      },
      'Unable to record the uploaded proof.',
    );

    if (!inserted[0]) {
      throw new Error('Proof upload completed, but no campaign photo row was returned.');
    }

    return inserted[0];
  } catch (error) {
    try {
      await deleteStorageObject(input.accessToken, CAMPAIGN_PROOFS_BUCKET, storagePath);
    } catch {
      // Keep the original insert failure as the surfaced error. Orphan cleanup can be retried later.
    }

    throw error;
  }
}

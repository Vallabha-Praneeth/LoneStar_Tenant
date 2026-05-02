import type {
  ResolveLoginContextRequest,
  ResolveLoginContextResponse,
  TenantBootstrapRequest,
  TenantBootstrapResponse,
} from '../../shared/tenant-types';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

interface PasswordSignInResponse {
  access_token: string;
  refresh_token: string;
}

export interface RefreshSessionResponse {
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

export interface OrganizationBrandingRecord {
  id: string;
  organization_id: string;
  logo_url: string | null;
  primary_color: string;
}

export interface SuperAdminInviteRecord {
  id: string;
  code: string;
  note: string | null;
  status: 'active' | 'used' | 'expired';
  expires_at: string;
  used_at: string | null;
  used_by_org_id: string | null;
  used_by_org_name: string | null;
  created_at: string;
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

export interface CreateClientEntityInput {
  accessToken: string;
  organizationId: string;
  name: string;
  phoneNumber?: string | null;
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const SUPABASE_REST_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''}/rest/v1`;
export const SUPABASE_ANON_KEY_VALUE = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const CAMPAIGN_PROOFS_BUCKET = 'campaign-proofs';
export const BRANDING_LOGOS_BUCKET = 'branding-logos';
export const MAX_PROOF_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_BRANDING_LOGO_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Fail-fast if storage read/upload/insert hangs (e.g. Android content:// + fetch().blob()). */
const PROOF_UPLOAD_OPERATION_TIMEOUT_MS = 45_000;

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

function proofUploadTimedOutError() {
  return new Error('Proof upload timed out. Please try again.');
}

function withProofUploadTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      console.warn('[proof-upload] operation exceeded timeout (ms)', PROOF_UPLOAD_OPERATION_TIMEOUT_MS);
      reject(proofUploadTimedOutError());
    }, PROOF_UPLOAD_OPERATION_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function parseStorageUploadFailureBody(status: number, body: string, fallback: string) {
  const trimmed = body.trim();
  if (trimmed.length > 0 && trimmed.length < 800) {
    try {
      const parsed = JSON.parse(trimmed) as ErrorResponse;
      const msg = parsed.error_description ?? parsed.error ?? parsed.message ?? parsed.msg;
      if (msg) {
        return msg;
      }
    } catch {
      return trimmed;
    }
  }
  return `${fallback} (HTTP ${status})`;
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

function deriveBrandingLogoExtension(fileName?: string | null, mimeType?: string | null, logoUri?: string) {
  return deriveProofExtension(fileName, mimeType, logoUri);
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

export function getBrandingLogoImageSource(accessToken: string, storagePath: string) {
  return {
    uri: createObjectUrl(BRANDING_LOGOS_BUCKET, storagePath, 'object/authenticated'),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  };
}

/**
 * @deprecated No longer used in the login flow.
 * Login now goes: signInWithPassword → bootstrapTenantSession.
 * Kept for reference only until SSO/magic-link needs are decided.
 */
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

export async function refreshSession(refreshToken: string): Promise<RefreshSessionResponse> {
  return requestJson<RefreshSessionResponse>(
    '/auth/v1/token?grant_type=refresh_token',
    {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
    'Unable to refresh session.',
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

export async function createOrganization(input: {
  orgName: string;
  adminName: string;
  email: string;
  password: string;
  inviteCode: string;
}): Promise<void> {
  requireConfig();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-organization`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Could not create organization.'));
  }
}

export async function createClientEntity(input: CreateClientEntityInput): Promise<void> {
  requireConfig();
  const response = await fetch(`${SUPABASE_REST_URL}/clients`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      apikey: SUPABASE_ANON_KEY_VALUE,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      organization_id: input.organizationId,
      name: input.name.trim(),
      phone_number: input.phoneNumber?.trim() || null,
      is_active: true,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Could not create client entity.'));
  }
}

interface ListInviteCodesResponse {
  invites: SuperAdminInviteRecord[];
}

interface InviteMutationResponse {
  invite: Pick<SuperAdminInviteRecord, 'id' | 'code' | 'expires_at' | 'used_at'>;
}

export async function listInviteCodes(accessToken: string): Promise<SuperAdminInviteRecord[]> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/list-invite-codes`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Could not list invite codes.'));
  }

  const body = (await response.json()) as ListInviteCodesResponse;
  return body.invites ?? [];
}

export async function sendInviteCode(input: {
  accessToken: string;
  note?: string;
  expiresInDays?: number;
}): Promise<Pick<SuperAdminInviteRecord, 'id' | 'code' | 'expires_at' | 'used_at'>> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-invite-code`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      note: input.note ?? null,
      expires_in_days: input.expiresInDays,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Could not send invite code.'));
  }

  const body = (await response.json()) as InviteMutationResponse;
  return body.invite;
}

export async function resendInviteCode(input: {
  accessToken: string;
  inviteId: string;
}): Promise<Pick<SuperAdminInviteRecord, 'id' | 'code' | 'expires_at' | 'used_at'>> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/resend-invite-code`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invite_id: input.inviteId,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Could not resend invite code.'));
  }

  const body = (await response.json()) as InviteMutationResponse;
  return body.invite;
}

export interface CreateTenantUserInput {
  accessToken: string;
  organizationId: string;
  role: 'driver' | 'client';
  username: string;
  displayName: string;
  password: string;
  email?: string;
  clientId?: string;
}

export interface UpdateOrganizationBrandingInput {
  accessToken: string;
  organizationId: string;
  logoUrl?: string | null;
  primaryColor?: string;
}

export interface UploadOrganizationBrandingLogoInput {
  accessToken: string;
  organizationId: string;
  logoUri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export async function createTenantUser(input: CreateTenantUserInput): Promise<void> {
  requireConfig();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-tenant-user`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organization_id: input.organizationId,
      role: input.role,
      username: input.username,
      display_name: input.displayName,
      password: input.password,
      email: input.email,
      client_id: input.clientId,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Could not create user.'));
  }
}

export async function updateOrganizationBranding(
  input: UpdateOrganizationBrandingInput,
): Promise<OrganizationBrandingRecord> {
  requireConfig();

  if (input.logoUrl === undefined && input.primaryColor === undefined) {
    throw new Error('No branding updates were provided.');
  }

  const payload: Record<string, string | null> = {};
  if (input.logoUrl !== undefined) {
    payload.logo_url = input.logoUrl;
  }
  if (input.primaryColor !== undefined) {
    payload.primary_color = input.primaryColor;
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/organization_branding?organization_id=eq.${input.organizationId}&select=id,organization_id,logo_url,primary_color`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to update branding settings.'));
  }

  const rows = (await response.json()) as OrganizationBrandingRecord[];
  if (!rows[0]) {
    throw new Error('Branding update succeeded but no row was returned.');
  }
  return rows[0];
}

export async function uploadOrganizationBrandingLogo(
  input: UploadOrganizationBrandingLogoInput,
): Promise<OrganizationBrandingRecord> {
  requireConfig();

  const sourceResponse = await fetch(input.logoUri);
  if (!sourceResponse.ok) {
    throw new Error('Unable to read the selected logo image.');
  }

  const payload = await sourceResponse.blob();
  if (payload.size > MAX_BRANDING_LOGO_UPLOAD_BYTES) {
    throw new Error('Selected logo is too large. Keep uploads under 5 MB.');
  }

  const extension = deriveBrandingLogoExtension(input.fileName, input.mimeType, input.logoUri);
  const storagePath = `${input.organizationId}/branding/logo-${createPhotoId()}.${extension}`;
  const contentType = input.mimeType || payload.type || 'image/jpeg';

  const uploadResponse = await fetch(createObjectUrl(BRANDING_LOGOS_BUCKET, storagePath, 'object'), {
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
    throw new Error(await readErrorMessage(uploadResponse, 'Unable to upload logo image.'));
  }

  let updateDefinitelyFailed = false;
  try {
    return await updateOrganizationBranding({
      accessToken: input.accessToken,
      organizationId: input.organizationId,
      logoUrl: storagePath,
    });
  } catch (error) {
    updateDefinitelyFailed = true;
    throw error;
  } finally {
    if (updateDefinitelyFailed) {
      try {
        await deleteStorageObject(input.accessToken, BRANDING_LOGOS_BUCKET, storagePath);
      } catch {
        // Ignore cleanup errors; orphan cleanup can be retried separately.
      }
    }
  }
}

async function loadProofBlobForWeb(photoUri: string, mimeType: string | null | undefined) {
  const sourceResponse = await fetch(photoUri);
  if (!sourceResponse.ok) {
    throw new Error('Unable to read the selected photo.');
  }

  const payload = await sourceResponse.blob();
  if (payload.size > MAX_PROOF_UPLOAD_BYTES) {
    throw new Error('Selected photo is too large. Keep uploads under 15 MB.');
  }

  const contentType = mimeType || payload.type || 'image/jpeg';
  return { blob: payload, contentType };
}

async function uploadProofBytesViaFetch(
  uploadUrl: string,
  accessToken: string,
  payload: Blob,
  contentType: string,
) {
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': contentType,
      'x-upsert': 'false',
    },
    body: payload,
  });

  if (!uploadResponse.ok) {
    throw new Error(await readErrorMessage(uploadResponse, 'Unable to upload the proof photo.'));
  }
}

async function uploadProofFileNative(uploadUrl: string, fileUri: string, contentType: string, accessToken: string) {
  const result = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': contentType,
      'x-upsert': 'false',
    },
  });

  if (result.status < 200 || result.status >= 300) {
    console.warn('[proof-upload] storage upload rejected', { status: result.status });
    throw new Error(parseStorageUploadFailureBody(result.status, result.body, 'Unable to upload the proof photo.'));
  }
}

async function runCampaignProofUpload(input: CreateCampaignProofUploadInput): Promise<CampaignPhotoRecord> {
  requireConfig();

  const photoId = createPhotoId();
  const extension = deriveProofExtension(input.fileName, input.mimeType, input.photoUri);
  const storagePath = `${input.organizationId}/campaigns/${input.campaignId}/proofs/${photoId}.${extension}`;
  const uploadUrl = createObjectUrl(CAMPAIGN_PROOFS_BUCKET, storagePath, 'object');

  let stagedCacheUri: string | null = null;
  let uploadSourceUri = input.photoUri;

  if (Platform.OS !== 'web' && FileSystem.cacheDirectory && input.photoUri.startsWith('content://')) {
    try {
      stagedCacheUri = `${FileSystem.cacheDirectory}proof-upload-${photoId}.${extension}`;
      await FileSystem.copyAsync({ from: input.photoUri, to: stagedCacheUri });
      uploadSourceUri = stagedCacheUri;
    } catch {
      console.warn('[proof-upload] could not stage content URI to cache; uploading original picker URI');
    }
  }

  try {
    if (Platform.OS === 'web') {
      const { blob, contentType } = await loadProofBlobForWeb(input.photoUri, input.mimeType);
      await uploadProofBytesViaFetch(uploadUrl, input.accessToken, blob, contentType);
    } else {
      const contentType = input.mimeType || 'image/jpeg';
      try {
        const info = await FileSystem.getInfoAsync(uploadSourceUri);
        if (info.exists && info.size > MAX_PROOF_UPLOAD_BYTES) {
          throw new Error('Selected photo is too large. Keep uploads under 15 MB.');
        }
      } catch (statError) {
        if (statError instanceof Error && statError.message.includes('too large')) {
          throw statError;
        }
        console.warn('[proof-upload] could not read file metadata for size check');
      }

      await uploadProofFileNative(uploadUrl, uploadSourceUri, contentType, input.accessToken);
    }

    // Track whether the DB insert was definitively rejected (non-2xx) so we only
    // clean up the uploaded storage object when we know the row was never created.
    // An ambiguous failure (e.g., network drop while reading a 2xx response) leaves
    // the storage object in place to avoid orphaning a committed row.
    let insertDefinitelyFailed = false;

    try {
      requireConfig();
      const insertResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/campaign_photos?select=id,organization_id,campaign_id,uploaded_by,storage_path,note,submitted_at,captured_at,is_hidden`,
        {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
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
      );

      if (!insertResponse.ok) {
        insertDefinitelyFailed = true;
        throw new Error(await readErrorMessage(insertResponse, 'Unable to record the uploaded proof.'));
      }

      const inserted = (await insertResponse.json()) as CampaignPhotoRecord[];

      if (!inserted[0]) {
        throw new Error('Proof upload completed, but no campaign photo row was returned.');
      }

      return inserted[0];
    } catch (error) {
      if (insertDefinitelyFailed) {
        try {
          await deleteStorageObject(input.accessToken, CAMPAIGN_PROOFS_BUCKET, storagePath);
        } catch {
          // Ignore cleanup errors; orphan cleanup can be retried separately.
        }
      }

      throw error;
    }
  } finally {
    if (stagedCacheUri) {
      try {
        await FileSystem.deleteAsync(stagedCacheUri, { idempotent: true });
      } catch {
        // Best-effort cleanup of staged copy.
      }
    }
  }
}

export async function createCampaignProofUpload(
  input: CreateCampaignProofUploadInput,
): Promise<CampaignPhotoRecord> {
  requireConfig();

  try {
    return await withProofUploadTimeout(runCampaignProofUpload(input));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[proof-upload]', message);
    throw error;
  }
}

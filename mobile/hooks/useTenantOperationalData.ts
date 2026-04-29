import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  clearTenantOperationalDataCache,
  loadTenantOperationalData,
  scopeTenantOperationalData,
  type ScopedTenantOperationalData,
  type TenantOperationalData,
} from '../constants/tenant-operational-data';

const EMPTY_DATA: TenantOperationalData = {
  campaigns: [],
  proofs: [],
  routes: [],
  shifts: [],
  drivers: [],
  clients: [],
  costTypes: [],
  campaignCosts: [],
};

export function useTenantOperationalData() {
  const { accessToken, bootstrap, user } = useAuth();
  const [data, setData] = React.useState<TenantOperationalData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const organizationId = bootstrap?.organization.id ?? null;
  const clientId = bootstrap?.profile.clientId ?? null;

  const load = React.useCallback(
    async (forceRefresh = false) => {
      if (!accessToken || !organizationId) {
        setData(EMPTY_DATA);
        setError(null);
        setIsLoading(false);
        return;
      }

      if (forceRefresh) {
        clearTenantOperationalDataCache();
      }

      setIsLoading(true);
      try {
        const next = await loadTenantOperationalData(accessToken, organizationId);
        setData(next);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load operational data.');
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, organizationId],
  );

  React.useEffect(() => {
    let active = true;

    if (!accessToken || !organizationId) {
      setData(EMPTY_DATA);
      setError(null);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    loadTenantOperationalData(accessToken, organizationId)
      .then((next) => {
        if (active) {
          setData(next);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load operational data.');
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, organizationId]);

  const scoped = React.useMemo<ScopedTenantOperationalData>(
    () => scopeTenantOperationalData(data, user, clientId),
    [clientId, data, user],
  );

  return {
    ...scoped,
    isLoading,
    error,
    refetch: () => void load(true),
  };
}

import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import colors from '../../constants/colors';
import {
  SUPABASE_ANON_KEY_VALUE,
  SUPABASE_REST_URL,
  fetchSupabaseRows,
} from '../../constants/supabase';
import { clearTenantOperationalDataCache } from '../../constants/tenant-operational-data';
import type { TenantTheme } from '../../constants/tenants';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

type StopDraft = { key: string; venueName: string; address: string };

interface RouteEditRow {
  id: string;
  name: string;
  city: string | null;
  is_active: boolean;
}

interface RouteStopRow {
  id: string;
  stop_order: number;
  venue_name: string;
  address: string | null;
}

interface RouteInsertResponse {
  id: string;
}

function newKey() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createStyles(theme: TenantTheme, radius: number) {
  return StyleSheet.create({
    root: { flex: 1 },
    keyboardWrap: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
    loadingWrap: { alignItems: 'center', gap: 10, paddingVertical: 24 },
    card: { gap: 12 },
    fieldGroup: { gap: 6 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    inputWrap: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    input: { fontSize: 15, fontFamily: 'Inter_400Regular', color: theme.foreground },
    stopRow: { gap: 10, paddingVertical: 6 },
    stopHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stopActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconButton: { paddingHorizontal: 4, paddingVertical: 2 },
    addStopButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
    errorText: { textAlign: 'left' },
    saveSection: { gap: 10 },
    dangerSection: { gap: 8 },
  });
}

export default function RouteFormScreen() {
  const { routeId } = useLocalSearchParams<{ routeId?: string }>();
  const isEdit = Boolean(routeId);
  const { accessToken, bootstrap } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const theme = tenant?.theme ?? colors.light;
  const radius = tenant?.radius ?? 8;
  const styles = React.useMemo(() => createStyles(theme, radius), [theme, radius]);

  const [name, setName] = React.useState('');
  const [city, setCity] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);
  const [stops, setStops] = React.useState<StopDraft[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const orgId = bootstrap?.organization?.id;
  const resolvedRouteId = typeof routeId === 'string' ? routeId : undefined;
  const keyboardBehavior: 'padding' | undefined = Platform.OS === 'ios' ? 'padding' : undefined;
  const bottomPadding = insets.bottom + 84;
  const scrollContentStyle = React.useMemo(
    () => [styles.content, { paddingBottom: bottomPadding }],
    [bottomPadding, styles.content],
  );

  const addStop = React.useCallback(() => {
    setStops((prev) => [...prev, { key: newKey(), venueName: '', address: '' }]);
  }, []);

  const removeStop = React.useCallback((i: number) => {
    setStops((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const updateStop = React.useCallback((i: number, field: 'venueName' | 'address', val: string) => {
    setStops((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  }, []);

  const moveStop = React.useCallback((i: number, dir: 'up' | 'down') => {
    setStops((prev) => {
      const arr = [...prev];
      const t = dir === 'up' ? i - 1 : i + 1;
      if (t < 0 || t >= arr.length) return prev;
      [arr[i], arr[t]] = [arr[t], arr[i]];
      return arr;
    });
  }, []);

  async function readErrorMessage(response: Response, fallback: string) {
    const raw = await response.text();
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw) as { error?: string; message?: string; msg?: string };
      return parsed.error ?? parsed.message ?? parsed.msg ?? fallback;
    } catch {
      return raw;
    }
  }

  React.useEffect(() => {
    if (!isEdit || !resolvedRouteId) {
      return;
    }
    if (!accessToken || !orgId) {
      setLoadError('Missing auth context. Please sign in again.');
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError(null);

    Promise.all([
      fetchSupabaseRows<RouteEditRow>('routes', {
        select: 'id,name,city,is_active',
        id: `eq.${resolvedRouteId}`,
        organization_id: `eq.${orgId}`,
      }, accessToken),
      fetchSupabaseRows<RouteStopRow>('route_stops', {
        select: 'id,stop_order,venue_name,address',
        route_id: `eq.${resolvedRouteId}`,
        organization_id: `eq.${orgId}`,
        order: 'stop_order.asc',
      }, accessToken),
    ])
      .then(([routes, routeStops]) => {
        if (!active) return;
        const row = routes[0];
        if (!row) {
          setLoadError('Route not found.');
          return;
        }
        setName(row.name);
        setCity(row.city ?? '');
        setIsActive(row.is_active);
        setStops(routeStops.map((stop) => ({
          key: stop.id,
          venueName: stop.venue_name,
          address: stop.address ?? '',
        })));
      })
      .catch((err) => {
        if (active) {
          setLoadError(err instanceof Error ? err.message : 'Unable to load route details.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, isEdit, orgId, resolvedRouteId]);

  async function handleSave() {
    if (!accessToken || !orgId) {
      setSaveError('Missing auth context. Please sign in again.');
      return;
    }
    if (!name.trim()) {
      setSaveError('Route name is required.');
      return;
    }
    if (stops.some((stop) => !stop.venueName.trim())) {
      setSaveError('Each stop must include a venue name.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      let finalRouteId = resolvedRouteId;
      if (!isEdit) {
        const createResponse = await fetch(`${SUPABASE_REST_URL}/routes?select=id`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: SUPABASE_ANON_KEY_VALUE,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            organization_id: orgId,
            name: name.trim(),
            city: city.trim() || null,
            is_active: isActive,
          }),
        });

        if (!createResponse.ok) {
          throw new Error(await readErrorMessage(createResponse, 'Could not create route.'));
        }

        const created = (await createResponse.json()) as RouteInsertResponse[];
        finalRouteId = created[0]?.id;
      } else if (finalRouteId) {
        const updateResponse = await fetch(
          `${SUPABASE_REST_URL}/routes?id=eq.${finalRouteId}&organization_id=eq.${orgId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              apikey: SUPABASE_ANON_KEY_VALUE,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              name: name.trim(),
              city: city.trim() || null,
              is_active: isActive,
            }),
          },
        );

        if (!updateResponse.ok) {
          throw new Error(await readErrorMessage(updateResponse, 'Could not update route.'));
        }
      }

      if (!finalRouteId) {
        throw new Error('Unable to resolve route id.');
      }

      const stopPayload = stops.map((stop) => ({
        venue_name: stop.venueName.trim(),
        address: stop.address.trim() || null,
      }));

      const replaceStopsResponse = await fetch(`${SUPABASE_REST_URL}/rpc/replace_route_stops`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY_VALUE,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_route_id: finalRouteId,
          p_stops: stopPayload,
        }),
      });

      if (!replaceStopsResponse.ok) {
        throw new Error(await readErrorMessage(replaceStopsResponse, 'Could not save route stops.'));
      }

      clearTenantOperationalDataCache();
      router.back();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save route.');
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteRoute() {
    if (!accessToken || !orgId || !resolvedRouteId) {
      setSaveError('Route id is missing.');
      return;
    }

    Alert.alert('Delete route?', 'This will delete the route and all its stops.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true);
            setSaveError(null);
            try {
              const deleteStopsResponse = await fetch(
                `${SUPABASE_REST_URL}/route_stops?route_id=eq.${resolvedRouteId}&organization_id=eq.${orgId}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    apikey: SUPABASE_ANON_KEY_VALUE,
                    'Content-Type': 'application/json',
                    Prefer: 'return=minimal',
                  },
                },
              );
              if (!deleteStopsResponse.ok) {
                throw new Error(await readErrorMessage(deleteStopsResponse, 'Could not delete route stops.'));
              }

              const deleteRouteResponse = await fetch(
                `${SUPABASE_REST_URL}/routes?id=eq.${resolvedRouteId}&organization_id=eq.${orgId}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    apikey: SUPABASE_ANON_KEY_VALUE,
                    'Content-Type': 'application/json',
                    Prefer: 'return=minimal',
                  },
                },
              );

              if (!deleteRouteResponse.ok) {
                throw new Error(await readErrorMessage(deleteRouteResponse, 'Could not delete route.'));
              }

              clearTenantOperationalDataCache();
              router.back();
            } catch (err) {
              setSaveError(err instanceof Error ? err.message : 'Unable to delete route.');
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-route-form" testID="screen-admin-route-form">
      <AppHeader title={isEdit ? 'Edit Route' : 'New Route'} showBack onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.keyboardWrap} behavior={keyboardBehavior}>
        <ScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={theme.primary} />
              <ThemedText variant="body" color={theme.mutedForeground}>Loading route...</ThemedText>
            </View>
          ) : null}

          {loadError ? (
            <ThemedText variant="caption" color={theme.mutedForeground} style={styles.errorText}>
              {loadError}
            </ThemedText>
          ) : null}

          <Card style={styles.card}>
            <ThemedText variant="subheading">Route details</ThemedText>
            <View style={styles.fieldGroup}>
              <ThemedText variant="label" color={theme.mutedForeground}>Name</ThemedText>
              <View style={styles.inputWrap}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Route name"
                  placeholderTextColor={theme.mutedForeground}
                  style={styles.input}
                  accessibilityLabel="input-route-name"
                  testID="input-route-name"
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <ThemedText variant="label" color={theme.mutedForeground}>City</ThemedText>
              <View style={styles.inputWrap}>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor={theme.mutedForeground}
                  style={styles.input}
                  accessibilityLabel="input-route-city"
                  testID="input-route-city"
                />
              </View>
            </View>
            <View style={styles.switchRow}>
              <ThemedText variant="label">Active route</ThemedText>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={theme.card}
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.rowBetween}>
              <ThemedText variant="subheading">Stops</ThemedText>
              <ThemedText variant="caption" color={theme.mutedForeground}>{stops.length}</ThemedText>
            </View>
            {stops.map((stop, idx) => (
              <View key={stop.key} style={styles.stopRow}>
                <View style={styles.stopHeader}>
                  <ThemedText variant="label">Stop {idx + 1}</ThemedText>
                  <View style={styles.stopActions}>
                    <Pressable onPress={() => moveStop(idx, 'up')} style={styles.iconButton}>
                      <Feather name="arrow-up" size={14} color={theme.primary} />
                    </Pressable>
                    <Pressable onPress={() => moveStop(idx, 'down')} style={styles.iconButton}>
                      <Feather name="arrow-down" size={14} color={theme.primary} />
                    </Pressable>
                    <Pressable onPress={() => removeStop(idx)} style={styles.iconButton}>
                      <Feather name="x" size={16} color={theme.destructive} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.fieldGroup}>
                  <View style={styles.inputWrap}>
                    <TextInput
                      value={stop.venueName}
                      onChangeText={(value) => updateStop(idx, 'venueName', value)}
                      placeholder="Venue name"
                      placeholderTextColor={theme.mutedForeground}
                      style={styles.input}
                    />
                  </View>
                </View>
                <View style={styles.fieldGroup}>
                  <View style={styles.inputWrap}>
                    <TextInput
                      value={stop.address}
                      onChangeText={(value) => updateStop(idx, 'address', value)}
                      placeholder="Address"
                      placeholderTextColor={theme.mutedForeground}
                      style={styles.input}
                    />
                  </View>
                </View>
                {idx < stops.length - 1 ? <Divider /> : null}
              </View>
            ))}
            <Pressable onPress={addStop} style={styles.addStopButton}>
              <Feather name="plus-circle" size={16} color={theme.primary} />
              <ThemedText variant="label" color={theme.primary}>Add stop</ThemedText>
            </Pressable>
          </Card>

          <View style={styles.saveSection}>
            {saveError ? (
              <ThemedText variant="caption" color={theme.mutedForeground} style={styles.errorText}>
                {saveError}
              </ThemedText>
            ) : null}
            <Button
              label={saving ? 'Saving route...' : 'Save route'}
              onPress={() => void handleSave()}
              disabled={saving}
              loading={saving}
              accessibilityLabel="action-save-route"
              testID="action-save-route"
            />
          </View>

          {isEdit ? (
            <View style={styles.dangerSection}>
              <Button
                label="Delete route"
                variant="destructive"
                onPress={handleDeleteRoute}
                disabled={saving}
                accessibilityLabel="action-delete-route"
                testID="action-delete-route"
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

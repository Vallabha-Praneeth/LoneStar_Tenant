import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import colors from '../../constants/colors';
import { SUPABASE_ANON_KEY_VALUE, SUPABASE_REST_URL, fetchSupabaseRows } from '../../constants/supabase';
import { clearTenantOperationalDataCache } from '../../constants/tenant-operational-data';
import type { TenantTheme } from '../../constants/tenants';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

type CampaignFormStatus = 'scheduled' | 'active' | 'completed' | 'paused';

interface CampaignRow {
  id: string;
  title: string;
  campaign_date: string;
  route_id: string | null;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';
  client_id: string;
  driver_profile_id: string | null;
  internal_notes: string | null;
}

function fromDbStatus(status: CampaignRow['status']): CampaignFormStatus {
  if (status === 'active') return 'active';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'paused';
  return 'scheduled';
}

function toDbStatus(status: CampaignFormStatus): CampaignRow['status'] {
  if (status === 'active') return 'active';
  if (status === 'completed') return 'completed';
  if (status === 'paused') return 'cancelled';
  return 'pending';
}

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

export default function CampaignFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { accessToken, bootstrap } = useAuth();
  const { tenant } = useTenant();
  const { clients, drivers, routes } = useTenantOperationalData();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const radius = tenant?.radius ?? 8;
  const orgId = bootstrap?.organization?.id;
  const profileId = bootstrap?.profile?.id;
  const isEdit = Boolean(id);
  const [name, setName] = React.useState('');
  const [selectedClientId, setSelectedClientId] = React.useState('');
  const [selectedDriverId, setSelectedDriverId] = React.useState('');
  const [selectedRouteId, setSelectedRouteId] = React.useState('');
  const [campaignDate, setCampaignDate] = React.useState('');
  const [status, setStatus] = React.useState<CampaignFormStatus>('scheduled');
  const [description, setDescription] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id || !accessToken || !orgId) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetchSupabaseRows<CampaignRow>('campaigns', {
      select: 'id,title,campaign_date,route_id,status,client_id,driver_profile_id,internal_notes',
      id: `eq.${id}`,
      organization_id: `eq.${orgId}`,
    }, accessToken)
      .then((rows) => {
        if (!active) return;
        const row = rows[0];
        if (!row) {
          setError('Campaign not found.');
          return;
        }
        setName(row.title);
        setCampaignDate(row.campaign_date);
        setStatus(fromDbStatus(row.status));
        setSelectedClientId(row.client_id);
        setSelectedDriverId(row.driver_profile_id ?? '');
        setSelectedRouteId(row.route_id ?? '');
        setDescription(row.internal_notes ?? '');
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load campaign.');
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
  }, [id, accessToken, orgId]);

  async function handleSubmit() {
    if (!accessToken || !orgId || !profileId) {
      setError('Missing auth context. Please sign in again.');
      return;
    }

    if (!name.trim() || !selectedClientId || !campaignDate.trim()) {
      setError('Campaign name, client, and campaign date are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && id) {
        const response = await fetch(
          `${SUPABASE_REST_URL}/campaigns?id=eq.${id}&organization_id=eq.${orgId}&select=id`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              apikey: SUPABASE_ANON_KEY_VALUE,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify({
              title: name.trim(),
              campaign_date: campaignDate.trim(),
              status: toDbStatus(status),
              client_id: selectedClientId,
              driver_profile_id: selectedDriverId || null,
              route_id: selectedRouteId || null,
              internal_notes: description.trim() || null,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(await readErrorMessage(response, 'Could not update campaign.'));
        }

        const updated = (await response.json()) as Array<{ id: string }>;
        if (!updated[0]) {
          throw new Error('Campaign update did not affect any row.');
        }
      } else {
        const response = await fetch(`${SUPABASE_REST_URL}/campaigns`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: SUPABASE_ANON_KEY_VALUE,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            organization_id: orgId,
            title: name.trim(),
            campaign_date: campaignDate.trim(),
            status: toDbStatus(status),
            client_id: selectedClientId,
            driver_profile_id: selectedDriverId || null,
            route_id: selectedRouteId || null,
            internal_notes: description.trim() || null,
            created_by: profileId,
          }),
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response, 'Could not create campaign.'));
        }
      }

      clearTenantOperationalDataCache();
      router.back();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save campaign.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete() {
    if (!accessToken || !orgId || !id) {
      setError('Campaign id is missing.');
      return;
    }

    Alert.alert('Delete campaign?', 'This will permanently remove the campaign.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSubmitting(true);
            setError(null);
            try {
              const response = await fetch(
                `${SUPABASE_REST_URL}/campaigns?id=eq.${id}&organization_id=eq.${orgId}&select=id`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    apikey: SUPABASE_ANON_KEY_VALUE,
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation',
                  },
                },
              );

              if (!response.ok) {
                throw new Error(await readErrorMessage(response, 'Could not delete campaign.'));
              }

              const deleted = (await response.json()) as Array<{ id: string }>;
              if (!deleted[0]) {
                throw new Error('Campaign delete did not affect any row.');
              }

              clearTenantOperationalDataCache();
              router.back();
            } catch (deleteError) {
              setError(deleteError instanceof Error ? deleteError.message : 'Could not delete campaign.');
            } finally {
              setSubmitting(false);
            }
          })();
        },
      },
    ]);
  }

  const isValid = name.trim() && selectedClientId && campaignDate.trim();

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-campaign-form" testID="screen-admin-campaign-form">
      <AppHeader title={isEdit ? 'Edit Campaign' : 'New Campaign'} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ThemedText variant="caption" color={theme.mutedForeground}>Loading campaign...</ThemedText>
        ) : null}
        {error ? (
          <ThemedText variant="caption" color={theme.mutedForeground}>{error}</ThemedText>
        ) : null}

        <Card style={styles.section}>
          <ThemedText variant="label" color={theme.mutedForeground} style={styles.sectionTitle}>Campaign Details</ThemedText>

          <Field label="Campaign Name" theme={theme} radius={radius}>
            <TextInput
              style={[styles.input, { color: theme.foreground }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Q3 South Corridor"
              placeholderTextColor={theme.mutedForeground}
            />
          </Field>

          <Field label="Description" theme={theme} radius={radius}>
            <TextInput
              style={[styles.input, styles.multiline, { color: theme.foreground }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the campaign scope and goals"
              placeholderTextColor={theme.mutedForeground}
              multiline
              numberOfLines={3}
            />
          </Field>

          <Field label="Campaign Date (YYYY-MM-DD)" theme={theme} radius={radius}>
            <TextInput
              style={[styles.input, { color: theme.foreground }]}
              value={campaignDate}
              onChangeText={setCampaignDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.mutedForeground}
            />
          </Field>

          <View style={styles.fieldGroup}>
            <ThemedText variant="label" color={theme.mutedForeground}>Status</ThemedText>
            <View style={styles.statusRow}>
              {(['scheduled', 'active', 'completed', 'paused'] as CampaignFormStatus[]).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setStatus(option)}
                  style={({ pressed }) => [
                    styles.statusChip,
                    {
                      backgroundColor: status === option ? theme.primary : theme.card,
                      borderColor: status === option ? theme.primary : theme.border,
                      borderRadius: radius,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <ThemedText variant="caption" color={status === option ? theme.primaryForeground : theme.foreground}>
                    {option}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <ThemedText variant="label" color={theme.mutedForeground} style={styles.sectionTitle}>Client</ThemedText>
          <View style={styles.chipList}>
            {clients.map((client) => (
              <Pressable
                key={client.id}
                onPress={() => setSelectedClientId(client.id)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: selectedClientId === client.id ? theme.primary : theme.card,
                    borderColor: selectedClientId === client.id ? theme.primary : theme.border,
                    borderRadius: radius,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText variant="label" color={selectedClientId === client.id ? theme.primaryForeground : theme.foreground} numberOfLines={1}>
                  {client.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={styles.section}>
          <ThemedText variant="label" color={theme.mutedForeground} style={styles.sectionTitle}>Assignment (optional)</ThemedText>
          <Field label="Driver" theme={theme} radius={radius}>
            <View style={styles.selectorWrap}>
              <Pressable
                onPress={() => setSelectedDriverId('')}
                style={({ pressed }) => [
                  styles.selectorChip,
                  {
                    backgroundColor: selectedDriverId === '' ? theme.primary : theme.card,
                    borderColor: selectedDriverId === '' ? theme.primary : theme.border,
                    borderRadius: radius,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText variant="caption" color={selectedDriverId === '' ? theme.primaryForeground : theme.foreground}>Unassigned</ThemedText>
              </Pressable>
              {drivers.map((driver) => (
                <Pressable
                  key={driver.id}
                  onPress={() => setSelectedDriverId(driver.id)}
                  style={({ pressed }) => [
                    styles.selectorChip,
                    {
                      backgroundColor: selectedDriverId === driver.id ? theme.primary : theme.card,
                      borderColor: selectedDriverId === driver.id ? theme.primary : theme.border,
                      borderRadius: radius,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <ThemedText variant="caption" color={selectedDriverId === driver.id ? theme.primaryForeground : theme.foreground}>
                    {driver.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="Route" theme={theme} radius={radius}>
            <View style={styles.selectorWrap}>
              <Pressable
                onPress={() => setSelectedRouteId('')}
                style={({ pressed }) => [
                  styles.selectorChip,
                  {
                    backgroundColor: selectedRouteId === '' ? theme.primary : theme.card,
                    borderColor: selectedRouteId === '' ? theme.primary : theme.border,
                    borderRadius: radius,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText variant="caption" color={selectedRouteId === '' ? theme.primaryForeground : theme.foreground}>No route</ThemedText>
              </Pressable>
              {routes.map((route) => (
                <Pressable
                  key={route.id}
                  onPress={() => setSelectedRouteId(route.id)}
                  style={({ pressed }) => [
                    styles.selectorChip,
                    {
                      backgroundColor: selectedRouteId === route.id ? theme.primary : theme.card,
                      borderColor: selectedRouteId === route.id ? theme.primary : theme.border,
                      borderRadius: radius,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <ThemedText variant="caption" color={selectedRouteId === route.id ? theme.primaryForeground : theme.foreground}>
                    {route.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Field>
        </Card>

        <Button label={isEdit ? 'Save Changes' : 'Create Campaign'} onPress={() => void handleSubmit()} loading={submitting} disabled={!isValid} />
        {isEdit ? <Button label="Delete Campaign" variant="destructive" onPress={handleDelete} disabled={submitting} /> : null}
        {!clients.length ? (
          <ThemedText variant="caption" color={theme.mutedForeground} style={styles.note}>
            No clients available. Create a client entity in Team first.
          </ThemedText>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function Field({
  label,
  theme,
  radius,
  children,
}: {
  label: string;
  theme: TenantTheme;
  radius: number;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldGroup}>
      <ThemedText variant="label" color={theme.mutedForeground}>{label}</ThemedText>
      <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: theme.card, borderRadius: radius }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  section: { gap: 14 },
  sectionTitle: { marginBottom: 2 },
  fieldGroup: { gap: 6 },
  inputWrap: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  input: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  chipList: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5 },
  selectorWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  note: { textAlign: 'center' },
});

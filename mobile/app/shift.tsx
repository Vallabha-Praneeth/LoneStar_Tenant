import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { ScreenMarker } from '../components/ScreenMarker';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Divider } from '../components/ui/Divider';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedView } from '../components/ui/ThemedView';
import { type Campaign, type Shift } from '../constants/mockData';
import colors from '../constants/colors';
import {
  SUPABASE_ANON_KEY_VALUE,
  SUPABASE_REST_URL,
} from '../constants/supabase';
import type { TenantTheme } from '../constants/tenants';
import { clearTenantOperationalDataCache } from '../constants/tenant-operational-data';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useTenantOperationalData } from '../hooks/useTenantOperationalData';

export default function ShiftScreen() {
  const { user, accessToken, bootstrap } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const radius = tenant?.radius ?? 8;
  const { visibleShifts, visibleCampaigns, isLoading, error } = useTenantOperationalData();
  const activeShift = visibleShifts.find((shift) => shift.status === 'active');
  const completedShifts = user ? visibleShifts.filter((shift) => shift.driverId === user.id && shift.status === 'completed') : [];
  const campaigns = visibleCampaigns.filter((campaign) => campaign.status === 'active');
  const [odometer, setOdometer] = React.useState('');
  const [selectedCampaign, setSelectedCampaign] = React.useState(campaigns[0]?.id ?? '');
  const [shiftEnded, setShiftEnded] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isStartingShift, setIsStartingShift] = React.useState(false);
  const [isEndingShift, setIsEndingShift] = React.useState(false);
  const organizationId = bootstrap?.organization?.id ?? null;

  React.useEffect(() => {
    if (!selectedCampaign && campaigns[0]?.id) {
      setSelectedCampaign(campaigns[0].id);
    }
  }, [campaigns, selectedCampaign]);

  async function readResponseError(response: Response, fallback: string) {
    const raw = await response.text();
    if (!raw) {
      return fallback;
    }
    try {
      const parsed = JSON.parse(raw) as { error?: string; message?: string; msg?: string };
      return parsed.error ?? parsed.message ?? parsed.msg ?? fallback;
    } catch {
      return raw;
    }
  }

  async function handleStartShift() {
    if (!accessToken || !organizationId || !user?.id) {
      setActionError('Missing authentication context. Please sign in again.');
      return;
    }
    if (!selectedCampaign) {
      setActionError('Select a campaign before starting a shift.');
      return;
    }

    setActionError(null);
    setIsStartingShift(true);
    try {
      const response = await fetch(`${SUPABASE_REST_URL}/driver_shifts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY_VALUE,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          organization_id: organizationId,
          campaign_id: selectedCampaign,
          driver_profile_id: user.id,
          started_at: new Date().toISOString(),
          shift_status: 'active',
        }),
      });

      if (!response.ok) {
        throw new Error(await readResponseError(response, 'Could not start shift.'));
      }

      clearTenantOperationalDataCache();
      router.back();
    } catch (startError) {
      setActionError(startError instanceof Error ? startError.message : 'Could not start shift.');
    } finally {
      setIsStartingShift(false);
    }
  }

  async function handleEndShift() {
    if (!accessToken || !organizationId || !activeShift?.id) {
      setActionError('No active shift found to end.');
      return;
    }

    setActionError(null);
    setIsEndingShift(true);
    try {
      const response = await fetch(
        `${SUPABASE_REST_URL}/driver_shifts?id=eq.${activeShift.id}&organization_id=eq.${organizationId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: SUPABASE_ANON_KEY_VALUE,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            ended_at: new Date().toISOString(),
            shift_status: 'completed',
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await readResponseError(response, 'Could not end shift.'));
      }

      clearTenantOperationalDataCache();
      setShiftEnded(true);
    } catch (endError) {
      setActionError(endError instanceof Error ? endError.message : 'Could not end shift.');
    } finally {
      setIsEndingShift(false);
    }
  }

  return (
    <ThemedView style={styles.root}>
      <ScreenMarker id="screen-shift" />
      <AppHeader title="Shift" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ThemedText variant="body" color={theme.mutedForeground}>Loading shift data...</ThemedText>
        ) : null}
        {error ? (
          <ThemedText variant="body" color={theme.mutedForeground}>{error}</ThemedText>
        ) : null}
        {activeShift ? (
          <ActiveShiftSection
            shift={activeShift}
            theme={theme}
            radius={radius}
            odometer={odometer}
            setOdometer={setOdometer}
            shiftEnded={shiftEnded}
            onEndShift={() => void handleEndShift()}
            isEndingShift={isEndingShift}
            actionError={actionError}
          />
        ) : (
          <StartShiftSection
            campaigns={campaigns}
            theme={theme}
            radius={radius}
            odometer={odometer}
            setOdometer={setOdometer}
            selectedCampaign={selectedCampaign}
            setSelectedCampaign={setSelectedCampaign}
            onStartShift={() => void handleStartShift()}
            isStartingShift={isStartingShift}
            actionError={actionError}
          />
        )}

        <View style={styles.history}>
          <ThemedText variant="subheading">Shift History</ThemedText>
          {completedShifts.map((shift) => (
            <Card key={shift.id} style={styles.historyCard}>
              <View style={styles.historyRow}>
                <View style={styles.historyInfo}>
                  <ThemedText variant="label">{shift.campaignName}</ThemedText>
                  <ThemedText variant="caption" color={theme.mutedForeground}>
                    {shift.date} · {shift.startTime} - {shift.endTime}
                  </ThemedText>
                </View>
                <Badge label="Completed" variant="neutral" />
              </View>
              {shift.startOdometer !== null && shift.endOdometer !== null ? (
                <ThemedText variant="caption" color={theme.mutedForeground}>
                  {(shift.endOdometer - shift.startOdometer).toLocaleString()} mi driven
                </ThemedText>
              ) : null}
            </Card>
          ))}
        </View>

      </ScrollView>
    </ThemedView>
  );
}

function ActiveShiftSection({
  shift,
  theme,
  radius,
  odometer,
  setOdometer,
  shiftEnded,
  onEndShift,
  isEndingShift,
  actionError,
}: {
  shift: Shift;
  theme: TenantTheme;
  radius: number;
  odometer: string;
  setOdometer: (value: string) => void;
  shiftEnded: boolean;
  onEndShift: () => void;
  isEndingShift: boolean;
  actionError: string | null;
}) {
  return (
    <Card style={styles.activeCard}>
      <View style={styles.activeHeader}>
        <View>
          <ThemedText variant="subheading">Active Shift</ThemedText>
          <ThemedText variant="body" color={theme.mutedForeground}>{shift.campaignName}</ThemedText>
        </View>
        <Badge label="On Shift" variant="success" />
      </View>

      <Divider />

      <View style={styles.shiftMeta}>
        <View style={styles.metaItem}>
          <Feather name="clock" size={14} color={theme.mutedForeground} />
          <ThemedText variant="caption" color={theme.mutedForeground}>Started {shift.startTime}</ThemedText>
        </View>
        {shift.startOdometer !== null ? (
          <View style={styles.metaItem}>
            <Feather name="activity" size={14} color={theme.mutedForeground} />
            <ThemedText variant="caption" color={theme.mutedForeground}>
              Start: {shift.startOdometer.toLocaleString()} mi
            </ThemedText>
          </View>
        ) : null}
      </View>

      {!shiftEnded ? (
        <>
          <View style={styles.fieldGroup}>
            <ThemedText variant="label" color={theme.mutedForeground}>End Odometer (mi)</ThemedText>
            <View style={[styles.inputWrap, { borderColor: theme.border, borderRadius: radius, backgroundColor: theme.card }]}>
              <TextInput
                style={[styles.input, { color: theme.foreground }]}
                value={odometer}
                onChangeText={setOdometer}
                placeholder="Enter current odometer"
                placeholderTextColor={theme.mutedForeground}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <Button
            label={isEndingShift ? 'Ending Shift...' : 'End Shift'}
            variant="destructive"
            onPress={onEndShift}
            disabled={!odometer || isEndingShift}
            loading={isEndingShift}
          />
          {actionError ? (
            <ThemedText variant="caption" color={theme.mutedForeground}>
              {actionError}
            </ThemedText>
          ) : null}
        </>
      ) : (
        <View style={styles.ended}>
          <Feather name="check-circle" size={28} color="#166534" />
          <ThemedText variant="subheading" color="#166534">Shift ended</ThemedText>
          <ThemedText variant="caption" color={theme.mutedForeground}>PLACEHOLDER · Not persisted</ThemedText>
        </View>
      )}
    </Card>
  );
}

function StartShiftSection({
  campaigns,
  theme,
  radius,
  odometer,
  setOdometer,
  selectedCampaign,
  setSelectedCampaign,
  onStartShift,
  isStartingShift,
  actionError,
}: {
  campaigns: Campaign[];
  theme: TenantTheme;
  radius: number;
  odometer: string;
  setOdometer: (value: string) => void;
  selectedCampaign: string;
  setSelectedCampaign: (id: string) => void;
  onStartShift: () => void;
  isStartingShift: boolean;
  actionError: string | null;
}) {
  return (
    <Card style={styles.section}>
      <ThemedText variant="subheading">Start a Shift</ThemedText>

      <View style={styles.fieldGroup}>
        <ThemedText variant="label" color={theme.mutedForeground}>Campaign</ThemedText>
        {campaigns.map((campaign) => (
          <Pressable
            key={campaign.id}
            onPress={() => setSelectedCampaign(campaign.id)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selectedCampaign === campaign.id ? theme.primary : theme.card,
                borderColor: selectedCampaign === campaign.id ? theme.primary : theme.border,
                borderRadius: radius,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText variant="label" color={selectedCampaign === campaign.id ? theme.primaryForeground : theme.foreground}>
              {campaign.name}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText variant="label" color={theme.mutedForeground}>Start Odometer (mi)</ThemedText>
        <View style={[styles.inputWrap, { borderColor: theme.border, borderRadius: radius, backgroundColor: theme.card }]}>
          <TextInput
            style={[styles.input, { color: theme.foreground }]}
            value={odometer}
            onChangeText={setOdometer}
            placeholder="Enter current odometer"
            placeholderTextColor={theme.mutedForeground}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <Button
        label={isStartingShift ? 'Starting Shift...' : 'Start Shift'}
        onPress={onStartShift}
        disabled={!selectedCampaign || !odometer || isStartingShift}
        loading={isStartingShift}
      />
      {actionError ? (
        <ThemedText variant="caption" color={theme.mutedForeground}>
          {actionError}
        </ThemedText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  section: { gap: 12 },
  activeCard: { gap: 14 },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shiftMeta: { gap: 6 },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldGroup: { gap: 6 },
  inputWrap: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  ended: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  history: { gap: 10 },
  historyCard: { gap: 8 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  historyInfo: { flex: 1, gap: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    marginBottom: 8,
  },
});

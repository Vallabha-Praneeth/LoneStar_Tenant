import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
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
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

interface DriverRow {
  id: string;
  profile_id: string;
  license_number: string | null;
  license_type: string | null;
  license_expiry: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  base_daily_wage: number | null;
  city: string | null;
  can_create_routes: boolean;
}

function createStyles(theme: TenantTheme, radius: number) {
  return StyleSheet.create({
    root: { flex: 1 },
    keyboardWrap: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
    card: { gap: 10 },
    warningCard: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1, borderRadius: radius },
    warningText: { color: '#92400E' },
    sectionTitle: { marginBottom: 2 },
    fieldGroup: { gap: 6 },
    inputWrap: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    input: { fontSize: 15, fontFamily: 'Inter_400Regular', color: theme.foreground },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    shiftHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    shiftCard: { gap: 6 },
    shiftMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusText: { textAlign: 'left' },
  });
}

export default function DriverDetailScreen() {
  const { profileId } = useLocalSearchParams<{ profileId?: string }>();
  const resolvedProfileId = typeof profileId === 'string' ? profileId : '';
  const { accessToken, bootstrap } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const theme = tenant?.theme ?? colors.light;
  const radius = tenant?.radius ?? 8;
  const styles = React.useMemo(() => createStyles(theme, radius), [theme, radius]);
  const keyboardBehavior: 'padding' | undefined = Platform.OS === 'ios' ? 'padding' : undefined;
  const bottomPadding = insets.bottom + 84;
  const scrollContentStyle = React.useMemo(
    () => [styles.content, { paddingBottom: bottomPadding }],
    [bottomPadding, styles.content],
  );
  const orgId = bootstrap?.organization?.id;

  const { drivers, shifts } = useTenantOperationalData();
  const driverName = drivers.find((driver) => driver.id === resolvedProfileId)?.name ?? 'Driver';
  const driverShifts = shifts.filter((shift) => shift.driverId === resolvedProfileId);

  const [driverRow, setDriverRow] = React.useState<DriverRow | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [licenseType, setLicenseType] = React.useState('');
  const [licenseExpiry, setLicenseExpiry] = React.useState('');
  const [emergencyName, setEmergencyName] = React.useState('');
  const [emergencyPhone, setEmergencyPhone] = React.useState('');
  const [baseDailyWage, setBaseDailyWage] = React.useState('');
  const [city, setCity] = React.useState('');
  const [canCreateRoutes, setCanCreateRoutes] = React.useState(false);

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
    if (!accessToken || !orgId || !resolvedProfileId) {
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);

    fetchSupabaseRows<DriverRow>('drivers', {
      select: 'id,profile_id,license_number,license_type,license_expiry,emergency_contact_name,emergency_contact_phone,base_daily_wage,city,can_create_routes',
      profile_id: `eq.${resolvedProfileId}`,
      organization_id: `eq.${orgId}`,
    }, accessToken)
      .then((rows) => {
        if (!active) return;
        const row = rows[0] ?? null;
        setDriverRow(row);
        setLicenseNumber(row?.license_number ?? '');
        setLicenseType(row?.license_type ?? '');
        setLicenseExpiry(row?.license_expiry ?? '');
        setEmergencyName(row?.emergency_contact_name ?? '');
        setEmergencyPhone(row?.emergency_contact_phone ?? '');
        setBaseDailyWage(row?.base_daily_wage !== null && row?.base_daily_wage !== undefined ? String(row.base_daily_wage) : '');
        setCity(row?.city ?? '');
        setCanCreateRoutes(row?.can_create_routes ?? false);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load driver details.');
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
  }, [accessToken, orgId, resolvedProfileId]);

  React.useEffect(() => {
    if (!savedMessage) return;
    const timer = setTimeout(() => setSavedMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [savedMessage]);

  async function handleSave() {
    if (!accessToken || !orgId || !resolvedProfileId) {
      setSaveError('Missing auth context. Please sign in again.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSavedMessage(null);

    const parsedWage = Number.parseFloat(baseDailyWage);
    const payload = {
      organization_id: orgId,
      profile_id: resolvedProfileId,
      license_number: licenseNumber.trim() || null,
      license_type: licenseType.trim() || null,
      license_expiry: licenseExpiry.trim() || null,
      emergency_contact_name: emergencyName.trim() || null,
      emergency_contact_phone: emergencyPhone.trim() || null,
      base_daily_wage: Number.isFinite(parsedWage) ? parsedWage : null,
      city: city.trim() || null,
      can_create_routes: canCreateRoutes,
    };

    try {
      if (!driverRow) {
        const createResponse = await fetch(`${SUPABASE_REST_URL}/drivers`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: SUPABASE_ANON_KEY_VALUE,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(payload),
        });

        if (!createResponse.ok) {
          throw new Error(await readErrorMessage(createResponse, 'Could not create driver profile.'));
        }

        const createdRows = (await createResponse.json()) as DriverRow[];
        setDriverRow(createdRows[0] ?? null);
      } else {
        const updateResponse = await fetch(
          `${SUPABASE_REST_URL}/drivers?id=eq.${driverRow.id}&organization_id=eq.${orgId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              apikey: SUPABASE_ANON_KEY_VALUE,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              license_number: payload.license_number,
              license_type: payload.license_type,
              license_expiry: payload.license_expiry,
              emergency_contact_name: payload.emergency_contact_name,
              emergency_contact_phone: payload.emergency_contact_phone,
              base_daily_wage: payload.base_daily_wage,
              city: payload.city,
              can_create_routes: payload.can_create_routes,
            }),
          },
        );

        if (!updateResponse.ok) {
          throw new Error(await readErrorMessage(updateResponse, 'Could not update driver profile.'));
        }
      }

      clearTenantOperationalDataCache();
      setSavedMessage('Saved');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save driver details.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-driver-detail" testID="screen-admin-driver-detail">
      <AppHeader title={driverName} showBack onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.keyboardWrap} behavior={keyboardBehavior}>
        <ScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading ? <ThemedText variant="body" color={theme.mutedForeground}>Loading driver details...</ThemedText> : null}
          {error ? <ThemedText variant="caption" color={theme.mutedForeground}>{error}</ThemedText> : null}

          {!driverRow ? (
            <Card style={[styles.card, styles.warningCard]}>
              <ThemedText variant="label" style={styles.warningText}>
                No driver record yet. Fill details below to create one.
              </ThemedText>
            </Card>
          ) : null}

          <Card style={styles.card}>
            <View style={styles.shiftHeader}>
              <ThemedText variant="subheading">Shift history</ThemedText>
              <ThemedText variant="caption" color={theme.mutedForeground}>{driverShifts.length}</ThemedText>
            </View>
            {driverShifts.length === 0 ? (
              <EmptyState icon="clock" title="No shifts yet" message="Shift history will appear once this driver logs shifts." />
            ) : (
              driverShifts.map((shift) => (
                <Card key={shift.id} style={styles.shiftCard}>
                  <ThemedText variant="label">{shift.campaignName}</ThemedText>
                  <View style={styles.shiftMeta}>
                    <ThemedText variant="caption" color={theme.mutedForeground}>
                      {shift.date} · {shift.startTime ?? '--'} - {shift.endTime ?? '--'}
                    </ThemedText>
                    <Badge
                      label={shift.status}
                      variant={shift.status === 'active' ? 'success' : shift.status === 'pending' ? 'warning' : 'neutral'}
                    />
                  </View>
                </Card>
              ))
            )}
          </Card>

          <Card style={styles.card}>
            <ThemedText variant="subheading" style={styles.sectionTitle}>License</ThemedText>
            <View style={styles.fieldGroup}>
              <ThemedText variant="label" color={theme.mutedForeground}>License number</ThemedText>
              <View style={styles.inputWrap}>
                <TextInput value={licenseNumber} onChangeText={setLicenseNumber} style={styles.input} placeholder="License number" placeholderTextColor={theme.mutedForeground} />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <ThemedText variant="label" color={theme.mutedForeground}>License type</ThemedText>
              <View style={styles.inputWrap}>
                <TextInput value={licenseType} onChangeText={setLicenseType} style={styles.input} placeholder="Class A / Class B" placeholderTextColor={theme.mutedForeground} />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <ThemedText variant="label" color={theme.mutedForeground}>License expiry (YYYY-MM-DD)</ThemedText>
              <View style={styles.inputWrap}>
                <TextInput value={licenseExpiry} onChangeText={setLicenseExpiry} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={theme.mutedForeground} />
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText variant="subheading" style={styles.sectionTitle}>Emergency contact</ThemedText>
            <View style={styles.fieldGroup}>
              <ThemedText variant="label" color={theme.mutedForeground}>Name</ThemedText>
              <View style={styles.inputWrap}>
                <TextInput value={emergencyName} onChangeText={setEmergencyName} style={styles.input} placeholder="Emergency contact name" placeholderTextColor={theme.mutedForeground} />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <ThemedText variant="label" color={theme.mutedForeground}>Phone</ThemedText>
              <View style={styles.inputWrap}>
                <TextInput value={emergencyPhone} onChangeText={setEmergencyPhone} style={styles.input} placeholder="Emergency contact phone" placeholderTextColor={theme.mutedForeground} keyboardType="phone-pad" />
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText variant="subheading" style={styles.sectionTitle}>Compensation & location</ThemedText>
            <View style={styles.fieldGroup}>
              <ThemedText variant="label" color={theme.mutedForeground}>Base daily wage</ThemedText>
              <View style={styles.inputWrap}>
                <TextInput value={baseDailyWage} onChangeText={setBaseDailyWage} style={styles.input} placeholder="0.00" placeholderTextColor={theme.mutedForeground} keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <ThemedText variant="label" color={theme.mutedForeground}>City</ThemedText>
              <View style={styles.inputWrap}>
                <TextInput value={city} onChangeText={setCity} style={styles.input} placeholder="City" placeholderTextColor={theme.mutedForeground} />
              </View>
            </View>
            <View style={styles.toggleRow}>
              <ThemedText variant="label">Allow driver to create routes</ThemedText>
              <Switch
                value={canCreateRoutes}
                onValueChange={setCanCreateRoutes}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={theme.card}
              />
            </View>
          </Card>

          {saveError ? <ThemedText variant="caption" color={theme.mutedForeground} style={styles.statusText}>{saveError}</ThemedText> : null}
          {savedMessage ? <ThemedText variant="caption" color={theme.mutedForeground} style={styles.statusText}>{savedMessage}</ThemedText> : null}
          <Button label={saving ? 'Saving...' : 'Save'} onPress={() => void handleSave()} disabled={saving} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

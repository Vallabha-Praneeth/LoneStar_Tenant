import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { ScreenMarker } from '../../components/ScreenMarker';
import { ShiftStatusCard } from '../../components/ShiftStatusCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

export default function DriverHomeScreen() {
  const { user, signOut } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const { visibleShifts, visibleCampaigns, isLoading, error } = useTenantOperationalData();
  const shifts = visibleShifts;
  const activeShift = visibleShifts.find((shift) => shift.status === 'active');
  const activeCampaigns = visibleCampaigns.filter((campaign) => campaign.status === 'active');

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  return (
    <ThemedView style={styles.root}>
      <ScreenMarker id="screen-driver-home" />
      <AppHeader
        rightAction={
          <Pressable onPress={() => void handleSignOut()} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Feather name="log-out" size={18} color={theme.mutedForeground} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <ThemedText variant="heading">{user?.name.split(' ')[0]}</ThemedText>
          <ThemedText variant="body" color={theme.mutedForeground}>
            Driver · {tenant?.name}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText variant="subheading">Today's Shift</ThemedText>
          {activeShift ? (
            <ShiftStatusCard shift={activeShift} />
          ) : (
            <Card style={styles.noShift}>
              <Feather name="truck" size={28} color={theme.mutedForeground} />
              <ThemedText variant="body" color={theme.mutedForeground} style={styles.noShiftText}>
                No active shift
              </ThemedText>
              <Button label="Start Shift" onPress={() => router.push('/shift')} size="sm" />
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText variant="subheading">Quick Actions</ThemedText>
          <View style={styles.quickActions}>
            <Pressable
              onPress={() => router.push('/proof-upload')}
              accessibilityLabel="driver-action-upload-proof"
              testID="driver-action-upload-proof"
              style={({ pressed }) => [
                styles.quickBtn,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.8 : 1,
                  borderRadius: tenant?.radius ?? 8,
                },
              ]}
            >
              <Feather name="camera" size={22} color={theme.primaryForeground} />
              <ThemedText variant="label" color={theme.primaryForeground} style={styles.quickLabel}>
                Upload Proof
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/shift')}
              accessibilityLabel="driver-action-shift-log"
              testID="driver-action-shift-log"
              style={({ pressed }) => [
                styles.quickBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderWidth: 1,
                  opacity: pressed ? 0.8 : 1,
                  borderRadius: tenant?.radius ?? 8,
                },
              ]}
            >
              <Feather name="clock" size={22} color={theme.primary} />
              <ThemedText variant="label" color={theme.foreground} style={styles.quickLabel}>
                Shift Log
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText variant="subheading">Assigned Campaigns</ThemedText>
          {isLoading ? (
            <ThemedText variant="body" color={theme.mutedForeground}>Loading assignments...</ThemedText>
          ) : null}
          {error ? (
            <ThemedText variant="body" color={theme.mutedForeground}>{error}</ThemedText>
          ) : null}
          {activeCampaigns.slice(0, 2).map((campaign) => (
            <Pressable
              key={campaign.id}
              onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: campaign.id } })}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Card style={styles.assignedCard}>
                <ThemedText variant="label">{campaign.name}</ThemedText>
                <ThemedText variant="caption" color={theme.mutedForeground}>
                  {campaign.proofsSubmitted}/{campaign.proofsRequired} proofs · {campaign.routes} routes
                </ThemedText>
              </Card>
            </Pressable>
          ))}
          {!isLoading && !error && activeCampaigns.length === 0 ? (
            <ThemedText variant="body" color={theme.mutedForeground}>
              No assigned campaigns yet.
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.section}>
          <ThemedText variant="subheading">Recent Shift History</ThemedText>
          <Card style={styles.assignedCard}>
            <ThemedText variant="caption" color={theme.mutedForeground}>
              {shifts.length} shift record{shifts.length !== 1 ? 's' : ''} available
            </ThemedText>
          </Card>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 24 },
  greeting: { gap: 4 },
  section: { gap: 12 },
  noShift: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  noShiftText: {
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    marginTop: 6,
  },
  assignedCard: {
    gap: 4,
    marginBottom: 8,
  },
});

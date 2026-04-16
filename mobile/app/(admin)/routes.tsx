import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvatarBadge } from '../../components/AvatarBadge';
import { AppHeader } from '../../components/AppHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import { EmptyState } from '../../components/ui/EmptyState';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import { type Route } from '../../constants/mockData';
import colors from '../../constants/colors';
import type { TenantTheme } from '../../constants/tenants';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

type Filter = 'all' | Route['status'];

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
];

export default function AdminRoutesScreen() {
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const [filter, setFilter] = React.useState<Filter>('all');
  const { routes: all, isLoading, error } = useTenantOperationalData();
  const filtered = filter === 'all' ? all : all.filter((route) => route.status === filter);

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-routes" testID="screen-admin-routes">
      <AppHeader title="Routes" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((candidate) => (
            <Pressable
              key={candidate.key}
              onPress={() => setFilter(candidate.key)}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: filter === candidate.key ? theme.primary : theme.card,
                  borderColor: filter === candidate.key ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                  borderRadius: tenant?.radius ?? 6,
                },
              ]}
            >
              <ThemedText variant="label" color={filter === candidate.key ? theme.primaryForeground : theme.foreground}>
                {candidate.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        <ThemedText variant="caption" color={theme.mutedForeground}>
          {filtered.length} route{filtered.length !== 1 ? 's' : ''}
        </ThemedText>

        {isLoading ? (
          <ThemedText variant="body" color={theme.mutedForeground}>Loading routes...</ThemedText>
        ) : null}
        {error ? (
          <ThemedText variant="body" color={theme.mutedForeground}>{error}</ThemedText>
        ) : null}
        {!isLoading && !error && filtered.length === 0 ? (
          <EmptyState icon="map" title="No routes" message="No routes match this filter." />
        ) : (
          <Card padded={false} style={styles.list}>
            {filtered.map((route, index) => (
              <RouteRow key={route.id} route={route} theme={theme} isLast={index === filtered.length - 1} />
            ))}
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function RouteRow({
  route,
  theme,
  isLast,
}: {
  route: Route;
  theme: TenantTheme;
  isLast: boolean;
}) {
  return (
    <>
      <View style={styles.routeRow}>
        <View style={styles.iconWrap}>
          <Feather name="navigation" size={16} color={theme.primary} />
        </View>
        <View style={styles.routeContent}>
          <View style={styles.routeHeader}>
            <ThemedText variant="label" style={styles.routeName} numberOfLines={1}>
              {route.name}
            </ThemedText>
            <Badge
              label={route.status}
              variant={route.status === 'active' ? 'success' : route.status === 'scheduled' ? 'warning' : 'neutral'}
            />
          </View>
          <ThemedText variant="caption" color={theme.mutedForeground} numberOfLines={1}>
            {route.campaignName}
          </ThemedText>
          <View style={styles.routeMeta}>
            <Feather name="map-pin" size={11} color={theme.mutedForeground} />
            <ThemedText variant="caption" color={theme.mutedForeground}>
              {route.startPoint} → {route.endPoint}
            </ThemedText>
          </View>
          <View style={styles.routeFooter}>
            {route.assignedDriverName ? (
              <View style={styles.driverChip}>
                <AvatarBadge initials={route.assignedDriverName.split(' ').map((name) => name[0]).join('')} size={18} />
                <ThemedText variant="caption" color={theme.mutedForeground}>{route.assignedDriverName}</ThemedText>
              </View>
            ) : (
              <ThemedText variant="caption" color={theme.mutedForeground}>Unassigned</ThemedText>
            )}
            <ThemedText variant="caption" color={theme.mutedForeground}>{route.estimatedMiles} mi</ThemedText>
          </View>
        </View>
      </View>
      {!isLast ? <Divider inset={52} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  filters: { flexDirection: 'row', gap: 8, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  list: { overflow: 'hidden' },
  routeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: { width: 24, alignItems: 'center', paddingTop: 2 },
  routeContent: { flex: 1, gap: 4 },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  routeName: { flex: 1 },
  routeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  driverChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});

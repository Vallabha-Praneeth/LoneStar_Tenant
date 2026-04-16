import React from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvatarBadge } from '../../components/AvatarBadge';
import { AppHeader } from '../../components/AppHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListRow } from '../../components/ui/ListRow';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import type { Client, Driver } from '../../constants/mockData';
import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

type Segment = 'drivers' | 'clients';

export default function AdminTeamScreen() {
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [segment, setSegment] = React.useState<Segment>('drivers');
  const { drivers, clients, isLoading } = useTenantOperationalData();

  const theme = tenant?.theme ?? colors.light;

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-team" testID="screen-admin-team">
      <AppHeader title="Team" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ThemedText variant="body" color={theme.mutedForeground} style={styles.loading}>Loading team…</ThemedText>
        ) : null}
        <SegmentedControl
          segments={[
            { key: 'drivers', label: `Drivers (${drivers.length})` },
            { key: 'clients', label: `Clients (${clients.length})` },
          ]}
          value={segment}
          onChange={setSegment}
        />
        {segment === 'drivers' ? <DriversSection drivers={drivers} /> : <ClientsSection clients={clients} />}
      </ScrollView>
    </ThemedView>
  );
}

function DriversSection({ drivers }: { drivers: Driver[] }) {
  if (drivers.length === 0) {
    return <EmptyState icon="truck" title="No drivers" message="No drivers assigned to this organization." />;
  }

  return (
    <Card padded={false} style={styles.list}>
      {drivers.map((driver, index) => (
        <ListRow
          key={driver.id}
          title={driver.name}
          subtitle={`${driver.licenseClass} · ${driver.totalProofs} proofs`}
          meta={driver.activeCampaigns > 0 ? `${driver.activeCampaigns} active` : undefined}
          leading={<AvatarBadge initials={driver.avatarInitials} size={36} />}
          trailing={<Badge label={driver.status} variant={driver.status === 'active' ? 'success' : 'neutral'} />}
          showDivider={index < drivers.length - 1}
        />
      ))}
    </Card>
  );
}

function ClientsSection({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return <EmptyState icon="briefcase" title="No clients" message="No clients registered for this organization." />;
  }

  return (
    <Card padded={false} style={styles.list}>
      {clients.map((client, index) => (
        <ListRow
          key={client.id}
          title={client.name}
          subtitle={`${client.contactName} · ${client.industry}`}
          meta={client.activeCampaigns > 0 ? `${client.activeCampaigns} active` : undefined}
          leading={<AvatarBadge initials={client.avatarInitials} size={36} />}
          trailing={<Badge label={client.status} variant={client.status === 'active' ? 'success' : 'neutral'} />}
          showDivider={index < clients.length - 1}
        />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  list: { overflow: 'hidden' },
  loading: { textAlign: 'center' },
});

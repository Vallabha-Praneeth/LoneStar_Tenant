import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import { getCampaignById, getClientsForTenant } from '../../constants/mockData';
import colors from '../../constants/colors';
import type { TenantTheme } from '../../constants/tenants';
import { useTenant } from '../../context/TenantContext';

export default function CampaignFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const radius = tenant?.radius ?? 8;
  const existing = id ? getCampaignById(id) : undefined;
  const clients = tenant ? getClientsForTenant(tenant.id) : [];
  const isEdit = Boolean(existing);
  const [name, setName] = React.useState(existing?.name ?? '');
  const [selectedClient, setSelectedClient] = React.useState(existing?.client ?? '');
  const [startDate, setStartDate] = React.useState(existing?.startDate ?? '');
  const [endDate, setEndDate] = React.useState(existing?.endDate ?? '');
  const [routes, setRoutes] = React.useState(existing?.routes ? String(existing.routes) : '');
  const [proofsRequired, setProofsRequired] = React.useState(existing?.proofsRequired ? String(existing.proofsRequired) : '');
  const [description, setDescription] = React.useState(existing?.description ?? '');
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitting(false);
    router.back();
  }

  const isValid = name.trim() && selectedClient && startDate && endDate;

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-campaign-form" testID="screen-admin-campaign-form">
      <AppHeader title={isEdit ? 'Edit Campaign' : 'New Campaign'} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
        </Card>

        <Card style={styles.section}>
          <ThemedText variant="label" color={theme.mutedForeground} style={styles.sectionTitle}>Client</ThemedText>
          <View style={styles.chipList}>
            {clients.map((client) => (
              <Pressable
                key={client.id}
                onPress={() => setSelectedClient(client.name)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: selectedClient === client.name ? theme.primary : theme.card,
                    borderColor: selectedClient === client.name ? theme.primary : theme.border,
                    borderRadius: radius,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText variant="label" color={selectedClient === client.name ? theme.primaryForeground : theme.foreground} numberOfLines={1}>
                  {client.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={styles.section}>
          <ThemedText variant="label" color={theme.mutedForeground} style={styles.sectionTitle}>Schedule & Scope</ThemedText>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Field label="Start Date" theme={theme} radius={radius}>
                <TextInput
                  style={[styles.input, { color: theme.foreground }]}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.mutedForeground}
                />
              </Field>
            </View>
            <View style={styles.halfField}>
              <Field label="End Date" theme={theme} radius={radius}>
                <TextInput
                  style={[styles.input, { color: theme.foreground }]}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.mutedForeground}
                />
              </Field>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Field label="Routes" theme={theme} radius={radius}>
                <TextInput
                  style={[styles.input, { color: theme.foreground }]}
                  value={routes}
                  onChangeText={setRoutes}
                  placeholder="0"
                  placeholderTextColor={theme.mutedForeground}
                  keyboardType="number-pad"
                />
              </Field>
            </View>
            <View style={styles.halfField}>
              <Field label="Proofs Required" theme={theme} radius={radius}>
                <TextInput
                  style={[styles.input, { color: theme.foreground }]}
                  value={proofsRequired}
                  onChangeText={setProofsRequired}
                  placeholder="0"
                  placeholderTextColor={theme.mutedForeground}
                  keyboardType="number-pad"
                />
              </Field>
            </View>
          </View>
        </Card>

        <Button label={isEdit ? 'Save Changes' : 'Create Campaign'} onPress={() => void handleSubmit()} loading={submitting} disabled={!isValid} />
        {isEdit ? <Button label="Delete Campaign" variant="destructive" onPress={() => router.back()} /> : null}
        <ThemedText variant="caption" color={theme.mutedForeground} style={styles.note}>
          PLACEHOLDER · Changes are not persisted. Backend not implemented.
        </ThemedText>
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
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  note: { textAlign: 'center' },
});

import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import colors from '../../constants/colors';
import {
  SUPABASE_ANON_KEY_VALUE,
  SUPABASE_REST_URL,
  fetchSupabaseRows,
} from '../../constants/supabase';
import type { TenantTheme } from '../../constants/tenants';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

interface CostTypeRow {
  id: string;
  name: string;
  is_active: boolean;
}

function createStyles(theme: TenantTheme, radius: number) {
  return StyleSheet.create({
    root: { flex: 1 },
    keyboardWrap: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
    createBar: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    inputWrap: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    input: { fontSize: 15, fontFamily: 'Inter_400Regular', color: theme.foreground },
    listContent: { gap: 10, paddingBottom: 12 },
    row: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    rowActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    actionPressed: { opacity: 0.6 },
    nameWrap: { flex: 1 },
    mutedText: { textAlign: 'left' },
    inactiveLabel: { marginLeft: 6 },
    rowToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  });
}

export default function CostTypesScreen() {
  const { accessToken, bootstrap } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const theme = tenant?.theme ?? colors.light;
  const radius = tenant?.radius ?? 8;
  const styles = React.useMemo(() => createStyles(theme, radius), [theme, radius]);
  const keyboardBehavior: 'padding' | undefined = Platform.OS === 'ios' ? 'padding' : undefined;
  const orgId = bootstrap?.organization?.id;
  const listContentStyle = React.useMemo(
    () => [styles.listContent, { paddingBottom: insets.bottom + 80 }],
    [insets.bottom, styles.listContent],
  );

  const [costTypes, setCostTypes] = React.useState<CostTypeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [saving, setSaving] = React.useState(false);

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

  const loadCostTypes = React.useCallback(async () => {
    if (!accessToken || !orgId) {
      setError('Missing auth context. Please sign in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchSupabaseRows<CostTypeRow>('cost_types', {
        select: 'id,name,is_active',
        organization_id: `eq.${orgId}`,
        order: 'name.asc',
      }, accessToken);
      setCostTypes(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load cost types.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, orgId]);

  React.useEffect(() => {
    void loadCostTypes();
  }, [loadCostTypes]);

  async function handleCreate() {
    if (!accessToken || !orgId) {
      setError('Missing auth context. Please sign in again.');
      return;
    }
    if (!newName.trim()) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${SUPABASE_REST_URL}/cost_types?select=id,name,is_active`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY_VALUE,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          organization_id: orgId,
          name: newName.trim(),
          is_active: true,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Could not create cost type.'));
      }

      const inserted = (await response.json()) as CostTypeRow[];
      if (inserted[0]) {
        setCostTypes((prev) => [...prev, inserted[0]].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setNewName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create cost type.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRename(item: CostTypeRow) {
    if (!accessToken || !orgId) {
      setError('Missing auth context. Please sign in again.');
      return;
    }
    if (!editName.trim()) {
      setError('Cost type name cannot be empty.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `${SUPABASE_REST_URL}/cost_types?id=eq.${item.id}&organization_id=eq.${orgId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: SUPABASE_ANON_KEY_VALUE,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ name: editName.trim() }),
        },
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Could not rename cost type.'));
      }

      setCostTypes((prev) =>
        prev
          .map((row) => (row.id === item.id ? { ...row, name: editName.trim() } : row))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
      setEditName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename cost type.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: CostTypeRow) {
    if (!accessToken || !orgId) {
      setError('Missing auth context. Please sign in again.');
      return;
    }

    const nextValue = !item.is_active;
    setCostTypes((prev) => prev.map((row) => (row.id === item.id ? { ...row, is_active: nextValue } : row)));

    try {
      const response = await fetch(
        `${SUPABASE_REST_URL}/cost_types?id=eq.${item.id}&organization_id=eq.${orgId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: SUPABASE_ANON_KEY_VALUE,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ is_active: nextValue }),
        },
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Could not update cost type.'));
      }
    } catch (err) {
      setCostTypes((prev) => prev.map((row) => (row.id === item.id ? { ...row, is_active: item.is_active } : row)));
      setError(err instanceof Error ? err.message : 'Could not update cost type.');
    }
  }

  function handleDelete(item: CostTypeRow) {
    if (!accessToken || !orgId) {
      setError('Missing auth context. Please sign in again.');
      return;
    }

    Alert.alert('Delete cost type?', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true);
            setError(null);
            try {
              const response = await fetch(
                `${SUPABASE_REST_URL}/cost_types?id=eq.${item.id}&organization_id=eq.${orgId}`,
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

              if (!response.ok) {
                const message = await readErrorMessage(response, 'Could not delete cost type.');
                if (message.toLowerCase().includes('foreign key')) {
                  throw new Error('Cannot delete: cost type has linked costs.');
                }
                throw new Error(message);
              }

              setCostTypes((prev) => prev.filter((row) => row.id !== item.id));
              if (editingId === item.id) {
                setEditingId(null);
                setEditName('');
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not delete cost type.');
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-cost-types" testID="screen-admin-cost-types">
      <AppHeader title="Cost Types" showBack onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.keyboardWrap} behavior={keyboardBehavior}>
        <View style={styles.content}>
          <View style={styles.createBar}>
            <View style={styles.inputWrap}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                style={styles.input}
                placeholder="Add new cost type"
                placeholderTextColor={theme.mutedForeground}
                accessibilityLabel="input-cost-type-new"
                testID="input-cost-type-new"
              />
            </View>
            <Button label="Add" onPress={() => void handleCreate()} disabled={!newName.trim() || saving} loading={saving} />
          </View>

          <ThemedText variant="caption" color={theme.mutedForeground}>
            Categories for campaign cost breakdowns. Amounts in dollars.
          </ThemedText>
          {error ? <ThemedText variant="caption" color={theme.mutedForeground} style={styles.mutedText}>{error}</ThemedText> : null}

          {loading ? (
            <ThemedText variant="body" color={theme.mutedForeground}>Loading cost types...</ThemedText>
          ) : costTypes.length === 0 ? (
            <EmptyState icon="tag" title="No cost types" message="Create a cost type to start tracking campaign expenses." />
          ) : (
            <FlatList
              data={costTypes}
              keyExtractor={(item) => item.id}
              contentContainerStyle={listContentStyle}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={styles.rowHeader}>
                    <View style={styles.nameWrap}>
                      {editingId === item.id ? (
                        <View style={styles.inputWrap}>
                          <TextInput value={editName} onChangeText={setEditName} style={styles.input} placeholder="Cost type name" placeholderTextColor={theme.mutedForeground} />
                        </View>
                      ) : (
                        <View style={styles.rowHeader}>
                          <ThemedText variant="label" color={item.is_active ? theme.foreground : theme.mutedForeground}>
                            {item.name}
                          </ThemedText>
                          {!item.is_active ? (
                            <ThemedText variant="caption" color={theme.mutedForeground} style={styles.inactiveLabel}>
                              (inactive)
                            </ThemedText>
                          ) : null}
                        </View>
                      )}
                    </View>
                    <View style={styles.rowActions}>
                      {editingId === item.id ? (
                        <Pressable onPress={() => void handleRename(item)} style={({ pressed }) => (pressed ? styles.actionPressed : null)}>
                          <ThemedText variant="label" color={theme.primary}>Save</ThemedText>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => {
                            setEditingId(item.id);
                            setEditName(item.name);
                          }}
                          style={({ pressed }) => (pressed ? styles.actionPressed : null)}
                        >
                          <ThemedText variant="label" color={theme.primary}>Edit</ThemedText>
                        </Pressable>
                      )}
                      <Pressable onPress={() => handleDelete(item)} style={({ pressed }) => (pressed ? styles.actionPressed : null)}>
                        <ThemedText variant="label" color={theme.destructive}>Delete</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.rowToggle}>
                    <ThemedText variant="caption" color={theme.mutedForeground}>Active</ThemedText>
                    <Switch
                      value={item.is_active}
                      onValueChange={() => void handleToggle(item)}
                      trackColor={{ false: theme.border, true: theme.accent }}
                      thumbColor={theme.card}
                    />
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

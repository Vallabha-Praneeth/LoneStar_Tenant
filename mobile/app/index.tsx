import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenMarker } from '../components/ScreenMarker';
import { TenantLogo } from '../components/TenantLogo';
import { TENANT_LIST, type TenantConfig } from '../constants/tenants';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';

export default function OrgSelectionScreen() {
  const { selectTenant, isLoading: tenantLoading, tenant } = useTenant();
  const { user, isLoading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  React.useEffect(() => {
    if (!tenantLoading && !authLoading && tenant && user) {
      router.replace(`/${groupForRole(user.role)}/home`);
    }
  }, [authLoading, tenant, tenantLoading, user]);

  async function handleSelect(nextTenant: TenantConfig) {
    await selectTenant(nextTenant.id);
    router.replace('/login');
  }

  if (tenantLoading || authLoading) {
    return (
      <View
        style={[styles.center, { paddingTop: topPad }]}
        accessibilityLabel="screen-org-selection-loading"
        testID="screen-org-selection-loading"
      >
        <ActivityIndicator size="large" color="#1B3A5C" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.root, { paddingTop: topPad + 24 }]}
      accessibilityLabel="screen-org-selection"
      testID="screen-org-selection"
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenMarker id="screen-org-selection" />
        <View style={styles.header}>
          <Text style={styles.appName}>Campaign Proof</Text>
          <Text style={styles.subtitle}>Select your organization to continue</Text>
        </View>

        <View style={styles.list}>
          {TENANT_LIST.map((candidate) => (
            <Pressable
              key={candidate.id}
              onPress={() => void handleSelect(candidate)}
              accessibilityLabel={`org-option-${candidate.id}`}
              testID={`org-option-${candidate.id}`}
              style={({ pressed }) => [
                styles.card,
                {
                  borderColor: pressed ? candidate.theme.primary : '#E2E8F0',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={styles.cardInner}>
                <TenantLogo tenant={candidate} size="md" />
                <View style={styles.cardText}>
                  <Text style={styles.orgName}>{candidate.name}</Text>
                  <Text style={styles.orgTagline}>{candidate.tagline}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#94A3B8" />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.demoNote}>
          <Feather name="info" size={12} color="#94A3B8" />
          <Text style={styles.demoNoteText}>
            Demo platform · PLACEHOLDER · No real tenant isolation
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function groupForRole(role: 'admin' | 'driver' | 'client') {
  return role === 'admin' ? '(admin)' : role === 'driver' ? '(driver)' : '(client)';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 32,
    gap: 6,
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  orgName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F172A',
  },
  orgTagline: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    lineHeight: 18,
  },
  demoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 40,
  },
  demoNoteText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
    textAlign: 'center',
  },
});

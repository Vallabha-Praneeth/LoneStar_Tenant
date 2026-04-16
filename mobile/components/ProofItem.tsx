import React from 'react';
import { StyleSheet, View } from 'react-native';
import colors from '../constants/colors';
import { type Proof, formatTime } from '../constants/mockData';
import { useTenant } from '../context/TenantContext';
import { ProofThumbnail } from './ProofThumbnail';
import { Badge } from './ui/Badge';
import { Divider } from './ui/Divider';
import { ThemedText } from './ui/ThemedText';

const STATUS_VARIANT: Record<Proof['status'], 'success'> = {
  uploaded: 'success',
};

interface ProofItemProps {
  proof: Proof;
  isLast?: boolean;
}

export function ProofItem({ proof, isLast }: ProofItemProps) {
  const { tenant } = useTenant();
  const theme = tenant?.theme ?? colors.light;

  return (
    <>
      <View style={styles.row}>
        <ProofThumbnail storagePath={proof.storagePath} size={42} />
        <View style={styles.details}>
          <View style={styles.top}>
            <ThemedText variant="label" style={styles.location}>
              {proof.location}
            </ThemedText>
            <Badge label={proof.status} variant={STATUS_VARIANT[proof.status]} />
          </View>
          <View style={styles.meta}>
            <ThemedText variant="caption" color={theme.mutedForeground}>
              {proof.driverName}
            </ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>
              ·
            </ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>
              {formatTime(proof.submittedAt)}
            </ThemedText>
          </View>
          {proof.notes ? (
            <ThemedText variant="caption" color={theme.mutedForeground} numberOfLines={1}>
              {proof.notes}
            </ThemedText>
          ) : null}
        </View>
      </View>
      {!isLast && <Divider inset={42} style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 10,
  },
  details: {
    flex: 1,
    gap: 3,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  location: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    marginLeft: 42,
  },
});

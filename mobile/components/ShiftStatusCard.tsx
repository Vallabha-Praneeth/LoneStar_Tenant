import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import colors from '../constants/colors';
import { type Shift } from '../constants/mockData';
import { useTenant } from '../context/TenantContext';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ThemedText } from './ui/ThemedText';

interface ShiftStatusCardProps {
  shift: Shift;
}

export function ShiftStatusCard({ shift }: ShiftStatusCardProps) {
  const { tenant } = useTenant();
  const theme = tenant?.theme ?? colors.light;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="truck" size={16} color={theme.primary} />
          <ThemedText variant="subheading">{shift.campaignName}</ThemedText>
        </View>
        <Badge
          label={shift.status === 'active' ? 'On Shift' : shift.status === 'pending' ? 'Pending' : 'Completed'}
          variant={shift.status === 'active' ? 'success' : shift.status === 'pending' ? 'warning' : 'neutral'}
        />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Feather name="clock" size={13} color={theme.mutedForeground} />
          <ThemedText variant="caption" color={theme.mutedForeground}>
            {shift.startTime
              ? `Started ${shift.startTime}${shift.endTime ? ` - ${shift.endTime}` : ' (ongoing)'}`
              : 'Not started'}
          </ThemedText>
        </View>
        {shift.startOdometer !== null ? (
          <View style={styles.detailRow}>
            <Feather name="activity" size={13} color={theme.mutedForeground} />
            <ThemedText variant="caption" color={theme.mutedForeground}>
              Odometer: {shift.startOdometer.toLocaleString()} mi
              {shift.endOdometer !== null ? ` -> ${shift.endOdometer.toLocaleString()} mi` : ''}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <Button
        label={shift.status === 'active' ? 'Manage Shift' : shift.status === 'pending' ? 'Start Shift' : 'View Shift'}
        variant={shift.status === 'active' ? 'primary' : 'secondary'}
        size="sm"
        onPress={() => router.push('/shift')}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  details: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

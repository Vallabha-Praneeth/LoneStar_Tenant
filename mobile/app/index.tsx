import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();

  React.useEffect(() => {
    if (isLoading) return;
    if (user) {
      const shell =
        user.role === 'admin' ? '/(admin)/home'
        : user.role === 'driver' ? '/(driver)/home'
        : '/(client)/home';
      router.replace(shell);
    } else {
      router.replace('/login');
    }
  }, [isLoading, user]);

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1B3A5C" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7FB',
  },
});

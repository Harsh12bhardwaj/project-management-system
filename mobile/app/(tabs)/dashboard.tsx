import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient, ApiError } from '../../lib/api';
import { removeStoredToken } from '../../lib/auth';
import { DashboardStats, User } from '../../types';

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [statsRes, userRes] = await Promise.all([
        apiClient<{ status: string; data: DashboardStats }>('/dashboard'),
        apiClient<{ status: string; data: { user: User } }>('/auth/me'),
      ]);
      setStats(statsRes.data);
      setUser(userRes.data.user);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load dashboard. Pull down to retry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient('/auth/logout', { method: 'POST' });
          } catch {
            // ignore network issues on logout
          }
          await removeStoredToken();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading workspace...</Text>
      </View>
    );
  }

  const cards = [
    {
      title: 'Total Projects',
      value: stats?.totalProjects ?? 0,
      icon: 'folder-outline' as const,
      color: '#4f46e5',
      bg: '#eef2ff',
    },
    {
      title: 'Projects In Progress',
      value: stats?.projectsInProgress ?? 0,
      icon: 'progress-clock' as const,
      color: '#0284c7',
      bg: '#e0f2fe',
    },
    {
      title: 'Total Tasks',
      value: stats?.totalTasks ?? 0,
      icon: 'checkbox-marked-outline' as const,
      color: '#9333ea',
      bg: '#f3e8ff',
    },
    {
      title: 'Pending Tasks',
      value: stats?.pendingTasks ?? 0,
      icon: 'clock-outline' as const,
      color: '#d97706',
      bg: '#fef3c7',
    },
    {
      title: 'Completed Tasks',
      value: stats?.completedTasks ?? 0,
      icon: 'check-circle-outline' as const,
      color: '#059669',
      bg: '#d1fae5',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
      }
    >
      {/* User Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.fullName?.[0]?.toUpperCase() || 'U'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#b91c1c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Metrics Section */}
      <Text style={styles.sectionTitle}>Overview Metrics</Text>
      <View style={styles.metricsGrid}>
        {cards.map((c, i) => (
          <View key={i} style={[styles.metricCard, { borderLeftColor: c.color }]}>
            <View style={[styles.iconBadge, { backgroundColor: c.bg }]}>
              <MaterialCommunityIcons name={c.icon} size={22} color={c.color} />
            </View>
            <View style={styles.metricData}>
              <Text style={styles.metricValue}>{c.value}</Text>
              <Text style={styles.metricTitle}>{c.title}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Action Navigation */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/projects')}
        >
          <MaterialCommunityIcons name="folder-plus-outline" size={28} color="#4f46e5" />
          <Text style={styles.actionTitle}>Manage Projects</Text>
          <Text style={styles.actionDesc}>View & organize projects</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/tasks')}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={28} color="#059669" />
          <Text style={styles.actionTitle}>Manage Tasks</Text>
          <Text style={styles.actionDesc}>Track task progress</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  userEmail: { fontSize: 13, color: '#64748b' },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: { color: '#b91c1c', fontSize: 13, flex: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
    marginTop: 4,
  },
  metricsGrid: { gap: 10, marginBottom: 20 },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  metricData: { flex: 1 },
  metricValue: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  metricTitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  actionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 8 },
  actionDesc: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 2 },
});

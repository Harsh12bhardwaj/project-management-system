import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient, ApiError } from '../../lib/api';
import { Task, Project, TaskPriority, TaskStatus } from '../../types';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const fetchTasks = useCallback(async () => {
    setError(null);
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        apiClient<{ status: string; data: { tasks: Task[] } }>('/tasks', {
          params: {
            search: search.trim() || undefined,
            status: statusFilter || undefined,
            priority: priorityFilter || undefined,
          },
        }),
        apiClient<{ status: string; data: { projects: Project[] } }>('/projects'),
      ]);
      setTasks(tasksRes.data.tasks);
      setProjects(projectsRes.data.projects);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load tasks. Pull down to retry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await apiClient(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update task');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Task', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient(`/tasks/${id}`, { method: 'DELETE' });
            fetchTasks();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'HIGH':
        return { label: 'High', color: '#dc2626', bg: '#fee2e2' };
      case 'MEDIUM':
        return { label: 'Medium', color: '#d97706', bg: '#fef3c7' };
      default:
        return { label: 'Low', color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const statuses = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  const priorities = [
    { label: 'All', value: '' },
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
  ];

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search tasks by name..."
          placeholderTextColor="#94a3b8"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status Filters */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Status:</Text>
        {statuses.map((s) => {
          const active = statusFilter === s.value;
          return (
            <TouchableOpacity
              key={s.value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(s.value)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Priority Filters */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Priority:</Text>
        {priorities.map((p) => {
          const active = priorityFilter === p.value;
          return (
            <TouchableOpacity
              key={p.value}
              style={[styles.filterChip, active && styles.filterChipActivePriority]}
              onPress={() => setPriorityFilter(p.value)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="checkbox-marked-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>
                {search || statusFilter || priorityFilter
                  ? 'Try clearing your filters'
                  : 'Tap the + button to create a task'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const priorityBadge = getPriorityBadge(item.priority);
            const isCompleted = item.status === 'COMPLETED';
            const projectName = projectMap.get(item.projectId) || 'Project';

            return (
              <View style={styles.card}>
                <View style={styles.cardMain}>
                  <TouchableOpacity
                    style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
                    onPress={() => toggleTaskStatus(item)}
                  >
                    {isCompleted && (
                      <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>

                  <View style={styles.taskInfo}>
                    <Text
                      style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>

                    <Text style={styles.projectTag} numberOfLines={1}>
                      📁 {projectName}
                    </Text>

                    {item.description ? (
                      <Text style={styles.taskDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: priorityBadge.bg }]}>
                      <Text style={[styles.badgeText, { color: priorityBadge.color }]}>
                        {priorityBadge.label}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            item.status === 'COMPLETED'
                              ? '#d1fae5'
                              : item.status === 'IN_PROGRESS'
                              ? '#e0f2fe'
                              : '#fef3c7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              item.status === 'COMPLETED'
                                ? '#059669'
                                : item.status === 'IN_PROGRESS'
                                ? '#0284c7'
                                : '#d97706',
                          },
                        ]}
                      >
                        {item.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => router.push({ pathname: '/tasks/edit', params: { id: item.id } })}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={16} color="#4f46e5" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDelete(item.id, item.name)}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (projects.length === 0) {
            Alert.alert('No Projects', 'Please create a project first before adding tasks.', [
              { text: 'Create Project', onPress: () => router.push('/projects/create') },
              { text: 'Cancel', style: 'cancel' },
            ]);
            return;
          }
          router.push('/tasks/create');
        }}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 42, fontSize: 14, color: '#0f172a' },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 6,
    gap: 6,
  },
  filterLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', width: 50 },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterChipActivePriority: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  filterChipText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  filterChipTextActive: { color: '#ffffff' },
  list: { padding: 16, paddingTop: 6 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBanner: {
    marginHorizontal: 16,
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: { color: '#b91c1c', fontSize: 13 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardMain: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#94a3b8' },
  projectTag: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '500' },
  taskDesc: { fontSize: 12, color: '#64748b', marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { padding: 5, borderRadius: 6, backgroundColor: '#f8fafc' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});

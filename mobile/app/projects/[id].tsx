import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient, ApiError } from '../../lib/api';
import { Project, Task, TaskPriority, TaskStatus } from '../../types';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [projRes, tasksRes] = await Promise.all([
        apiClient<{ status: string; data: { project: Project } }>(`/projects/${id}`),
        apiClient<{ status: string; data: { tasks: Task[] } }>('/tasks', {
          params: { projectId: id },
        }),
      ]);
      setProject(projRes.data.project);
      setTasks(tasksRes.data.tasks);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load project details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await apiClient(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = (taskId: string, name: string) => {
    Alert.alert('Delete Task', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient(`/tasks/${taskId}`, { method: 'DELETE' });
            fetchData();
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Project Header Info */}
      <View style={styles.projectHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.projectName}>{project?.name}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {project?.status?.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {project?.description ? (
          <Text style={styles.projectDesc}>{project.description}</Text>
        ) : null}

        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-outline" size={14} color="#64748b" />
          <Text style={styles.dateText}>
            {project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} -{' '}
            {project?.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Tasks Header Bar */}
      <View style={styles.tasksBar}>
        <Text style={styles.tasksTitle}>Project Tasks ({tasks.length})</Text>
        <TouchableOpacity
          style={styles.addTaskBtn}
          onPress={() => router.push({ pathname: '/tasks/create', params: { projectId: id } })}
        >
          <MaterialCommunityIcons name="plus" size={16} color="#ffffff" />
          <Text style={styles.addTaskText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Task List */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="checkbox-marked-outline" size={44} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No tasks under this project</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push({ pathname: '/tasks/create', params: { projectId: id } })}
            >
              <Text style={styles.emptyButtonText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const priorityBadge = getPriorityBadge(item.priority);
          const isCompleted = item.status === 'COMPLETED';

          return (
            <View style={styles.taskCard}>
              <View style={styles.taskCardMain}>
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
                  {item.description ? (
                    <Text style={styles.taskDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.taskCardFooter}>
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
                    onPress={() => handleDeleteTask(item.id, item.name)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  projectHeader: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projectName: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', flex: 1, marginRight: 8 },
  statusBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { color: '#4f46e5', fontSize: 11, fontWeight: '700' },
  projectDesc: { fontSize: 13, color: '#64748b', marginTop: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  dateText: { fontSize: 12, color: '#64748b' },
  tasksBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tasksTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addTaskText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  errorBanner: { margin: 16, backgroundColor: '#fee2e2', padding: 10, borderRadius: 8 },
  errorText: { color: '#b91c1c', fontSize: 13 },
  list: { padding: 16, paddingTop: 4 },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskCardMain: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 10,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: { backgroundColor: '#059669', borderColor: '#059669' },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#94a3b8' },
  taskDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { padding: 4, borderRadius: 4, backgroundColor: '#f8fafc' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  emptyButton: {
    marginTop: 10,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyButtonText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
});

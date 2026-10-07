import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiClient, ApiError } from '../../lib/api';
import { Project, Task, TaskPriority, TaskStatus } from '../../types';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [dueDate, setDueDate] = useState('');
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const [taskRes, projectsRes] = await Promise.all([
          apiClient<{ status: string; data: { task: Task } }>(`/tasks/${id}`),
          apiClient<{ status: string; data: { projects: Project[] } }>('/projects'),
        ]);

        const t = taskRes.data.task;
        setProjects(projectsRes.data.projects);
        setSelectedProjectId(t.projectId);
        setName(t.name);
        setDescription(t.description || '');
        setPriority(t.priority);
        setStatus(t.status);
        setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '');
      } catch (err: any) {
        setError(err.message || 'Failed to load task details');
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [id]);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Task name is required.');
      return;
    }

    setLoading(true);
    try {
      await apiClient(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          projectId: selectedProjectId,
          name: name.trim(),
          description: description.trim() || null,
          priority,
          status,
          dueDate: dueDate.trim() ? new Date(dueDate.trim()).toISOString() : null,
        }),
      });

      router.back();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update task.');
      }
    } finally {
      setLoading(false);
    }
  };

  const priorities: { label: string; value: TaskPriority }[] = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
  ];

  const statuses: { label: string; value: TaskStatus }[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  if (fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Project Selector */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Project</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectScroll}>
          {projects.map((p) => {
            const active = selectedProjectId === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.projectChip, active && styles.projectChipActive]}
                onPress={() => setSelectedProjectId(p.id)}
              >
                <Text style={[styles.projectChipText, active && styles.projectChipTextActive]}>
                  📁 {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Task Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Implement authentication"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Notes or acceptance criteria"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.choiceRow}>
          {priorities.map((p) => {
            const active = priority === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                style={[styles.choiceChip, active && styles.choiceChipActive]}
                onPress={() => setPriority(p.value)}
              >
                <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.choiceRow}>
          {statuses.map((s) => {
            const active = status === s.value;
            return (
              <TouchableOpacity
                key={s.value}
                style={[styles.choiceChip, active && styles.choiceChipActive]}
                onPress={() => setStatus(s.value)}
              >
                <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="2026-10-15"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitBtnText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { color: '#b91c1c', fontSize: 13 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  projectScroll: { flexDirection: 'row', marginTop: 4 },
  projectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
    backgroundColor: '#f8fafc',
  },
  projectChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  projectChipText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  projectChipTextActive: { color: '#ffffff' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  textArea: { height: 70, textAlignVertical: 'top' },
  choiceRow: { flexDirection: 'row', gap: 8 },
  choiceChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  choiceChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  choiceChipText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  choiceChipTextActive: { color: '#ffffff' },
  submitBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
});

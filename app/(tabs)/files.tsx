import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { FileText, Trash2, FolderOpen, AlertCircle, Clock, HardDrive } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

interface LogFile {
  id: string;
  file_name: string;
  file_size: number | null;
  log_type: string | null;
  error_count: number;
  warning_count: number;
  created_at: string;
}

export default function FilesScreen() {
  const [files, setFiles] = useState<LogFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const fetchFiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('log_analyses')
        .select('id, file_name, file_size, log_type, error_count, warning_count, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching files:', error);
        return;
      }

      setFiles(data || []);
    } catch (err) {
      console.error('Exception fetching files:', err);
    }
  }, []);

  useEffect(() => {
    fetchFiles().finally(() => setLoading(false));
  }, [fetchFiles]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFiles();
    setRefreshing(false);
  }, [fetchFiles]);

  const deleteFile = async (id: string, fileName: string) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${fileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(id);
            try {
              const { error } = await supabase.from('log_analyses').delete().eq('id', id);
              if (error) {
                Alert.alert('Error', 'Failed to delete file');
              } else {
                setFiles(prev => prev.filter(f => f.id !== id));
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete file');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (logType: string | null) => {
    if (!logType) return <FileText size={24} color="#6B7280" />;
    if (logType.toLowerCase().includes('android')) return <FileText size={24} color="#3DDC84" />;
    if (logType.toLowerCase().includes('exception')) return <AlertCircle size={24} color="#EF4444" />;
    if (logType.toLowerCase().includes('kernel')) return <FileText size={24} color="#8B5CF6" />;
    return <FileText size={24} color="#3B82F6" />;
  };

  const renderItem = ({ item }: { item: LogFile }) => (
    <TouchableOpacity
      style={styles.fileCard}
      onPress={() => router.push(`/history/detail?id=${item.id}`)}
      activeOpacity={0.7}>
      <View style={styles.fileIconContainer}>
        {getFileIcon(item.log_type)}
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.file_name}
        </Text>
        <View style={styles.fileMeta}>
          <Clock size={12} color="#9CA3AF" />
          <Text style={styles.fileMetaText}>{formatDate(item.created_at)}</Text>
          <HardDrive size={12} color="#9CA3AF" />
          <Text style={styles.fileMetaText}>{formatFileSize(item.file_size)}</Text>
        </View>
        {item.log_type && (
          <Text style={styles.logType}>{item.log_type}</Text>
        )}
        <View style={styles.statsRow}>
          {item.error_count > 0 && (
            <View style={[styles.badge, styles.errorBadge]}>
              <Text style={styles.badgeText}>{item.error_count} errors</Text>
            </View>
          )}
          {item.warning_count > 0 && (
            <View style={[styles.badge, styles.warningBadge]}>
              <Text style={styles.badgeText}>{item.warning_count} warnings</Text>
            </View>
          )}
          {item.error_count === 0 && item.warning_count === 0 && (
            <View style={[styles.badge, styles.cleanBadge]}>
              <Text style={styles.badgeText}>Clean</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteFile(item.id, item.file_name)}
        disabled={deleting === item.id}>
        {deleting === item.id ? (
          <ActivityIndicator size="small" color="#EF4444" />
        ) : (
          <Trash2 size={20} color="#EF4444" />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <FolderOpen size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>No Files Yet</Text>
      <Text style={styles.emptySubtitle}>
        Analyzed log files will appear here. Go to the Analyze tab to get started.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading files...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Files</Text>
        <Text style={styles.subtitle}>
          {files.length} {files.length === 1 ? 'file' : 'files'} saved
        </Text>
      </View>

      <FlatList
        data={files}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#111827',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#111827',
    marginBottom: 4,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  fileMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 8,
  },
  logType: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  errorBadge: {
    backgroundColor: '#FEE2E2',
  },
  warningBadge: {
    backgroundColor: '#FEF3C7',
  },
  cleanBadge: {
    backgroundColor: '#D1FAE5',
  },
  badgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});

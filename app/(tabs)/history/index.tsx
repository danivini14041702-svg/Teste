import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { FileText, Trash2, AlertCircle, AlertTriangle, Calendar, Clock, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

interface LogAnalysis {
  id: string;
  file_name: string;
  file_size: number;
  log_content: string;
  analysis_result: string;
  log_type: string;
  error_count: number;
  warning_count: number;
  created_at: string;
}

export default function HistoryScreen() {
  const [analyses, setAnalyses] = useState<LogAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchAnalyses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('log_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalyses();
    setRefreshing(false);
  }, [fetchAnalyses]);

  const deleteAnalysis = async (id: string) => {
    Alert.alert(
      'Excluir Analise',
      'Tem certeza que deseja excluir esta analise?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('log_analyses')
                .delete()
                .eq('id', id);

              if (error) throw error;
              setAnalyses(prev => prev.filter(a => a.id !== id));
            } catch (error) {
              console.error('Error deleting analysis:', error);
              Alert.alert('Erro', 'Falha ao excluir analise');
            }
          },
        },
      ]
    );
  };

  const openDetail = (item: LogAnalysis) => {
    router.push({
      pathname: '/(tabs)/history/detail',
      params: {
        id: item.id,
        fileName: item.file_name,
        logType: item.log_type,
        logContent: item.log_content || '',
        analysisResult: item.analysis_result || '',
        errorCount: item.error_count.toString(),
        warningCount: item.warning_count.toString(),
        fileSize: item.file_size.toString(),
        createdAt: item.created_at,
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? 'Agora' : `${minutes} min atras`;
      }
      return `${hours}h atras`;
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return `${days} dias atras`;
    }
    return date.toLocaleDateString('pt-BR');
  };

  const AnalysisItem = ({ item }: { item: LogAnalysis }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => openDetail(item)}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <FileText size={20} color="#3B82F6" />
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.file_name}
            </Text>
            <Text style={styles.cardMeta}>{item.log_type}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteAnalysis(item.id)}>
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
            <ChevronRight size={20} color="#9CA3AF" />
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <AlertCircle size={14} color={item.error_count > 0 ? '#EF4444' : '#9CA3AF'} />
            <Text style={[styles.statText, item.error_count > 0 && styles.statError]}>
              {item.error_count} erros
            </Text>
          </View>
          <View style={styles.statItem}>
            <AlertTriangle size={14} color={item.warning_count > 0 ? '#F59E0B' : '#9CA3AF'} />
            <Text style={[styles.statText, item.warning_count > 0 && styles.statWarning]}>
              {item.warning_count} avisos
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateContainer}>
            <Clock size={12} color="#9CA3AF" />
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
          {item.error_count > 0 && (
            <Text style={styles.tapHint}>Toque para ver detalhes</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historico</Text>
        <Text style={styles.subtitle}>
          {analyses.length} {analyses.length === 1 ? 'analise salva' : 'analises salvas'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      ) : analyses.length === 0 ? (
        <View style={styles.centered}>
          <FileText size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Nenhuma Analise Ainda</Text>
          <Text style={styles.emptyText}>
            Analise um arquivo de log para ver aqui
          </Text>
        </View>
      ) : (
        <FlatList
          data={analyses}
          renderItem={AnalysisItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#111827',
  },
  cardMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardStats: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  statError: {
    color: '#EF4444',
  },
  statWarning: {
    color: '#F59E0B',
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tapHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#3B82F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
});

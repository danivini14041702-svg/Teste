import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Wrench,
  Shield,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Coffee,
  Wind,
  Download,
  Info,
} from 'lucide-react-native';
import { matchErrorsFromDatabase, getSeverityColor, getSeverityLabel, getCategoryLabel, ErrorPattern } from '@/lib/errorDatabase';

export default function DetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [matchedErrors, setMatchedErrors] = useState<ErrorPattern[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    fileName = 'Unknown',
    logType = 'Unknown',
    logContent = '',
    errorCount = '0',
    warningCount = '0',
    fileSize = '0',
  } = params;

  useEffect(() => {
    const loadErrors = async () => {
      setLoading(true);
      const errors = await matchErrorsFromDatabase(logContent as string);
      setMatchedErrors(errors);
      setLoading(false);
    };
    loadErrors();
  }, [logContent]);

  const toggleErrorExpansion = (errorId: string) => {
    setExpandedErrors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(errorId)) {
        newSet.delete(errorId);
      } else {
        newSet.add(errorId);
      }
      return newSet;
    });
  };

  const getSeverityIcon = (severity: string) => {
    const color = getSeverityColor(severity);
    switch (severity) {
      case 'critical':
        return <Shield size={16} color={color} />;
      case 'high':
        return <AlertCircle size={16} color={color} />;
      case 'medium':
        return <AlertTriangle size={16} color={color} />;
      case 'low':
        return <Info size={16} color={color} />;
      default:
        return <Info size={16} color={color} />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'android':
        return <Smartphone size={14} color="#10B981" />;
      case 'java':
        return <Coffee size={14} color="#3B82F6" />;
      case 'flutter':
        return <Wind size={14} color="#0EA5E9" />;
      case 'install':
        return <Download size={14} color="#8B5CF6" />;
      default:
        return <Info size={14} color="#6B7280" />;
    }
  };

  const ErrorCard = ({ explanation }: { explanation: ErrorPattern }) => {
    const isExpanded = expandedErrors.has(explanation.id);
    const severityColor = getSeverityColor(explanation.severity);

    return (
      <View style={styles.errorCard}>
        <TouchableOpacity
          style={styles.errorHeader}
          onPress={() => toggleErrorExpansion(explanation.id)}
          activeOpacity={0.7}>
          <View style={styles.errorHeaderLeft}>
            {getSeverityIcon(explanation.severity)}
            <View style={styles.errorTitleContainer}>
              <Text style={styles.errorTitle}>{explanation.error_name}</Text>
              <View style={styles.errorBadges}>
                <View style={styles.categoryBadge}>
                  {getCategoryIcon(explanation.category)}
                  <Text style={styles.categoryText}>{getCategoryLabel(explanation.category)}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
                  <Text style={[styles.severityText, { color: severityColor }]}>
                    {getSeverityLabel(explanation.severity)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color="#9CA3AF" />
          ) : (
            <ChevronDown size={20} color="#9CA3AF" />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.errorContent}>
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>O que significa</Text>
              <Text style={styles.sectionText}>{explanation.what_it_means}</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={styles.sectionHeader}>Causas comuns</Text>
              </View>
              {explanation.common_causes.map((cause, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listBullet} />
                  <Text style={styles.listText}>{cause}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Wrench size={16} color="#10B981" />
                <Text style={styles.sectionHeader}>Possiveis solucoes</Text>
              </View>
              {explanation.possible_solutions.map((solution, index) => (
                <View key={index} style={styles.solutionItem}>
                  <View style={styles.solutionBullet}>
                    <CheckCircle size={12} color="#10B981" />
                  </View>
                  <Text style={styles.solutionText}>{solution}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Detalhes do Erro</Text>
          <Text style={styles.subtitle}>Analise em Portugues</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.fileInfo}>
          <View style={styles.fileHeader}>
            <FileText size={24} color="#3B82F6" />
            <View style={styles.fileDetails}>
              <Text style={styles.fileName}>{fileName}</Text>
              <Text style={styles.fileMeta}>
                {logType} • {(Number(fileSize) / 1024).toFixed(1)} KB
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <AlertCircle size={16} color={Number(errorCount) > 0 ? '#EF4444' : '#9CA3AF'} />
              <Text style={[styles.statChipText, Number(errorCount) > 0 && styles.statChipError]}>
                {errorCount} erros
              </Text>
            </View>
            <View style={styles.statChip}>
              <AlertTriangle size={16} color={Number(warningCount) > 0 ? '#F59E0B' : '#9CA3AF'} />
              <Text style={[styles.statChipText, Number(warningCount) > 0 && styles.statChipWarning]}>
                {warningCount} avisos
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.introSection}>
          <Lightbulb size={20} color="#F59E0B" />
          <Text style={styles.introText}>
            Toque em cada erro abaixo para ver uma explicacao simples em portugues.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Consultando banco de dados...</Text>
          </View>
        ) : matchedErrors.length === 0 ? (
          <View style={styles.noErrorsBox}>
            <CheckCircle size={24} color="#10B981" />
            <Text style={styles.noErrorsText}>
              Nenhum erro conhecido detectado neste log.
            </Text>
          </View>
        ) : (
          <View style={styles.errorsSection}>
            <Text style={styles.errorsTitle}>Erros Detectados ({matchedErrors.length})</Text>
            {matchedErrors.map((error) => (
              <ErrorCard key={error.id} explanation={error} />
            ))}
          </View>
        )}

        {!loading && matchedErrors.length > 0 && (
          <TouchableOpacity
            style={styles.expandAllButton}
            onPress={() => {
              if (expandedErrors.size === matchedErrors.length) {
                setExpandedErrors(new Set());
              } else {
                setExpandedErrors(new Set(matchedErrors.map((e) => e.id)));
              }
            }}>
            <Text style={styles.expandAllText}>
              {expandedErrors.size === matchedErrors.length ? 'Recolher todos' : 'Expandir todos'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#111827',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  fileInfo: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
  },
  fileMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  statChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#6B7280',
  },
  statChipError: {
    color: '#EF4444',
    fontFamily: 'Inter-SemiBold',
  },
  statChipWarning: {
    color: '#F59E0B',
    fontFamily: 'Inter-SemiBold',
  },
  introSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  introText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  errorsSection: {
    marginHorizontal: 20,
  },
  errorsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#111827',
    marginBottom: 12,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  errorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  errorTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  errorTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#111827',
  },
  errorBadges: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  categoryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#6B7280',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  severityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
  errorContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  listBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 7,
    marginRight: 10,
  },
  listText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  solutionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  solutionBullet: {
    marginTop: 2,
    marginRight: 10,
  },
  solutionText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#059669',
    lineHeight: 20,
  },
  noErrorsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  noErrorsText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#166534',
  },
  expandAllButton: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  expandAllText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 40,
  },
});

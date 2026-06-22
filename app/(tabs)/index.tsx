import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { FileText, Upload, AlertCircle, AlertTriangle, Info, CheckCircle, Zap } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import Markdown from 'react-native-markdown-display';

interface LogAnalysis {
  fileName: string;
  fileSize: number;
  content: string;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  debugCount: number;
  analysis: string;
  logType: string;
  keyIssues: string[];
  suggestions: string[];
}

export default function AnalyzeScreen() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LogAnalysis | null>(null);
  const router = useRouter();

  const detectLogType = (content: string): string => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('androidruntime') || lowerContent.includes('dalvikvm') || lowerContent.includes('activitymanager')) {
      return 'Android System Log';
    }
    if (lowerContent.includes('logcat')) {
      return 'Logcat Output';
    }
    if (lowerContent.includes('exception') && lowerContent.includes('stack trace')) {
      return 'Exception Stack Trace';
    }
    if (lowerContent.includes('kernel') || lowerContent.includes('dmesg')) {
      return 'Kernel Log';
    }
    if (lowerContent.includes('[error]') || lowerContent.includes('[warn]')) {
      return 'Application Log';
    }
    if (lowerContent.includes('{') && lowerContent.includes('}') && (lowerContent.includes('"level"') || lowerContent.includes('"msg"'))) {
      return 'JSON Format Log';
    }
    return 'Generic Log File';
  };

  const countLogLevels = (content: string) => {
    const lines = content.split('\n');
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let debugCount = 0;

    const errorPatterns = [
      /\bE\//, /ERROR/i, /FATAL/i, /Exception/i, /SEVERE/i, /error/i,
      /CRITICAL/i, /fail/i, /failed/i, /failures/i
    ];
    const warningPatterns = [
      /\bW\//, /WARN/i, /WARNING/i, /warn/i
    ];
    const infoPatterns = [
      /\bI\//, /INFO/i, /info/i
    ];
    const debugPatterns = [
      /\bD\//, /DEBUG/i, /debug/i, /VERBOSE/i, /\bV\//
    ];

    lines.forEach(line => {
      if (errorPatterns.some(p => p.test(line))) errorCount++;
      else if (warningPatterns.some(p => p.test(line))) warningCount++;
      else if (infoPatterns.some(p => p.test(line))) infoCount++;
      else if (debugPatterns.some(p => p.test(line))) debugCount++;
    });

    return { errorCount, warningCount, infoCount, debugCount };
  };

  const extractKeyIssues = (content: string): string[] => {
    const issues: string[] = [];
    const lines = content.split('\n');
    const seenIssues = new Set<string>();

    lines.forEach(line => {
      if (/Exception/i.test(line) && !seenIssues.has(line.trim().substring(0, 100))) {
        const issue = line.trim().substring(0, 150);
        if (!seenIssues.has(issue)) {
          seenIssues.add(issue);
          if (issues.length < 5) issues.push(issue);
        }
      }
      if (/FATAL/i.test(line) && issues.length < 5) {
        const issue = line.trim().substring(0, 150);
        if (!seenIssues.has(issue)) {
          seenIssues.add(issue);
          issues.push(issue);
        }
      }
    });

    if (issues.length === 0) {
      const errorLines = lines.filter(l => /error/i.test(l)).slice(0, 3);
      errorLines.forEach(l => {
        const issue = l.trim().substring(0, 150);
        if (!seenIssues.has(issue)) {
          seenIssues.add(issue);
          issues.push(issue);
        }
      });
    }

    return issues;
  };

  const generateSuggestions = (logType: string, errorCount: number, warningCount: number, issues: string[]): string[] => {
    const suggestions: string[] = [];

    if (errorCount > 0) {
      suggestions.push(`Found ${errorCount} error entries. Review these first for critical issues.`);
    }
    if (warningCount > 10) {
      suggestions.push(`High warning count (${warningCount}). Consider investigating recurring warnings.`);
    }

    if (logType === 'Android System Log') {
      suggestions.push('Check ActivityManager entries for app lifecycle issues.');
      suggestions.push('Look for ANR (Application Not Responding) traces if UI freezes are reported.');
    }

    if (issues.some(i => i.toLowerCase().includes('nullpointer'))) {
      suggestions.push('NullPointerException detected. Check for uninitialized objects or missing null checks.');
    }
    if (issues.some(i => i.toLowerCase().includes('outofmemory'))) {
      suggestions.push('OutOfMemoryError found. Consider optimizing memory usage or checking for memory leaks.');
    }
    if (issues.some(i => i.toLowerCase().includes('network')) || issues.some(i => i.toLowerCase().includes('socket'))) {
      suggestions.push('Network-related issues detected. Check connectivity and timeout configurations.');
    }

    suggestions.push('Use log filtering to focus on specific tags or processes.');

    return suggestions.slice(0, 6);
  };

  const generateAnalysis = (
    content: string,
    logType: string,
    counts: { errorCount: number; warningCount: number; infoCount: number; debugCount: number },
    issues: string[],
    suggestions: string[]
  ): string => {
    const totalLines = content.split('\n').length;
    const totalEntries = counts.errorCount + counts.warningCount + counts.infoCount + counts.debugCount;

    let analysis = `## Log Analysis Summary\n\n`;
    analysis += `**Log Type:** ${logType}\n`;
    analysis += `**Total Lines:** ${totalLines.toLocaleString()}\n\n`;

    analysis += `### Entry Distribution\n`;
    analysis += `- Errors: ${counts.errorCount}\n`;
    analysis += `- Warnings: ${counts.warningCount}\n`;
    analysis += `- Info: ${counts.infoCount}\n`;
    analysis += `- Debug: ${counts.debugCount}\n\n`;

    if (counts.errorCount > 0) {
      const errorPercentage = ((counts.errorCount / totalLines) * 100).toFixed(1);
      analysis += `### Health Status\n`;
      analysis += `Error rate: ${errorPercentage}% of total lines.\n`;
      if (counts.errorCount > 50) {
        analysis += `**Warning:** High error count detected. This log indicates significant issues.\n`;
      } else if (counts.errorCount > 10) {
        analysis += `**Notice:** Moderate error count. Some issues need attention.\n`;
      } else {
        analysis += `**Info:** Low error count. System appears generally stable.\n`;
      }
    }

    return analysis;
  };

  const analyzeLog = useCallback((content: string, fileName: string, fileSize: number): LogAnalysis => {
    const logType = detectLogType(content);
    const counts = countLogLevels(content);
    const keyIssues = extractKeyIssues(content);
    const suggestions = generateSuggestions(logType, counts.errorCount, counts.warningCount, keyIssues);
    const analysis = generateAnalysis(content, logType, counts, keyIssues, suggestions);

    return {
      fileName,
      fileSize,
      content,
      errorCount: counts.errorCount,
      warningCount: counts.warningCount,
      infoCount: counts.infoCount,
      debugCount: counts.debugCount,
      analysis,
      logType,
      keyIssues,
      suggestions,
    };
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFile(file.name);
      setIsAnalyzing(true);

      // Read file content
      const response = await fetch(file.uri);
      const content = await response.text();
      const analysisResult = analyzeLog(content, file.name, file.size ?? 0);

      setAnalysis(analysisResult);

      // Save to Supabase
      const { error } = await supabase.from('log_analyses').insert({
        file_name: file.name,
        file_size: file.size ?? 0,
        log_content: content.substring(0, 50000), // Limit stored content
        analysis_result: analysisResult.analysis,
        log_type: analysisResult.logType,
        error_count: analysisResult.errorCount,
        warning_count: analysisResult.warningCount,
      });

      if (error) {
        console.error('Failed to save analysis:', error);
      }

    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to read the file. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Analyzer</Text>
        <Text style={styles.subtitle}>Open and analyze Android log files</Text>
      </View>

      {!analysis ? (
        <View style={styles.emptyState}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickDocument}
            disabled={isAnalyzing}
            activeOpacity={0.8}>
            {isAnalyzing ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.uploadIconContainer}>
                  <Upload size={40} color="#FFFFFF" />
                </View>
                <Text style={styles.uploadTitle}>Select Log File</Text>
                <Text style={styles.uploadSubtitle}>
                  Tap to browse .log, .txt, or other files
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.supportedFormats}>
            <Text style={styles.supportedTitle}>Supported Logs</Text>
            <View style={styles.formatsList}>
              <View style={styles.formatItem}>
                <FileText size={16} color="#6B7280" />
                <Text style={styles.formatText}>Logcat Output</Text>
              </View>
              <View style={styles.formatItem}>
                <FileText size={16} color="#6B7280" />
                <Text style={styles.formatText}>Android Runtime</Text>
              </View>
              <View style={styles.formatItem}>
                <FileText size={16} color="#6B7280" />
                <Text style={styles.formatText}>Kernel Logs</Text>
              </View>
              <View style={styles.formatItem}>
                <FileText size={16} color="#6B7280" />
                <Text style={styles.formatText}>Exception Traces</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.resultContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.fileInfo}>
            <View style={styles.fileHeader}>
              <FileText size={24} color="#3B82F6" />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName}>{analysis.fileName}</Text>
                <Text style={styles.fileMeta}>
                  {analysis.logType} • {(analysis.fileSize / 1024).toFixed(1)} KB
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, analysis.errorCount > 0 && styles.statCardError]}>
              <AlertCircle size={20} color={analysis.errorCount > 0 ? '#EF4444' : '#9CA3AF'} />
              <Text style={[styles.statNumber, analysis.errorCount > 0 && styles.statNumberError]}>
                {analysis.errorCount}
              </Text>
              <Text style={styles.statLabel}>Errors</Text>
            </View>
            <View style={[styles.statCard, analysis.warningCount > 0 && styles.statCardWarning]}>
              <AlertTriangle size={20} color={analysis.warningCount > 0 ? '#F59E0B' : '#9CA3AF'} />
              <Text style={[styles.statNumber, analysis.warningCount > 0 && styles.statNumberWarning]}>
                {analysis.warningCount}
              </Text>
              <Text style={styles.statLabel}>Warnings</Text>
            </View>
            <View style={styles.statCard}>
              <Info size={20} color="#3B82F6" />
              <Text style={styles.statNumber}>{analysis.infoCount}</Text>
              <Text style={styles.statLabel}>Info</Text>
            </View>
            <View style={styles.statCard}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.statNumber}>{analysis.debugCount}</Text>
              <Text style={styles.statLabel}>Debug</Text>
            </View>
          </View>

          {/* Analysis Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analysis</Text>
            <View style={styles.analysisBox}>
              <Markdown style={markdownStyles}>{analysis.analysis}</Markdown>
            </View>
          </View>

          {/* Key Issues */}
          {analysis.keyIssues.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Issues Found</Text>
              {analysis.keyIssues.map((issue, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.issueItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/history/detail',
                      params: {
                        fileName: analysis.fileName,
                        logType: analysis.logType,
                        logContent: analysis.content,
                        errorCount: analysis.errorCount.toString(),
                        warningCount: analysis.warningCount.toString(),
                        fileSize: analysis.fileSize.toString(),
                      },
                    });
                  }}>
                  <View style={styles.issueBullet} />
                  <Text style={styles.issueText}>{issue}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {analysis.suggestions.map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <Zap size={16} color="#F59E0B" />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Analyze Another */}
          <TouchableOpacity
            style={styles.newAnalysisButton}
            onPress={() => {
              setAnalysis(null);
              setSelectedFile(null);
            }}>
            <Text style={styles.newAnalysisButtonText}>Analyze Another Log</Text>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
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
  emptyState: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  uploadButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  supportedFormats: {
    marginTop: 40,
  },
  supportedTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
  },
  formatsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  formatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formatText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fileInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardError: {
    backgroundColor: '#FEF2F2',
  },
  statCardWarning: {
    backgroundColor: '#FFFBEB',
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#111827',
    marginTop: 4,
  },
  statNumberError: {
    color: '#EF4444',
  },
  statNumberWarning: {
    color: '#F59E0B',
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  analysisBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  analysisText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  issueBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 6,
    marginRight: 10,
  },
  issueText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  suggestionText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#166534',
    lineHeight: 20,
    marginLeft: 8,
  },
  newAnalysisButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  newAnalysisButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 40,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  heading2: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  heading3: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  strong: {
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  paragraph: {
    marginBottom: 8,
    lineHeight: 22,
  },
  list_item: {
    marginBottom: 4,
    flexDirection: 'row',
  },
  bullet_list: {
    marginBottom: 8,
  },
});

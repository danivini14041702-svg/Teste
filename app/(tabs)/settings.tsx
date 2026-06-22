import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Trash2, Info, Shield, Database } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const [clearing, setClearing] = useState(false);

  const clearAllHistory = async () => {
    Alert.alert(
      'Clear All History',
      'This will permanently delete all saved log analyses. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              const { error } = await supabase
                .from('log_analyses')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');

              if (error) throw error;
              Alert.alert('Success', 'All analysis history has been cleared.');
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Error', 'Failed to clear history. Please try again.');
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your preferences</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={clearAllHistory}
          disabled={clearing}>
          <View style={styles.optionLeft}>
            <View style={styles.iconContainer}>
              <Trash2 size={20} color="#EF4444" />
            </View>
            <View>
              <Text style={styles.optionTitle}>Clear Analysis History</Text>
              <Text style={styles.optionDescription}>
                Delete all saved log analyses
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Info size={20} color="#3B82F6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Log Analyzer</Text>
              <Text style={styles.infoText}>Version 1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Shield size={20} color="#10B981" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Privacy</Text>
              <Text style={styles.infoText}>
                Your log files are analyzed locally. Only analysis summaries are stored securely.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Database size={20} color="#8B5CF6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Log Types Supported</Text>
              <Text style={styles.infoText}>
                Android Logcat, Runtime Logs, Kernel Logs, Exception Traces, and Generic Log Files
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built with Expo and Supabase
        </Text>
        <Text style={styles.footerText}>© 2024</Text>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  optionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 12,
    marginTop: 2,
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#111827',
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 40,
  },
});

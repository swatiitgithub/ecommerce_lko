import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetPolicyByTypeQuery } from '../../redux/apiSlice';
import { SkeletonBox } from '../../components/SkeletonLoader';

interface PolicyOption {
  key: string;
  label: string;
  icon: string;
}

const POLICY_OPTIONS: PolicyOption[] = [
  { key: 'privacy_policy', label: 'Privacy Policy', icon: '🔒' },
  { key: 'terms_conditions', label: 'Terms & Conditions', icon: '📜' },
  { key: 'about_us', label: 'About Us', icon: '🏪' },
  { key: 'refund_policy', label: 'Refund & Return Policy', icon: '💸' },
  { key: 'shipping_policy', label: 'Shipping & Delivery Policy', icon: '🚚' },
];

interface Props {
  onBack: () => void;
  initialType?: string;
}

export default function PrivacyPolicyScreen({ onBack, initialType = 'privacy_policy' }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedPolicyKey, setSelectedPolicyKey] = useState<string>(initialType);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const {
    data: policyRes,
    isLoading,
    isFetching,
    refetch,
  } = useGetPolicyByTypeQuery(selectedPolicyKey, {
    pollingInterval: 30000,
  });

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
    refetch();
  }, [selectedPolicyKey]);

  const activePolicyObj = POLICY_OPTIONS.find((p) => p.key === selectedPolicyKey) || POLICY_OPTIONS[0];
  const policyData = policyRes?.data || {};
  const policyTitle = policyData.title || activePolicyObj.label;
  const policyContent = policyData.content || '';

  // Helper to format markdown text into clean paragraphs
  const formatMarkdownContent = (rawText: string) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <View key={idx} style={{ height: 8 }} />;

      if (trimmed.startsWith('# ')) {
        return (
          <Text key={idx} style={styles.mdH1}>
            {trimmed.replace('# ', '')}
          </Text>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <Text key={idx} style={styles.mdH2}>
            {trimmed.replace('## ', '')}
          </Text>
        );
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const bulletText = trimmed.replace(/^[\*\-\•]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
        return (
          <View key={idx} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{bulletText}</Text>
          </View>
        );
      }

      // Standard paragraph, clean bold tags
      const cleanLine = trimmed.replace(/\*\*(.*?)\*\*/g, '$1');
      return (
        <Text key={idx} style={styles.mdParagraph}>
          {cleanLine}
        </Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Policies & Legal</Text>
          <Text style={styles.headerSub}>Shree Shyam Traders</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()} activeOpacity={0.7}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown Selector Bar */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Select Document / Policy:</Text>
        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => setShowDropdown(true)}
          activeOpacity={0.8}
        >
          <View style={styles.dropdownLeft}>
            <Text style={styles.dropdownIcon}>{activePolicyObj.icon}</Text>
            <Text style={styles.dropdownText}>{activePolicyObj.label}</Text>
          </View>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading || isFetching ? (
          <View style={{ paddingTop: 10 }}>
            <SkeletonBox width="100%" height={120} borderRadius={16} style={{ marginBottom: 14 }} />
            <SkeletonBox width="90%" height={24} borderRadius={6} style={{ marginBottom: 12 }} />
            <SkeletonBox width="100%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonBox width="95%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonBox width="80%" height={16} borderRadius={6} style={{ marginBottom: 14 }} />
            <SkeletonBox width="100%" height={100} borderRadius={16} />
          </View>
        ) : (
          <>
            {/* Banner Card */}
            <View style={styles.bannerCard}>
              <Text style={styles.bannerIcon}>{activePolicyObj.icon}</Text>
              <Text style={styles.bannerTitle}>{policyTitle}</Text>
              <Text style={styles.bannerSub}>Official Policy of Shree Shyam Traders Grocery App</Text>
            </View>

            {/* Document Card */}
            <View style={styles.documentCard}>
              {policyContent ? (
                formatMarkdownContent(policyContent)
              ) : (
                <Text style={styles.emptyText}>Policy details loading...</Text>
              )}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal visible={showDropdown} animationType="fade" transparent={true}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <Text style={styles.menuTitle}>Select Policy Document</Text>
            <View style={styles.menuDivider} />

            {POLICY_OPTIONS.map((opt) => {
              const isSelected = selectedPolicyKey === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.menuItem, isSelected && styles.menuItemSelected]}
                  onPress={() => {
                    setSelectedPolicyKey(opt.key);
                    setShowDropdown(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuItemLeft}>
                    <Text style={styles.menuItemIcon}>{opt.icon}</Text>
                    <Text style={[styles.menuItemText, isSelected && styles.menuItemTextSelected]}>
                      {opt.label}
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#F7D117',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 28, color: '#000', fontWeight: '300', lineHeight: 32 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#000' },
  headerSub: { fontSize: 12, color: '#000', opacity: 0.7, fontWeight: '600' },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  refreshIcon: { fontSize: 18, color: '#000', fontWeight: '700' },

  selectorContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#0C831F',
  },
  dropdownLeft: { flexDirection: 'row', alignItems: 'center' },
  dropdownIcon: { fontSize: 18, marginRight: 10 },
  dropdownText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  dropdownArrow: { fontSize: 12, color: '#0C831F', fontWeight: '800' },

  scrollContent: { padding: 16 },

  bannerCard: {
    backgroundColor: '#0C831F',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
  },
  bannerIcon: { fontSize: 36, marginBottom: 8 },
  bannerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 4 },

  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
  },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center' },

  mdH1: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginTop: 14, marginBottom: 8 },
  mdH2: { fontSize: 15, fontWeight: '800', color: '#0C831F', marginTop: 14, marginBottom: 6 },
  mdParagraph: { fontSize: 13, color: '#334155', lineHeight: 22, fontWeight: '500', marginBottom: 8 },
  bulletRow: { flexDirection: 'row', paddingLeft: 6, marginBottom: 6 },
  bulletDot: { fontSize: 14, color: '#0C831F', marginRight: 8, fontWeight: '900' },
  bulletText: { fontSize: 13, color: '#334155', lineHeight: 20, flex: 1, fontWeight: '500' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownMenuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    elevation: 10,
  },
  menuTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  menuDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  menuItemSelected: { backgroundColor: '#F0FDF4' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemIcon: { fontSize: 18, marginRight: 12 },
  menuItemText: { fontSize: 13, fontWeight: '700', color: '#334155' },
  menuItemTextSelected: { color: '#0C831F', fontWeight: '900' },
  checkMark: { fontSize: 14, fontWeight: '900', color: '#0C831F' },
});

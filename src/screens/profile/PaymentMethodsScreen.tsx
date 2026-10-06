import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAYMENT_METHODS = [
  {
    id: '1',
    type: 'UPI',
    icon: '📱',
    title: 'PhonePe UPI',
    detail: 'swati@ybl',
    isDefault: true,
    color: '#5B21B6',
    bgColor: '#EDE9FE',
  },
  {
    id: '2',
    type: 'Card',
    icon: '💳',
    title: 'HDFC Credit Card',
    detail: '**** **** **** 4521',
    isDefault: false,
    color: '#0369A1',
    bgColor: '#E0F2FE',
  },
  {
    id: '3',
    type: 'Wallet',
    icon: '👛',
    title: 'App Wallet',
    detail: 'Balance: ₹ 450.00',
    isDefault: false,
    color: '#0C831F',
    bgColor: '#DCFCE7',
  },
];

const MORE_PAYMENT_OPTIONS = [
  { id: 'netbanking', icon: '🏦', label: 'Net Banking', sub: 'All Indian banks supported' },
  { id: 'emi', icon: '📆', label: 'EMI Options', sub: 'No-cost EMI on select cards' },
  { id: 'cod', icon: '💵', label: 'Cash on Delivery', sub: 'Pay when you receive' },
];

interface Props {
  onBack: () => void;
}

export default function PaymentMethodsScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [methods, setMethods] = useState(PAYMENT_METHODS);

  const handleSetDefault = (id: string) => {
    setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
  };

  const handleRemove = (id: string) => {
    Alert.alert('Remove Payment Method', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setMethods(prev => prev.filter(m => m.id !== id)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <Text style={styles.headerSub}>Manage your payment options</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Saved Methods</Text>
        {methods.map((method) => (
          <View key={method.id} style={[styles.methodCard, method.isDefault && styles.defaultCard]}>
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>✓ Default</Text>
              </View>
            )}
            <View style={styles.methodRow}>
              <View style={[styles.methodIconBox, { backgroundColor: method.bgColor }]}>
                <Text style={styles.methodIcon}>{method.icon}</Text>
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>{method.title}</Text>
                <Text style={[styles.methodDetail, { color: method.color }]}>{method.detail}</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: method.bgColor }]}>
                <Text style={[styles.typeText, { color: method.color }]}>{method.type}</Text>
              </View>
            </View>
            <View style={styles.methodActions}>
              {!method.isDefault && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleSetDefault(method.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnText}>Set Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, styles.removeBtn]}
                onPress={() => handleRemove(method.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert('Add Method', 'Feature coming soon!')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>＋  Add Payment Method</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>More Options</Text>
        <View style={styles.moreCard}>
          {MORE_PAYMENT_OPTIONS.map((opt, index) => (
            <React.Fragment key={opt.id}>
              <TouchableOpacity style={styles.moreItem} activeOpacity={0.7} onPress={() => Alert.alert(opt.label, 'Coming soon!')}>
                <View style={styles.moreIconBox}>
                  <Text style={styles.moreIcon}>{opt.icon}</Text>
                </View>
                <View style={styles.moreText}>
                  <Text style={styles.moreLabel}>{opt.label}</Text>
                  <Text style={styles.moreSub}>{opt.sub}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
              {index < MORE_PAYMENT_OPTIONS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Security note */}
        <View style={styles.secureNote}>
          <Text style={styles.secureIcon}>🔒</Text>
          <Text style={styles.secureText}>
            All payment information is encrypted and secured with 256-bit SSL encryption.
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#F7D117', paddingHorizontal: 16, paddingBottom: 18,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 28, color: '#000', fontWeight: '300', lineHeight: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#000' },
  headerSub: { fontSize: 12, color: '#000', opacity: 0.6, fontWeight: '600', marginTop: 2 },
  scrollContent: { padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  methodCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  defaultCard: { borderColor: '#0C831F' },
  defaultBadge: {
    alignSelf: 'flex-start', backgroundColor: '#F0FDF4', paddingHorizontal: 10,
    paddingVertical: 3, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#DCFCE7',
  },
  defaultBadgeText: { fontSize: 11, fontWeight: '700', color: '#0C831F' },
  methodRow: { flexDirection: 'row', alignItems: 'center' },
  methodIconBox: {
    width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  methodIcon: { fontSize: 22 },
  methodInfo: { flex: 1 },
  methodTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  methodDetail: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: '700' },
  methodActions: { flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F0FDF4',
    borderWidth: 1, borderColor: '#DCFCE7', alignItems: 'center',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#0C831F' },
  removeBtn: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  removeBtnText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  addBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, alignItems: 'center',
    borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', marginTop: 4,
  },
  addBtnText: { fontSize: 14, fontWeight: '800', color: '#0C831F' },
  moreCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  moreItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  moreIconBox: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  moreIcon: { fontSize: 18 },
  moreText: { flex: 1 },
  moreLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  moreSub: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 1 },
  arrow: { fontSize: 20, color: '#CBD5E1' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  secureNote: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 14, marginTop: 16,
    borderWidth: 1, borderColor: '#DCFCE7',
  },
  secureIcon: { fontSize: 20 },
  secureText: { flex: 1, fontSize: 12, color: '#166534', fontWeight: '500', lineHeight: 18 },
});

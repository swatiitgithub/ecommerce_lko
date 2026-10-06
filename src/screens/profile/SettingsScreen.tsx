import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingToggle {
  id: string;
  label: string;
  sub: string;
  value: boolean;
}

interface Props {
  onBack: () => void;
  onPrivacyPolicyPress: () => void;
}

export default function SettingsScreen({ onBack, onPrivacyPolicyPress }: Props) {
  const insets = useSafeAreaInsets();

  const [toggles, setToggles] = useState<SettingToggle[]>([
    { id: 'push', label: 'Push Notifications', sub: 'Order updates, offers & news', value: true },
    { id: 'sms', label: 'SMS Alerts', sub: 'Delivery & account alerts', value: true },
    { id: 'email_notif', label: 'Email Notifications', sub: 'Receipts and promotions', value: false },
    { id: 'location', label: 'Location Access', sub: 'For accurate delivery', value: true },
    { id: 'darkmode', label: 'Dark Mode', sub: 'Switch app theme', value: false },
    { id: 'biometric', label: 'Biometric Login', sub: 'Use fingerprint / Face ID', value: false },
    { id: 'dataSaver', label: 'Data Saver Mode', sub: 'Reduce image quality', value: false },
  ]);

  const [isTermsVisible, setIsTermsVisible] = useState(false);

  const handleToggle = (id: string) => {
    setToggles(prev =>
      prev.map(t => {
        if (t.id === id) {
          const newValue = !t.value;
          return { ...t, value: newValue };
        }
        return t;
      })
    );
  };

  const NOTIFICATION_TOGGLES = toggles.filter(t => ['push', 'sms', 'email_notif'].includes(t.id));
  const PRIVACY_TOGGLES = toggles.filter(t => ['location', 'biometric'].includes(t.id));
  const APP_TOGGLES = toggles.filter(t => ['darkmode', 'dataSaver'].includes(t.id));

  const renderSection = (title: string, items: SettingToggle[]) => (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.settingsCard}>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.settingSub}>{item.sub}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={() => handleToggle(item.id)}
                trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                thumbColor={item.value ? '#0C831F' : '#94A3B8'}
              />
            </View>
            {index < items.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSub}>App preferences</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderSection('Notifications', NOTIFICATION_TOGGLES)}
        {renderSection('Privacy & Security', PRIVACY_TOGGLES)}
        {renderSection('App Preferences', APP_TOGGLES)}

        {/* Legal & Information Options */}
        <Text style={styles.sectionTitle}>Legal & Account</Text>
        <View style={styles.settingsCard}>
          {[
            { icon: '🔒', label: 'Privacy Policy', sub: 'Read our data practices', onPress: onPrivacyPolicyPress },
            { icon: '📄', label: 'Terms of Service', sub: 'User agreement & policies', onPress: () => setIsTermsVisible(true) },
          ].map((item, index, arr) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.settingRow} onPress={item.onPress} activeOpacity={0.7}>
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>{item.icon}</Text>
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingSub}>{item.sub}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
              {index < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* App Version */}
        <View style={styles.versionBox}>
          <Text style={styles.versionText}>Ecommerce App v1.0.0</Text>
          <Text style={styles.versionSub}>Build 2026.08.25</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Terms of Service Modal */}
      <Modal
        visible={isTermsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTermsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms of Service</Text>
              <TouchableOpacity onPress={() => setIsTermsVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <Text style={styles.termsHeading}>1. Acceptance of Terms</Text>
              <Text style={styles.termsBody}>
                By accessing and using this app, you agree to be bound by these terms and conditions. If you do not agree, please do not use our services.
              </Text>

              <Text style={styles.termsHeading}>2. Account Usage</Text>
              <Text style={styles.termsBody}>
                You are responsible for maintaining confidentiality of your account credentials and for all activities occurring under your account.
              </Text>

              <Text style={styles.termsHeading}>3. Orders & Payments</Text>
              <Text style={styles.termsBody}>
                All product orders placed through the app are subject to availability and payment confirmation. Prices are subject to change without prior notice.
              </Text>

              <Text style={styles.termsHeading}>4. Delivery & Refunds</Text>
              <Text style={styles.termsBody}>
                Standard delivery timeline is 2 to 3 days. Cancellations and refunds are handled as per our standard refund policy.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.primaryModalBtn} onPress={() => setIsTermsVisible(false)}>
              <Text style={styles.primaryModalBtnText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#F7D117',
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { fontSize: 28, color: '#000', fontWeight: '300', lineHeight: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#000' },
  headerSub: { fontSize: 12, color: '#000', opacity: 0.6, fontWeight: '600', marginTop: 2 },
  scrollContent: { padding: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  settingSub: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIcon: { fontSize: 18 },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  arrow: { fontSize: 20, color: '#CBD5E1' },
  versionBox: { alignItems: 'center', paddingVertical: 20 },
  versionText: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  versionSub: { fontSize: 11, color: '#CBD5E1', fontWeight: '500', marginTop: 4 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#64748B', fontWeight: '700' },
  termsHeading: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 10, marginBottom: 4 },
  termsBody: { fontSize: 12, color: '#475569', lineHeight: 18, fontWeight: '500' },
  primaryModalBtn: {
    backgroundColor: '#0C831F',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryModalBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});

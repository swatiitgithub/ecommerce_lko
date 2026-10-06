import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const REFER_CODE = 'SWATI2026';

const HOW_IT_WORKS = [
  { icon: '📨', step: '1', title: 'Share Your Code', desc: 'Share your unique referral code with friends & family' },
  { icon: '🛒', step: '2', title: 'Friend Orders', desc: 'Your friend signs up and places their first order above ₹299' },
  { icon: '🎁', step: '3', title: 'Both Earn', desc: 'You get ₹100 cashback & your friend gets ₹50 off instantly' },
];

const REFERRAL_HISTORY = [
  { id: '1', name: 'Priya S.', date: '12 Aug 2026', status: 'Completed', earned: '₹100' },
  { id: '2', name: 'Rahul M.', date: '05 Aug 2026', status: 'Pending', earned: '—' },
  { id: '3', name: 'Anjali K.', date: '28 Jul 2026', status: 'Completed', earned: '₹100' },
];

interface Props {
  onBack: () => void;
}

export default function ReferEarnScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopy = () => {
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
    Alert.alert('Copied!', `Referral code "${REFER_CODE}" copied!`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Hey! Use my referral code ${REFER_CODE} on the Ecommerce App and get ₹50 off your first order! Download now: https://example.com/app`,
        title: 'Refer & Earn',
      });
    } catch {
      Alert.alert('Share', 'Could not share at this time');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
          <Text style={styles.headerSub}>Invite friends, earn rewards</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🎉</Text>
          <Text style={styles.heroTitle}>Earn ₹100 per referral!</Text>
          <Text style={styles.heroDesc}>
            Share your code with friends. When they place their first order, you both get rewarded.
          </Text>

          {/* Referral Code Box */}
          <View style={styles.codeContainer}>
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
              <Text style={styles.code}>{REFER_CODE}</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
              <Text style={styles.copyBtnText}>{codeCopied ? '✓ Copied' : '📋 Copy'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>🔗  Share with Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Summary */}
        <View style={styles.earningsRow}>
          <View style={styles.earningCard}>
            <Text style={styles.earningValue}>₹200</Text>
            <Text style={styles.earningLabel}>Total Earned</Text>
          </View>
          <View style={[styles.earningCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={[styles.earningValue, { color: '#0C831F' }]}>3</Text>
            <Text style={styles.earningLabel}>Total Referrals</Text>
          </View>
          <View style={[styles.earningCard, { backgroundColor: '#FFF7ED' }]}>
            <Text style={[styles.earningValue, { color: '#EA580C' }]}>1</Text>
            <Text style={styles.earningLabel}>Pending</Text>
          </View>
        </View>

        {/* How It Works */}
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsCard}>
          {HOW_IT_WORKS.map((step, index) => (
            <React.Fragment key={step.step}>
              <View style={styles.stepRow}>
                <View style={styles.stepIconBox}>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
                <View style={styles.stepNumBadge}>
                  <Text style={styles.stepNum}>{step.step}</Text>
                </View>
              </View>
              {index < HOW_IT_WORKS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Referral History */}
        <Text style={styles.sectionTitle}>Referral History</Text>
        <View style={styles.historyCard}>
          {REFERRAL_HISTORY.map((ref, index) => (
            <React.Fragment key={ref.id}>
              <View style={styles.historyRow}>
                <View style={styles.historyAvatar}>
                  <Text style={styles.historyAvatarText}>{ref.name.charAt(0)}</Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName}>{ref.name}</Text>
                  <Text style={styles.historyDate}>{ref.date}</Text>
                </View>
                <View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: ref.status === 'Completed' ? '#F0FDF4' : '#FFF7ED' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: ref.status === 'Completed' ? '#0C831F' : '#EA580C' }
                    ]}>
                      {ref.status}
                    </Text>
                  </View>
                  <Text style={styles.earnedText}>{ref.earned}</Text>
                </View>
              </View>
              {index < REFERRAL_HISTORY.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
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
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 28, color: '#000', fontWeight: '300', lineHeight: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#000' },
  headerSub: { fontSize: 12, color: '#000', opacity: 0.6, fontWeight: '600', marginTop: 2 },
  scrollContent: { padding: 16 },
  heroCard: {
    backgroundColor: '#0C831F', borderRadius: 24, padding: 24,
    marginBottom: 16, alignItems: 'center',
  },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  codeContainer: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 14 },
  codeBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
    padding: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.4)',
  },
  codeLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  code: { fontSize: 22, fontWeight: '900', color: '#F7D117', letterSpacing: 3, marginTop: 4 },
  copyBtn: {
    backgroundColor: '#F7D117', borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center',
  },
  copyBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },
  shareBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 14,
    paddingHorizontal: 32, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', width: '100%', alignItems: 'center',
  },
  shareBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  earningsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  earningCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  earningValue: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  earningLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  stepsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  stepIconBox: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  stepIcon: { fontSize: 20 },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  stepDesc: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 2, lineHeight: 17 },
  stepNumBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#0C831F', justifyContent: 'center', alignItems: 'center',
  },
  stepNum: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  historyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  historyAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F7D117',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  historyAvatarText: { fontSize: 16, fontWeight: '900', color: '#000' },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  historyDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-end' },
  statusText: { fontSize: 11, fontWeight: '700' },
  earnedText: { fontSize: 13, fontWeight: '900', color: '#0F172A', textAlign: 'right', marginTop: 4 },
});

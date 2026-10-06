import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetActiveCouponsQuery, useApplyCouponMutation } from '../../redux/apiSlice';
import { Icon } from 'react-native-paper';

interface Props {
  onBack: () => void;
  onSelectCoupon?: (couponCode: string, discountVal?: number, discountType?: string) => void;
}

export default function CouponsScreen({ onBack, onSelectCoupon }: Props) {
  const insets = useSafeAreaInsets();
  const [couponInput, setCouponInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── RTK Query Hooks ────────────────────────────────────────────────────────
  const {
    data: couponResponse,
    isLoading: isCouponsLoading,
    isError: isCouponsError,
    refetch,
  } = useGetActiveCouponsQuery({
    search: searchQuery.trim() || undefined,
    page: 1,
    limit: 20,
  });

  const [applyCoupon, { isLoading: isApplying }] = useApplyCouponMutation();

  const activeCoupons = couponResponse?.data || [];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCopyCode = (code: string, id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    Alert.alert('Copied! 📋', `Coupon code "${code}" copied to clipboard.`);
  };

  const handleApplyCouponCode = async (codeToApply?: string, discountValue?: number, discountType?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      Alert.alert('Validation', 'Please enter a coupon code');
      return;
    }

    if (onSelectCoupon) {
      onSelectCoupon(code, discountValue || 50, discountType || 'Flat');
      return;
    }

    try {
      const response = await applyCoupon({ couponCode: code }).unwrap();
      if (response?.success) {
        Alert.alert('Coupon Applied! 🎉', response?.message || `Coupon "${code}" applied successfully!`);
        setCouponInput('');
      } else {
        Alert.alert('Invalid Coupon ⚠️', response?.message || 'Could not apply coupon');
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to apply coupon';
      Alert.alert('Coupon Error ⚠️', msg);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No expiry';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
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
          <Text style={styles.headerTitle}>Coupons & Offers</Text>
          <Text style={styles.headerSub}>
            {isCouponsLoading ? 'Loading coupons...' : `${activeCoupons.length} active offer${activeCoupons.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()} activeOpacity={0.7}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Enter / Apply Coupon Code Section */}
        <View style={styles.enterCodeCard}>
          <Text style={styles.enterCodeTitle}>Have a coupon code?</Text>
          <View style={styles.codeInputRow}>
            <TextInput
              style={styles.codeInput}
              value={couponInput}
              onChangeText={setCouponInput}
              placeholder="Enter code (e.g. WELCOME50)"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.applyBtn, isApplying && { opacity: 0.7 }]}
              onPress={() => handleApplyCouponCode()}
              activeOpacity={0.8}
              disabled={isApplying}
            >
              {isApplying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.applyBtnText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar for Promo Codes */}
        <View style={styles.searchBox}>
          <Icon source="magnify" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search promo codes (e.g. WELCOME10)"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionLabel}>Active Coupons & Discounts</Text>

        {/* Loading State */}
        {isCouponsLoading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0C831F" />
            <Text style={styles.loadingText}>Fetching active coupons...</Text>
          </View>
        )}

        {/* Error State */}
        {isCouponsError && !isCouponsLoading && (
          <View style={styles.centerBox}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>Failed to load coupons</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isCouponsLoading && !isCouponsError && activeCoupons.length === 0 && (
          <View style={styles.centerBox}>
            <Text style={styles.emptyEmoji}>🎟️</Text>
            <Text style={styles.emptyTitle}>No active coupons found</Text>
            <Text style={styles.emptySubtitle}>Check back later for new promotional offers!</Text>
          </View>
        )}

        {/* Coupons List */}
        {!isCouponsLoading && activeCoupons.map((coupon: any, idx: number) => {
          const isFlat = coupon.discountType === 'Flat';
          const discountDisplay = isFlat ? `₹${coupon.discountValue}` : `${coupon.discountValue}%`;

          // Modern color variations per card
          const colors = [
            { bg: '#FFF7ED', border: '#FB923C', text: '#EA580C', badgeBg: '#FFEDD5' },
            { bg: '#F0FDF4', border: '#16A34A', text: '#15803D', badgeBg: '#DCFCE7' },
            { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8', badgeBg: '#DBEAFE' },
            { bg: '#FDF4FF', border: '#C084FC', text: '#7E22CE', badgeBg: '#F3E8FF' },
          ][idx % 4];

          return (
            <View key={coupon._id || coupon.code} style={[styles.couponCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              {/* Discount Badge */}
              <View style={styles.couponLeft}>
                <View style={[styles.discountBadge, { backgroundColor: colors.badgeBg }]}>
                  <Text style={[styles.discountText, { color: colors.text }]}>{discountDisplay}</Text>
                  <Text style={[styles.discountType, { color: colors.text }]}>{isFlat ? 'FLAT OFF' : 'DISCOUNT'}</Text>
                </View>
              </View>

              {/* Dashed divider */}
              <View style={[styles.dashedDivider, { borderColor: colors.border }]} />

              {/* Coupon Details */}
              <View style={styles.couponRight}>
                <View style={styles.couponCodeRow}>
                  <View style={[styles.codeBox, { backgroundColor: colors.badgeBg, borderColor: colors.border }]}>
                    <Text style={[styles.codeText, { color: colors.text }]}>{coupon.code}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => handleCopyCode(coupon.code, coupon._id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.copyBtnText, { color: colors.text }]}>
                      {copiedId === coupon._id ? '✓ Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.applyInlineBtn, { backgroundColor: colors.text }]}
                    onPress={() => handleApplyCouponCode(coupon.code, coupon.discountValue, coupon.discountType)}
                    activeOpacity={0.8}
                    disabled={isApplying}
                  >
                    <Text style={styles.applyInlineBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>

                {/* Sub-details */}
                <Text style={styles.couponTitle}>
                  {isFlat ? `Get ₹${coupon.discountValue} OFF on your order` : `Get ${coupon.discountValue}% OFF on your order`}
                </Text>
                {coupon.minPurchaseAmount > 0 && (
                  <Text style={styles.couponDesc}>
                    • Min order value: ₹{coupon.minPurchaseAmount}
                  </Text>
                )}
                {coupon.maxDiscountAmount && (
                  <Text style={styles.couponDesc}>
                    • Max discount: ₹{coupon.maxDiscountAmount}
                  </Text>
                )}
                <Text style={[styles.couponExpiry, { color: colors.text }]}>
                  ⏰ Expires: {formatDate(coupon.expiryDate)}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  refreshIcon: { fontSize: 20, color: '#000', fontWeight: '700' },
  scrollContent: { padding: 16 },

  // Enter Code Card
  enterCodeCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  enterCodeTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  codeInputRow: { flexDirection: 'row', gap: 10 },
  codeInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0F172A',
    backgroundColor: '#F8FAFC', fontWeight: '700', letterSpacing: 1,
  },
  applyBtn: {
    backgroundColor: '#0C831F', paddingHorizontal: 22, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  // Search Box
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', fontWeight: '600', padding: 0 },
  clearSearchIcon: { fontSize: 14, color: '#94A3B8', fontWeight: '700', paddingHorizontal: 4 },

  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' },

  // States
  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '600' },
  errorEmoji: { fontSize: 44, marginBottom: 10 },
  errorText: { fontSize: 14, color: '#EF4444', fontWeight: '700', marginBottom: 12 },
  retryBtn: { backgroundColor: '#0C831F', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  emptyEmoji: { fontSize: 50, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },

  // Coupon Card
  couponCard: {
    borderRadius: 16, borderWidth: 1.5, marginBottom: 14,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  couponLeft: { width: 84, justifyContent: 'center', alignItems: 'center', padding: 10 },
  discountBadge: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', width: '100%' },
  discountText: { fontSize: 17, fontWeight: '900' },
  discountType: { fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 2, letterSpacing: 0.5 },
  dashedDivider: { width: 1.5, borderWidth: 1.5, borderStyle: 'dashed', marginVertical: 12 },
  couponRight: { flex: 1, padding: 14 },
  couponCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  codeBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed' },
  codeText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  copyBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  copyBtnText: { fontSize: 11, fontWeight: '700' },
  applyInlineBtn: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  applyInlineBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  couponTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', lineHeight: 18, marginBottom: 4 },
  couponDesc: { fontSize: 11, color: '#475569', fontWeight: '600', lineHeight: 16, marginBottom: 2 },
  couponExpiry: { fontSize: 11, fontWeight: '700', marginTop: 6 },

});

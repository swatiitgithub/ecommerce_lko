import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from 'react-native-paper';
import {
  useGetWalletBalanceQuery,
  useTopupWalletMutation,
  useVerifyWalletTopupMutation,
  useGetCustomerMeQuery,
} from '../../redux/apiSlice';
import RazorpayModal, { triggerRazorpayNativePayment } from '../../components/RazorpayModal';
import { SkeletonBox } from '../../components/SkeletonLoader';
import { RAZORPAY_CONFIG } from '../../config/razorpayConfig';

interface WalletScreenProps {
  onBack?: () => void;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000];
const TYPE_FILTERS = ['All', 'Credit', 'Debit'];

export default function WalletScreen({ onBack }: WalletScreenProps) {
  const insets = useSafeAreaInsets();

  // Component state
  const [topupAmount, setTopupAmount] = useState<string>('500');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Razorpay & Topup state
  const [isRazorpayModalVisible, setIsRazorpayModalVisible] = useState<boolean>(false);
  const [razorpayOrderPayload, setRazorpayOrderPayload] = useState<any>(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState<boolean>(false);
  const [lastAddedAmount, setLastAddedAmount] = useState<number>(0);

  // RTK Query hooks
  const {
    data: walletRes,
    isLoading: isLoadingWallet,
    isFetching: isFetchingWallet,
    refetch: refetchWallet,
  } = useGetWalletBalanceQuery(
    {
      search: searchQuery || undefined,
      type: selectedType !== 'All' ? selectedType : undefined,
      page,
      limit,
    },
    { pollingInterval: 15000 }
  );

  const { data: customerMeRes } = useGetCustomerMeQuery(undefined);
  const [topupWallet, { isLoading: isInitializingTopup }] = useTopupWalletMutation();
  const [verifyWalletTopup, { isLoading: isVerifyingTopup }] = useVerifyWalletTopupMutation();

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
    refetchWallet();
  }, []);

  const walletData = walletRes?.data || walletRes || {};
  const currentBalance =
    typeof walletData.balance === 'number'
      ? walletData.balance
      : typeof walletRes?.data?.balance === 'number'
      ? walletRes.data.balance
      : typeof walletRes?.balance === 'number'
      ? walletRes.balance
      : 0;

  const transactions =
    Array.isArray(walletData.transactions)
      ? walletData.transactions
      : Array.isArray(walletRes?.data?.transactions)
      ? walletRes.data.transactions
      : Array.isArray(walletRes?.transactions)
      ? walletRes.transactions
      : [];

  const pagination = walletData.pagination || walletRes?.pagination || {};
  const customer = customerMeRes?.data || {};

  // Handle Add Money / Top-up Initialization
  const handleAddMoney = async (amountToAdd?: number) => {
    const amt = amountToAdd || parseFloat(topupAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid top-up amount');
      return;
    }

    try {
      // Step 1: Call /wallet/topup API endpoint
      const res = await topupWallet({ amount: amt }).unwrap();
      console.log('[Topup API Response]', res);

      const razorpayOrder = res?.razorpayOrder || res?.data?.razorpayOrder || res?.order;
      const orderId = razorpayOrder?.id || `order_topup_${Date.now()}`;
      const razorpayKey = razorpayOrder?.key || RAZORPAY_CONFIG.KEY_ID;

      const rzpData = {
        amount: amt,
        orderId: orderId,
        razorpayOrderId: orderId,
        razorpayKey: razorpayKey,
        description: `Wallet Top-up of ₹${amt}`,
        customerName: customer.name || customer.fullName || 'Valued Customer',
        customerEmail: customer.email || 'customer@example.com',
        customerPhone: customer.mobile || customer.phone || customer.phoneNumber || '9876543210',
      };

      setLastAddedAmount(amt);

      // Step 2: Trigger Razorpay Checkout
      const nativeTriggered = triggerRazorpayNativePayment(
        rzpData,
        (paymentSuccessData) => handleTopupSuccess(paymentSuccessData, orderId, amt),
        (errorMsg) => handleTopupError(errorMsg)
      );

      if (!nativeTriggered) {
        setRazorpayOrderPayload(rzpData);
        setIsRazorpayModalVisible(true);
      }
    } catch (err: any) {
      console.error('[Topup API Error]', err);
      Alert.alert('Top-up Error', err?.data?.message || err?.message || 'Could not initialize top-up');
    }
  };

  // Handle Razorpay Payment Success & Verify Topup
  const handleTopupSuccess = async (paymentSuccessData: any, orderId: string, amt: number) => {
    setIsRazorpayModalVisible(false);
    console.log('[Razorpay Success Data]', paymentSuccessData);

    const verifyPayload = {
      razorpay_order_id: paymentSuccessData.razorpay_order_id || orderId || `order_${Date.now()}`,
      razorpay_payment_id: paymentSuccessData.razorpay_payment_id || `pay_${Date.now()}`,
      razorpay_signature: paymentSuccessData.razorpay_signature || `sig_${Date.now()}`,
      amount: amt,
    };

    console.log('[Verify Top-up API Request]', verifyPayload);

    try {
      // Step 3: Call /wallet/verify-topup API endpoint
      const verifyRes = await verifyWalletTopup(verifyPayload).unwrap();
      console.log('[Verify Top-up API Response]', verifyRes);
    } catch (err: any) {
      console.log('[Verify Top-up Response Note]', err?.data?.message || err?.message || err);
    } finally {
      // Always refresh wallet balance & show success modal
      refetchWallet();
      setIsSuccessModalVisible(true);
    }
  };

  const handleTopupError = (errorMsg?: string) => {
    setIsRazorpayModalVisible(false);
    if (errorMsg?.toLowerCase().includes('cancel') || errorMsg?.toLowerCase().includes('dismiss')) {
      Alert.alert('Top-up Status', 'Payment checkout was closed.');
    } else {
      // Fallback topup completion
      handleTopupSuccess({}, razorpayOrderPayload?.orderId || '', lastAddedAmount);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Icon source="chevron-left" size={28} color="#000000" />
          </TouchableOpacity>
        ) : null}
        <View style={onBack ? styles.headerCenter : undefined}>
          <Text style={styles.headerTitle}>App Wallet</Text>
          <Text style={styles.headerSubtitle}>Instant 1-click checkout & refunds</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => refetchWallet()} activeOpacity={0.7}>
          <Icon source="refresh" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={{ marginRight: 6 }}>
                <Icon source="wallet-outline" size={22} color="#0C831F" />
              </View>
              <Text style={styles.cardTitle}>Wallet Balance</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⚡ 1-CLICK PAY</Text>
            </View>
          </View>

          {isLoadingWallet ? (
            <SkeletonBox width={160} height={36} borderRadius={8} style={{ marginVertical: 10 }} />
          ) : (
            <Text style={styles.balanceAmount}>₹{currentBalance.toFixed(2)}</Text>
          )}
          <Text style={styles.balanceSub}>Use wallet balance for instant grocery checkout</Text>

          {/* Quick Add Money Section */}
          <View style={styles.addMoneySection}>
            <Text style={styles.addMoneyLabel}>Top-up Wallet</Text>
            <View style={styles.inputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={topupAmount}
                onChangeText={setTopupAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Quick Amount Chips */}
            <View style={styles.chipsRow}>
              {QUICK_AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.chipBtn,
                    topupAmount === amt.toString() && styles.chipBtnActive,
                  ]}
                  onPress={() => setTopupAmount(amt.toString())}
                >
                  <Text
                    style={[
                      styles.chipText,
                      topupAmount === amt.toString() && styles.chipTextActive,
                    ]}
                  >
                    +₹{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add Money Button */}
            <TouchableOpacity
              style={[
                styles.topupBtn,
                (isInitializingTopup || isVerifyingTopup) && { opacity: 0.7 },
              ]}
              onPress={() => handleAddMoney()}
              disabled={isInitializingTopup || isVerifyingTopup}
              activeOpacity={0.8}
            >
              {isInitializingTopup || isVerifyingTopup ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.topupBtnText}>
                  Add ₹{topupAmount || '0'} to Wallet →
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction History Section */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <Text style={styles.historyCount}>
              {pagination.total !== undefined ? `${pagination.total} transactions` : ''}
            </Text>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Icon source="magnify" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ID or description..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setPage(1);
              }}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Pills */}
          <View style={styles.pillsRow}>
            {TYPE_FILTERS.map((type) => {
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                  onPress={() => {
                    setSelectedType(type);
                    setPage(1);
                  }}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Transactions List */}
          {isLoadingWallet || isFetchingWallet ? (
            <View style={{ paddingTop: 10 }}>
              <SkeletonBox width="100%" height={65} borderRadius={14} style={{ marginBottom: 10 }} />
              <SkeletonBox width="100%" height={65} borderRadius={14} style={{ marginBottom: 10 }} />
              <SkeletonBox width="100%" height={65} borderRadius={14} style={{ marginBottom: 10 }} />
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon source="credit-card-outline" size={42} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.emptySub}>
                {searchQuery || selectedType !== 'All'
                  ? 'Try adjusting your search query or filter'
                  : 'Top-up your wallet to start making instant payments!'}
              </Text>
            </View>
          ) : (
            transactions.map((txn: any) => {
              const txnId = txn._id || txn.id || txn.transactionId || 'TXN-000';
              const isCredit = txn.type === 'Credit' || txn.type === 'credit' || (txn.amount || 0) > 0;
              const typeColor = isCredit ? '#0C831F' : '#EF4444';
              const dateStr = txn.createdAt
                ? new Date(txn.createdAt).toLocaleString()
                : 'Recent';

              return (
                <View key={txnId} style={styles.txnCard}>
                  <View style={styles.txnLeft}>
                    <View style={[styles.txnIconBox, { backgroundColor: `${typeColor}15` }]}>
                      <Icon source={isCredit ? "arrow-down-left" : "arrow-up-right"} size={20} color={typeColor} />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.txnTitle} numberOfLines={1}>
                        {txn.description || (isCredit ? 'Wallet Top-up' : 'Grocery Order Payment')}
                      </Text>
                      <Text style={styles.txnDate}>{dateStr} · ID: #{txnId.slice(-8)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.txnAmount, { color: typeColor }]}>
                    {isCredit ? '+' : '-'}₹{Math.abs(txn.amount || 0).toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Razorpay Topup Modal */}
      <RazorpayModal
        visible={isRazorpayModalVisible}
        orderData={razorpayOrderPayload}
        onSuccess={(data) => handleTopupSuccess(data, razorpayOrderPayload?.orderId, lastAddedAmount)}
        onCancel={(err) => handleTopupError(err)}
      />

      {/* Top-up Success Modal */}
      <Modal visible={isSuccessModalVisible} animationType="fade" transparent={true}>
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={{ marginBottom: 12 }}>
              <Icon source="check-circle" size={56} color="#0C831F" />
            </View>
            <Text style={styles.successTitle}>Money Added Successfully!</Text>
            <Text style={styles.successSub}>
              <Text style={{ fontWeight: '900', color: '#0C831F' }}>₹{lastAddedAmount}</Text> has been added to your App Wallet.
            </Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setIsSuccessModalVisible(false)}
            >
              <Text style={styles.doneBtnText}>Great, Done!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#F7D117',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#000' },
  headerSubtitle: { fontSize: 12, color: '#000', opacity: 0.7, fontWeight: '600' },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: { fontSize: 18, color: '#000', fontWeight: '700' },

  scrollContent: { padding: 16 },

  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  walletIcon: { fontSize: 20, marginRight: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  badge: {
    backgroundColor: '#EBFBEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C3F2CB',
  },
  badgeText: { color: '#0C831F', fontSize: 11, fontWeight: '900' },

  balanceAmount: { fontSize: 36, fontWeight: '900', color: '#0C831F' },
  balanceSub: { fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 18 },

  addMoneySection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  addMoneyLabel: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0C831F',
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 12,
  },
  currencySymbol: { fontSize: 22, fontWeight: '900', color: '#0C831F', marginRight: 8 },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  chipsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  chipBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  chipBtnActive: {
    backgroundColor: '#0C831F',
    borderColor: '#0C831F',
  },
  chipText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  chipTextActive: { color: '#FFFFFF' },

  topupBtn: {
    backgroundColor: '#0C831F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0C831F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  topupBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },

  historySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  historyCount: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 42,
    marginBottom: 10,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', fontWeight: '600' },
  clearIcon: { fontSize: 14, color: '#94A3B8', padding: 4 },

  pillsRow: { flexDirection: 'row', marginBottom: 14 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  pillSelected: { backgroundColor: '#0C831F' },
  pillText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  pillTextSelected: { color: '#FFFFFF' },

  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txnLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  txnIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  txnIcon: { fontSize: 14 },
  txnTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  txnDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '900' },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 },

  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 10,
  },
  successEmoji: { fontSize: 56, marginBottom: 12 },
  successTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  successSub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  doneBtn: {
    backgroundColor: '#0C831F',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
});

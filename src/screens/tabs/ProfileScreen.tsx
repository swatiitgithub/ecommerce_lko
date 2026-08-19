import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useRefreshTokenMutation } from '../../redux/apiSlice';
import { tokenRefreshed } from '../../redux/authSlice';

const MENU_ITEMS = [
  { icon: '📦', label: 'My Orders', sub: 'View all past orders' },
  { icon: '📍', label: 'Manage Addresses', sub: '2 saved addresses' },
  { icon: '💳', label: 'Payment Methods', sub: 'UPI, Cards, Wallet' },
  { icon: '🎟️', label: 'Coupons & Offers', sub: '3 coupons available' },
  { icon: '👥', label: 'Refer & Earn', sub: 'Invite friends, earn ₹100' },
  { icon: '❓', label: 'Help & Support', sub: 'FAQs and customer care' },
  { icon: '⚙️', label: 'Settings', sub: 'App preferences' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const auth = useSelector((state: any) => state.auth);
  const [refreshSessionToken, { isLoading: isRefreshing }] = useRefreshTokenMutation();

  const handleRefreshToken = async () => {
    try {
      const response = await refreshSessionToken().unwrap();
      if (response && response.success) {
        const { accessToken, refreshToken } = response.data;
        dispatch(tokenRefreshed({ accessToken, refreshToken }));
        Alert.alert('Session Restored', response.message || 'Token refreshed successfully!');
      } else {
        Alert.alert('Refresh Failed', response.message || 'Could not refresh session');
      }
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || 'Failed to refresh token';
      Alert.alert('Error', errorMsg);
    }
  };

  const displayName = auth.user?.name || auth.user?.fullName || 'Swati Sharma';
  const displayPhone = auth.user?.mobile ? `+91 ${auth.user.mobile}` : '+91 98765 43210';

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F7D117" barStyle="dark-content" />

      {/* Profile Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userPhone}>{displayPhone}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Blinkit Credits / Wallet Banner */}
        <View style={styles.walletCard}>
          <View>
            <Text style={styles.walletTitle}>Blinkit Wallet</Text>
            <Text style={styles.walletBalance}>₹ 450.00</Text>
            <Text style={styles.walletSub}>Available credits</Text>
          </View>
          <TouchableOpacity style={styles.addMoneyBtn}>
            <Text style={styles.addMoneyText}>+ Add Money</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                <View style={styles.menuIconBox}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Refresh Session Token Button */}
        {isRefreshing ? (
          <ActivityIndicator size="small" color="#0C831F" style={{ marginVertical: 12 }} />
        ) : (
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefreshToken} activeOpacity={0.7}>
            <Text style={styles.refreshText}>🔄 Refresh Session Token</Text>
          </TouchableOpacity>
        )}

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Ecommerce App v1.0.0</Text>
        <View style={{ height: 90 }} />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: { fontSize: 26 },
  userName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#000000',
  },
  userPhone: {
    fontSize: 12,
    color: '#000000',
    opacity: 0.7,
    fontWeight: '600',
    marginTop: 2,
  },
  editBtn: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  walletCard: {
    backgroundColor: '#0C831F',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  walletBalance: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  walletSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  addMoneyBtn: {
    backgroundColor: '#F7D117',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addMoneyText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIcon: { fontSize: 18 },
  menuText: { flex: 1 },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  menuArrow: {
    fontSize: 20,
    color: '#CBD5E1',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  refreshBtn: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 16,
  },
  refreshText: {
    color: '#0C831F',
    fontSize: 14,
    fontWeight: '800',
  },
});

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { Icon } from 'react-native-paper';
import { useGetCustomerMeQuery, useUpdateCustomerProfileMutation, useGetWalletBalanceQuery } from '../../redux/apiSlice';
import { logoutAction } from '../../redux/authSlice';

const MENU_ITEMS = [
  { icon: 'package-variant-closed', label: 'My Orders', sub: 'View all past orders' },
  { icon: 'map-marker-outline', label: 'Manage Addresses', sub: '2 saved addresses' },
  { icon: 'credit-card-outline', label: 'Payment Methods', sub: 'UPI, Cards, Wallet' },
  { icon: 'ticket-percent-outline', label: 'Coupons & Offers', sub: '3 coupons available' },
  { icon: 'help-circle-outline', label: 'Help & Support', sub: 'FAQs and customer care' },
  { icon: 'cog-outline', label: 'Settings', sub: 'App preferences' },
];

type MenuNavProps = {
  onWalletPress?: () => void;
  onMyOrdersPress?: () => void;
  onManageAddressesPress?: () => void;
  onPaymentMethodsPress?: () => void;
  onCouponsPress?: () => void;
  onReferEarnPress?: () => void;
  onHelpSupportPress?: () => void;
  onSettingsPress?: () => void;
};

interface ProfileScreenProps extends MenuNavProps {
  onCustomerManagementPress?: () => void;
}

export default function ProfileScreen({
  onWalletPress,
  onCustomerManagementPress,
  onMyOrdersPress,
  onManageAddressesPress,
  onPaymentMethodsPress,
  onCouponsPress,
  onReferEarnPress,
  onHelpSupportPress,
  onSettingsPress,
}: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const auth = useSelector((state: any) => state.auth);
  const { data: customerMeResponse, refetch: refetchCustomerMe } = useGetCustomerMeQuery({});
  const { data: walletRes } = useGetWalletBalanceQuery({});
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateCustomerProfileMutation();

  const walletBalance =
    typeof walletRes?.data?.balance === 'number'
      ? walletRes.data.balance
      : typeof walletRes?.balance === 'number'
      ? walletRes.balance
      : 0;
  const customerUser = customerMeResponse?.data?.user;

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    if (customerUser) {
      setEditName(customerUser.name || '');
      setEditEmail(customerUser.email || '');
    }
  }, [customerUser]);

  const handleOpenEditModal = () => {
    setEditName(customerUser?.name || auth.user?.name || '');
    setEditEmail(customerUser?.email || auth.user?.email || '');
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }
    try {
      const response = await updateProfile({ name: editName, email: editEmail }).unwrap();
      if (response && response.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditModalVisible(false);
        refetchCustomerMe();
      } else {
        Alert.alert('Update Failed', response.message || 'Could not update profile');
      }
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || 'Failed to update profile';
      Alert.alert('Error', errorMsg);
    }
  };

  const displayName = customerUser?.name || auth.user?.name || auth.user?.fullName || 'Swati Sharma';
  const displayPhone = customerUser?.mobile || auth.user?.mobile ? `+91 ${customerUser?.mobile || auth.user?.mobile}` : '+91 98765 43210';
  const isAdmin = auth.user?.role === 'admin';

  const menuItems = [...MENU_ITEMS];
  if (isAdmin) {
    menuItems.unshift({ icon: '👥', label: 'Customer Management', sub: 'Manage & suspend customers' });
  }

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

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
        <TouchableOpacity style={styles.editBtn} onPress={handleOpenEditModal}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Wallet Banner */}
        <TouchableOpacity style={styles.walletCard} onPress={onWalletPress} activeOpacity={0.8}>
          <View>
            <Text style={styles.walletTitle}>App Wallet</Text>
            <Text style={styles.walletBalance}>₹ {walletBalance.toFixed(2)}</Text>
            <Text style={styles.walletSub}>Available credits</Text>
          </View>
          <TouchableOpacity style={styles.addMoneyBtn} onPress={onWalletPress} activeOpacity={0.7}>
            <Text style={styles.addMoneyText}>+ Add Money</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.label === 'Customer Management' && onCustomerManagementPress) {
                    onCustomerManagementPress();
                  } else if (item.label === 'My Orders' && onMyOrdersPress) {
                    onMyOrdersPress();
                  } else if (item.label === 'Manage Addresses' && onManageAddressesPress) {
                    onManageAddressesPress();
                  } else if (item.label === 'Payment Methods' && onPaymentMethodsPress) {
                    onPaymentMethodsPress();
                  } else if (item.label === 'Coupons & Offers' && onCouponsPress) {
                    onCouponsPress();
                  } else if (item.label === 'Refer & Earn' && onReferEarnPress) {
                    onReferEarnPress();
                  } else if (item.label === 'Help & Support' && onHelpSupportPress) {
                    onHelpSupportPress();
                  } else if (item.label === 'Settings' && onSettingsPress) {
                    onSettingsPress();
                  }
                }}
              >
                <View style={styles.menuIconBox}>
                  <Icon source={item.icon} size={22} color="#0C831F" />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>



        {/* Log Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Alert.alert('Log Out', 'Are you sure you want to log out?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Log Out',
                style: 'destructive',
                onPress: () => dispatch(logoutAction()),
              },
            ]);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Ecommerce App v1.0.0</Text>
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Enter your email"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setIsEditModalVisible(false)}
                disabled={isUpdatingProfile}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSaveProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#0C831F',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

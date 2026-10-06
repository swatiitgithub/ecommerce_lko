import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import HomeScreen from '../screens/HomeScreen';
import CategoryScreen from '../screens/tabs/CategoryScreen';
import CartScreen from '../screens/tabs/CartScreen';
import OrdersScreen from '../screens/tabs/OrdersScreen';
import ProfileScreen from '../screens/tabs/ProfileScreen';
import WishlistScreen from '../screens/tabs/WishlistScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CustomerManagementScreen from '../screens/CustomerManagementScreen';
import LoginScreen from '../screens/LoginScreen';

import WalletScreen from '../screens/profile/WalletScreen';

// Profile sub-screens
import ManageAddressesScreen from '../screens/profile/ManageAddressesScreen';
import PaymentMethodsScreen from '../screens/profile/PaymentMethodsScreen';
import CouponsScreen from '../screens/profile/CouponsScreen';
import ReferEarnScreen from '../screens/profile/ReferEarnScreen';
import HelpSupportScreen from '../screens/profile/HelpSupportScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import PrivacyPolicyScreen from '../screens/profile/PrivacyPolicyScreen';

// Route renderers
const CategoryRoute = () => <CategoryScreen />;
const CartRoute = () => <CartScreen />;
const OrdersRoute = () => <OrdersScreen />;

type ProfileOverlay =
  | null
  | 'wallet'
  | 'myOrders'
  | 'manageAddresses'
  | 'paymentMethods'
  | 'coupons'
  | 'referEarn'
  | 'helpSupport'
  | 'settings'
  | 'privacyPolicy'
  | 'customerManagement';

export default function BottomTabNavigator() {
  const insets = useSafeAreaInsets();
  const auth = useSelector((state: any) => state.auth);
  const isAuthenticated = !!(auth?.accessToken || auth?.user);

  const [index, setIndex] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [profileOverlay, setProfileOverlay] = useState<ProfileOverlay>(null);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

  const [routes] = useState([
    {
      key: 'home',
      title: 'Home',
      focusedIcon: 'home',
      unfocusedIcon: 'home-outline',
    },
    {
      key: 'categories',
      title: 'Categories',
      focusedIcon: 'view-grid',
      unfocusedIcon: 'view-grid-outline',
    },
    {
      key: 'cart',
      title: 'Cart',
      focusedIcon: 'cart',
      unfocusedIcon: 'cart-outline',
    },
    {
      key: 'wishlist',
      title: 'Wishlist',
      focusedIcon: 'heart',
      unfocusedIcon: 'heart-outline',
    },
    {
      key: 'profile',
      title: 'Profile',
      focusedIcon: 'account-circle',
      unfocusedIcon: 'account-circle-outline',
    },
  ]);

  const goToProfile = () => setIndex(4);
  const closeOverlay = () => setProfileOverlay(null);

  const handleCategorySelectFromHome = (categoryId: string) => {
    setTargetCategoryId(categoryId);
    setIndex(1); // Switch to Categories tab
  };

  const handleTabPress = (newIndex: number) => {
    if (!isAuthenticated && (newIndex === 2 || newIndex === 3 || newIndex === 4)) {
      setIsLoginModalVisible(true);
      return;
    }
    setIndex(newIndex);
  };

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'home':
        return (
          <HomeScreen
            onProfilePress={goToProfile}
            onProductPress={(id) => setSelectedProductId(id)}
            onCategoryPress={handleCategorySelectFromHome}
            onCartPress={() => handleTabPress(2)}
            onRequireLogin={() => setIsLoginModalVisible(true)}
          />
        );
      case 'categories':
        return (
          <CategoryScreen
            initialCategoryId={targetCategoryId}
            onProductPress={(id) => setSelectedProductId(id)}
            onCartPress={() => handleTabPress(2)}
            onRequireLogin={() => setIsLoginModalVisible(true)}
          />
        );
      case 'cart':
        return <CartScreen onNavigateToOrders={() => setProfileOverlay('myOrders')} />;
      case 'wishlist':
        return (
          <WishlistScreen
            onProductPress={(id) => setSelectedProductId(id)}
            onCartPress={() => setIndex(2)}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onWalletPress={() => setProfileOverlay('wallet')}
            onCustomerManagementPress={() => setProfileOverlay('customerManagement')}
            onMyOrdersPress={() => setProfileOverlay('myOrders')}
            onManageAddressesPress={() => setProfileOverlay('manageAddresses')}
            onPaymentMethodsPress={() => setProfileOverlay('wallet')}
            onCouponsPress={() => setProfileOverlay('coupons')}
            onReferEarnPress={() => setProfileOverlay('referEarn')}
            onHelpSupportPress={() => setProfileOverlay('helpSupport')}
            onSettingsPress={() => setProfileOverlay('settings')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={handleTabPress}
        renderScene={renderScene}
        barStyle={styles.tabBar}
        safeAreaInsets={{ bottom: insets.bottom }}
        activeColor="#0C831F"       // Primary Green for active tab
        inactiveColor="#94A3B8"     // Slate for inactive tabs
        theme={{
          colors: {
            secondaryContainer: '#F0FDF4', // Light green indicator background
          },
        }}
        labeled={true}
        compact={false}
        shifting={false}
      />

      {/* Product Details Overlay */}
      {selectedProductId && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <ProductDetailsScreen
            productId={selectedProductId}
            onBack={() => setSelectedProductId(null)}
            onGoToCart={() => {
              setSelectedProductId(null);
              setIndex(2); // Switch to Cart tab
            }}
          />
        </View>
      )}

      {/* Wallet Overlay */}
      {profileOverlay === 'wallet' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <WalletScreen onBack={closeOverlay} />
        </View>
      )}

      {/* Customer Management Overlay */}
      {profileOverlay === 'customerManagement' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <CustomerManagementScreen onBack={closeOverlay} />
        </View>
      )}

      {/* My Orders Overlay */}
      {profileOverlay === 'myOrders' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <OrdersScreen onBack={closeOverlay} />
        </View>
      )}

      {/* Manage Addresses Overlay */}
      {profileOverlay === 'manageAddresses' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <ManageAddressesScreen onBack={closeOverlay} />
        </View>
      )}

      {/* Payment Methods Overlay */}
      {profileOverlay === 'paymentMethods' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <PaymentMethodsScreen onBack={closeOverlay} />
        </View>
      )}

      {/* Coupons Overlay */}
      {profileOverlay === 'coupons' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <CouponsScreen onBack={closeOverlay} />
        </View>
      )}

      {/* Refer & Earn Overlay */}
      {profileOverlay === 'referEarn' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <ReferEarnScreen onBack={closeOverlay} />
        </View>
      )}

      {/* Help & Support Overlay */}
      {profileOverlay === 'helpSupport' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <HelpSupportScreen onBack={closeOverlay} onRequireLogin={() => setIsLoginModalVisible(true)} />
        </View>
      )}

      {/* Settings Overlay */}
      {profileOverlay === 'settings' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <SettingsScreen
            onBack={closeOverlay}
            onPrivacyPolicyPress={() => setProfileOverlay('privacyPolicy')}
          />
        </View>
      )}

      {/* Privacy Policy Overlay */}
      {profileOverlay === 'privacyPolicy' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 10000, elevation: 10000 }]}>
          <PrivacyPolicyScreen onBack={() => setProfileOverlay('settings')} />
        </View>
      )}

      {/* Guest Mode Login Overlay */}
      {isLoginModalVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 10001, elevation: 10001 }]}>
          <LoginScreen
            onLoginSuccess={() => setIsLoginModalVisible(false)}
            onClose={() => {
              setIsLoginModalVisible(false);
              setIndex(0);
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
});

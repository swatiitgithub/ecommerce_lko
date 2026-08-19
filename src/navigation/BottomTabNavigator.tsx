import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import CategoryScreen from '../screens/tabs/CategoryScreen';
import CartScreen from '../screens/tabs/CartScreen';
import OrdersScreen from '../screens/tabs/OrdersScreen';
import ProfileScreen from '../screens/tabs/ProfileScreen';

// Route renderers - HomeRoute gets onProfilePress callback
const CategoryRoute = () => <CategoryScreen />;
const CartRoute = () => <CartScreen />;
const OrdersRoute = () => <OrdersScreen />;
const ProfileRoute = () => <ProfileScreen />;

export default function BottomTabNavigator() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  const goToProfile = () => setIndex(4);

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'home':
        return <HomeScreen onProfilePress={goToProfile} />;
      case 'categories':
        return <CategoryRoute />;
      case 'cart':
        return <CartRoute />;
      case 'orders':
        return <OrdersRoute />;
      case 'profile':
        return <ProfileRoute />;
      default:
        return null;
    }
  };

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
      key: 'orders',
      title: 'Orders',
      focusedIcon: 'package-variant-closed',
      unfocusedIcon: 'package-variant',
    },
    {
      key: 'profile',
      title: 'Profile',
      focusedIcon: 'account-circle',
      unfocusedIcon: 'account-circle-outline',
    },
  ]);

  return (
    <View style={styles.container}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        barStyle={[
          styles.tabBar,
          {
            height: 62 + (insets.bottom > 0 ? insets.bottom - 6 : 0),
            paddingBottom: insets.bottom > 0 ? insets.bottom - 6 : 0,
          },
        ]}
        safeAreaInsets={{ bottom: insets.bottom }}
        activeColor="#0C831F"       // Blinkit Green for active tab
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

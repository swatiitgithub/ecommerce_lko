import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const ALL_CATEGORIES = [
  { id: '1', title: 'Vegetables & Fruits', icon: '🥦', bgColor: '#E8F5E9', count: '120+ items' },
  { id: '2', title: 'Dairy, Bread & Eggs', icon: '🥛', bgColor: '#FFF3E0', count: '85+ items' },
  { id: '3', title: 'Munchies & Chips', icon: '🍟', bgColor: '#FFEBEE', count: '60+ items' },
  { id: '4', title: 'Cold Drinks & Juices', icon: '🥤', bgColor: '#E1F5FE', count: '75+ items' },
  { id: '5', title: 'Instant & Frozen Food', icon: '🍜', bgColor: '#F3E5F5', count: '50+ items' },
  { id: '6', title: 'Tea, Coffee & Health', icon: '☕', bgColor: '#FBE9E7', count: '40+ items' },
  { id: '7', title: 'Sweet Tooth', icon: '🍫', bgColor: '#FCE4EC', count: '90+ items' },
  { id: '8', title: 'Bakery & Biscuits', icon: '🍪', bgColor: '#FFFDE7', count: '55+ items' },
  { id: '9', title: 'Atta, Rice & Oil', icon: '🌾', bgColor: '#F9FBE7', count: '45+ items' },
  { id: '10', title: 'Masala & Dry Fruits', icon: '🌶️', bgColor: '#FFF8E1', count: '65+ items' },
  { id: '11', title: 'Personal Care', icon: '🧴', bgColor: '#E0F7FA', count: '100+ items' },
  { id: '12', title: 'Baby Care', icon: '🍼', bgColor: '#F8F9FA', count: '70+ items' },
  { id: '13', title: 'Home Cleaning', icon: '🧹', bgColor: '#EFEBE9', count: '80+ items' },
  { id: '14', title: 'Pet Care', icon: '🐾', bgColor: '#E8EAF6', count: '35+ items' },
  { id: '15', title: 'Stationery', icon: '✏️', bgColor: '#F3E5F5', count: '45+ items' },
  { id: '16', title: 'Electronics', icon: '🔌', bgColor: '#E8F5E9', count: '30+ items' },
];

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F7D117" barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>All Categories</Text>
        <Text style={styles.headerSubtitle}>{ALL_CATEGORIES.length} categories available</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {ALL_CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.categoryCard}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={styles.categoryTitle}>{item.title}</Text>
              <Text style={styles.categoryCount}>{item.count}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
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
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.7,
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 26,
  },
  cardText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

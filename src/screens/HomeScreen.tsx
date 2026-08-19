import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Searchbar, Surface } from 'react-native-paper';

const { width } = Dimensions.get('window');

// Data for Categories
const CATEGORIES = [
  { id: '1', title: 'Vegetables & Fruits', icon: '🥦🍎', bgColor: '#E8F5E9' },
  { id: '2', title: 'Dairy, Bread & Eggs', icon: '🥛🍞', bgColor: '#FFF3E0' },
  { id: '3', title: 'Munchies & Chips', icon: '🍟🍪', bgColor: '#FFEBEE' },
  { id: '4', title: 'Cold Drinks & Juices', icon: '🥤🧊', bgColor: '#E1F5FE' },
  { id: '5', title: 'Instant Food', icon: '🍜🍕', bgColor: '#F3E5F5' },
  { id: '6', title: 'Personal Care', icon: '🧴🧼', bgColor: '#E0F7FA' },
  { id: '7', title: 'Baby Care', icon: '🍼🧸', bgColor: '#FFFDE7' },
  { id: '8', title: 'Home & Kitchen', icon: '🧹🍳', bgColor: '#EFEBE9' },
];

// Data for Trending Products
const TRENDING_PRODUCTS = [
  { id: 't1', title: 'Amul Taaza T-Special Milk (1L)', price: 68, oldPrice: 70, weight: '1 l', icon: '🥛' },
  { id: 't2', title: 'Harvest Gold White Bread', price: 42, oldPrice: 45, weight: '400 g', icon: '🍞' },
  { id: 't3', title: 'Lay\'s Classic Salted Potato Chips', price: 20, oldPrice: 20, weight: '50 g', icon: '🍟' },
  { id: 't4', title: 'Coca-Cola Soft Drink Can', price: 38, oldPrice: 40, weight: '300 ml', icon: '🥤' },
];

interface HomeScreenProps {
  onProfilePress?: () => void;
}

export default function HomeScreen({ onProfilePress }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const handleAdd = (productId: string) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleSubtract = (productId: string) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: current - 1,
      };
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F7D117" barStyle="dark-content" />

      {/* --- Header Section (Blinkit Yellow) --- */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.locationContainer}>
          <View>
            <Text style={styles.deliveryTitle}>Blinkit in 10 minutes</Text>
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={1}>
                B-102, Shanti Kunj, Sector-5, Noida
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            {/* Notification Icon */}
            <TouchableOpacity style={styles.iconBtn}>
              <Text style={styles.iconEmoji}>🔔</Text>
              {/* Red badge */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
            {/* Profile Avatar */}
            <TouchableOpacity style={styles.avatar} onPress={onProfilePress} activeOpacity={0.75}>
              <Text style={styles.avatarText}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Paper Searchbar */}
        <Searchbar
          placeholder='Search "milk", "bread", "chips"'
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchBarInput}
          iconColor="#64748B"
          placeholderTextColor="#94A3B8"
          theme={{ colors: { primary: '#0C831F' } }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- Promo Banner --- */}
        <View style={styles.promoBanner}>
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoTitle}>Super Saver Deals</Text>
            <Text style={styles.promoSubtitle}>Get up to 40% OFF on household essentials</Text>
            <TouchableOpacity style={styles.promoButton}>
              <Text style={styles.promoButtonText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.promoEmoji}>🛒🎉</Text>
        </View>

        {/* --- Categories Grid --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity key={item.id} style={styles.categoryCard}>
                <View style={[styles.categoryIconBox, { backgroundColor: item.bgColor }]}>
                  <Text style={styles.categoryIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.categoryTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- Trending Products Section --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Trending Products</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsRow}>
            {TRENDING_PRODUCTS.map((product) => {
              const qty = quantities[product.id] || 0;
              return (
                <View key={product.id} style={styles.productCard}>
                  {/* Product Visual Container */}
                  <View style={styles.productImageContainer}>
                    <Text style={styles.productEmoji}>{product.icon}</Text>
                  </View>

                  <Text style={styles.productTitle} numberOfLines={2}>
                    {product.title}
                  </Text>
                  <Text style={styles.productWeight}>{product.weight}</Text>

                  {/* Price & Add to Cart Section */}
                  <View style={styles.productFooter}>
                    <View>
                      <Text style={styles.productPrice}>₹{product.price}</Text>
                      {product.oldPrice > product.price && (
                        <Text style={styles.productOldPrice}>₹{product.oldPrice}</Text>
                      )}
                    </View>

                    {qty > 0 ? (
                      // Plus / Minus Quantity Selector
                      <View style={styles.quantitySelector}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleSubtract(product.id)}>
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleAdd(product.id)}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      // Add Button
                      <TouchableOpacity style={styles.addButton} onPress={() => handleAdd(product.id)}>
                        <Text style={styles.addButtonText}>ADD</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Extra Bottom Space */}
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
    backgroundColor: '#F7D117', // Blinkit Yellow
    paddingHorizontal: 16,
    // paddingTop is applied dynamically via insets
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  deliveryTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    maxWidth: width * 0.6,
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#000000',
    marginLeft: 6,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconEmoji: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#F7D117',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    height: 46,
  },
  searchBarInput: {
    fontSize: 13,
    color: '#0F172A',
    minHeight: 0,
  },
  scrollContent: {
    padding: 16,
  },
  promoBanner: {
    backgroundColor: '#0F766E', // Teal Green
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  promoTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  promoSubtitle: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 4,
    lineHeight: 15,
  },
  promoButton: {
    backgroundColor: '#F7D117',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  promoButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
  promoEmoji: {
    fontSize: 48,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 48) / 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.02)',
  },
  categoryIcon: {
    fontSize: 30,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 14,
    height: 28,
  },
  productsRow: {
    paddingRight: 16,
  },
  productCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productImageContainer: {
    width: '100%',
    height: 90,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  productEmoji: {
    fontSize: 44,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
    height: 32,
  },
  productWeight: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  productOldPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0C831F',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  addButtonText: {
    color: '#0C831F',
    fontSize: 11,
    fontWeight: '800',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C831F',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  qtyBtn: {
    paddingHorizontal: 6,
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  qtyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginHorizontal: 4,
  },
});

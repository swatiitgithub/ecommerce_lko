import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Searchbar, Surface, IconButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import {
  useGetPublicBannersQuery,
  useGetPublicCategoriesQuery,
  useGetPublicProductsQuery,
  useGetPublicSubCategoriesQuery,
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useViewCartQuery,
  useAddToCartMutation,
  useIncreaseCartQtyMutation,
  useDecreaseCartQtyMutation,
  useRemoveFromCartMutation,
  useGetAddressesQuery,
} from '../redux/apiSlice';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onProfilePress?: () => void;
  onProductPress?: (productId: string) => void;
  onCategoryPress?: (categoryId: string) => void;
  onCartPress?: () => void;
  onRequireLogin?: () => void;
}

export default function HomeScreen({ onProfilePress, onProductPress, onCategoryPress, onCartPress, onRequireLogin }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const auth = useSelector((state: any) => state.auth);
  const isAuthenticated = !!(auth?.accessToken || auth?.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);

  // Skeleton animation fade
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  // Fetch banners from API
  const { data: bannerResponse, isLoading: isBannersLoading } = useGetPublicBannersQuery({
    page: 1,
    limit: 20,
  });
  const banners = bannerResponse?.data || [];

  // Fetch categories from API
  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useGetPublicCategoriesQuery({
    page: 1,
    limit: 50,
    status: 'active',
  });
  const categories = categoriesResponse?.data || [];

  // Fetch subcategories from API
  const { data: subCategoriesResponse, isLoading: isSubCategoriesLoading } = useGetPublicSubCategoriesQuery({
    category_id: selectedCategoryId || undefined,
    page: 1,
    limit: 50,
    status: 'active',
  });
  const subCategories = subCategoriesResponse?.data || [];

  // Fetch user addresses from API
  const { data: addressesRes } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });
  const userAddresses = addressesRes?.data || addressesRes?.addresses || [];
  const defaultAddress = userAddresses.find((a: any) => a.isDefault) || userAddresses[0];

  const headerAddressText = defaultAddress
    ? `${defaultAddress.addressType ? defaultAddress.addressType + ': ' : ''}${defaultAddress.addressLine1}${defaultAddress.city ? `, ${defaultAddress.city}` : ''}`
    : isAuthenticated
    ? 'Add delivery address'
    : 'Select Location / Login';

  // Fetch wishlist
  const { data: wishlistResponse, refetch: refetchWishlist } = useGetWishlistQuery({ page: 1, limit: 50 });
  const [toggleWishlist] = useToggleWishlistMutation();

  const handleToggleWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    try {
      const res = await toggleWishlist(productId).unwrap();
      if (res.success) {
        refetchWishlist();
      }
    } catch (err: any) {
      console.log('Wishlist toggle error:', err);
    }
  };

  // Fetch Cart from API
  const { data: cartResponse, refetch: refetchCart } = useViewCartQuery({ page: 1, limit: 50 });
  const [addToCart] = useAddToCartMutation();
  const [increaseQty] = useIncreaseCartQtyMutation();
  const [decreaseQty] = useDecreaseCartQtyMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const cartData = cartResponse?.data;
  const cartItems = cartData?.items || [];
  const pricingSummary = cartData?.pricingSummary;

  const totalCartQty = pricingSummary?.totalQuantity || cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  const totalCartPrice = pricingSummary?.subtotal || cartItems.reduce((sum: number, item: any) => {
    const price = item.product?.sellPrice || item.product?.price || 0;
    return sum + (price * (item.quantity || 1));
  }, 0);

  const firstCartItem = cartItems[0];
  const firstCartItemImg = firstCartItem?.product?.image?.url ||
    (firstCartItem?.product?.images && firstCartItem.product.images[0]?.url);

  const getProductQuantity = (productId: string) => {
    const item = cartItems.find((ci: any) => ci.product?._id === productId);
    return item ? item.quantity : 0;
  };

  // Refetch cart and wishlist on mount
  useEffect(() => {
    refetchCart();
    refetchWishlist();
  }, []);

  // Fetch products from API with search, category & subcategory filters
  const { data: productsResponse, isLoading: isProductsLoading } = useGetPublicProductsQuery({
    page: 1,
    limit: 50,
    status: 'active',
    ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
    ...(selectedCategoryId ? { category_id: selectedCategoryId } : {}),
    ...(selectedSubCategoryId ? { subcategory_id: selectedSubCategoryId } : {}),
  });
  const apiProducts = productsResponse?.data || [];
  const products = apiProducts.filter((p: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q)
    );
  });

  const handleAdd = async (productId: string) => {
    if (!isAuthenticated) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    try {
      const currentQty = getProductQuantity(productId);
      if (currentQty === 0) {
        await addToCart({ productId, quantity: 1 }).unwrap();
      } else {
        await increaseQty(productId).unwrap();
      }
      refetchCart();
    } catch (err: any) {
      console.log('Error adding to cart:', err);
    }
  };

  const handleSubtract = async (productId: string) => {
    try {
      const currentQty = getProductQuantity(productId);
      if (currentQty <= 1) {
        await removeFromCart(productId).unwrap();
      } else {
        await decreaseQty(productId).unwrap();
      }
      refetchCart();
    } catch (err: any) {
      console.log('Error subtracting/removing cart:', err);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* --- Header Section (Primary Yellow) --- */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.locationContainer}>
          <View>
            <Image
              source={require('../assest/images/logo.png')}
              style={styles.headerLogoImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.addressRow}
              onPress={() => {
                if (!isAuthenticated) {
                  onRequireLogin?.();
                } else {
                  onProfilePress?.();
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.addressText} numberOfLines={1}>
                {headerAddressText}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerIcons}>
            {/* Notification Icon */}
            <TouchableOpacity style={styles.iconBtn}>
              <IconButton
                icon="bell-outline"
                size={22}
                iconColor="#0F172A"
                style={{ margin: 0 }}
              />
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
        
        {/* --- Dynamic Categories (Above Banners) --- */}
        {isCategoriesLoading ? (
          <View style={styles.topCategoriesSection}>
            <Text style={styles.topCategoriesTitle}>Shop by Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScrollContent}>
              {[1, 2, 3, 4, 5].map((key) => (
                <View key={key} style={styles.circleCategoryCard}>
                  <Animated.View style={[styles.circleCategoryIconBox, { opacity: fadeAnim, backgroundColor: '#E2E8F0', borderWidth: 0 }]} />
                  <Animated.View style={{ opacity: fadeAnim, width: 50, height: 10, backgroundColor: '#E2E8F0', borderRadius: 4, marginTop: 4, alignSelf: 'center' }} />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : categories && categories.length > 0 ? (
          <View style={styles.topCategoriesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.topCategoriesTitle}>Shop by Category</Text>
              {(selectedCategoryId || selectedSubCategoryId) && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCategoryId(null);
                    setSelectedSubCategoryId(null);
                  }}
                >
                  <Text style={styles.clearFilterText}>Show All</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContent}
            >
              {categories.map((item: any) => {
                const isSelected = selectedCategoryId === item._id;
                return (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.circleCategoryCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (onCategoryPress) {
                        onCategoryPress(item._id);
                      } else {
                        if (isSelected) {
                          setSelectedCategoryId(null);
                          setSelectedSubCategoryId(null);
                        } else {
                          setSelectedCategoryId(item._id);
                          setSelectedSubCategoryId(null);
                        }
                      }
                    }}
                  >
                    <View style={[styles.circleCategoryIconBox, isSelected && styles.selectedCircleCategoryIconBox]}>
                      {item.image?.url ? (
                        <Image
                          source={{ uri: item.image.url }}
                          style={styles.circleCategoryImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ fontSize: 24 }}>🛍️</Text>
                      )}
                    </View>
                    <Text
                      style={[styles.circleCategoryTitle, isSelected && styles.selectedCircleCategoryTitle]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* --- Dynamic Sub-Categories Section --- */}
        {isSubCategoriesLoading ? (
          <View style={styles.subCategoriesSection}>
            <Text style={styles.subCategoriesSectionTitle}>Sub Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subCategoriesScrollContent}>
              {[1, 2, 3, 4].map((key) => (
                <Animated.View key={key} style={[styles.subCategoryPill, { opacity: fadeAnim, backgroundColor: '#E2E8F0', borderWidth: 0, width: 80, height: 32 }]} />
              ))}
            </ScrollView>
          </View>
        ) : subCategories && subCategories.length > 0 ? (
          <View style={styles.subCategoriesSection}>
            <Text style={styles.subCategoriesSectionTitle}>
              {selectedCategoryId
                ? `${categories.find((c: any) => c._id === selectedCategoryId)?.name || 'Category'} Options`
                : 'Sub Categories'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subCategoriesScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.subCategoryPill,
                  !selectedSubCategoryId && styles.activeSubCategoryPill,
                ]}
                onPress={() => setSelectedSubCategoryId(null)}
              >
                <Text
                  style={[
                    styles.subCategoryPillText,
                    !selectedSubCategoryId && styles.activeSubCategoryPillText,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              {subCategories
                .filter((subCat: any) => {
                  if (!selectedCategoryId) return true;
                  return subCat.category?._id === selectedCategoryId;
                })
                .map((subCat: any) => {
                  const isSelected = selectedSubCategoryId === subCat._id;
                  return (
                    <TouchableOpacity
                      key={subCat._id}
                      style={[
                        styles.subCategoryPill,
                        isSelected && styles.activeSubCategoryPill,
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedSubCategoryId(null);
                        } else {
                          setSelectedSubCategoryId(subCat._id);
                          if (subCat.category?._id) {
                            setSelectedCategoryId(subCat.category._id);
                          }
                        }
                      }}
                    >
                      {subCat.image?.url && (
                        <Image
                          source={{ uri: subCat.image.url }}
                          style={styles.subCategoryPillImage}
                          resizeMode="cover"
                        />
                      )}
                      <Text
                        style={[
                          styles.subCategoryPillText,
                          isSelected && styles.activeSubCategoryPillText,
                        ]}
                      >
                        {subCat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        ) : null}

        {/* --- Dynamic Banners --- */}
        {isBannersLoading ? (
          <Animated.View style={[styles.bannerItem, { opacity: fadeAnim, backgroundColor: '#E2E8F0', borderWidth: 0, marginBottom: 24 }]} />
        ) : banners && banners.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bannersContainer}
            contentContainerStyle={styles.bannersScroll}
          >
            {banners.map((banner: any, index: number) => (
              <TouchableOpacity
                key={banner._id}
                style={[
                  styles.bannerItem,
                  { marginRight: index === banners.length - 1 ? 0 : 12 }
                ]}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: banner.image.url }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
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
        )}

        {/* --- Products Section --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {selectedSubCategoryId
              ? subCategories.find((s: any) => s._id === selectedSubCategoryId)?.name || 'Products'
              : selectedCategoryId
              ? categories.find((c: any) => c._id === selectedCategoryId)?.name || 'Products'
              : 'All Products'}
          </Text>
          {isProductsLoading ? (
            <View style={styles.productsGrid}>
              {[1, 2, 3, 4].map((key) => (
                <View key={key} style={styles.productCard}>
                  <Animated.View style={[styles.productImageContainer, { opacity: fadeAnim, backgroundColor: '#E2E8F0', borderWidth: 0 }]} />
                  <Animated.View style={{ opacity: fadeAnim, width: 60, height: 12, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 6 }} />
                  <Animated.View style={{ opacity: fadeAnim, width: '90%', height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 6 }} />
                  <Animated.View style={{ opacity: fadeAnim, width: '60%', height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 12 }} />
                  <View style={styles.productFooter}>
                    <Animated.View style={{ opacity: fadeAnim, width: 50, height: 16, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
                    <Animated.View style={{ opacity: fadeAnim, width: 60, height: 26, backgroundColor: '#E2E8F0', borderRadius: 6 }} />
                  </View>
                </View>
              ))}
            </View>
          ) : (() => {
            const filteredProducts = products.filter((product: any) => {
              if (selectedSubCategoryId) {
                return product.subCategory?._id === selectedSubCategoryId;
              }
              if (selectedCategoryId) {
                return product.category?._id === selectedCategoryId;
              }
              if (searchQuery.trim()) {
                return product.name.toLowerCase().includes(searchQuery.toLowerCase());
              }
              return true;
            });

            return filteredProducts && filteredProducts.length > 0 ? (
              <View style={styles.productsGrid}>
                {filteredProducts.map((product: any) => {
                  const qty = getProductQuantity(product._id);
                  const discount = product.mrp > product.sellPrice
                    ? Math.round(((product.mrp - product.sellPrice) / product.mrp) * 100)
                    : 0;
                  const isWishlisted = wishlistResponse?.data?.some((item: any) => {
                    const productItem = item.product || item;
                    return productItem?._id === product._id;
                  }) || false;

                return (
                  <TouchableOpacity
                    key={product._id}
                    style={styles.productCard}
                    activeOpacity={0.88}
                    onPress={() => onProductPress && onProductPress(product._id)}
                  >
                    {/* Discount Badge */}
                    {discount > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
                      </View>
                    )}

                    {/* Wishlist Button */}
                    <TouchableOpacity
                      style={styles.heartButton}
                      onPress={() => handleToggleWishlist(product._id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.heartIconText}>{isWishlisted ? '❤️' : '🤍'}</Text>
                    </TouchableOpacity>

                    {/* Product Image */}
                    <View style={styles.productImageContainer}>
                      {product.image?.url ? (
                        <Image
                          source={{ uri: product.image.url }}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.productEmoji}>🛍️</Text>
                      )}
                    </View>

                    {/* Category Chip */}
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryChipText} numberOfLines={1}>
                        {product.category?.name || ''}
                      </Text>
                    </View>

                    <Text style={styles.productTitle} numberOfLines={2}>
                      {product.name}
                    </Text>

                    {/* Variant if exists */}
                    {product.variants && product.variants.length > 0 && (
                      <Text style={styles.productWeight}>
                        {product.variants[0].key}: {product.variants[0].value}
                      </Text>
                    )}

                    {/* Price & Add to Cart Section */}
                    <View style={styles.productFooter}>
                      <View>
                        <Text style={styles.productPrice}>₹{product.sellPrice}</Text>
                        {product.mrp > product.sellPrice && (
                          <Text style={styles.productOldPrice}>₹{product.mrp}</Text>
                        )}
                      </View>

                      {qty > 0 ? (
                        <View style={styles.quantitySelector}>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => handleSubtract(product._id)}>
                            <Text style={styles.qtyBtnText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{qty}</Text>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => handleAdd(product._id)}>
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.addButton} onPress={() => handleAdd(product._id)}>
                          <Text style={styles.addButtonText}>ADD</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.productsLoaderContainer}>
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>No products found in this selection</Text>
            </View>
          );
        })()}
        </View>

        {/* Extra Bottom Space */}
        <View style={{ height: totalCartQty > 0 ? 120 : 90 }} />
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {totalCartQty > 0 && (
        <View style={styles.floatingCartBar}>
          <TouchableOpacity
            style={styles.floatingCartContent}
            onPress={onCartPress}
            activeOpacity={0.9}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.cartBarImgWrapper}>
                {firstCartItemImg ? (
                  <Image source={{ uri: firstCartItemImg }} style={styles.cartBarImg as any} resizeMode="contain" />
                ) : (
                  <Text style={{ fontSize: 16 }}>🛍️</Text>
                )}
              </View>
              <View style={styles.floatingCartTextCol}>
                <Text style={styles.floatingCartTitle}>View cart</Text>
                <Text style={styles.floatingCartSubTitle}>
                  {totalCartQty} {totalCartQty === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </View>

            <View style={styles.cartBarArrowCircle}>
              <Text style={styles.cartBarArrowText}>›</Text>
            </View>
          </TouchableOpacity>
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
  header: {
    backgroundColor: '#F7D117', // Primary Yellow
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
  headerLogoImage: {
    width: 70,
    height: 26,
    marginBottom: 2,
  },
  topCategoriesSection: {
    marginBottom: 24,
  },
  topCategoriesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  categoriesScrollContent: {
    paddingRight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0C831F',
  },
  circleCategoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 66,
  },
  circleCategoryIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedCircleCategoryIconBox: {
    borderColor: '#0C831F',
    borderWidth: 2.5,
    backgroundColor: '#F0FDF4',
  },
  circleCategoryImage: {
    width: '100%',
    height: '100%',
  },
  circleCategoryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 14,
  },
  selectedCircleCategoryTitle: {
    color: '#0C831F',
    fontWeight: '800',
  },
  subCategoriesSection: {
    marginBottom: 20,
  },
  subCategoriesSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  subCategoriesScrollContent: {
    paddingRight: 16,
  },
  subCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  activeSubCategoryPill: {
    backgroundColor: '#0C831F',
    borderColor: '#0C831F',
  },
  subCategoryPillImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  subCategoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  activeSubCategoryPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  categoriesLoaderContainer: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
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
  bannersContainer: {
    marginBottom: 24,
  },
  bannersScroll: {
    paddingRight: 16,
  },
  bannerItem: {
    width: width - 32,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerLoaderContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productsLoaderContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#0C831F',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  productImageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productEmoji: {
    fontSize: 44,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  categoryChipText: {
    color: '#0C831F',
    fontSize: 9,
    fontWeight: '700',
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
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  heartIconText: {
    fontSize: 12,
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0C831F',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: '52%',
    maxWidth: 190,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBarImgWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 8,
  },
  cartBarImg: {
    width: 22,
    height: 22,
  },
  floatingCartTextCol: {
    justifyContent: 'center',
  },
  floatingCartTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  floatingCartSubTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 0,
    opacity: 0.9,
  },
  cartBarArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#085C15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBarArrowText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: -2,
  },
});

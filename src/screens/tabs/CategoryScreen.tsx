import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
  useGetPublicCategoriesQuery,
  useGetPublicSubCategoriesQuery,
  useGetPublicProductsQuery,
  useAddToCartMutation,
  useViewCartQuery,
  useIncreaseCartQtyMutation,
  useDecreaseCartQtyMutation,
} from '../../redux/apiSlice';
import {
  SkeletonBox,
  CategorySidebarSkeleton,
  CategoryBannerSkeleton,
  ProductCardSkeleton,
} from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');

interface CategoryScreenProps {
  initialCategoryId?: string | null;
  onProductPress?: (productId: string) => void;
  onCartPress?: () => void;
  onRequireLogin?: () => void;
}

export default function CategoryScreen({ initialCategoryId, onProductPress, onCartPress, onRequireLogin }: CategoryScreenProps) {
  const insets = useSafeAreaInsets();
  const auth = useSelector((state: any) => state.auth);
  const isAuthenticated = !!(auth?.accessToken || auth?.user);

  // ── RTK Query Data ─────────────────────────────────────────────────────────
  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useGetPublicCategoriesQuery({
    page: 1,
    limit: 50,
    status: 'active',
  });
  const categories = categoriesResponse?.data || [];

  // Selected Category & SubCategory state
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSubCatId, setSelectedSubCatId] = useState<string | null>(null);

  // Cart API
  const { data: cartDataResponse } = useViewCartQuery({});
  const cartData = cartDataResponse?.data;
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

  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [increaseQty] = useIncreaseCartQtyMutation();
  const [decreaseQty] = useDecreaseCartQtyMutation();

  // Initialize selected category when data arrives or initialCategoryId prop changes
  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCatId(initialCategoryId);
      setSelectedSubCatId(null);
    } else if (categories.length > 0 && !selectedCatId) {
      setSelectedCatId(categories[0].category_id || categories[0]._id);
      setSelectedSubCatId(null);
    }
  }, [categories, initialCategoryId]);

  // Active Category Object
  const activeCategory = categories.find(
    (cat: any) => cat.category_id === selectedCatId || cat._id === selectedCatId
  ) || categories[0];

  // Selected Category ID param to send to sub-categories API (can be CAT-XXXXXX or MongoDB _id)
  const activeCatParam = activeCategory?.category_id || activeCategory?._id || undefined;

  // Fetch Subcategories for active Category via API query with category_id param
  const {
    data: subCategoriesResponse,
    isLoading: isSubCategoriesLoading,
    isFetching: isSubCategoriesFetching,
  } = useGetPublicSubCategoriesQuery(
    activeCatParam
      ? { category_id: activeCatParam, page: 1, limit: 50, status: 'active' }
      : { page: 1, limit: 50, status: 'active' }
  );

  const rawSubCategories = subCategoriesResponse?.data || [];
  // Active subcategories matching the selected category
  const activeSubCategories = rawSubCategories.filter((subCat: any) => {
    if (!activeCatParam) return true;
    if (!subCat.category) return true;
    if (typeof subCat.category === 'object' && subCat.category !== null) {
      return (
        subCat.category._id === activeCategory?._id ||
        subCat.category.category_id === activeCategory?.category_id ||
        subCat.category._id === activeCatParam ||
        subCat.category.category_id === activeCatParam
      );
    }
    return (
      subCat.category === activeCategory?._id ||
      subCat.category === activeCategory?.category_id ||
      subCat.category === activeCatParam
    );
  });

  // Active SubCategory Object
  const activeSubCatObj = activeSubCategories.find(
    (sub: any) => sub._id === selectedSubCatId || sub.sub_category_id === selectedSubCatId
  );
  const subCatParam = activeSubCatObj?.sub_category_id || activeSubCatObj?._id || selectedSubCatId || undefined;

  // Fetch Products for active Category & optional Subcategory
  const {
    data: productsResponse,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
  } = useGetPublicProductsQuery(
    activeCatParam
      ? {
          category_id: activeCatParam,
          ...(subCatParam ? { sub_category_id: subCatParam } : {}),
          limit: 50,
        }
      : { limit: 50 }
  );

  const products = productsResponse?.data || [];

  // Cart Helper
  const getCartQuantity = (productId: string) => {
    const item = cartItems.find((ci: any) => (ci.product?._id || ci.product) === productId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = async (product: any) => {
    if (!isAuthenticated) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    try {
      await addToCart({ productId: product._id, quantity: 1 }).unwrap();
    } catch (err: any) {
      Alert.alert('Cart Error', err?.data?.message || 'Failed to add item to cart');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Category Store</Text>
            <Text style={styles.headerSubtitle}>
              {isCategoriesLoading ? 'Loading...' : `${categories.length} Categories available`}
            </Text>
          </View>
        </View>
      </View>

      {/* Split View Container */}
      <View style={styles.splitBody}>
        {/* ── LEFT SIDEBAR: CATEGORIES LIST ────────────────────────────────── */}
        <View style={styles.sidebar}>
          {isCategoriesLoading ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {[1, 2, 3, 4, 5, 6, 7].map((key) => (
                <CategorySidebarSkeleton key={key} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {categories.map((cat: any) => {
                const catIdVal = cat.category_id || cat._id;
                const isSelected =
                  cat._id === selectedCatId ||
                  cat.category_id === selectedCatId ||
                  cat._id === activeCategory?._id ||
                  cat.category_id === activeCategory?.category_id;

                return (
                  <TouchableOpacity
                    key={cat._id || cat.category_id}
                    style={[styles.sidebarItem, isSelected && styles.sidebarItemActive]}
                    onPress={() => {
                      setSelectedCatId(catIdVal);
                      setSelectedSubCatId(null);
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Active Left Indicator Bar */}
                    {isSelected && <View style={styles.activeBar} />}

                    <View style={[styles.sidebarIconBox, isSelected && styles.sidebarIconBoxActive]}>
                      {cat.image?.url ? (
                        <Image
                          source={{ uri: cat.image.url }}
                          style={styles.sidebarImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ fontSize: 18 }}>🛍️</Text>
                      )}
                    </View>
                    <Text
                      style={[styles.sidebarText, isSelected && styles.sidebarTextActive]}
                      numberOfLines={2}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── RIGHT PANEL: SUBCATEGORIES & PRODUCTS ───────────────────────── */}
        <View style={styles.mainContent}>
          {isCategoriesLoading ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.mainScrollContent}
            >
              {/* Category Header Banner Skeleton */}
              <CategoryBannerSkeleton />

              {/* Subcategories Section Skeleton */}
              <View style={styles.subCatSection}>
                <SkeletonBox width={100} height={14} borderRadius={4} style={{ marginBottom: 10 }} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <SkeletonBox width={60} height={30} borderRadius={12} />
                  <SkeletonBox width={85} height={30} borderRadius={12} />
                  <SkeletonBox width={75} height={30} borderRadius={12} />
                </View>
              </View>

              {/* Products Section Skeleton */}
              <View style={styles.productsSection}>
                <View style={styles.productsHeaderRow}>
                  <SkeletonBox width={80} height={14} borderRadius={4} />
                  <SkeletonBox width={50} height={18} borderRadius={6} />
                </View>
                <View style={styles.productsGrid}>
                  {[1, 2, 3, 4, 5, 6].map((key) => (
                    <ProductCardSkeleton key={key} />
                  ))}
                </View>
              </View>
            </ScrollView>
          ) : activeCategory ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.mainScrollContent}
            >
              {/* Category Header Banner */}
              <View style={styles.categoryBanner}>
                <View style={styles.bannerTextCol}>
                  <Text style={styles.bannerTitle}>{activeCategory.name}</Text>
                  <Text style={styles.bannerSub}>
                    {activeSubCategories.length > 0
                      ? `${activeSubCategories.length} Sub-categories`
                      : 'Explore quality products'}
                  </Text>
                </View>
                {activeCategory.image?.url && (
                  <Image
                    source={{ uri: activeCategory.image.url }}
                    style={styles.bannerImg}
                    resizeMode="contain"
                  />
                )}
              </View>

              {/* Subcategories Section */}
              {isSubCategoriesLoading || isSubCategoriesFetching ? (
                <View style={styles.subCatSection}>
                  <Text style={styles.sectionHeading}>Sub-categories</Text>
                  <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                    <SkeletonBox width={65} height={32} borderRadius={12} />
                    <SkeletonBox width={85} height={32} borderRadius={12} />
                    <SkeletonBox width={75} height={32} borderRadius={12} />
                  </View>
                </View>
              ) : activeSubCategories.length > 0 ? (
                <View style={styles.subCatSection}>
                  <Text style={styles.sectionHeading}>Sub-categories</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.subCatScroll}
                  >
                    {/* "All" Subcategory Pill */}
                    <TouchableOpacity
                      style={[
                        styles.subCatPill,
                        selectedSubCatId === null && styles.subCatPillActive,
                      ]}
                      onPress={() => setSelectedSubCatId(null)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.subCatPillText,
                          selectedSubCatId === null && styles.subCatPillTextActive,
                        ]}
                      >
                        All
                      </Text>
                    </TouchableOpacity>

                    {activeSubCategories.map((sub: any) => {
                      const subIdVal = sub.sub_category_id || sub._id;
                      const isSubSelected =
                        selectedSubCatId === sub._id || selectedSubCatId === sub.sub_category_id;
                      return (
                        <TouchableOpacity
                          key={sub._id || sub.sub_category_id}
                          style={[styles.subCatPill, isSubSelected && styles.subCatPillActive]}
                          onPress={() => setSelectedSubCatId(subIdVal)}
                          activeOpacity={0.8}
                        >
                          {sub.image?.url && (
                            <Image
                              source={{ uri: sub.image.url }}
                              style={styles.subCatPillImg}
                              resizeMode="cover"
                            />
                          )}
                          <Text
                            style={[
                              styles.subCatPillText,
                              isSubSelected && styles.subCatPillTextActive,
                            ]}
                          >
                            {sub.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              {/* Products Section */}
              <View style={styles.productsSection}>
                <View style={styles.productsHeaderRow}>
                  <Text style={styles.sectionHeading}>Products</Text>
                  <Text style={styles.productCountBadge}>{products.length} Items</Text>
                </View>

                {isProductsLoading ? (
                  <View style={styles.productsGrid}>
                    {[1, 2, 3, 4, 5, 6].map((key) => (
                      <ProductCardSkeleton key={key} />
                    ))}
                  </View>
                ) : products.length === 0 ? (
                  <View style={styles.emptyProductsBox}>
                    <Text style={{ fontSize: 36, marginBottom: 8 }}>🛒</Text>
                    <Text style={styles.emptyTitle}>No products found</Text>
                    <Text style={styles.emptySub}>No products available in this sub-category right now.</Text>
                  </View>
                ) : (
                  <View style={styles.productsGrid}>
                    {products.map((item: any) => {
                      const qty = getCartQuantity(item._id);
                      const sellPrice = item.sellPrice ?? item.price ?? item.sellingPrice ?? item.offerPrice ?? item.mrp ?? 0;
                      const mrpPrice = item.mrp ?? item.originalPrice ?? item.regularPrice ?? 0;
                      const discountPercentage = mrpPrice > sellPrice
                        ? Math.round(((mrpPrice - sellPrice) / mrpPrice) * 100)
                        : 0;

                      const imgUri = item.image?.url || (item.images && item.images[0]?.url) || (typeof item.image === 'string' ? item.image : null);

                      return (
                        <TouchableOpacity
                          key={item._id}
                          style={styles.productCard}
                          activeOpacity={0.9}
                          onPress={() => onProductPress && onProductPress(item._id)}
                        >
                          {/* Image Box */}
                          <View style={styles.productImgBox}>
                            {imgUri ? (
                              <Image
                                source={{ uri: imgUri }}
                                style={styles.productImg}
                                resizeMode="contain"
                              />
                            ) : (
                              <Text style={{ fontSize: 32 }}>📦</Text>
                            )}

                            {discountPercentage > 0 && (
                              <View style={styles.discountBadge}>
                                <Text style={styles.discountBadgeText}>{discountPercentage}% OFF</Text>
                              </View>
                            )}
                          </View>

                          {/* Product Details */}
                          <Text style={styles.productName} numberOfLines={2}>
                            {item.name}
                          </Text>
                          <Text style={styles.productUnit}>{item.unit || item.quantityLabel || item.weight || '1 unit'}</Text>

                          {/* Price & Add Button */}
                          <View style={styles.productBottomRow}>
                            <View>
                              <Text style={styles.priceText}>₹{sellPrice}</Text>
                              {mrpPrice > sellPrice && (
                                <Text style={styles.originalPriceText}>₹{mrpPrice}</Text>
                              )}
                            </View>

                            {qty > 0 ? (
                              <View style={styles.qtyBox}>
                                <TouchableOpacity
                                  style={styles.qtyBtn}
                                  onPress={() => decreaseQty(item._id)}
                                >
                                  <Text style={styles.qtyBtnText}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{qty}</Text>
                                <TouchableOpacity
                                  style={styles.qtyBtn}
                                  onPress={() => increaseQty(item._id)}
                                >
                                  <Text style={styles.qtyBtnText}>+</Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.addCartBtn}
                                onPress={() => handleAddToCart(item)}
                                activeOpacity={0.8}
                                disabled={isAddingToCart}
                              >
                                <Text style={styles.addCartBtnText}>ADD</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={{ height: totalCartQty > 0 ? 120 : 100 }} />
            </ScrollView>
          ) : null}
        </View>
      </View>

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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#F7D117',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#000000',
    opacity: 0.65,
    fontWeight: '600',
    marginTop: 2,
  },

  // Split Screen Body
  splitBody: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar (Left Category Column)
  sidebar: {
    width: 105,
    backgroundColor: '#F1F5F9',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  sidebarLoader: {
    paddingTop: 30,
    alignItems: 'center',
  },
  sidebarItem: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  sidebarItemActive: {
    backgroundColor: '#FFFFFF',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    backgroundColor: '#0C831F',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  sidebarIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sidebarIconBoxActive: {
    borderColor: '#0C831F',
    backgroundColor: '#F0FDF4',
  },
  sidebarImg: {
    width: '100%',
    height: '100%',
  },
  sidebarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },
  sidebarTextActive: {
    color: '#0C831F',
    fontWeight: '900',
  },

  // Main Content (Right Subcategories & Products Column)
  mainContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainScrollContent: {
    padding: 14,
  },

  // Category Banner
  categoryBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  bannerSub: {
    fontSize: 11,
    color: '#0C831F',
    fontWeight: '700',
    marginTop: 2,
  },
  bannerImg: {
    width: 50,
    height: 50,
    marginLeft: 8,
  },

  // Subcategories Section
  subCatSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subCatScroll: {
    gap: 8,
    paddingRight: 10,
  },
  subCatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  subCatPillActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#0C831F',
  },
  subCatPillImg: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  subCatPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  subCatPillTextActive: {
    color: '#0C831F',
    fontWeight: '900',
  },

  // Products Section
  productsSection: {},
  productsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productCountBadge: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  centerLoader: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyProductsBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },

  // Products Grid
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    marginBottom: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  productImgBox: {
    height: 90,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  productImg: {
    width: '85%',
    height: '85%',
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16,
    height: 32,
  },
  productUnit: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  productBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  originalPriceText: {
    fontSize: 10,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  addCartBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#0C831F',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addCartBtnText: {
    color: '#0C831F',
    fontSize: 11,
    fontWeight: '900',
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C831F',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  qtyBtn: {
    paddingHorizontal: 5,
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  qtyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 4,
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
    borderRadius: 30,
    paddingVertical: 7,
    paddingHorizontal: 12,
    width: '76%',
    maxWidth: 290,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  cartBarImg: {
    width: 28,
    height: 28,
  },
  floatingCartTextCol: {
    justifyContent: 'center',
  },
  floatingCartTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  floatingCartSubTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
    opacity: 0.9,
  },
  cartBarArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#085C15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBarArrowText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
});

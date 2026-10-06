import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Share,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Icon } from 'react-native-paper';
import {
  useGetPublicSingleProductQuery,
  useAddToCartMutation,
  useIncreaseCartQtyMutation,
  useDecreaseCartQtyMutation,
  useViewCartQuery,
  useGetWishlistQuery,
  useToggleWishlistMutation,
} from '../redux/apiSlice';

const { width } = Dimensions.get('window');

function ProductDetailsSkeleton() {
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

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Image Gallery Showcase Skeleton */}
      <Animated.View
        style={[
          styles.galleryContainer,
          {
            opacity: fadeAnim,
            height: width * 0.75,
            backgroundColor: '#E2E8F0',
            borderWidth: 0,
          },
        ]}
      />

      {/* Product Meta Section Skeleton */}
      <View style={styles.infoCard}>
        <View style={[styles.categoryRow, { gap: 8 }]}>
          <Animated.View style={{ opacity: fadeAnim, width: 80, height: 20, borderRadius: 6, backgroundColor: '#E2E8F0' }} />
          <Animated.View style={{ opacity: fadeAnim, width: 100, height: 20, borderRadius: 6, backgroundColor: '#E2E8F0' }} />
        </View>

        <Animated.View style={{ opacity: fadeAnim, width: '90%', height: 24, borderRadius: 6, backgroundColor: '#E2E8F0', marginTop: 12 }} />
        <Animated.View style={{ opacity: fadeAnim, width: '60%', height: 24, borderRadius: 6, backgroundColor: '#E2E8F0', marginTop: 8 }} />

        <View style={[styles.metaRow, { marginTop: 16 }]}>
          <Animated.View style={{ opacity: fadeAnim, width: 100, height: 16, borderRadius: 4, backgroundColor: '#E2E8F0' }} />
          <Animated.View style={{ opacity: fadeAnim, width: 120, height: 24, borderRadius: 6, backgroundColor: '#E2E8F0' }} />
        </View>

        <View style={[styles.priceRow, { marginTop: 16, alignItems: 'center' }]}>
          <Animated.View style={{ opacity: fadeAnim, width: 80, height: 32, borderRadius: 6, backgroundColor: '#E2E8F0' }} />
          <Animated.View style={{ opacity: fadeAnim, width: 60, height: 20, borderRadius: 6, backgroundColor: '#E2E8F0' }} />
          <Animated.View style={{ opacity: fadeAnim, width: 100, height: 16, borderRadius: 6, backgroundColor: '#E2E8F0' }} />
        </View>
      </View>

      {/* Trust Highlights Skeleton */}
      <View style={styles.trustHighlightsCard}>
        <Animated.View style={{ opacity: fadeAnim, width: '100%', height: 50, borderRadius: 12, backgroundColor: '#E2E8F0' }} />
      </View>

      {/* Description Section Skeleton */}
      <View style={styles.sectionCard}>
        <Animated.View style={{ opacity: fadeAnim, width: 140, height: 18, borderRadius: 6, backgroundColor: '#E2E8F0', marginBottom: 12 }} />
        <Animated.View style={{ opacity: fadeAnim, width: '100%', height: 14, borderRadius: 4, backgroundColor: '#E2E8F0', marginBottom: 8 }} />
        <Animated.View style={{ opacity: fadeAnim, width: '95%', height: 14, borderRadius: 4, backgroundColor: '#E2E8F0', marginBottom: 8 }} />
        <Animated.View style={{ opacity: fadeAnim, width: '70%', height: 14, borderRadius: 4, backgroundColor: '#E2E8F0' }} />
      </View>
    </ScrollView>
  );
}

interface ProductDetailsScreenProps {
  productId: string;
  onBack: () => void;
  onGoToCart?: () => void;
}

export default function ProductDetailsScreen({ productId, onBack, onGoToCart }: ProductDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  const { data: response, isLoading, isError, error, refetch } = useGetPublicSingleProductQuery(productId);
  
  // Cart API Hooks
  const { data: cartResponse, refetch: refetchCart } = useViewCartQuery({});
  const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();
  const [increaseCartQty] = useIncreaseCartQtyMutation();
  const [decreaseCartQty] = useDecreaseCartQtyMutation();

  const { data: wishlistResponse, refetch: refetchWishlist } = useGetWishlistQuery({ page: 1, limit: 50 });
  const [toggleWishlist] = useToggleWishlistMutation();

  const cartData = cartResponse?.data;
  const cartItems = cartData?.items || [];
  const pricingSummary = cartData?.pricingSummary;

  const cartItem = cartItems.find((ci: any) => (ci.product?._id || ci.product) === productId);
  const currentCartQty = cartItem ? cartItem.quantity : 0;

  const totalCartQty = pricingSummary?.totalQuantity || cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  const totalCartPrice = pricingSummary?.subtotal || cartItems.reduce((sum: number, item: any) => {
    const price = item.product?.sellPrice || item.product?.price || 0;
    return sum + (price * (item.quantity || 1));
  }, 0);

  const isFavorite = wishlistResponse?.data?.some((item: any) => {
    const productItem = item.product || item;
    return productItem?._id === productId;
  }) || false;

  const handleToggleWishlist = async () => {
    try {
      const res = await toggleWishlist(productId).unwrap();
      if (res.success) {
        Alert.alert('Wishlist Updated', res.message || 'Wishlist status changed.');
        refetchWishlist();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || err?.message || 'Could not update wishlist');
    }
  };

  const product = response?.data;

  // Safe price extraction
  const sellPrice = product?.sellPrice ?? product?.price ?? product?.sellingPrice ?? product?.offerPrice ?? product?.mrp ?? 0;
  const mrpPrice = product?.mrp ?? product?.originalPrice ?? product?.regularPrice ?? 0;

  // Calculate discount percentage
  const discountPercent = mrpPrice > sellPrice
    ? Math.round(((mrpPrice - sellPrice) / mrpPrice) * 100)
    : 0;

  // Build image list (primary image + extra images)
  const imageList: string[] = [];
  if (product?.image?.url) {
    imageList.push(product.image.url);
  }
  if (product?.images && Array.isArray(product.images)) {
    product.images.forEach((img: any) => {
      if (img.url && !imageList.includes(img.url)) {
        imageList.push(img.url);
      }
    });
  }

  const handleShare = async () => {
    try {
      if (product) {
        await Share.share({
          message: `Check out ${product.name} on Grocery App for ₹${sellPrice}!`,
        });
      }
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      refetchCart();
      Alert.alert(
        'Item Added! 🛒',
        `"${product?.name || 'Product'}" has been added to your cart.`,
        [
          { text: 'Keep Browsing', style: 'cancel' },
          {
            text: 'Go to Checkout →',
            onPress: () => onGoToCart && onGoToCart(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Cart Error', err?.data?.message || 'Failed to add item to cart');
    }
  };

  const handleBuyNow = async () => {
    try {
      if (currentCartQty === 0) {
        await addToCart({ productId, quantity: 1 }).unwrap();
        refetchCart();
      }
      if (onGoToCart) {
        onGoToCart();
      }
    } catch (err: any) {
      Alert.alert('Cart Error', err?.data?.message || 'Failed to proceed to checkout');
    }
  };

  const handleIncreaseQty = async () => {
    try {
      await increaseCartQty(productId).unwrap();
      refetchCart();
    } catch (err: any) {
      Alert.alert('Cart Error', err?.data?.message || 'Failed to update quantity');
    }
  };

  const handleDecreaseQty = async () => {
    try {
      await decreaseCartQty(productId).unwrap();
      refetchCart();
    } catch (err: any) {
      Alert.alert('Cart Error', err?.data?.message || 'Failed to update quantity');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon source="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product?.name || 'Product Details'}
        </Text>
        <View style={styles.headerActions}>
          <IconButton
            icon={isFavorite ? 'heart' : 'heart-outline'}
            iconColor={isFavorite ? '#EF4444' : '#0F172A'}
            size={22}
            onPress={handleToggleWishlist}
            style={styles.headerIconBtn}
          />
          <IconButton
            icon="share-variant-outline"
            iconColor="#0F172A"
            size={22}
            onPress={handleShare}
            style={styles.headerIconBtn}
          />
        </View>
      </View>

      {isLoading ? (
        <ProductDetailsSkeleton />
      ) : isError || !product ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to load product</Text>
          <Text style={styles.errorSubtitle}>
            {error && 'status' in error
              ? `Status: ${error.status}\n${JSON.stringify(error.data || 'No details')}`
              : 'Could not retrieve details for this item.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Image Gallery Showcase */}
            <View style={styles.galleryContainer}>
              {discountPercent > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
                </View>
              )}

              <Image
                source={{
                  uri: imageList[selectedImageIndex] || 'https://via.placeholder.com/400',
                }}
                style={styles.mainImage}
                resizeMode="contain"
              />

              {/* Thumbnails list if multiple images exist */}
              {imageList.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailList}>
                  {imageList.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setSelectedImageIndex(idx)}
                      style={[
                        styles.thumbnailItem,
                        selectedImageIndex === idx && styles.activeThumbnailItem,
                      ]}
                    >
                      <Image source={{ uri: url }} style={styles.thumbnailImage} resizeMode="contain" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Product Meta Section */}
            <View style={styles.infoCard}>
              {/* Category Breadcrumbs */}
              <View style={styles.categoryRow}>
                {product.category?.name && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{product.category.name}</Text>
                  </View>
                )}
                {product.subCategory?.name && (
                  <View style={styles.subCategoryBadge}>
                    <Text style={styles.subCategoryBadgeText}>{product.subCategory.name}</Text>
                  </View>
                )}
              </View>

              {/* Title */}
              <Text style={styles.productTitle}>{product.name}</Text>
              <Text style={styles.productUnitLabel}>{product.unit || product.quantityLabel || product.weight || '1 unit'}</Text>

              {/* SKU & Stock Info */}
              <View style={styles.metaRow}>
                {product.sku && <Text style={styles.skuText}>SKU: {product.sku}</Text>}
                {product.stockQuantity !== undefined && (
                  <View
                    style={[
                      styles.stockBadge,
                      { backgroundColor: product.stockQuantity > 0 ? '#F0FDF4' : '#FEF2F2' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockBadgeText,
                        { color: product.stockQuantity > 0 ? '#0C831F' : '#EF4444' },
                      ]}
                    >
                      {product.stockQuantity > 0 ? `In Stock (${product.stockQuantity})` : 'Out of Stock'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Pricing Row */}
              <View style={styles.priceRow}>
                <Text style={styles.sellPrice}>₹{sellPrice}</Text>
                {mrpPrice > sellPrice && (
                  <>
                    <Text style={styles.mrpPrice}>₹{mrpPrice}</Text>
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>SAVE ₹{mrpPrice - sellPrice}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Trust Highlights Bar */}
            <View style={styles.trustHighlightsCard}>
              <View style={styles.trustItem}>
                <Text style={styles.trustEmoji}>🚚</Text>
                <View>
                  <Text style={styles.trustTitle}>2 TO 3 DAYS</Text>
                  <Text style={styles.trustSub}>Standard delivery</Text>
                </View>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <Text style={styles.trustEmoji}>💯</Text>
                <View>
                  <Text style={styles.trustTitle}>BEST PRICE</Text>
                  <Text style={styles.trustSub}>Quality assured</Text>
                </View>
              </View>
            </View>

            {/* Variants Section */}
            {product.variants && product.variants.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Available Options</Text>
                <View style={styles.variantsRow}>
                  {product.variants.map((v: any, idx: number) => (
                    <View key={v._id || idx} style={styles.variantChip}>
                      <Text style={styles.variantChipKey}>{v.key}: </Text>
                      <Text style={styles.variantChipVal}>{v.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Description Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Product Details & Description</Text>
              <Text style={styles.descriptionText}>
                {product.description || 'No description available for this product.'}
              </Text>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Sticky Bottom Add to Cart & Proceed to Checkout Bar */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 14 }]}>
            {currentCartQty > 0 ? (
              <View style={styles.bottomActiveRow}>
                {/* Quantity Stepper for this item */}
                <View style={styles.qtyContainer}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={handleDecreaseQty}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValText}>{currentCartQty}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={handleIncreaseQty}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Direct Checkout Action Button */}
                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={() => onGoToCart && onGoToCart()}
                  activeOpacity={0.88}
                >
                  <View style={styles.checkoutTextCol}>
                    <Text style={styles.checkoutTitle}>Proceed to Checkout</Text>
                    <Text style={styles.checkoutSub}>
                      {totalCartQty} {totalCartQty === 1 ? 'Item' : 'Items'} • ₹{totalCartPrice}
                    </Text>
                  </View>
                  <Text style={styles.checkoutArrow}>→</Text>
                </TouchableOpacity>
              </View>
            ) : totalCartQty > 0 ? (
              <View style={styles.bottomActiveRow}>
                <TouchableOpacity
                  style={styles.addInlineBtn}
                  onPress={handleAddToCart}
                  activeOpacity={0.85}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <ActivityIndicator size="small" color="#0C831F" />
                  ) : (
                    <Text style={styles.addInlineBtnText}>+ ADD</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={() => onGoToCart && onGoToCart()}
                  activeOpacity={0.88}
                >
                  <View style={styles.checkoutTextCol}>
                    <Text style={styles.checkoutTitle}>View Cart & Checkout</Text>
                    <Text style={styles.checkoutSub}>
                      {totalCartQty} {totalCartQty === 1 ? 'Item' : 'Items'} • ₹{totalCartPrice}
                    </Text>
                  </View>
                  <Text style={styles.checkoutArrow}>→</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.bottomNormalRow}>
                <View style={styles.bottomPriceCol}>
                  <Text style={styles.bottomPriceLabel}>Total Price</Text>
                  <Text style={styles.bottomPriceVal}>₹{sellPrice}</Text>
                </View>

                <View style={styles.btnActionGroup}>
                  <TouchableOpacity
                    style={styles.addToCartOutlineBtn}
                    onPress={handleAddToCart}
                    activeOpacity={0.85}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <ActivityIndicator size="small" color="#0C831F" />
                    ) : (
                      <Text style={styles.addToCartOutlineText}>ADD TO CART</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.buyNowBtn}
                    onPress={handleBuyNow}
                    activeOpacity={0.85}
                    disabled={isAdding}
                  >
                    <Text style={styles.buyNowBtnText}>BUY NOW</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7D117',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    margin: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#0C831F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  galleryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  mainImage: {
    width: '100%',
    height: width * 0.72,
    backgroundColor: '#FFFFFF',
  },
  discountBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#0C831F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  thumbnailList: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  thumbnailItem: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  activeThumbnailItem: {
    borderColor: '#0C831F',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  categoryBadgeText: {
    color: '#0C831F',
    fontSize: 11,
    fontWeight: '800',
  },
  subCategoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  subCategoryBadgeText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
  },
  productTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 25,
  },
  productUnitLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  skuText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  sellPrice: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  mrpPrice: {
    fontSize: 16,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  savingsBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savingsText: {
    fontSize: 11,
    color: '#0C831F',
    fontWeight: '900',
  },
  trustHighlightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trustEmoji: {
    fontSize: 22,
  },
  trustTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  trustSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  trustDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  variantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '100%',
    flexShrink: 1,
  },
  variantChipKey: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  variantChipVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '800',
    flexShrink: 1,
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 21,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  bottomActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  bottomNormalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomPriceCol: {},
  bottomPriceLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomPriceVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  btnActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToCartOutlineBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#0C831F',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartOutlineText: {
    color: '#0C831F',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  buyNowBtn: {
    backgroundColor: '#0C831F',
    borderRadius: 14,
    paddingHorizontal: 20,
    height: 46,
    elevation: 3,
    shadowColor: '#0C831F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addInlineBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#0C831F',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addInlineBtnText: {
    color: '#0C831F',
    fontSize: 13,
    fontWeight: '900',
  },
  addToCartBtn: {
    backgroundColor: '#0C831F',
    borderRadius: 14,
    paddingHorizontal: 28,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0C831F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addToCartBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C831F',
    borderRadius: 14,
    paddingHorizontal: 8,
    height: 46,
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  qtyValText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginHorizontal: 6,
  },
  checkoutBtn: {
    flex: 1,
    backgroundColor: '#0C831F',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#0C831F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  checkoutTextCol: {
    flex: 1,
  },
  checkoutTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  checkoutSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  checkoutArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 8,
  },
});



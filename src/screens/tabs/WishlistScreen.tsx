import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useAddToCartMutation,
  useViewCartQuery,
  useIncreaseCartQtyMutation,
  useDecreaseCartQtyMutation,
  useRemoveFromCartMutation,
} from '../../redux/apiSlice';

const { width } = Dimensions.get('window');

interface WishlistScreenProps {
  onProductPress?: (productId: string) => void;
  onCartPress?: () => void;
}

export default function WishlistScreen({ onProductPress, onCartPress }: WishlistScreenProps) {
  const insets = useSafeAreaInsets();
  const { data: wishlistResponse, isLoading, isError, refetch } = useGetWishlistQuery({ page: 1, limit: 50 });
  const [toggleWishlist, { isLoading: isToggling }] = useToggleWishlistMutation();

  // Cart API hooks
  const { data: cartDataResponse, refetch: refetchCart } = useViewCartQuery({ page: 1, limit: 50 });
  const cartData = cartDataResponse?.data;
  const cartItems = cartData?.items || [];
  const pricingSummary = cartData?.pricingSummary;
  const totalCartQty = pricingSummary?.totalQuantity || cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  const [addToCart] = useAddToCartMutation();
  const [increaseQty] = useIncreaseCartQtyMutation();
  const [decreaseQty] = useDecreaseCartQtyMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      const res = await toggleWishlist(productId).unwrap();
      if (res.success) {
        Alert.alert('Removed', 'Item removed from wishlist');
        refetch();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || err?.message || 'Could not remove item');
    }
  };

  const getProductQuantity = (productId: string) => {
    const item = cartItems.find((ci: any) => (ci.product?._id || ci.product) === productId);
    return item ? item.quantity : 0;
  };

  const handleAdd = async (productId: string) => {
    try {
      const currentQty = getProductQuantity(productId);
      if (currentQty === 0) {
        await addToCart({ productId, quantity: 1 }).unwrap();
      } else {
        await increaseQty(productId).unwrap();
      }
      refetchCart();
    } catch (err: any) {
      Alert.alert('Cart Error', err?.data?.message || err?.message || 'Could not add item to cart');
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
      Alert.alert('Cart Error', err?.data?.message || err?.message || 'Could not update cart quantity');
    }
  };

  // Wishlist items array
  const wishlistItems = wishlistResponse?.data || [];
  const firstCartItem = cartItems[0];
  const firstCartItemImg = firstCartItem?.product?.image?.url ||
    (firstCartItem?.product?.images && firstCartItem.product.images[0]?.url);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          <Text style={styles.headerSubtitle}>
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0C831F" />
        </View>
      ) : wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyTitle}>Your Wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any product to save it here for later.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {wishlistItems.map((item: any) => {
              const product = item.product || item;
              if (!product || !product._id) return null;

              const qty = getProductQuantity(product._id);

              const discount = product.mrp > product.sellPrice
                ? Math.round(((product.mrp - product.sellPrice) / product.mrp) * 100)
                : 0;

              return (
                <View key={item._id || product._id} style={styles.card}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onProductPress && onProductPress(product._id)}
                  >
                    {discount > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.heartButton}
                      onPress={() => handleRemove(product._id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.heartIcon}>❤️</Text>
                    </TouchableOpacity>

                    <View style={styles.imageContainer}>
                      {product.image?.url ? (
                        <Image source={{ uri: product.image.url }} style={styles.image as any} resizeMode="cover" />
                      ) : (
                        <Text style={styles.emoji}>🛍️</Text>
                      )}
                    </View>

                    <Text style={styles.title} numberOfLines={2}>
                      {product.name}
                    </Text>

                    <View style={styles.priceRow}>
                      <View>
                        <Text style={styles.sellPrice}>₹{product.sellPrice}</Text>
                        {product.mrp > product.sellPrice && (
                          <Text style={styles.mrp}>₹{product.mrp}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Add / Stepper Button */}
                  {qty > 0 ? (
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleSubtract(product._id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepperBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperQtyText}>{qty}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleAdd(product._id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addToCartBtn}
                      onPress={() => handleAdd(product._id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addToCartText}>ADD</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
          <View style={{ height: 85 }} />
        </ScrollView>
      )}

      {/* Floating View Cart Pill Bar */}
      {totalCartQty > 0 && (
        <View style={styles.cartBarContainer}>
          <TouchableOpacity
            style={styles.cartBarPill}
            activeOpacity={0.9}
            onPress={() => onCartPress && onCartPress()}
          >
            <View style={styles.cartBarLeft}>
              <View style={styles.cartBarImgWrapper}>
                {firstCartItemImg ? (
                  <Image source={{ uri: firstCartItemImg }} style={styles.cartBarImg as any} resizeMode="contain" />
                ) : (
                  <Text style={{ fontSize: 16 }}>🛍️</Text>
                )}
              </View>
              <View style={styles.cartBarTextCol}>
                <Text style={styles.cartBarTitle}>View cart</Text>
                <Text style={styles.cartBarSubTitle}>
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
    backgroundColor: '#F7D117',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#0F172A',
    opacity: 0.8,
    marginTop: 2,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  scrollContent: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    justifyContent: 'space-between',
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
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
  heartButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heartIcon: {
    fontSize: 13,
  },
  imageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
    height: 32,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  sellPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  mrp: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  addToCartBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#0C831F',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  addToCartText: {
    color: '#0C831F',
    fontSize: 12,
    fontWeight: '800',
  },
  stepperContainer: {
    backgroundColor: '#0C831F',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  stepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  stepperQtyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cartBarContainer: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  cartBarPill: {
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
  cartBarLeft: {
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
  cartBarTextCol: {
    justifyContent: 'center',
  },
  cartBarTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cartBarSubTitle: {
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


import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useViewCartQuery,
  useIncreaseCartQtyMutation,
  useDecreaseCartQtyMutation,
  useRemoveFromCartMutation,
  useGetAddressesQuery,
} from '../../redux/apiSlice';
import CheckoutScreen from '../CheckoutScreen';
import CouponsScreen from '../profile/CouponsScreen';
import ManageAddressesScreen from '../profile/ManageAddressesScreen';
import { CartItemSkeleton } from '../../components/SkeletonLoader';

interface CartScreenProps {
  onNavigateToOrders?: () => void;
}

export default function CartScreen({ onNavigateToOrders }: CartScreenProps) {
  const insets = useSafeAreaInsets();
  const { data: cartResponse, isLoading, refetch } = useViewCartQuery({ page: 1, limit: 50 });
  const { data: addressesRes } = useGetAddressesQuery(undefined);

  const [increaseQty] = useIncreaseCartQtyMutation();
  const [decreaseQty] = useDecreaseCartQtyMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  const [isCouponsVisible, setIsCouponsVisible] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isManageAddressesVisible, setIsManageAddressesVisible] = useState(false);

  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountValue?: number; discountType?: string } | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const addresses = addressesRes?.data || addressesRes?.addresses || [];

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
    refetch();
  }, []);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const def = addresses.find((a: any) => a.isDefault) || addresses[0];
      setSelectedAddress(def);
    }
  }, [addresses]);

  const cartData = cartResponse?.data;
  const cartItems = cartData?.items || [];
  const filteredCartItems = cartItems.filter((item: any) => {
    if (!searchQuery.trim()) return true;
    const name = item.product?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });
  const pricingSummary = cartData?.pricingSummary || {
    subtotal: 0,
    totalMrp: 0,
    totalSavings: 0,
    totalGst: 0,
    itemCount: 0,
    totalQuantity: 0,
  };

  const handleAdd = async (productId: string) => {
    try {
      await increaseQty(productId).unwrap();
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || err?.message || 'Could not increase quantity');
    }
  };

  const handleSubtract = async (productId: string, currentQty: number) => {
    try {
      if (currentQty <= 1) {
        await removeFromCart(productId).unwrap();
      } else {
        await decreaseQty(productId).unwrap();
      }
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || err?.message || 'Could not decrease quantity');
    }
  };

  const totalItems = pricingSummary.totalQuantity || 0;
  const subtotal = pricingSummary.subtotal || 0;
  const totalMrp = pricingSummary.totalMrp || subtotal;
  const totalSavings = pricingSummary.totalSavings || (totalMrp > subtotal ? totalMrp - subtotal : 0);
  const totalGst = pricingSummary.totalGst || 0;
  const grandTotal = Math.max(0, subtotal + totalGst - discountAmount);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>My Cart</Text>
          <Text style={styles.headerSubtitle}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} · Delivery in 2 to 3 days
          </Text>
        </View>
        <View style={styles.deliveryBadge}>
          <Text style={styles.deliveryBadgeText}>🚚 2-3 DAYS</Text>
        </View>
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <CartItemSkeleton />
          <CartItemSkeleton />
          <CartItemSkeleton />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {cartItems.length === 0 ? (
            // Empty Cart State
            <View style={styles.emptyCart}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptySubtitle}>
                Add items to start your grocery run!
              </Text>
            </View>
          ) : (
            <>
              {/* Search Bar inside Cart */}
              <View style={styles.cartSearchBox}>
                <Text style={styles.cartSearchIcon}>🔍</Text>
                <TextInput
                  style={styles.cartSearchInput}
                  placeholder="Search items in cart..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Text style={styles.cartClearIcon}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Cart Items List */}
              {filteredCartItems.length === 0 ? (
                <View style={styles.noCartSearchMatch}>
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>
                    No items in cart matching "{searchQuery}"
                  </Text>
                </View>
              ) : (
                filteredCartItems.map((item: any) => {
                  const product = item.product;
                  if (!product) return null;

                  return (
                    <View key={item._id || product._id} style={styles.cartItem}>
                      <View style={styles.itemImageBox}>
                        {product.image?.url ? (
                          <Image source={{ uri: product.image.url }} style={styles.itemImage} resizeMode="cover" />
                        ) : (
                          <Text style={styles.itemEmoji}>🛍️</Text>
                        )}
                      </View>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemTitle}>{product.name}</Text>
                        {product.variants && product.variants.length > 0 && (
                          <Text style={styles.itemWeight}>
                            {product.variants[0].key}: {product.variants[0].value}
                          </Text>
                        )}
                        <Text style={styles.itemPrice}>₹{product.sellPrice}</Text>
                      </View>
                      <View style={styles.qtySelector}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleSubtract(product._id, item.quantity)}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleAdd(product._id)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}

              {/* Coupons & Offers Section */}
              {appliedCoupon ? (
                <View style={styles.appliedCouponCard}>
                  <View style={styles.appliedCouponLeft}>
                    <Text style={{ fontSize: 22 }}>🎉</Text>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.appliedCouponTitle}>'{appliedCoupon.code}' APPLIED</Text>
                      <Text style={styles.appliedCouponSub}>You saved ₹{discountAmount} on this order!</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setAppliedCoupon(null);
                      setDiscountAmount(0);
                    }}
                    style={styles.removeCouponBtn}
                  >
                    <Text style={styles.removeCouponText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.couponCard}
                  onPress={() => setIsCouponsVisible(true)}
                  activeOpacity={0.85}
                >
                  <View style={styles.couponCardLeft}>
                    <Text style={{ fontSize: 24 }}>🎟️</Text>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.couponCardTitle}>Avail Coupons & Offers</Text>
                      <Text style={styles.couponCardSub}>Save extra on your order with promo codes</Text>
                    </View>
                  </View>
                  <View style={styles.applyBadge}>
                    <Text style={styles.applyBadgeText}>Apply →</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Delivery Address Section */}
              <View style={styles.addressCard}>
                <View style={styles.addressHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16 }}>📍</Text>
                    <Text style={styles.addressHeaderTitle}>
                      Delivering to {selectedAddress?.addressType || 'Home'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsAddressModalVisible(true)}
                    style={styles.changeAddressBtn}
                  >
                    <Text style={styles.changeAddressText}>
                      {addresses.length > 0 ? 'Change' : '+ Add Address'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.addressText} numberOfLines={2}>
                  {selectedAddress
                    ? `${selectedAddress.name ? selectedAddress.name + ' · ' : ''}${selectedAddress.addressLine1}${selectedAddress.addressLine2 ? ', ' + selectedAddress.addressLine2 : ''}, ${selectedAddress.city}, ${selectedAddress.pincode}`
                    : 'B-102, Shanti Kunj, Sector-5, Noida, UP - 201301'}
                </Text>
              </View>

              {/* Bill Details strictly matching API response */}
              <View style={styles.billCard}>
                <Text style={styles.billTitle}>Bill Details</Text>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Item Subtotal</Text>
                  <Text style={styles.billValue}>₹{subtotal}</Text>
                </View>
                {totalSavings > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: '#0C831F' }]}>Total Savings</Text>
                    <Text style={[styles.billValue, { color: '#0C831F' }]}>-₹{totalSavings}</Text>
                  </View>
                )}
                {discountAmount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: '#0C831F', fontWeight: '700' }]}>
                      Coupon Discount ({appliedCoupon?.code})
                    </Text>
                    <Text style={[styles.billValue, { color: '#0C831F', fontWeight: '800' }]}>
                      -₹{discountAmount}
                    </Text>
                  </View>
                )}
                {totalGst > 0 && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>GST & Taxes</Text>
                    <Text style={styles.billValue}>₹{totalGst}</Text>
                  </View>
                )}
                <View style={styles.billDivider} />
                <View style={styles.billRow}>
                  <Text style={styles.billTotalLabel}>Grand Total</Text>
                  <Text style={styles.billTotalValue}>₹{grandTotal}</Text>
                </View>
              </View>
            </>
          )}
          <View style={{ height: 140 }} />
        </ScrollView>
      )}

      {/* Bottom Checkout Bar */}
      {!isLoading && cartItems.length > 0 && (
        <View style={[styles.checkoutBar, { bottom: 10 }]}>
          <TouchableOpacity
            style={styles.checkoutContent}
            onPress={() => setIsCheckoutVisible(true)}
            activeOpacity={0.88}
          >
            <View>
              <Text style={styles.checkoutTotal}>₹{grandTotal.toFixed(2)}</Text>
              <Text style={styles.checkoutLabel}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'} · Total Payable
              </Text>
            </View>
            <View style={styles.checkoutButton}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout →</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Address Selection Modal */}
      <Modal
        visible={isAddressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Address</Text>
              <TouchableOpacity onPress={() => setIsAddressModalVisible(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {addresses.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>No saved addresses found</Text>
                </View>
              ) : (
                addresses.map((addr: any) => {
                  const isSelected = (selectedAddress?._id || selectedAddress?.id) === (addr._id || addr.id);
                  return (
                    <TouchableOpacity
                      key={addr._id || addr.id}
                      style={[styles.addressItemOption, isSelected && styles.addressItemOptionActive]}
                      onPress={() => {
                        setSelectedAddress(addr);
                        setIsAddressModalVisible(false);
                      }}
                    >
                      <View style={styles.radioCircle}>
                        {isSelected && <View style={styles.radioInnerCircle} />}
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.addrTypeBadge}>{addr.addressType || 'Home'}</Text>
                          {addr.isDefault && <Text style={styles.defaultBadgeText}>DEFAULT</Text>}
                        </View>
                        <Text style={styles.addrNameText}>{addr.name} ({addr.mobile})</Text>
                        <Text style={styles.addrDetailText} numberOfLines={2}>
                          {addr.addressLine1}, {addr.city}, {addr.pincode}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.addNewAddrBtn}
              onPress={() => {
                setIsAddressModalVisible(false);
                setIsManageAddressesVisible(true);
              }}
            >
              <Text style={styles.addNewAddrBtnText}>+ Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Coupons Screen Overlay */}
      {isCouponsVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <CouponsScreen
            onBack={() => setIsCouponsVisible(false)}
            onSelectCoupon={(code, discountValue, discountType) => {
              let disc = discountValue || 50;
              if (discountType === 'Percentage') {
                disc = Math.round((subtotal * (discountValue || 10)) / 100);
              }
              setAppliedCoupon({ code, discountValue, discountType });
              setDiscountAmount(disc);
              setIsCouponsVisible(false);
              Alert.alert('Coupon Applied! 🎉', `Coupon "${code}" applied! You saved ₹${disc}`);
            }}
          />
        </View>
      )}

      {/* Manage Addresses Overlay */}
      {isManageAddressesVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <ManageAddressesScreen onBack={() => setIsManageAddressesVisible(false)} />
        </View>
      )}

      {/* Checkout Screen Modal */}
      <CheckoutScreen
        visible={isCheckoutVisible}
        cartItems={cartItems}
        pricingSummary={pricingSummary}
        initialAddressId={selectedAddress?._id || selectedAddress?.id}
        initialCouponCode={appliedCoupon?.code}
        onClose={() => setIsCheckoutVisible(false)}
        onOrderSuccess={(orderId) => {
          setIsCheckoutVisible(false);
          refetch();
          if (onNavigateToOrders) {
            onNavigateToOrders();
          }
        }}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.7,
  },
  deliveryBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  deliveryBadgeText: {
    color: '#F7D117',
    fontSize: 11,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
  },
  cartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemImageBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemWeight: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C831F',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  qtyBtn: {
    paddingHorizontal: 8,
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  qtyValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginHorizontal: 8,
  },

  // Coupon Card
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
  },
  couponCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  couponCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  couponCardSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  applyBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#0C831F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyBadgeText: {
    color: '#0C831F',
    fontSize: 12,
    fontWeight: '900',
  },
  appliedCouponCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#16A34A',
  },
  appliedCouponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appliedCouponTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803D',
  },
  appliedCouponSub: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
    marginTop: 2,
  },
  removeCouponBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  removeCouponText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },

  // Address Card
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  addressHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  changeAddressBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeAddressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0C831F',
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 16,
  },

  // Bill Details Card
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  billTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  billValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  billTotalValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  checkoutBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 999,
    elevation: 12,
  },
  checkoutContent: {
    backgroundColor: '#0C831F',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0C831F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  checkoutTotal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  checkoutLabel: {
    fontSize: 11,
    color: '#DCFCE7',
    fontWeight: '700',
    marginTop: 2,
  },
  checkoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkoutButtonText: {
    color: '#0C831F',
    fontSize: 14,
    fontWeight: '900',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseIcon: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '800',
  },
  addressItemOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  addressItemOptionActive: {
    borderColor: '#0C831F',
    backgroundColor: '#F0FDF4',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0C831F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0C831F',
  },
  addrTypeBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0C831F',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addrNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  addrDetailText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  addNewAddrBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#0C831F',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  addNewAddrBtnText: {
    color: '#0C831F',
    fontSize: 13,
    fontWeight: '800',
  },
  cartSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cartSearchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  cartSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  cartClearIcon: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  noCartSearchMatch: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});

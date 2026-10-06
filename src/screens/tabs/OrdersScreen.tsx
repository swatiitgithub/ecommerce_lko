import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetOrdersQuery, useCancelOrderMutation, useGetPublicProductsQuery } from '../../redux/apiSlice';
import { OrderSkeleton } from '../../components/SkeletonLoader';
import { Icon } from 'react-native-paper';

interface Props {
  onBack?: () => void;
}

const STATUS_FILTERS = ['All', 'Placed', 'Processing', 'Delivered', 'Cancelled'];

const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Delivery is taking too long',
  'Found a better price elsewhere',
  'Incorrect address selected',
  'Other',
];

export default function OrdersScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Cancel order modal states
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState<any>(null);
  const [selectedReason, setSelectedReason] = useState('Changed my mind');
  const [customReasonText, setCustomReasonText] = useState('');

  const { data: ordersRes, isLoading, isFetching, refetch } = useGetOrdersQuery(
    {
      search: searchQuery || undefined,
      orderStatus: selectedStatus !== 'All' ? selectedStatus : undefined,
      page,
      limit,
    },
    { pollingInterval: 15000 }
  );

  const [cancelOrderApi, { isLoading: isCancelling }] = useCancelOrderMutation();

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
    refetch();
  }, []);

  const apiOrders = ordersRes?.data || ordersRes?.orders || [];
  const displayOrders = apiOrders;
  const pagination = ordersRes?.pagination;

  const { data: publicProductsRes } = useGetPublicProductsQuery({ page: 1, limit: 100 });
  const catalogProducts = publicProductsRes?.data || [];

  const getProductImage = (item: any) => {
    let url =
      item.image?.url ||
      (typeof item.image === 'string' && item.image.startsWith('http') ? item.image : null) ||
      item.product?.image?.url ||
      (typeof item.product?.image === 'string' && item.product?.image.startsWith('http') ? item.product?.image : null) ||
      item.product?.images?.[0]?.url ||
      (typeof item.product?.images?.[0] === 'string' && item.product?.images?.[0].startsWith('http') ? item.product?.images?.[0] : null) ||
      item.imageUrl ||
      null;

    if (!url) {
      const pId = typeof item.product === 'string' ? item.product : item.product?._id;
      if (pId) {
        const found = catalogProducts.find((p: any) => p._id === pId);
        if (found) {
          url = found.image?.url || (found.images && found.images[0]?.url) || (typeof found.image === 'string' ? found.image : null);
        }
      }
    }
    return url;
  };

  const handleOpenCancelModal = (order: any) => {
    setSelectedOrderToCancel(order);
    setSelectedReason('Changed my mind');
    setCustomReasonText('');
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrderToCancel) return;
    const finalReason =
      selectedReason === 'Other'
        ? customReasonText.trim() || 'Changed my mind'
        : selectedReason;
    const orderId =
      selectedOrderToCancel.order_id ||
      selectedOrderToCancel._id ||
      selectedOrderToCancel.id;

    try {
      const res: any = await cancelOrderApi({ id: orderId, reason: finalReason }).unwrap();
      setCancelModalVisible(false);
      setSelectedOrderToCancel(null);
      setCustomReasonText('');
      Alert.alert(
        'Order Cancelled',
        res?.message || 'Your order has been cancelled successfully.'
      );
      refetch();
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      const errorMsg =
        err?.data?.message ||
        err?.error ||
        'Could not cancel order. Please try again.';
      Alert.alert('Cancellation Failed', errorMsg);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        ) : null}
        <View style={onBack ? styles.headerCenter : undefined}>
          <Text style={styles.headerTitle}>Your Orders</Text>
          <Text style={styles.headerSubtitle}>
            {pagination?.total !== undefined ? `${pagination.total} orders found` : 'Manage your orders'}
          </Text>
        </View>
      </View>

      {/* Search Bar & Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Icon source="magnify" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID, Item, or Status..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setPage(1);
            }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
          {STATUS_FILTERS.map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => {
                  setSelectedStatus(status);
                  setPage(1);
                }}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading || isFetching ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <OrderSkeleton />
          <OrderSkeleton />
          <OrderSkeleton />
          <OrderSkeleton />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {displayOrders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySub}>
                {searchQuery || selectedStatus !== 'All'
                  ? 'Try adjusting your search or status filter'
                  : 'Place your first order to see it here!'}
              </Text>
            </View>
          ) : (
            <>
              {/* Active Order Banner if applicable */}
              {displayOrders.length > 0 &&
                displayOrders[0]?.orderStatus !== 'Delivered' &&
                displayOrders[0]?.orderStatus !== 'Cancelled' && (
                  <View style={styles.activeOrderCard}>
                    <View style={styles.activeOrderHeader}>
                      <Text style={styles.activeOrderLabel}>⚡ Active Order</Text>
                      <View style={styles.activeStatusBadge}>
                        <Text style={styles.activeStatusText}>
                          {displayOrders[0]?.orderStatus || 'Out for Delivery'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.activeOrderId}>
                      #{displayOrders[0]?.order_id || displayOrders[0]?._id?.slice(-8) || displayOrders[0]?.id?.slice(-8) || 'ORD-001'}
                    </Text>
                    <Text style={styles.activeOrderItems}>Fresh Groceries & Daily Essentials</Text>
                    <View style={styles.progressBar}>
                      <View style={styles.progressFill} />
                    </View>
                    <View style={styles.activeOrderFooter}>
                      <Text style={styles.etaText}>🛵 Arriving soon</Text>
                      <TouchableOpacity
                        style={styles.activeCancelBtn}
                        onPress={() => handleOpenCancelModal(displayOrders[0])}
                      >
                        <Text style={styles.activeCancelBtnText}>Cancel Order</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              {/* Order History */}
              <Text style={styles.sectionTitle}>Order History</Text>
              {displayOrders.map((order: any) => {
                const orderId = order._id || order.id || 'ORD-000';
                const displayOrderId = order.order_id || (order._id ? `#${order._id.slice(-8)}` : 'ORD-000');
                const status = order.orderStatus || order.status || 'Placed';
                const isCancelled = status === 'Cancelled';
                const isDelivered = status === 'Delivered';
                const canCancel = !isCancelled && !isDelivered;
                const statusColor = isCancelled ? '#EF4444' : isDelivered ? '#059669' : '#0C831F';
                const icon = isCancelled ? '❌' : isDelivered ? '📦' : '✅';
                const total =
                  order.pricing?.totalPrice ??
                  order.pricing?.itemsPrice ??
                  order.payableAmount ??
                  order.totalAmount ??
                  order.total ??
                  0;
                const paymentMethodDisplay = order.paymentInfo?.method || order.paymentMethod || 'Online';
                const orderItems: any[] = order.items || [];

                return (
                  <View key={orderId} style={styles.orderCard}>
                    {/* Order Header */}
                    <View style={styles.orderHeader}>
                      <View style={styles.orderIconBox}>
                        <Text style={styles.orderIcon}>{icon}</Text>
                      </View>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderId}>{displayOrderId.startsWith('#') || displayOrderId.startsWith('ORD') ? displayOrderId : `#${displayOrderId}`}</Text>
                        <Text style={styles.orderDate}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'} · {paymentMethodDisplay}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {status}
                        </Text>
                      </View>
                    </View>

                    {/* Items List with Image + Price */}
                    {orderItems.length > 0 ? (
                      <View style={styles.itemsList}>
                        {orderItems.map((item: any, idx: number) => {
                          const productName =
                            item.product?.name ||
                            item.name ||
                            item.productName ||
                            'Item';
                          const qty = item.quantity || 1;
                          const imageUrl = getProductImage(item);
                          const itemPrice =
                            item.sellPrice ??
                            item.price ??
                            item.sellingPrice ??
                            item.product?.sellPrice ??
                            item.product?.sellingPrice ??
                            item.product?.price ??
                            0;
                          const lineTotal = itemPrice * qty;

                          return (
                            <View
                              key={`${orderId}-item-${idx}`}
                              style={[
                                styles.itemRow,
                                idx < orderItems.length - 1 && styles.itemRowBorder,
                              ]}
                            >
                              {/* Product Image */}
                              <View style={styles.itemImageBox}>
                                {imageUrl ? (
                                  <Image
                                    source={{ uri: imageUrl }}
                                    style={styles.itemImage}
                                    resizeMode="contain"
                                  />
                                ) : (
                                  <Text style={styles.itemImageFallback}>🛒</Text>
                                )}
                              </View>

                              {/* Product Name & Qty */}
                              <View style={styles.itemDetails}>
                                <Text style={styles.itemName} numberOfLines={2}>
                                  {productName}
                                </Text>
                                <Text style={styles.itemQty}>Qty: {qty}</Text>
                              </View>

                              {/* Price */}
                              <View style={styles.itemPriceBox}>
                                <Text style={styles.itemPrice}>₹{lineTotal}</Text>
                                {qty > 1 && (
                                  <Text style={styles.itemUnitPrice}>₹{itemPrice} each</Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.orderItems}>Grocery items</Text>
                    )}

                    {/* Order Footer */}
                    <View style={styles.orderFooter}>
                      <Text style={styles.orderTotal}>Total: ₹{total}</Text>
                      <View style={styles.actionsRow}>
                        {canCancel && (
                          <TouchableOpacity
                            style={styles.cancelOrderBtn}
                            onPress={() => handleOpenCancelModal(order)}
                          >
                            <Text style={styles.cancelOrderBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.reorderBtn} onPress={() => refetch()}>
                          <Text style={styles.reorderText}>Reorder</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
          <View style={{ height: 90 }} />
        </ScrollView>
      )}

      {/* Cancel Order Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isCancelling) setCancelModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => {
              if (!isCancelling) setCancelModalVisible(false);
            }}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalHeaderIcon}>⚠️</Text>
                <Text style={styles.modalTitle}>Cancel Order</Text>
              </View>
              <TouchableOpacity
                disabled={isCancelling}
                onPress={() => setCancelModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Are you sure you want to cancel order #{selectedOrderToCancel?._id?.slice(-8) || selectedOrderToCancel?.id?.slice(-8) || 'this order'}? Please select a reason:
            </Text>

            {/* Reason Options List */}
            <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
              {CANCEL_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                    onPress={() => setSelectedReason(reason)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {selectedReason === 'Other' && (
                <View style={styles.customReasonBox}>
                  <TextInput
                    style={styles.customReasonInput}
                    placeholder="Enter reason for cancellation..."
                    placeholderTextColor="#94A3B8"
                    value={customReasonText}
                    onChangeText={setCustomReasonText}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.keepOrderBtn}
                disabled={isCancelling}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.keepOrderText}>Keep Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmCancelBtn, isCancelling && styles.confirmCancelBtnDisabled]}
                disabled={isCancelling}
                onPress={handleConfirmCancel}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmCancelText}>Confirm Cancel</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 0,
  },
  backIcon: { fontSize: 28, color: '#000', fontWeight: '300', lineHeight: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
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
  scrollContent: {
    padding: 16,
  },
  activeOrderCard: {
    backgroundColor: '#0C831F',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeOrderLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeStatusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeStatusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeOrderId: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  activeOrderItems: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    marginBottom: 12,
  },
  progressBar: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    width: '70%',
    height: '100%',
    backgroundColor: '#F7D117',
    borderRadius: 3,
  },
  activeOrderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaText: {
    fontSize: 13,
    color: '#F7D117',
    fontWeight: '800',
  },
  activeCancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  activeCancelBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  orderIcon: { fontSize: 18 },
  orderInfo: { flex: 1 },
  orderId: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderItems: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 18,
  },
  itemsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  itemImageBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: 46,
    height: 46,
    borderRadius: 8,
  },
  itemImageFallback: {
    fontSize: 24,
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  itemQty: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  itemPriceBox: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0C831F',
  },
  itemUnitPrice: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelOrderBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cancelOrderBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  reorderBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#0C831F',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
  },
  reorderText: {
    color: '#0C831F',
    fontSize: 12,
    fontWeight: '800',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 42,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  clearIcon: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  pillsScroll: {
    marginTop: 10,
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: '#0C831F',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderIcon: {
    fontSize: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  reasonsList: {
    maxHeight: 240,
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonOptionSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#EF4444',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  reasonTextSelected: {
    color: '#991B1B',
    fontWeight: '700',
  },
  customReasonBox: {
    marginTop: 4,
    marginBottom: 8,
  },
  customReasonInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  keepOrderBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepOrderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  confirmCancelBtn: {
    flex: 1.2,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelBtnDisabled: {
    opacity: 0.6,
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});


import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAST_ORDERS = [
  {
    id: 'ORD-8821',
    date: '15 Aug, 2:30 PM',
    status: 'Delivered',
    statusColor: '#0C831F',
    items: ['Amul Milk x2', 'Bread x1', 'Chips x3'],
    total: 216,
    icon: '✅',
  },
  {
    id: 'ORD-8756',
    date: '12 Aug, 7:10 PM',
    status: 'Delivered',
    statusColor: '#0C831F',
    items: ['Coca-Cola x2', 'Lay\'s x4'],
    total: 156,
    icon: '✅',
  },
  {
    id: 'ORD-8612',
    date: '8 Aug, 11:05 AM',
    status: 'Cancelled',
    statusColor: '#EF4444',
    items: ['Maggi x6', 'Coffee x1'],
    total: 142,
    icon: '❌',
  },
];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F7D117" barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Your Orders</Text>
        <Text style={styles.headerSubtitle}>{PAST_ORDERS.length} past orders</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Order Card */}
        <View style={styles.activeOrderCard}>
          <View style={styles.activeOrderHeader}>
            <Text style={styles.activeOrderLabel}>⚡ Active Order</Text>
            <View style={styles.activeStatusBadge}>
              <Text style={styles.activeStatusText}>Out for Delivery</Text>
            </View>
          </View>
          <Text style={styles.activeOrderId}>#ORD-8854</Text>
          <Text style={styles.activeOrderItems}>Amul Curd, Maggi 2-Min Noodles, Lay's</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.etaText}>🛵 Arriving in 4 mins</Text>
        </View>

        {/* Past Orders */}
        <Text style={styles.sectionTitle}>Order History</Text>
        {PAST_ORDERS.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderIconBox}>
                <Text style={styles.orderIcon}>{order.icon}</Text>
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${order.statusColor}18` }]}>
                <Text style={[styles.statusText, { color: order.statusColor }]}>
                  {order.status}
                </Text>
              </View>
            </View>
            <Text style={styles.orderItems}>{order.items.join(' · ')}</Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>₹{order.total}</Text>
              <TouchableOpacity style={styles.reorderBtn}>
                <Text style={styles.reorderText}>Reorder</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    width: '70%',
    height: '100%',
    backgroundColor: '#F7D117',
    borderRadius: 3,
  },
  etaText: {
    fontSize: 13,
    color: '#F7D117',
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
});

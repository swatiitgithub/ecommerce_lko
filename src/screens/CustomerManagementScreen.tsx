import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetCustomersQuery, useToggleCustomerStatusMutation } from '../redux/apiSlice';
import { Icon } from 'react-native-paper';

const { width } = Dimensions.get('window');

interface Customer {
  _id: string;
  customer_id: string;
  name?: string;
  mobile: string;
  email?: string;
  isActive: boolean;
  walletBalance: number;
  createdAt: string;
}

interface CustomerManagementScreenProps {
  onBack: () => void;
}

function SkeletonCard({ fadeAnim }: { fadeAnim: Animated.Value }) {
  return (
    <View style={styles.customerCard}>
      <View style={styles.cardHeader}>
        <Animated.View style={[styles.skeletonText, { opacity: fadeAnim, width: 120, height: 18 }]} />
        <Animated.View style={[styles.skeletonText, { opacity: fadeAnim, width: 80, height: 22, borderRadius: 12 }]} />
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardBody}>
        <Animated.View style={[styles.skeletonText, { opacity: fadeAnim, width: '70%', height: 14, marginBottom: 8 }]} />
        <Animated.View style={[styles.skeletonText, { opacity: fadeAnim, width: '50%', height: 14, marginBottom: 8 }]} />
        <Animated.View style={[styles.skeletonText, { opacity: fadeAnim, width: '40%', height: 14 }]} />
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardFooter}>
        <Animated.View style={[styles.skeletonText, { opacity: fadeAnim, width: 100, height: 16 }]} />
        <Animated.View style={[styles.skeletonText, { opacity: fadeAnim, width: 120, height: 36, borderRadius: 10 }]} />
      </View>
    </View>
  );
}

export default function CustomerManagementScreen({ onBack }: CustomerManagementScreenProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: response, isLoading, isError, refetch } = useGetCustomersQuery(undefined, {
    refetchOnFocus: true,
  });
  const [toggleStatus, { isLoading: isToggling }] = useToggleCustomerStatusMutation();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isLoading) {
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
    }
  }, [isLoading, fadeAnim]);

  const customersList: Customer[] = response?.data || [];

  const handleToggle = async (customer: Customer) => {
    try {
      setTogglingId(customer._id);
      const res = await toggleStatus(customer._id).unwrap();
      Alert.alert('Success', res?.message || 'Customer status updated successfully!');
      refetch();
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || 'Failed to update customer status';
      Alert.alert('Error', errorMsg);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCustomers = customersList.filter((c) => {
    const query = searchQuery.toLowerCase();
    const idMatch = c.customer_id?.toLowerCase().includes(query);
    const nameMatch = c.name?.toLowerCase().includes(query);
    const mobileMatch = c.mobile?.includes(query);
    const emailMatch = c.email?.toLowerCase().includes(query);
    return idMatch || nameMatch || mobileMatch || emailMatch;
  });

  const renderSkeletonList = () => (
    <View style={{ padding: 16 }}>
      <SkeletonCard fadeAnim={fadeAnim} />
      <SkeletonCard fadeAnim={fadeAnim} />
      <SkeletonCard fadeAnim={fadeAnim} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Customer Management</Text>
          {!isLoading && (
            <Text style={styles.headerSubtitle}>
              Total Customers: {customersList.length}
            </Text>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon source="magnify" size={20} color="#64748B" />
        <TextInput
          placeholder="Search by ID, name, mobile or email..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        renderSkeletonList()
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to load customers</Text>
          <Text style={styles.errorSubtitle}>Could not retrieve admin customer list.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No customers found matching search.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelfToggling = togglingId === item._id && isToggling;
            return (
              <View style={styles.customerCard}>
                {/* ID and Status Row */}
                <View style={styles.cardHeader}>
                  <Text style={styles.customerIdText}>{item.customer_id}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: item.isActive ? '#F0FDF4' : '#FEF2F2' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: item.isActive ? '#0C831F' : '#EF4444' },
                      ]}
                    >
                      {item.isActive ? 'Active' : 'Suspended'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Details Section */}
                <View style={styles.cardBody}>
                  <Text style={styles.customerName}>
                    {item.name ? item.name : '(Unnamed Customer)'}
                  </Text>
                  <Text style={styles.infoRow}>📱 {item.mobile}</Text>
                  {item.email ? <Text style={styles.infoRow}>✉️ {item.email}</Text> : null}
                  <Text style={styles.dateText}>
                    Joined: {new Date(item.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>

                <View style={styles.cardDivider} />

                {/* Wallet and Action Button */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.walletLabel}>Wallet Balance</Text>
                    <Text style={styles.walletValue}>₹{item.walletBalance || 0}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: item.isActive ? '#FEF2F2' : '#F0FDF4', borderColor: item.isActive ? '#FECACA' : '#DCFCE7' },
                    ]}
                    onPress={() => handleToggle(item)}
                    disabled={isSelfToggling}
                    activeOpacity={0.7}
                  >
                    {isSelfToggling ? (
                      <ActivityIndicator size="small" color={item.isActive ? '#EF4444' : '#0C831F'} />
                    ) : (
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: item.isActive ? '#EF4444' : '#0C831F' },
                        ]}
                      >
                        {item.isActive ? 'Suspend' : 'Activate'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
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
    paddingRight: 12,
    paddingLeft: 4,
  },
  backBtnText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#0F172A',
    opacity: 0.7,
    fontWeight: '600',
    marginTop: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  customerIdText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  cardBody: {
    padding: 16,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  infoRow: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFDFB',
  },
  walletLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  walletValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0C831F',
    marginTop: 1,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  skeletonText: {
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
});

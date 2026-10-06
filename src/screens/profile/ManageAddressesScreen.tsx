import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from 'react-native-paper';
import {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useLazyGetSingleAddressQuery,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from '../../redux/apiSlice';
import { AddressSkeleton } from '../../components/SkeletonLoader';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiAddress {
  _id: string;
  customer: string;
  name: string;
  mobile: string;
  alternateMobile?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  addressType: 'Home' | 'Work' | 'Office' | 'Other';
  isDefault: boolean;
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onBack: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  Home: 'home-outline',
  Work: 'briefcase-outline',
  Office: 'office-building-outline',
  Other: 'map-marker-outline',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ManageAddressesScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();

  // ── RTK Query hooks ─────────────────────────────────────────────────────────
  const {
    data: addressResponse,
    isLoading: isLoadingAddresses,
    isError: isAddressError,
    refetch,
  } = useGetAddressesQuery({ page: 1, limit: 50 });

  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const [deleteAddress, { isLoading: isDeleting }] = useDeleteAddressMutation();
  const [triggerGetSingleAddress, { isFetching: isFetchingSingle }] = useLazyGetSingleAddressQuery();

  const addresses: ApiAddress[] = addressResponse?.data ?? [];

  // ── Modal & Form state ────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [viewingAddress, setViewingAddress] = useState<ApiAddress | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Office' | 'Other'>('Home');
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setName('');
    setMobile('');
    setAlternateMobile('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPincode('');
    setLandmark('');
    setAddressType('Home');
    setIsDefault(false);
    setEditingAddressId(null);
  };

  // ── 1. GET Single Address Handler ──────────────────────────────────────────
  const handleViewSingleAddress = async (id: string) => {
    try {
      const response = await triggerGetSingleAddress(id).unwrap();
      if (response?.success && response?.data) {
        setViewingAddress(response.data);
        setShowDetailsModal(true);
      } else {
        Alert.alert('Error', response?.message || 'Could not fetch address details');
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to fetch single address';
      Alert.alert('Error', msg);
    }
  };

  // ── Pre-fill Edit Modal ─────────────────────────────────────────────────────
  const handleOpenEditModal = async (addr: ApiAddress) => {
    resetForm();
    setEditingAddressId(addr._id);

    // Fetch fresh data via GET single address API first
    try {
      const response = await triggerGetSingleAddress(addr._id).unwrap();
      const data: ApiAddress = (response?.success && response?.data) ? response.data : addr;

      setName(data.name || '');
      setMobile(data.mobile || '');
      setAlternateMobile(data.alternateMobile || '');
      setAddressLine1(data.addressLine1 || '');
      setAddressLine2(data.addressLine2 || '');
      setCity(data.city || '');
      setState(data.state || '');
      setPincode(data.pincode || '');
      setLandmark(data.landmark || '');
      setAddressType(data.addressType || 'Home');
      setIsDefault(data.isDefault ?? false);

      setShowEditModal(true);
    } catch (err: any) {
      // Fallback to list item data if single GET fails
      setName(addr.name || '');
      setMobile(addr.mobile || '');
      setAlternateMobile(addr.alternateMobile || '');
      setAddressLine1(addr.addressLine1 || '');
      setAddressLine2(addr.addressLine2 || '');
      setCity(addr.city || '');
      setState(addr.state || '');
      setPincode(addr.pincode || '');
      setLandmark(addr.landmark || '');
      setAddressType(addr.addressType || 'Home');
      setIsDefault(addr.isDefault ?? false);
      setShowEditModal(true);
    }
  };

  // ── 2. Add Address Handler (POST) ──────────────────────────────────────────
  const handleAddAddress = async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Name is required'); return; }
    if (!mobile.trim() || mobile.length !== 10) { Alert.alert('Validation', 'Enter a valid 10-digit mobile number'); return; }
    if (!addressLine1.trim()) { Alert.alert('Validation', 'Address Line 1 is required'); return; }
    if (!city.trim()) { Alert.alert('Validation', 'City is required'); return; }
    if (!state.trim()) { Alert.alert('Validation', 'State is required'); return; }
    if (!pincode.trim() || pincode.length !== 6) { Alert.alert('Validation', 'Enter a valid 6-digit pincode'); return; }

    try {
      const payload: any = {
        name: name.trim(),
        mobile: mobile.trim(),
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        addressType,
        isDefault,
      };
      if (addressLine2.trim()) payload.addressLine2 = addressLine2.trim();
      if (landmark.trim()) payload.landmark = landmark.trim();
      if (alternateMobile.trim()) payload.alternateMobile = alternateMobile.trim();

      const response = await createAddress(payload).unwrap();
      if (response?.success) {
        Alert.alert('Success 🎉', response.message || 'Address added successfully!');
        setShowAddModal(false);
        resetForm();
        refetch();
      } else {
        Alert.alert('Failed', response?.message || 'Could not add address');
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to add address';
      Alert.alert('Error', msg);
    }
  };

  // ── 3. Update Address Handler (PUT) ────────────────────────────────────────
  const handleUpdateAddress = async () => {
    if (!editingAddressId) return;
    if (!name.trim()) { Alert.alert('Validation', 'Name is required'); return; }
    if (!mobile.trim() || mobile.length !== 10) { Alert.alert('Validation', 'Enter a valid 10-digit mobile number'); return; }
    if (!addressLine1.trim()) { Alert.alert('Validation', 'Address Line 1 is required'); return; }
    if (!city.trim()) { Alert.alert('Validation', 'City is required'); return; }
    if (!state.trim()) { Alert.alert('Validation', 'State is required'); return; }
    if (!pincode.trim() || pincode.length !== 6) { Alert.alert('Validation', 'Enter a valid 6-digit pincode'); return; }

    try {
      const payload: any = {
        id: editingAddressId,
        name: name.trim(),
        mobile: mobile.trim(),
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        addressType,
        isDefault,
      };
      if (addressLine2.trim()) payload.addressLine2 = addressLine2.trim();
      if (landmark.trim()) payload.landmark = landmark.trim();
      if (alternateMobile.trim()) payload.alternateMobile = alternateMobile.trim();

      const response = await updateAddress(payload).unwrap();
      if (response?.success) {
        Alert.alert('Success 🎉', response.message || 'Address updated successfully');
        setShowEditModal(false);
        resetForm();
        refetch();
      } else {
        Alert.alert('Failed', response?.message || 'Could not update address');
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to update address';
      Alert.alert('Error', msg);
    }
  };

  // ── 4. Delete Address Handler (DELETE) ─────────────────────────────────────
  const handleDeleteAddress = (id: string, name: string) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete the address for "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteAddress(id).unwrap();
              if (response?.success) {
                Alert.alert('Deleted 🗑️', response.message || 'Address deleted successfully');
                refetch();
              } else {
                Alert.alert('Failed', response?.message || 'Could not delete address');
              }
            } catch (err: any) {
              const msg = err?.data?.message || err?.message || 'Failed to delete address';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  };

  // ── Helper to Render Form Fields (shared for Add & Edit) ─────────────────────
  const renderAddressForm = (isEdit: boolean) => (
    <>
      {/* Address Type */}
      <Text style={styles.inputLabel}>Address Type *</Text>
      <View style={styles.typeRow}>
        {(['Home', 'Work', 'Office', 'Other'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.typeChip, addressType === t && styles.typeChipActive]}
            onPress={() => setAddressType(t)}
          >
            <Icon source={TYPE_ICONS[t] || 'map-marker-outline'} size={16} color={addressType === t ? '#0C831F' : '#64748B'} />
            <Text style={[styles.typeChipText, addressType === t && styles.typeChipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Name */}
      <Text style={styles.inputLabel}>Full Name *</Text>
      <TextInput
        style={styles.textInput}
        value={name}
        onChangeText={setName}
        placeholder="Enter full name"
        placeholderTextColor="#94A3B8"
      />

      {/* Mobile */}
      <Text style={styles.inputLabel}>Mobile Number *</Text>
      <TextInput
        style={styles.textInput}
        value={mobile}
        onChangeText={setMobile}
        placeholder="10-digit mobile number"
        placeholderTextColor="#94A3B8"
        keyboardType="numeric"
        maxLength={10}
      />

      {/* Alternate Mobile */}
      <Text style={styles.inputLabel}>Alternate Mobile</Text>
      <TextInput
        style={styles.textInput}
        value={alternateMobile}
        onChangeText={setAlternateMobile}
        placeholder="Alternate mobile (optional)"
        placeholderTextColor="#94A3B8"
        keyboardType="numeric"
        maxLength={10}
      />

      {/* Address Line 1 */}
      <Text style={styles.inputLabel}>Address Line 1 *</Text>
      <TextInput
        style={styles.textInput}
        value={addressLine1}
        onChangeText={setAddressLine1}
        placeholder="Flat / House No, Building, Street"
        placeholderTextColor="#94A3B8"
      />

      {/* Address Line 2 */}
      <Text style={styles.inputLabel}>Address Line 2</Text>
      <TextInput
        style={styles.textInput}
        value={addressLine2}
        onChangeText={setAddressLine2}
        placeholder="Area, Colony (optional)"
        placeholderTextColor="#94A3B8"
      />

      {/* City & Pincode row */}
      <View style={styles.rowInputs}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>City *</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: 0 }]}
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Pincode *</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: 0 }]}
            value={pincode}
            onChangeText={setPincode}
            placeholder="6-digit"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={6}
          />
        </View>
      </View>

      {/* State */}
      <Text style={[styles.inputLabel, { marginTop: 14 }]}>State *</Text>
      <TextInput
        style={styles.textInput}
        value={state}
        onChangeText={setState}
        placeholder="State"
        placeholderTextColor="#94A3B8"
      />

      {/* Landmark */}
      <Text style={styles.inputLabel}>Landmark</Text>
      <TextInput
        style={styles.textInput}
        value={landmark}
        onChangeText={setLandmark}
        placeholder="Nearby landmark (optional)"
        placeholderTextColor="#94A3B8"
      />

      {/* Set as Default toggle */}
      <TouchableOpacity
        style={[styles.defaultToggle, { marginTop: 14 }]}
        onPress={() => setIsDefault(prev => !prev)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
          {isDefault && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.defaultToggleText}>Set as default address</Text>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.modalBtn, styles.cancelBtn]}
          onPress={() => {
            if (isEdit) setShowEditModal(false);
            else setShowAddModal(false);
            resetForm();
          }}
          disabled={isCreating || isUpdating}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalBtn, styles.saveBtn, (isCreating || isUpdating) && { opacity: 0.7 }]}
          onPress={isEdit ? handleUpdateAddress : handleAddAddress}
          disabled={isCreating || isUpdating}
        >
          {(isCreating || isUpdating) ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>{isEdit ? 'Update Address' : 'Save Address'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon source="arrow-left" size={22} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Manage Addresses</Text>
          <Text style={styles.headerSub}>
            {isLoadingAddresses ? 'Loading...' : `${addresses.length} saved address${addresses.length !== 1 ? 'es' : ''}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()} activeOpacity={0.7}>
          <Icon source="refresh" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Loading State Skeleton */}
        {isLoadingAddresses && (
          <View style={{ paddingTop: 4 }}>
            <AddressSkeleton />
            <AddressSkeleton />
            <AddressSkeleton />
          </View>
        )}

        {/* Error State */}
        {isAddressError && !isLoadingAddresses && (
          <View style={styles.centerBox}>
            <Icon source="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>Failed to load addresses</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isLoadingAddresses && !isAddressError && addresses.length === 0 && (
          <View style={styles.centerBox}>
            <Icon source="map-marker-off-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No addresses saved</Text>
            <Text style={styles.emptySubtitle}>Add your first delivery address below</Text>
          </View>
        )}

        {/* Address Cards */}
        {!isLoadingAddresses && addresses.map((addr) => (
          <View
            key={addr._id}
            style={[styles.addressCard, addr.isDefault && styles.defaultCard]}
          >
            {addr.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>✓ Default Address</Text>
              </View>
            )}

            <View style={styles.cardTop}>
              <View style={styles.typeIconBox}>
                <Icon source={TYPE_ICONS[addr.addressType] || 'map-marker-outline'} size={22} color="#0C831F" />
              </View>
              <View style={styles.addrInfo}>
                <Text style={styles.addrType}>{addr.addressType}</Text>
                <Text style={styles.addrName}>{addr.name}</Text>
              </View>
              <View style={[styles.typeBadge, addr.isDefault ? styles.defaultTypeBadge : styles.normalTypeBadge]}>
                <Text style={[styles.typeBadgeText, addr.isDefault && { color: '#0C831F' }]}>{addr.addressType}</Text>
              </View>
            </View>

            {/* Address Details */}
            <View style={styles.addrDetails}>
              <Text style={styles.addrLine}>{addr.addressLine1}</Text>
              {addr.addressLine2 ? <Text style={styles.addrLine}>{addr.addressLine2}</Text> : null}
              <Text style={styles.addrLine}>{addr.city}, {addr.state} – {addr.pincode}</Text>
              {addr.landmark ? <Text style={styles.addrLine}>Landmark: {addr.landmark}</Text> : null}
              <Text style={styles.addrPhone}>Mobile: {addr.mobile}{addr.alternateMobile ? ` · ${addr.alternateMobile}` : ''}</Text>
            </View>

            {/* Card Actions: View Single, Edit, Delete */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => handleViewSingleAddress(addr._id)}
                activeOpacity={0.7}
              >
                {isFetchingSingle ? (
                  <ActivityIndicator size="small" color="#64748B" />
                ) : (
                  <>
                    <Icon source="eye-outline" size={16} color="#475569" />
                    <Text style={styles.actionBtnTextSecondary}>Details</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={() => handleOpenEditModal(addr)}
                activeOpacity={0.7}
              >
                <Icon source="pencil-outline" size={16} color="#2563EB" />
                <Text style={styles.actionBtnTextPrimary}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnDanger}
                onPress={() => handleDeleteAddress(addr._id, addr.name)}
                activeOpacity={0.7}
                disabled={isDeleting}
              >
                <Icon source="delete-outline" size={16} color="#DC2626" />
                <Text style={styles.actionBtnTextDanger}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Add New Address Button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
          activeOpacity={0.8}
        >
          <Icon source="plus" size={20} color="#0C831F" />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── 1. Add Address Modal ────────────────────────────────────────────── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowAddModal(false); resetForm(); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity
                onPress={() => { setShowAddModal(false); resetForm(); }}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Icon source="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {renderAddressForm(false)}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 2. Edit Address Modal (PUT API) ─────────────────────────────────── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowEditModal(false); resetForm(); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Address</Text>
              <TouchableOpacity
                onPress={() => { setShowEditModal(false); resetForm(); }}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Icon source="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {renderAddressForm(true)}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 3. Single Address Details Modal (GET Single API) ───────────────── */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.detailsModalCard}>
            <View style={styles.detailsHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.detailsIconBox}>
                  <Icon source={TYPE_ICONS[viewingAddress?.addressType || ''] || 'map-marker-outline'} size={20} color="#0C831F" />
                </View>
                <View>
                  <Text style={styles.detailsTitle}>{viewingAddress?.addressType || 'Address'} Details</Text>
                  <Text style={styles.detailsSub}>Full saved location info</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowDetailsModal(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Icon source="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {viewingAddress && (
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address ID</Text>
                  <Text style={styles.detailValueCode}>{viewingAddress._id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Name</Text>
                  <Text style={styles.detailValue}>{viewingAddress.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mobile Number</Text>
                  <Text style={styles.detailValue}>{viewingAddress.mobile}</Text>
                </View>
                {viewingAddress.alternateMobile ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Alt Mobile</Text>
                    <Text style={styles.detailValue}>{viewingAddress.alternateMobile}</Text>
                  </View>
                ) : null}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address Line 1</Text>
                  <Text style={styles.detailValue}>{viewingAddress.addressLine1}</Text>
                </View>
                {viewingAddress.addressLine2 ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address Line 2</Text>
                    <Text style={styles.detailValue}>{viewingAddress.addressLine2}</Text>
                  </View>
                ) : null}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City & State</Text>
                  <Text style={styles.detailValue}>{viewingAddress.city}, {viewingAddress.state}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pincode</Text>
                  <Text style={styles.detailValue}>{viewingAddress.pincode}</Text>
                </View>
                {viewingAddress.landmark ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Landmark</Text>
                    <Text style={styles.detailValue}>{viewingAddress.landmark}</Text>
                  </View>
                ) : null}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Default Status</Text>
                  <Text style={[styles.detailValue, viewingAddress.isDefault && { color: '#0C831F', fontWeight: '800' }]}>
                    {viewingAddress.isDefault ? '✓ Default Address' : 'Standard Address'}
                  </Text>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: 18, paddingVertical: 13, borderRadius: 14 }]}
              onPress={() => setShowDetailsModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    backgroundColor: '#F7D117',
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 28, color: '#000', fontWeight: '300', lineHeight: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#000' },
  headerSub: { fontSize: 12, color: '#000', opacity: 0.6, fontWeight: '600', marginTop: 2 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  refreshIcon: { fontSize: 20, color: '#000', fontWeight: '700' },

  // Scroll
  scrollContent: { padding: 16 },

  // States
  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '600' },
  errorEmoji: { fontSize: 48, marginBottom: 12 },
  errorText: { fontSize: 14, color: '#EF4444', fontWeight: '700', marginBottom: 12 },
  retryBtn: {
    backgroundColor: '#0C831F', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12,
  },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },

  // Address Card
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  defaultCard: { borderColor: '#0C831F' },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  defaultBadgeText: { fontSize: 11, fontWeight: '700', color: '#0C831F' },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  typeIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  typeIcon: { fontSize: 22 },
  addrInfo: { flex: 1 },
  addrType: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  addrName: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 2 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  defaultTypeBadge: { backgroundColor: '#F0FDF4' },
  normalTypeBadge: { backgroundColor: '#F8FAFC' },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  addrDetails: {
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  addrLine: { fontSize: 13, color: '#475569', fontWeight: '500', lineHeight: 21 },
  addrPhone: { fontSize: 12, color: '#0C831F', fontWeight: '700', marginTop: 6 },

  // Card Action Buttons
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnIcon: { fontSize: 14 },
  actionBtnTextSecondary: { fontSize: 12, fontWeight: '700', color: '#475569' },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  actionBtnTextPrimary: { fontSize: 12, fontWeight: '800', color: '#2563EB' },
  actionBtnDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 4,
  },
  actionBtnTextDanger: { fontSize: 12, fontWeight: '800', color: '#DC2626' },

  // Add Button
  addBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  addBtnIcon: { fontSize: 20, color: '#0C831F', fontWeight: '700' },
  addBtnText: { fontSize: 15, fontWeight: '800', color: '#0C831F' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '92%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },

  // Type chips
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC',
  },
  typeChipActive: { borderColor: '#0C831F', backgroundColor: '#F0FDF4' },
  typeChipEmoji: { fontSize: 14 },
  typeChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  typeChipTextActive: { color: '#0C831F' },

  // Inputs
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  textInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: '#0F172A', marginBottom: 14, backgroundColor: '#F8FAFC',
  },
  rowInputs: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },

  // Default toggle
  defaultToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 20,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF',
  },
  checkboxActive: { borderColor: '#0C831F', backgroundColor: '#0C831F' },
  checkmark: { fontSize: 13, color: '#FFFFFF', fontWeight: '900' },
  defaultToggleText: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1 },

  // Modal actions
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  saveBtn: { backgroundColor: '#0C831F' },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  // Details Modal
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailsModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EBFBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  detailsSub: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 1 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#64748B', fontWeight: '700' },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailLabel: { width: 115, fontSize: 13, fontWeight: '700', color: '#64748B' },
  detailValue: { flex: 1, fontSize: 13, color: '#0F172A', fontWeight: '600' },
  detailValueCode: { flex: 1, fontSize: 11, color: '#0C831F', fontFamily: 'monospace', fontWeight: '700' },
});

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function AddressSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.rowBetween}>
        <SkeletonBox width={70} height={20} borderRadius={6} />
        <SkeletonBox width={50} height={16} borderRadius={4} />
      </View>
      <SkeletonBox width="60%" height={16} borderRadius={6} style={{ marginTop: 10 }} />
      <SkeletonBox width="90%" height={14} borderRadius={6} style={{ marginTop: 8 }} />
      <SkeletonBox width="75%" height={14} borderRadius={6} style={{ marginTop: 6 }} />
      <View style={styles.footerRow}>
        <SkeletonBox width={80} height={32} borderRadius={8} />
        <SkeletonBox width={80} height={32} borderRadius={8} />
      </View>
    </View>
  );
}

export function OrderSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <SkeletonBox width={36} height={36} borderRadius={10} style={{ marginRight: 10 }} />
          <View>
            <SkeletonBox width={100} height={16} borderRadius={6} />
            <SkeletonBox width={70} height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>
        <SkeletonBox width={70} height={22} borderRadius={8} />
      </View>
      <SkeletonBox width="85%" height={14} borderRadius={6} style={{ marginTop: 14 }} />
      <View style={[styles.rowBetween, { marginTop: 16 }]}>
        <SkeletonBox width={60} height={20} borderRadius={6} />
        <SkeletonBox width={80} height={28} borderRadius={8} />
      </View>
    </View>
  );
}

export function CartItemSkeleton() {
  return (
    <View style={styles.cardSkeletonRow}>
      <SkeletonBox width={50} height={50} borderRadius={10} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBox width="70%" height={14} borderRadius={6} />
        <SkeletonBox width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
        <SkeletonBox width={50} height={14} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
      <SkeletonBox width={70} height={30} borderRadius={8} />
    </View>
  );
}

export function CategorySidebarSkeleton() {
  return (
    <View style={styles.sidebarSkeletonItem}>
      <SkeletonBox width={46} height={46} borderRadius={14} style={{ marginBottom: 6 }} />
      <SkeletonBox width={60} height={10} borderRadius={4} />
    </View>
  );
}

export function CategoryBannerSkeleton() {
  return (
    <View style={styles.bannerSkeleton}>
      <View style={{ flex: 1 }}>
        <SkeletonBox width="60%" height={16} borderRadius={6} style={{ marginBottom: 6 }} />
        <SkeletonBox width="40%" height={12} borderRadius={4} />
      </View>
      <SkeletonBox width={50} height={50} borderRadius={12} />
    </View>
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.productCardSkeleton}>
      <SkeletonBox width="100%" height={90} borderRadius={10} style={{ marginBottom: 8 }} />
      <SkeletonBox width="85%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
      <SkeletonBox width="50%" height={10} borderRadius={4} style={{ marginBottom: 10 }} />
      <View style={styles.rowBetween}>
        <SkeletonBox width={45} height={14} borderRadius={4} />
        <SkeletonBox width={50} height={26} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E2E8F0',
  },
  cardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardSkeletonRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sidebarSkeletonItem: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bannerSkeleton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productCardSkeleton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
});


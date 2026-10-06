import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { tokenRefreshed, logoutAction } from './authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: 'https://grocery-app-x6gf.onrender.com/api/v1/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth?.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    const refreshToken = (api.getState() as any).auth?.refreshToken;
    if (refreshToken) {
      console.log('[Auth] Access token expired. Sending refresh-token request...');
      const refreshResult: any = await rawBaseQuery(
        {
          url: 'auth/refresh-token',
          method: 'POST',
          body: { refreshToken },
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
        },
        api,
        extraOptions
      );

      if (refreshResult.data && refreshResult.data.success && refreshResult.data.data) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResult.data.data;
        api.dispatch(
          tokenRefreshed({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        );
        // Retry the original query with the new access token
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        console.log('[Auth] Token refresh failed. Logging out user.');
        api.dispatch(logoutAction());
      }
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Addresses', 'Coupons', 'Orders', 'Cart', 'Wallet', 'Tickets', 'Faqs', 'Policies', 'Wishlist'] as const,
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (userData) => ({
        url: 'auth/register',
        method: 'POST',
        body: userData,
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
    }),
    refreshToken: builder.mutation({
      query: (refreshToken: string) => ({
        url: 'auth/refresh-token',
        method: 'POST',
        body: { refreshToken },
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    }),
    sendOtp: builder.mutation({
      query: (payload) => ({
        url: 'auth/customer/send-otp',
        method: 'POST',
        body: payload,
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
    }),
    verifyOtp: builder.mutation({
      query: (payload) => ({
        url: 'auth/customer/verify-otp',
        method: 'POST',
        body: payload,
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
    }),
    getBanners: builder.query({
      query: (params) => ({
        url: 'admin/get-banners',
        method: 'GET',
        params,
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    getCategories: builder.query({
      query: () => ({
        url: 'admin/get-categories',
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    getProducts: builder.query({
      query: (params) => ({
        url: 'admin/get-products',
        method: 'GET',
        params,
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    getSubCategories: builder.query({
      query: (params) => ({
        url: 'admin/get-sub-categories',
        method: 'GET',
        params,
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    getSingleProduct: builder.query({
      query: (productId: string) => ({
        url: `admin/single-products/${productId}`,
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    getCustomers: builder.query({
      query: () => ({
        url: 'admin/customers',
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    toggleCustomerStatus: builder.mutation({
      query: (customerId: string) => ({
        url: `admin/customers/${customerId}/toggle-status`,
        method: 'PATCH',
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    getPublicBanners: builder.query({
      query: (params) => ({
        url: 'banners',
        method: 'GET',
        params,
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    addToCart: builder.mutation({
      query: ({ productId, quantity }: { productId: string; quantity: number }) => ({
        url: 'cart/add',
        method: 'POST',
        body: { productId, quantity },
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['Cart'],
    }),
    viewCart: builder.query({
      query: (params) => ({
        url: 'cart/view-cart',
        method: 'GET',
        params,
        headers: {
          'accept': '*/*',
        },
      }),
      providesTags: ['Cart'],
    }),
    increaseCartQty: builder.mutation({
      query: (productId: string) => ({
        url: 'cart/increase',
        method: 'POST',
        body: { productId },
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['Cart'],
    }),
    decreaseCartQty: builder.mutation({
      query: (productId: string) => ({
        url: 'cart/decrease',
        method: 'POST',
        body: { productId },
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['Cart'],
    }),
    removeFromCart: builder.mutation({
      query: (productId: string) => ({
        url: 'cart/remove',
        method: 'POST',
        body: { productId },
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['Cart'],
    }),
    getCustomerMe: builder.query({
      query: () => ({
        url: 'auth/customer/me',
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    updateCustomerProfile: builder.mutation({
      query: (profileData) => ({
        url: 'auth/customer/profile',
        method: 'PUT',
        body: profileData,
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
    }),
    getPublicProducts: builder.query({
      query: (params) => ({
        url: 'products',
        method: 'GET',
        params,
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    getPublicSingleProduct: builder.query({
      query: (productId: string) => ({
        url: `products/${productId}`,
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    getWishlist: builder.query({
      query: (params) => ({
        url: 'wishlist',
        method: 'GET',
        params,
        headers: {
          'accept': '*/*',
        },
      }),
      providesTags: ['Wishlist'],
    }),
    addToWishlist: builder.mutation({
      query: (productId: string) => ({
        url: 'wishlist/add',
        method: 'POST',
        body: { productId },
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['Wishlist'],
    }),
    removeFromWishlist: builder.mutation({
      query: (productId: string) => ({
        url: `wishlist/remove/${productId}`,
        method: 'DELETE',
        headers: {
          'accept': '*/*',
        },
      }),
      invalidatesTags: ['Wishlist'],
    }),
    toggleWishlist: builder.mutation({
      query: (productId: string) => ({
        url: 'wishlist/toggle',
        method: 'POST',
        body: { productId },
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['Wishlist'],
    }),
    getPublicCategories: builder.query({
      query: (params) => ({
        url: 'categories',
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 50,
          status: params?.status ?? 'active',
          ...(params?.search ? { search: params.search } : {}),
          ...params,
        },
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    getPublicSingleCategory: builder.query({
      query: (categoryId: string) => ({
        url: `categories/${categoryId}`,
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    getPublicSubCategories: builder.query({
      query: (params) => ({
        url: 'sub-categories',
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 50,
          status: params?.status ?? 'active',
          ...(params?.category_id ? { category_id: params.category_id } : {}),
          ...(params?.search ? { search: params.search } : {}),
          ...params,
        },
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    getPublicSingleSubCategory: builder.query({
      query: (subCategoryId: string) => ({
        url: `sub-categories/${subCategoryId}`,
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }),
    }),
    // ── Address APIs ────────────────────────────────────────────────────────
    createAddress: builder.mutation({
      query: (addressData: {
        name: string;
        mobile: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
        landmark?: string;
        addressType: 'Home' | 'Work' | 'Office' | 'Other';
        alternateMobile?: string;
        isDefault?: boolean;
      }) => ({
        url: 'addresses/create-address',
        method: 'POST',
        body: addressData,
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: [{ type: 'Addresses' as const, id: 'LIST' }],
    }),
    getAddresses: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: 'addresses/view-address',
        method: 'GET',
        params: { page: params?.page ?? 1, limit: params?.limit ?? 50 },
        headers: {
          'accept': '*/*',
        },
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((_: any, id: number) => ({ type: 'Addresses' as const, id })), { type: 'Addresses' as const, id: 'LIST' }]
          : [{ type: 'Addresses' as const, id: 'LIST' }],
    }),
    getSingleAddress: builder.query({
      query: (id: string) => ({
        url: `addresses/single-address/${id}`,
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }),
      providesTags: (_result, _error, id) => [{ type: 'Addresses' as const, id }],
    }),
    updateAddress: builder.mutation({
      query: ({
        id,
        ...addressData
      }: {
        id: string;
        name?: string;
        mobile?: string;
        alternateMobile?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        landmark?: string;
        addressType?: 'Home' | 'Work' | 'Office' | 'Other';
        isDefault?: boolean;
      }) => ({
        url: `addresses/update-address/${id}`,
        method: 'PUT',
        body: addressData,
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Addresses' as const, id: 'LIST' },
        { type: 'Addresses' as const, id },
      ],
    }),
    deleteAddress: builder.mutation({
      query: (id: string) => ({
        url: `addresses/delete-address/${id}`,
        method: 'DELETE',
        headers: {
          'accept': '*/*',
        },
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Addresses' as const, id: 'LIST' },
        { type: 'Addresses' as const, id },
      ],
    }),
    // ── Coupon APIs ─────────────────────────────────────────────────────────
    getActiveCoupons: builder.query({
      query: (params?: { search?: string; page?: number; limit?: number }) => ({
        url: 'coupons/active',
        method: 'GET',
        params: {
          ...(params?.search ? { search: params.search } : {}),
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
        },
        headers: {
          'accept': '*/*',
        },
      }),
      providesTags: ['Coupons' as const],
    }),
    applyCoupon: builder.mutation({
      query: (payload: { couponCode: string }) => ({
        url: 'coupons/apply',
        method: 'POST',
        body: payload,
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['Coupons' as const],
    }),
    // ── Order & Checkout APIs ───────────────────────────────────────────────────
    checkoutOrder: builder.mutation({
      query: (payload: { addressId: string; paymentMethod: 'Online' | 'COD' | string; couponCode?: string }) => ({
        url: 'orders/checkout',
        method: 'POST',
        body: payload,
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['Cart' as const, { type: 'Orders' as const, id: 'LIST' }],
    }),
    getOrders: builder.query({
      query: (params?: { search?: string; orderStatus?: string; page?: number; limit?: number }) => ({
        url: 'orders/view-orders',
        method: 'GET',
        params: {
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.orderStatus ? { orderStatus: params.orderStatus } : {}),
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
        },
        headers: {
          'accept': '*/*',
        },
      }),
      providesTags: [{ type: 'Orders' as const, id: 'LIST' }],
    }),
    verifyRazorpayPayment: builder.mutation({
      query: (payload: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => ({
        url: 'orders/verify-payment',
        method: 'POST',
        body: {
          razorpay_order_id: payload.razorpay_order_id,
          razorpay_payment_id: payload.razorpay_payment_id,
          razorpay_signature: payload.razorpay_signature,
        },
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['Cart' as const, { type: 'Orders' as const, id: 'LIST' }],
    }),
    cancelOrder: builder.mutation({
      query: ({ id, reason }: { id: string; reason?: string }) => ({
        url: `orders/${id}/cancel`,
        method: 'PUT',
        body: {
          reason: reason || 'Changed my mind',
        },
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: [{ type: 'Orders' as const, id: 'LIST' }, 'Cart' as const, 'Wallet' as const],
    }),
    // ── Wallet APIs ────────────────────────────────────────────────────────────
    getWalletBalance: builder.query({
      query: (params?: { search?: string; type?: string; page?: number; limit?: number }) => {
        const queryParams: Record<string, any> = {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
        };
        if (params?.search && params.search.trim()) {
          queryParams.search = params.search.trim();
        }
        if (params?.type && params.type !== 'All') {
          queryParams.type = params.type;
        }
        return {
          url: 'wallet/balance',
          method: 'GET',
          params: queryParams,
          headers: {
            'accept': '*/*',
          },
        };
      },
      providesTags: ['Wallet' as const],
    }),
    topupWallet: builder.mutation({
      query: (payload: { amount: number }) => ({
        url: 'wallet/topup',
        method: 'POST',
        body: payload,
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
    }),
    verifyWalletTopup: builder.mutation({
      query: (payload: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        amount: number;
      }) => ({
        url: 'wallet/verify-topup',
        method: 'POST',
        body: payload,
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['Wallet' as const],
    }),
    // ── Ticket & Support APIs ───────────────────────────────────────────────────
    createTicket: builder.mutation({
      query: (payload: {
        subject: string;
        category: string;
        priority?: 'Low' | 'Medium' | 'High' | string;
        message: string;
      }) => ({
        url: 'tickets/create',
        method: 'POST',
        body: payload,
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: [{ type: 'Tickets' as const, id: 'LIST' }],
    }),
    getTickets: builder.query({
      query: (params?: { page?: number; limit?: number; status?: string; category?: string }) => ({
        url: 'tickets',
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 50,
          ...(params?.status ? { status: params.status } : {}),
          ...(params?.category ? { category: params.category } : {}),
        },
        headers: {
          'accept': '*/*',
        },
      }),
      providesTags: [{ type: 'Tickets' as const, id: 'LIST' }],
    }),
    getSingleTicket: builder.query({
      query: (id: string) => ({
        url: `tickets/${id}`,
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }),
      providesTags: (_result, _error, id) => [{ type: 'Tickets' as const, id }],
    }),
    deleteTicket: builder.mutation({
      query: (id: string) => ({
        url: `tickets/${id}`,
        method: 'DELETE',
        headers: {
          'accept': '*/*',
        },
      }),
      invalidatesTags: [{ type: 'Tickets' as const, id: 'LIST' }],
    }),
    replyTicket: builder.mutation({
      query: ({ id, message }: { id: string; message: string }) => ({
        url: `tickets/${id}/reply`,
        method: 'POST',
        body: { message },
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Tickets' as const, id: 'LIST' },
        { type: 'Tickets' as const, id },
      ],
    }),
    updateTicketStatus: builder.mutation({
      query: ({ id, status }: { id: string; status: string }) => ({
        url: `tickets/${id}/status`,
        method: 'PUT',
        body: { status },
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Tickets' as const, id: 'LIST' },
        { type: 'Tickets' as const, id },
      ],
    }),
    // ── FAQs & Policies APIs ───────────────────────────────────────────────────
    getFaqs: builder.query({
      query: (params?: { search?: string; category?: string; page?: number; limit?: number }) => ({
        url: 'faqs',
        method: 'GET',
        params: {
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.category ? { category: params.category } : {}),
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
        },
        headers: {
          'accept': '*/*',
        },
      }),
      providesTags: ['Faqs' as const],
    }),
    getFaqCategories: builder.query({
      query: () => ({
        url: 'faqs/categories',
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }),
      providesTags: ['Faqs' as const],
    }),
    getPolicyByType: builder.query({
      query: (type: string) => ({
        url: `policies/${type}`,
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }),
      providesTags: (_result, _error, type) => [{ type: 'Policies' as const, id: type }],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshTokenMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useGetBannersQuery,
  useGetCategoriesQuery,
  useGetProductsQuery,
  useGetSubCategoriesQuery,
  useGetSingleProductQuery,
  useGetCustomersQuery,
  useToggleCustomerStatusMutation,
  useAddToCartMutation,
  useGetCustomerMeQuery,
  useUpdateCustomerProfileMutation,
  useGetPublicProductsQuery,
  useGetPublicSingleProductQuery,
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useToggleWishlistMutation,
  useGetPublicCategoriesQuery,
  useGetPublicSingleCategoryQuery,
  useGetPublicSubCategoriesQuery,
  useGetPublicSingleSubCategoryQuery,
  useGetPublicBannersQuery,
  useViewCartQuery,
  useIncreaseCartQtyMutation,
  useDecreaseCartQtyMutation,
  useRemoveFromCartMutation,
  // Address hooks
  useCreateAddressMutation,
  useGetAddressesQuery,
  useGetSingleAddressQuery,
  useLazyGetSingleAddressQuery,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  // Coupon hooks
  useGetActiveCouponsQuery,
  useApplyCouponMutation,
  // Order & Checkout hooks
  useCheckoutOrderMutation,
  useGetOrdersQuery,
  useVerifyRazorpayPaymentMutation,
  useCancelOrderMutation,
  // Wallet hooks
  useGetWalletBalanceQuery,
  useTopupWalletMutation,
  useVerifyWalletTopupMutation,
  // Support Ticket hooks
  useCreateTicketMutation,
  useGetTicketsQuery,
  useGetSingleTicketQuery,
  useLazyGetSingleTicketQuery,
  useDeleteTicketMutation,
  useReplyTicketMutation,
  useUpdateTicketStatusMutation,
  // FAQ & Policy hooks
  useGetFaqsQuery,
  useGetFaqCategoriesQuery,
  useGetPolicyByTypeQuery,
} = apiSlice;





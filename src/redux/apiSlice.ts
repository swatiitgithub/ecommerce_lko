import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://grocery-app-x6gf.onrender.com/api/v1/' }),
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
      query: () => ({
        url: 'auth/refresh-token',
        method: 'POST',
        headers: {
          'accept': '*/*',
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
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshTokenMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
} = apiSlice;

import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { RAZORPAY_CONFIG } from '../config/razorpayConfig';

let RazorpayCheckout: any = null;
try {
  RazorpayCheckout = require('react-native-razorpay').default;
} catch (e) {
  RazorpayCheckout = null;
}

let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch (e) {
  WebView = null;
}

interface RazorpayModalProps {
  visible: boolean;
  orderData: {
    amount: number; // in Rupees
    orderId?: string;
    razorpayOrderId?: string;
    razorpayKey?: string;
    description?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  } | null;
  onSuccess: (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onCancel: (error?: string) => void;
}

export function triggerRazorpayNativePayment(
  orderData: RazorpayModalProps['orderData'],
  onSuccess: RazorpayModalProps['onSuccess'],
  onCancel: RazorpayModalProps['onCancel']
): boolean {
  if (!RazorpayCheckout) {
    return false;
  }

  try {
    const razorpayOrderId = orderData?.razorpayOrderId || orderData?.orderId || '';
    const amountInPaise = Math.round((orderData?.amount || 0) * 100);
    const key = orderData?.razorpayKey || RAZORPAY_CONFIG.KEY_ID;

    const options = {
      description: orderData?.description || RAZORPAY_CONFIG.DESCRIPTION,
      image: RAZORPAY_CONFIG.LOGO,
      currency: RAZORPAY_CONFIG.CURRENCY,
      key: key,
      amount: amountInPaise,
      name: RAZORPAY_CONFIG.MERCHANT_NAME,
      order_id: razorpayOrderId,
      prefill: {
        email: orderData?.customerEmail || 'customer@example.com',
        contact: orderData?.customerPhone || '9876543210',
        name: orderData?.customerName || 'Grocery Customer',
      },
      theme: { color: RAZORPAY_CONFIG.THEME_COLOR },
    };

    RazorpayCheckout.open(options)
      .then((data: any) => {
        onSuccess({
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_order_id: data.razorpay_order_id || razorpayOrderId,
          razorpay_signature: data.razorpay_signature || '',
        });
      })
      .catch((error: any) => {
        if (error?.code === 0 || error?.description?.includes('cancelled')) {
          onCancel('Payment cancelled by user');
        } else {
          onCancel(error?.description || error?.message || 'Payment failed');
        }
      });
    return true;
  } catch (err: any) {
    console.warn('[Razorpay Native Error]', err);
    return false;
  }
}

export default function RazorpayModal({
  visible,
  orderData,
  onSuccess,
  onCancel,
}: RazorpayModalProps) {
  if (!visible || !orderData) return null;

  const keyId = orderData.razorpayKey || RAZORPAY_CONFIG.KEY_ID;
  const amountInPaise = Math.round((orderData.amount || 0) * 100);
  const razorpayOrderId = orderData.razorpayOrderId || orderData.orderId || '';
  const customerName = orderData.customerName || 'Valued Customer';
  const customerEmail = orderData.customerEmail || 'customer@example.com';
  const customerPhone = orderData.customerPhone || '9876543210';

  // HTML content for Razorpay Web Checkout fallback
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #F8FAFC;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            color: #0F172A;
          }
          .card {
            text-align: center;
            padding: 24px;
            background: #FFFFFF;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            max-width: 320px;
            width: 90%;
            border: 1px solid #E2E8F0;
          }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #F7D117; }
          .amount { font-size: 28px; font-weight: 900; margin: 12px 0; color: #10B981; }
          .btn {
            background: #0C831F;
            color: white;
            border: none;
            padding: 14px 28px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 10px;
            cursor: pointer;
            width: 100%;
            margin-top: 16px;
          }
          .cancel-btn {
            background: transparent;
            color: #94A3B8;
            border: none;
            padding: 10px;
            font-size: 14px;
            cursor: pointer;
            margin-top: 8px;
            width: 100%;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="title">Grocery Payment</div>
          <div>Order #${razorpayOrderId.slice(-6) || 'ONLINE'}</div>
          <div class="amount">₹${orderData.amount}</div>
          <p style="font-size: 12px; color: #94A3B8;">Click below to launch Razorpay Secure Checkout</p>
          <button class="btn" id="payBtn" onclick="openRazorpay()">Pay Now</button>
          <button class="cancel-btn" onclick="cancelPayment()">Cancel</button>
        </div>

        <script>
          function openRazorpay() {
            var options = {
              "key": "${keyId}",
              "amount": "${amountInPaise}",
              "currency": "${RAZORPAY_CONFIG.CURRENCY}",
              "name": "${RAZORPAY_CONFIG.MERCHANT_NAME}",
              "description": "${orderData.description || RAZORPAY_CONFIG.DESCRIPTION}",
              "image": "${RAZORPAY_CONFIG.LOGO}",
              "order_id": "${razorpayOrderId}",
              "prefill": {
                "name": "${customerName}",
                "email": "${customerEmail}",
                "contact": "${customerPhone}"
              },
              "theme": {
                "color": "${RAZORPAY_CONFIG.THEME_COLOR}"
              },
              "handler": function (response){
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  status: 'SUCCESS',
                  data: {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id || "${razorpayOrderId}",
                    razorpay_signature: response.razorpay_signature || ''
                  }
                }));
              },
              "modal": {
                "ondismiss": function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    status: 'CANCELLED',
                    message: 'Payment popup closed'
                  }));
                }
              }
            };
            var rzp1 = new Razorpay(options);
            rzp1.on('payment.failed', function (response){
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'FAILED',
                message: response.error.description || 'Payment Failed'
              }));
            });
            rzp1.open();
          }

          function cancelPayment() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              status: 'CANCELLED',
              message: 'User cancelled payment'
            }));
          }

          // Auto trigger on load
          setTimeout(openRazorpay, 500);
        </script>
      </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.status === 'SUCCESS') {
        onSuccess(message.data);
      } else if (message.status === 'CANCELLED') {
        onCancel('Payment cancelled');
      } else if (message.status === 'FAILED') {
        onCancel(message.message || 'Payment failed');
      }
    } catch (e) {
      console.warn('Error parsing webview message', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modalContainer}>
        <StatusBar barStyle="light-content" />

        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Razorpay Secure Payment</Text>
          <TouchableOpacity onPress={() => onCancel('User closed checkout')}>
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        {/* WebView or Fallback view */}
        {WebView ? (
          <WebView
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            onMessage={handleWebViewMessage}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loaderCenter}>
                <ActivityIndicator size="large" color="#0C831F" />
                <Text style={styles.loadingText}>Loading Razorpay Gateway...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackEmoji}>💳</Text>
            <Text style={styles.fallbackTitle}>Razorpay Checkout</Text>
            <Text style={styles.fallbackSubtitle}>
              Amount Payable: ₹{orderData.amount}
            </Text>
            <Text style={styles.fallbackKey}>
              Key ID: {RAZORPAY_CONFIG.KEY_ID}
            </Text>
            <TouchableOpacity
              style={styles.simulateBtn}
              onPress={() => {
                // Simulate test payment success
                onSuccess({
                  razorpay_payment_id: `pay_test_${Math.random().toString(36).substring(7)}`,
                  razorpay_order_id: razorpayOrderId || `order_${Math.random().toString(36).substring(7)}`,
                  razorpay_signature: `sig_test_${Math.random().toString(36).substring(7)}`,
                });
              }}
            >
              <Text style={styles.simulateBtnText}>Simulate Successful Payment (Test)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => onCancel('Payment cancelled')}
            >
              <Text style={styles.cancelLinkText}>Cancel Payment</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    height: 56,
    backgroundColor: '#F7D117',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
  loaderCenter: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  fallbackEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  fallbackSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C831F',
    marginBottom: 4,
  },
  fallbackKey: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 24,
  },
  simulateBtn: {
    backgroundColor: '#0C831F',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0C831F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  simulateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  cancelLink: {
    padding: 10,
  },
  cancelLinkText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});

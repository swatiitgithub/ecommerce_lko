import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TextInput as PaperTextInput,
  Button as PaperButton,
  Surface,
  useTheme,
  Icon,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { useSendOtpMutation, useVerifyOtpMutation, useLoginMutation } from '../redux/apiSlice';
import { loginSuccess } from '../redux/authSlice';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToRegister?: () => void;
  onClose?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister, onClose }: LoginScreenProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpCodes, setOtpCodes] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isResendActive, setIsResendActive] = useState(false);

  // Email & password states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Registration states
  const [showNameInput, setShowNameInput] = useState(false);
  const [name, setName] = useState('');

  // API Hooks
  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const handleSendOtp = async () => {
    if (!isPhoneValid) return;
    if (showNameInput && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      const payload: any = { mobile: phoneNumber };
      if (showNameInput && name.trim()) {
        payload.name = name.trim();
      }
      const response = await sendOtp(payload).unwrap();
      let displayMessage = response.message || 'OTP Sent successfully!';
      if (response.data && response.data.otp) {
        displayMessage += `\nYour OTP is: ${response.data.otp}`;
      } else if (response.otp) {
        displayMessage += `\nYour OTP is: ${response.otp}`;
      }
      
      Alert.alert('OTP Verification', displayMessage, [
        { text: 'OK', onPress: () => triggerTransition('otp') }
      ]);
    } catch (err: any) {
      console.log('Send OTP Error:', err);
      if (err?.data?.isNewUser || err?.isNewUser || (err?.data?.message && err.data.message.includes('Name is required'))) {
        setShowNameInput(true);
        Alert.alert('New User', 'This mobile number is not registered. Please enter your name to register.');
      } else {
        const errorMsg = err?.data?.message || err?.message || 'Failed to send OTP';
        Alert.alert('Error', errorMsg);
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!isOtpValid) return;
    try {
      const otpCode = otpCodes.join('');
      const response = await verifyOtp({ mobile: phoneNumber, otp: otpCode }).unwrap();
      console.log('[LoginScreen] verifyOtp response:', response);
      if (response && (response.success || response.data || response.accessToken)) {
        const userData = response.data?.user || response.user || response.data?.customer || response.customer || { mobile: phoneNumber };
        const accessToken = response.data?.accessToken || response.accessToken || response.data?.token || response.token || '';
        const refreshToken = response.data?.refreshToken || response.refreshToken || '';
        dispatch(loginSuccess({ message: response.message || 'Success', user: userData, accessToken, refreshToken }));
        onLoginSuccess();
      } else {
        Alert.alert('Verification Failed', response?.message || 'Invalid OTP');
      }
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || 'Verification failed';
      Alert.alert('Error', errorMsg);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) return;
    try {
      const response = await login({ email, password }).unwrap();
      console.log('[LoginScreen] emailLogin response:', response);
      if (response && (response.success || response.data || response.accessToken)) {
        const userData = response.data?.user || response.user || response.data?.customer || response.customer || { email };
        const accessToken = response.data?.accessToken || response.accessToken || response.data?.token || response.token || '';
        const refreshToken = response.data?.refreshToken || response.refreshToken || '';
        dispatch(loginSuccess({
          message: response.message || 'Login successful',
          user: userData,
          accessToken,
          refreshToken
        }));
        Alert.alert('Success', response.message || 'Login successful', [
          { text: 'OK', onPress: () => onLoginSuccess() }
        ]);
      } else {
        Alert.alert('Login Failed', response?.message || 'Invalid credentials');
      }
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || 'Login failed';
      Alert.alert('Error', errorMsg);
    }
  };

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Individual OTP refs (using plain TextInput from RN for multi-ref focus control)
  const otpRef0 = useRef<any>(null);
  const otpRef1 = useRef<any>(null);
  const otpRef2 = useRef<any>(null);
  const otpRef3 = useRef<any>(null);
  const otpRef4 = useRef<any>(null);
  const otpRef5 = useRef<any>(null);
  const otpRefs = [otpRef0, otpRef1, otpRef2, otpRef3, otpRef4, otpRef5];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((p) => p - 1), 1000);
    } else if (timer === 0) {
      setIsResendActive(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const triggerTransition = (nextStep: 'phone' | 'otp') => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: nextStep === 'otp' ? 50 : -50, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      if (nextStep === 'otp') {
        setTimer(30);
        setIsResendActive(false);
        setOtpCodes(['', '', '', '', '', '']);
        setTimeout(() => otpRefs[0].current?.focus(), 100);
      }
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleOtpChange = (text: string, index: number) => {
    const val = text.replace(/[^0-9]/g, '');
    const newOtp = [...otpCodes];
    newOtp[index] = val;
    setOtpCodes(newOtp);
    if (val !== '' && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otpCodes[index] === '' && index > 0) {
      const newOtp = [...otpCodes];
      newOtp[index - 1] = '';
      setOtpCodes(newOtp);
      otpRefs[index - 1].current?.focus();
    }
  };

  const isPhoneValid = phoneNumber.length === 10;
  const isOtpValid = otpCodes.join('').length === 6;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

        {/* ─── Top Yellow Banner ─── */}
        <View style={[styles.headerBanner, { paddingTop: Math.max(insets.top + 10, 36) }]}>
          {onClose && (
            <TouchableOpacity
              style={styles.closeLoginModalBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon source="close" size={22} color="#000000" />
            </TouchableOpacity>
          )}
          <Image
            source={require('../assest/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.bannerTagline}>India's last minute app</Text>
          <View style={[styles.groceryBubble, styles.bubble1]}><Text style={styles.bubbleEmoji}>🥦</Text></View>
          <View style={[styles.groceryBubble, styles.bubble2]}><Text style={styles.bubbleEmoji}>🥛</Text></View>
          <View style={[styles.groceryBubble, styles.bubble3]}><Text style={styles.bubbleEmoji}>🍎</Text></View>
          <View style={[styles.groceryBubble, styles.bubble4]}><Text style={styles.bubbleEmoji}>🍞</Text></View>
        </View>

        {/* ─── Form Section ─── */}
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {step === 'phone' ? (
            <>
              <Text style={styles.formTitle}>Log in or sign up</Text>
              <Text style={styles.formSubtitle}>Verify your mobile number to proceed</Text>

              {showNameInput && (
                <PaperTextInput
                  label="Your Name (New User)"
                  mode="outlined"
                  value={name}
                  onChangeText={setName}
                  style={styles.inputField}
                  textColor="#0F172A"
                  theme={{ colors: { primary: '#0C831F' } }}
                  left={<PaperTextInput.Icon icon="account" />}
                />
              )}

              {/* Paper Surface card for the phone input */}
              <Surface style={styles.inputSurface} elevation={1}>
                <View style={styles.prefixRow}>
                  <Text style={styles.countryFlag}>🇮🇳</Text>
                  <Text style={styles.countryCode}>+91</Text>
                  <View style={styles.inputDivider} />
                  <PaperTextInput
                    mode="flat"
                    placeholder="Enter mobile number"
                    keyboardType="numeric"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={(t) => {
                      setPhoneNumber(t.replace(/[^0-9]/g, ''));
                      if (showNameInput) {
                        setShowNameInput(false);
                        setName('');
                      }
                    }}
                    autoFocus
                    style={styles.paperPhoneInput}
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    placeholderTextColor="#94A3B8"
                    textColor="#0F172A"
                    contentStyle={styles.paperInputContent}
                  />
                </View>
              </Surface>

              {isSendingOtp ? (
                <ActivityIndicator size="large" color="#0C831F" style={{ marginVertical: 20 }} />
              ) : (
                <PaperButton
                  mode="contained"
                  onPress={handleSendOtp}
                  disabled={!isPhoneValid || (showNameInput && !name.trim())}
                  style={[styles.actionButton, (!isPhoneValid || (showNameInput && !name.trim())) && styles.buttonDisabled]}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  theme={{ colors: { primary: '#0C831F' } }}
                >
                  Continue
                </PaperButton>
              )}
            </>
          ) : (
            <>
              <View style={styles.otpHeaderRow}>
                <TouchableOpacity onPress={() => triggerTransition('phone')} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.formTitle}>OTP Verification</Text>
              </View>
              <Text style={styles.formSubtitle}>
                Code sent to +91 {phoneNumber.slice(0, 3)}***{phoneNumber.slice(7)}
              </Text>

              {/* 6 OTP boxes */}
              <View style={styles.otpRow}>
                {otpCodes.map((code, index) => (
                  <PaperTextInput
                    key={index}
                    ref={otpRefs[index]}
                    mode="outlined"
                    keyboardType="numeric"
                    maxLength={1}
                    value={code}
                    onChangeText={(t) => handleOtpChange(t, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    style={styles.otpBox}
                    outlineStyle={[styles.otpOutline, code !== '' && styles.otpOutlineFilled]}
                    textColor="#0F172A"
                    contentStyle={styles.otpContent}
                    theme={{
                      colors: {
                        primary: '#0C831F',
                        outline: code !== '' ? '#0C831F' : '#CBD5E1',
                        background: code !== '' ? '#F0FDF4' : '#F8FAFC',
                      },
                    }}
                  />
                ))}
              </View>

              <View style={styles.timerRow}>
                {isResendActive ? (
                  <PaperButton
                    mode="text"
                    onPress={handleSendOtp}
                    labelStyle={styles.resendLabel}
                    theme={{ colors: { primary: '#0C831F' } }}
                  >
                    Resend OTP
                  </PaperButton>
                ) : (
                  <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
                )}
              </View>

              {isVerifyingOtp ? (
                <ActivityIndicator size="large" color="#0C831F" style={{ marginVertical: 20 }} />
              ) : (
                <PaperButton
                  mode="contained"
                  onPress={handleVerifyOtp}
                  disabled={!isOtpValid}
                  style={[styles.actionButton, !isOtpValid && styles.buttonDisabled]}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  theme={{ colors: { primary: '#0C831F' } }}
                >
                  Verify & Proceed
                </PaperButton>
              )}
            </>
          )}

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service &amp; Privacy Policy.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7D117' },
  scrollContainer: { flexGrow: 1, backgroundColor: '#F7D117' },
  headerBanner: {
    height: SCREEN_HEIGHT * 0.38,
    backgroundColor: '#F7D117',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 20,
  },
  bannerLogoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -1,
  },
  logoImage: {
    width: 220,
    height: 95,
  },
  bannerTagline: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '700',
    marginTop: 4,
    opacity: 0.8,
  },
  groceryBubble: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bubbleEmoji: { fontSize: 20 },
  bubble1: { top: 20, left: 20 },
  bubble2: { top: 20, right: 20 },
  bubble3: { bottom: 35, left: 24 },
  bubble4: { bottom: 35, right: 24 },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    minHeight: SCREEN_HEIGHT * 0.62,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 20,
  },
  // Paper Surface wrapping the phone input
  inputSurface: {
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  prefixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    height: 56,
  },
  countryFlag: { fontSize: 20, marginRight: 6 },
  countryCode: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  inputDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10,
  },
  paperPhoneInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 16,
    height: 56,
  },
  paperInputContent: {
    paddingHorizontal: 0,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  backBtn: { paddingRight: 12 },
  backBtnText: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  otpBox: {
    width: 46,
    height: 52,
  },
  otpOutline: {
    borderRadius: 10,
  },
  otpOutlineFilled: {
    borderWidth: 2,
  },
  otpContent: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  timerRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    paddingVertical: 8,
  },
  resendLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0C831F',
    textDecorationLine: 'underline',
  },
  actionButton: {
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A7F3D0',
    elevation: 0,
  },
  buttonContent: {
    height: 52,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#FFFFFF',
  },
  termsText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 8,
  },
  registerLinkText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  registerLinkTextHighlight: {
    color: '#0C831F',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  activeTabButtonText: {
    color: '#0C831F',
  },
  inputField: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  closeLoginModalBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

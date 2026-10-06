import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import {
  TextInput as PaperTextInput,
  Button as PaperButton,
  useTheme,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '../redux/apiSlice';
import { setSuccess, setError, setLoading } from '../redux/authSlice';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export default function RegisterScreen({ onRegisterSuccess, onNavigateToLogin }: RegisterScreenProps) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // RTK Query register mutation hook
  const [registerAdmin, { isLoading }] = useRegisterMutation();

  const handleRegister = async () => {
    if (!fullName || !email || !mobile || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (mobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    const payload = {
      fullName,
      email,
      mobile,
      password,
    };

    dispatch(setLoading(true));
    try {
      const response = await registerAdmin(payload).unwrap();
      if (response && response.success) {
        dispatch(setSuccess({ message: response.message, user: response.data }));
        Alert.alert('Success', response.message || 'Registration successful!', [
          { text: 'OK', onPress: () => onRegisterSuccess() }
        ]);
      } else {
        const errorMsg = response?.message || 'Registration failed. Please try again.';
        dispatch(setError(errorMsg));
        Alert.alert('Registration Failed', errorMsg);
      }
    } catch (err: any) {
      console.error('Registration Error:', err);
      const errorMsg = err?.data?.message || err?.message || 'An error occurred during registration.';
      dispatch(setError(errorMsg));
      Alert.alert('Error', errorMsg);
    }
  };

  const isFormValid = fullName.trim() !== '' && email.trim() !== '' && mobile.length === 10 && password.trim() !== '';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

        {/* ─── Top Yellow Banner ─── */}
        <View style={styles.headerBanner}>
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
          <View style={[styles.groceryBubble, styles.bubble5]}><Text style={styles.bubbleEmoji}>🧀</Text></View>
        </View>

        {/* ─── Form Section ─── */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Create Account</Text>
          <Text style={styles.formSubtitle}>Register to start ordering fresh items</Text>

          {/* Full Name Input */}
          <PaperTextInput
            label="Full Name"
            mode="outlined"
            value={fullName}
            onChangeText={setFullName}
            style={styles.inputField}
            textColor="#0F172A"
            theme={{ colors: { primary: '#0C831F' } }}
            left={<PaperTextInput.Icon icon="account" />}
          />

          {/* Email Input */}
          <PaperTextInput
            label="Email Address"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.inputField}
            textColor="#0F172A"
            theme={{ colors: { primary: '#0C831F' } }}
            left={<PaperTextInput.Icon icon="email" />}
          />

          {/* Mobile Input */}
          <PaperTextInput
            label="Mobile Number"
            mode="outlined"
            value={mobile}
            onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            maxLength={10}
            style={styles.inputField}
            textColor="#0F172A"
            theme={{ colors: { primary: '#0C831F' } }}
            left={<PaperTextInput.Icon icon="phone" />}
          />

          {/* Password Input */}
          <PaperTextInput
            label="Password"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.inputField}
            textColor="#0F172A"
            theme={{ colors: { primary: '#0C831F' } }}
            left={<PaperTextInput.Icon icon="lock" />}
            right={
              <PaperTextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          {isLoading ? (
            <ActivityIndicator size="large" color="#0C831F" style={styles.loader} />
          ) : (
            <PaperButton
              mode="contained"
              onPress={handleRegister}
              disabled={!isFormValid}
              style={[styles.actionButton, !isFormValid && styles.buttonDisabled]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              theme={{ colors: { primary: '#0C831F' } }}
            >
              Register & Continue
            </PaperButton>
          )}

          <TouchableOpacity onPress={onNavigateToLogin} style={styles.loginLink} activeOpacity={0.7}>
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkTextHighlight}>Log In</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service &amp; Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContainer: { flexGrow: 1, backgroundColor: '#FFFFFF' },
  headerBanner: {
    height: 180,
    backgroundColor: '#F7D117',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerLogoText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -1,
  },
  logoImage: {
    width: 180,
    height: 70,
  },
  bannerTagline: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '700',
    marginTop: 4,
    opacity: 0.8,
  },
  groceryBubble: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  bubbleEmoji: { fontSize: 18 },
  bubble1: { top: 20, left: 20 },
  bubble2: { top: 20, right: 20 },
  bubble3: { bottom: 20, left: 20 },
  bubble4: { bottom: 20, right: 20 },
  bubble5: { top: 80, left: '46%' },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
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
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputField: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
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
  loginLink: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  loginLinkTextHighlight: {
    color: '#0C831F',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  loader: {
    marginVertical: 20,
  },
});

import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../shared/constants/colors';
import { ENV } from '../../../config/env';
import { useLoginForm } from '../hooks/useLoginForm';

interface LoginFormData {
  officeCode: string;
  username: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  const f = useLoginForm();
  const [showPassword, setShowPassword] = React.useState(false);

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    switch (field) {
      case 'officeCode':
        f.setKodeKantor(value);
        break;
      case 'username':
        f.setUsername(value);
        break;
      case 'password':
        f.setPassword(value);
        break;
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header - Logo dan Nama Aplikasi */}
            <View style={styles.header}>
              <Image 
                source={require('../../../assets/images/dots_logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>dots®</Text>
            </View>

            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Selamat Datang</Text>
              <Text style={styles.welcomeSubtitle}>Masuk untuk melanjutkan</Text>
            </View>

            {/* Error Message */}
            {f.errors.general ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{f.errors.general}</Text>
              </View>
            ) : null}

            {/* Login Form */}
            <View style={styles.formSection}>
              <FormInput
                icon="🏢"
                placeholder="Kode Kantor (6 digit)"
                value={f.kodeKantor}
                onChangeText={(value) => handleInputChange('officeCode', value)}
                keyboardType="numeric"
                maxLength={6}
                errorText={f.errors.kodeKantor}
              />
              
              <FormInput
                icon="👤"
                placeholder="Nama Pengguna"
                value={f.username}
                onChangeText={(value) => handleInputChange('username', value)}
                errorText={f.errors.username}
              />
              
              <FormInput
                icon="🔒"
                placeholder="Kata Sandi"
                value={f.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                rightIcon={
                  <TouchableOpacity onPress={togglePasswordVisibility}>
                    <Text style={styles.eyeIcon}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                }
                errorText={f.errors.password}
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, f.loading && styles.loginButtonDisabled]} 
              onPress={f.submit} 
              disabled={f.loading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {f.loading ? "Memuat…" : "Masuk"}
              </Text>
            </TouchableOpacity>

            {/* Version Info */}
            <Text style={styles.versionText}>
              Mobile Corporate Versi {ENV.VERSION_APP || '2.4.3'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Form Input Component
interface FormInputProps {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  maxLength?: number;
  rightIcon?: React.ReactNode;
  errorText?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  maxLength,
  rightIcon,
  errorText,
}) => (
  <View style={styles.inputWrapper}>
    <View style={[styles.inputContainer, errorText && styles.inputContainerError]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
      {rightIcon}
    </View>
    {errorText && <Text style={styles.errorText}>{errorText}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  formSection: {
    width: '100%',
    marginBottom: 30,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  eyeIcon: {
    fontSize: 20,
    padding: 5,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  loginButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  versionText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default LoginScreen;
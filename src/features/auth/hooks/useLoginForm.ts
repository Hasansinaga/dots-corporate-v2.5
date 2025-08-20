import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../../navigation/types';
import { validateLogin } from '../utils/validation';
import { login as loginService } from '../services/authService';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function useLoginForm() {
  const navigation = useNavigation<Nav>();

  const [kodeKantor, setKodeKantor] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    general?: string;
    kodeKantor?: string;
    username?: string;
    password?: string;
  }>({});

  const submit = async () => {
    setLoading(true);
    setErrors({});

    try {
      // 1. Validasi input
      const validation = validateLogin({ kodeKantor, username, password });
      if (!validation.ok) {
        setErrors(validation.errors);
        return { ok: false, message: "Data tidak valid" };
      }

      // 2. Convert kode kantor ke number
      const kodeKantorInt = parseInt(kodeKantor, 10);
      if (isNaN(kodeKantorInt)) {
        setErrors({ kodeKantor: "Kode kantor harus berupa angka" });
        return { ok: false, message: "Kode kantor tidak valid" };
      }

      // 3. Panggil service login
      await loginService({
        username,
        password,
        kodeKantor: kodeKantorInt
      });

      // 4. Jika berhasil, reset form dan redirect
      setKodeKantor('');
      setUsername('');
      setPassword('');
      setErrors({});

      // Reset navigation setelah delay singkat untuk UX yang lebih baik
      setTimeout(() => {
        navigation.reset({ 
          index: 0, 
          routes: [{ name: 'HomeTabs' as never }] 
        });
      }, 100);

      return { 
        ok: true, 
        user: { 
          id: 'user_id', // Akan diisi dari decoded token
          name: username, 
          email: '' 
        } 
      };

    } catch (error: any) {
      console.error('Login error:', error);

      // Handle different types of errors with user-friendly messages
      let errorMessage = 'Login gagal. Mohon periksa kembali data yang Anda masukkan';

      const status = error?.response?.status;
      if (status === 401) {
        errorMessage = 'Username atau password salah';
      } else if (status === 403) {
        errorMessage = 'Akses ditolak untuk kode kantor ini';
      } else if (status === 404) {
        errorMessage = 'Kode kantor tidak ditemukan';
      } else if (status === 500) {
        // For 500 errors, use a generic message
        errorMessage = 'Login gagal. Mohon periksa kembali data yang Anda masukkan';
      } else if (status >= 500) {
        errorMessage = 'Server sedang bermasalah, coba lagi nanti';
      } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
        errorMessage = 'Tidak dapat terhubung ke server';
      } else if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
        errorMessage = 'Koneksi timeout, coba lagi';
      } else if (error?.message && !error?.message?.includes('Request failed')) {
        // Use the error message if it's meaningful
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
      return { ok: false, message: errorMessage };

    } finally {
      setLoading(false);
    }
  };

  return {
    kodeKantor, setKodeKantor,
    username, setUsername, 
    password, setPassword,
    loading, errors, setErrors,
    submit,
  };
}
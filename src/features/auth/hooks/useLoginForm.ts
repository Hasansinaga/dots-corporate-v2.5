import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../shared/navigation';
import { validateLogin } from '../utils/validation';
import { useAuth } from '../../../stores/useAuth';


type Nav = NativeStackNavigationProp<RootStackParamList>;

export interface LoginFormState {
  kodeKantor: string;
  username: string;
  password: string;
  loading: boolean;
  errors: {
    general?: string;
    kodeKantor?: string;
    username?: string;
    password?: string;
  };
  setKodeKantor: (value: string) => void;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  setErrors: (errors: any) => void;
  submit: () => Promise<any>;
}

export function useLoginForm(): LoginFormState {
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();

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

      // 3. Panggil login dari auth store
      const user = await login({
        username,
        password,
        kodeKantor: kodeKantorInt
      });

      // 4. Jika berhasil, reset form
      setKodeKantor('');
      setUsername('');
      setPassword('');
      setErrors({});



      // 6. Navigate IMMEDIATELY setelah login berhasil
      navigation.reset({ 
        index: 0, 
        routes: [{ name: 'HomeTabs' as never }] 
      });

      return { 
        ok: true, 
        user
      };

    } catch (error: any) {
      console.error('[login] submit error:', error);

      // Handle different types of errors with user-friendly messages
      let errorMessage = 'Login gagal. Mohon periksa kembali data yang Anda masukkan';

      if (error?.message) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
      return { 
        ok: false, 
        message: errorMessage 
      };

    } finally {
      setLoading(false);
    }
  };

  return {
    kodeKantor,
    username,
    password,
    loading,
    errors,
    setKodeKantor,
    setUsername,
    setPassword,
    setErrors,
    submit,
  };
}
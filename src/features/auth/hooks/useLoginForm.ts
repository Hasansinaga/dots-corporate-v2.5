import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../../../src/navigation/types'; // sesuaikan path

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
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeTabs' as never }],
      });
    } catch (e: any) {
      setErrors({ general: e?.message ?? 'Gagal masuk. Coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  return {
    kodeKantor,
    setKodeKantor,
    username,
    setUsername,
    password,
    setPassword,
    loading,
    errors,
    submit,
  };
}

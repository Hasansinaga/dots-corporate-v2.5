import React, { useEffect } from 'react';
import { HomeTabs } from './src/shared/navigation';
import { useAuth } from './src/stores/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function App() {
  const hydrated = useAuth((s) => s.hydrated);
  const hydrate = useAuth((s) => s.hydrate);

  useEffect(() => { hydrate(); }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <HomeTabs />;
}
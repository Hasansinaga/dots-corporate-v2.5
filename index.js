import 'react-native-gesture-handler'; // wajib paling atas
// (opsional) import 'react-native-reanimated';

import { AppRegistry } from 'react-native';
import App from './src/App';                // <- pakai yang di src
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

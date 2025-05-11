/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import Navigation from './src/navigations/Navigation';
import 'react-native-gesture-handler';

AppRegistry.registerComponent(appName, () => Navigation);

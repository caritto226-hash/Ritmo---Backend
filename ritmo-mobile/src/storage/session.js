import * as SecureStore from 'expo-secure-store';

// El token se guarda cifrado en el almacenamiento seguro del dispositivo (Android Keystore).
const TOKEN_KEY = 'ritmo_token';

export function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function saveToken(token) {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function clearToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

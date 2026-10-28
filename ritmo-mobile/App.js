import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import { clearToken, getToken } from './src/storage/session';
import { colors, radius, spacing } from './src/theme';

export default function App() {
  // 'checking' mientras se lee el token; luego 'loggedOut' o 'loggedIn'. Así se navega sin librerías.
  const [screen, setScreen] = useState('checking');
  const [token, setToken] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    getToken()
      .then((storedToken) => {
        if (!active) {
          return;
        }

        setToken(storedToken);
        setScreen(storedToken ? 'loggedIn' : 'loggedOut');
      })
      .catch(() => {
        // Si el almacenamiento seguro falla, se pide iniciar sesión de nuevo.
        if (active) {
          setScreen('loggedOut');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function handleLogin(newToken) {
    setToken(newToken);
    setNotice('');
    setScreen('loggedIn');
  }

  // "message" permite avisar el motivo (por ejemplo, sesión expirada por un 401).
  async function handleLogout(message = '') {
    try {
      await clearToken();
    } catch {
      // Aunque falle el borrado, la sesión en memoria se descarta igual.
    }

    setToken(null);
    setNotice(message);
    setScreen('loggedOut');
  }

  let content;

  if (screen === 'checking') {
    content = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  } else if (screen === 'loggedOut') {
    content = <LoginScreen onLogin={handleLogin} notice={notice} />;
  } else {
    // Temporal: en la fase 3 se reemplaza por la pantalla de tareas, que recibirá "token".
    content = (
      <View style={styles.centered}>
        <Text style={styles.title}>Sesión iniciada</Text>
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
          onPress={() => handleLogout()}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  logoutText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});

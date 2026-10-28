import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { login } from '../api/auth';
import { saveToken } from '../storage/session';
import { colors, radius, spacing } from '../theme';

// Mismo patrón que usa el backend en auth.validator.js.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(correo, password) {
  const errors = {};

  if (correo === '') {
    errors.correo = 'El correo es obligatorio.';
  } else if (!EMAIL_PATTERN.test(correo)) {
    errors.correo = 'El correo no tiene un formato válido.';
  }

  if (password === '') {
    errors.password = 'La contraseña es obligatoria.';
  }

  return errors;
}

export default function LoginScreen({ onLogin, notice }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);

  async function handleSubmit() {
    if (loading) {
      return;
    }

    const normalizedCorreo = correo.trim().toLowerCase();
    const errors = validate(normalizedCorreo, password);

    setFieldErrors(errors);
    setServerError('');

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const token = await login(normalizedCorreo, password);
      await saveToken(token);
      onLogin(token);
    } catch (error) {
      // En el login un 401 significa credenciales incorrectas: se muestra el mensaje del servidor.
      setServerError(error.message || 'No se pudo iniciar sesión. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Ritmo</Text>
        <Text style={styles.subtitle}>Inicia sesión para ver tus tareas</Text>

        <View style={styles.card}>
          {notice ? (
            <Text style={[styles.banner, styles.bannerNotice]}>{notice}</Text>
          ) : null}

          {serverError ? (
            <Text style={[styles.banner, styles.bannerError]} accessibilityLiveRegion="polite">
              {serverError}
            </Text>
          ) : null}

          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={[styles.input, fieldErrors.correo && styles.inputError]}
            value={correo}
            onChangeText={(value) => {
              setCorreo(value);
              setFieldErrors((current) => ({ ...current, correo: undefined }));
            }}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!loading}
            accessibilityLabel="Correo"
          />
          {fieldErrors.correo ? <Text style={styles.fieldError}>{fieldErrors.correo}</Text> : null}

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            ref={passwordRef}
            style={[styles.input, fieldErrors.password && styles.inputError]}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
            }}
            placeholder="Tu contraseña"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            editable={!loading}
            accessibilityLabel="Contraseña"
          />
          {fieldErrors.password ? <Text style={styles.fieldError}>{fieldErrors.password}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading, busy: loading }}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  banner: {
    borderRadius: radius.control,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  bannerError: {
    backgroundColor: colors.errorSoft,
    color: colors.error,
  },
  bannerNotice: {
    backgroundColor: colors.accentSoft,
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  fieldError: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});

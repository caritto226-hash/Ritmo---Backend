import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, radius, spacing } from '../theme';

// Mismos límites que el backend (tasks.validator.js).
const MAX_TITLE_LENGTH = 45;
const MAX_DESCRIPTION_LENGTH = 2000;

const PRIORITIES = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

// Se usan los getters locales (no toISOString) para que la fecha elegida no se corra un día por zona horaria.
function toDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDisplayDate(date) {
  const [year, month, day] = toDateOnly(date).split('-');
  return `${day}/${month}/${year}`;
}

// Se monta cada vez que se abre, así el formulario empieza limpio; "onSubmit" lanza un error si el guardado falla.
export default function TaskForm({ onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [priority, setPriority] = useState('media');
  const [titleError, setTitleError] = useState('');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  function handleDateChange(event, selectedDate) {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }

  function openAndroidDatePicker() {
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      onValueChange: handleDateChange,
      onDismiss: () => {},
    });
  }

  async function handleSave() {
    if (saving) {
      return;
    }

    const trimmedTitle = title.trim();

    if (trimmedTitle === '') {
      setTitleError('El título es obligatorio.');
      return;
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      setTitleError(`El título no puede superar los ${MAX_TITLE_LENGTH} caracteres.`);
      return;
    }

    setTitleError('');
    setServerError('');
    setSaving(true);

    try {
      await onSubmit({
        title: trimmedTitle,
        // El backend exige el campo descripción: si está vacío se envía "".
        description: description.trim(),
        date: toDateOnly(date),
        priority,
      });
    } catch (error) {
      // Lo escrito se conserva: solo se muestra el mensaje del servidor dentro del formulario.
      if (mountedRef.current) {
        setServerError(error.message || 'No se pudo crear la tarea. Intenta de nuevo.');
      }
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  }

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <Text style={styles.heading}>Nueva tarea</Text>

            {serverError ? (
              <Text style={styles.bannerError} accessibilityLiveRegion="polite">{serverError}</Text>
            ) : null}

            <View style={styles.labelRow}>
              <Text style={styles.label}>Título</Text>
              <Text style={[styles.counter, title.length >= MAX_TITLE_LENGTH && styles.counterLimit]}>
                {title.length}/{MAX_TITLE_LENGTH}
              </Text>
            </View>
            <TextInput
              style={[styles.input, titleError && styles.inputError]}
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                setTitleError('');
              }}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="¿Qué necesitas hacer?"
              placeholderTextColor={colors.placeholder}
              returnKeyType="next"
              editable={!saving}
              accessibilityLabel="Título"
            />
            {titleError ? <Text style={styles.fieldError}>{titleError}</Text> : null}

            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder="Agrega detalles si los necesitas"
              placeholderTextColor={colors.placeholder}
              multiline
              textAlignVertical="top"
              editable={!saving}
              accessibilityLabel="Descripción"
            />

            <Text style={styles.label}>Fecha</Text>
            {Platform.OS === 'android' ? (
              <Pressable
                style={({ pressed }) => [styles.input, styles.dateButton, pressed && styles.pressed]}
                onPress={openAndroidDatePicker}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel={`Fecha: ${toDisplayDate(date)}. Toca para cambiarla`}
              >
                <Text style={styles.dateText}>{toDisplayDate(date)}</Text>
                <Text style={styles.dateHint}>Cambiar</Text>
              </Pressable>
            ) : (
              <DateTimePicker
                value={date}
                mode="date"
                display="compact"
                onValueChange={handleDateChange}
                disabled={saving}
                style={styles.iosPicker}
              />
            )}

            <Text style={styles.label}>Prioridad</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((option) => {
                const selected = option.value === priority;

                return (
                  <Pressable
                    key={option.value}
                    style={[styles.priorityButton, selected && styles.priorityButtonSelected]}
                    onPress={() => setPriority(option.value)}
                    disabled={saving}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: saving }}
                  >
                    <Text style={[styles.priorityText, selected && styles.priorityTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed, saving && styles.disabled]}
                onPress={handleClose}
                disabled={saving}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, saving && styles.disabled]}
                onPress={handleSave}
                disabled={saving}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving, busy: saving }}
              >
                {saving ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.saveText}>Guardar</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(29, 43, 68, 0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card + 4,
    borderTopRightRadius: radius.card + 4,
    maxHeight: '90%',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  bannerError: {
    backgroundColor: colors.errorSoft,
    color: colors.error,
    borderRadius: radius.control,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 14,
    overflow: 'hidden',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  counter: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  counterLimit: {
    color: colors.error,
    fontWeight: '600',
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
  textArea: {
    minHeight: 90,
  },
  fieldError: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  dateHint: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  iosPicker: {
    alignSelf: 'flex-start',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  priorityButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  priorityTextSelected: {
    color: colors.onPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});

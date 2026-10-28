import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

const PRIORITY = {
  alta: { label: 'Alta', background: colors.errorSoft, color: colors.error },
  media: { label: 'Media', background: colors.accentSoft, color: colors.text },
  baja: { label: 'Baja', background: colors.background, color: colors.textMuted },
};

const STATUS = {
  pendiente: { label: 'Pendiente', background: colors.background, color: colors.textMuted },
  en_proceso: { label: 'En proceso', background: colors.accentSoft, color: colors.text },
  completada: { label: 'Completada', background: colors.successSoft, color: colors.success },
};

// El backend envía la fecha como texto "YYYY-MM-DD"; se corta sin usar Date para no correrla por zona horaria.
function formatDate(value) {
  if (typeof value !== 'string' || value.length < 10) {
    return 'Sin fecha';
  }

  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function normalize(value) {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(' ', '_') : '';
}

function Pill({ label, background, color }) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export default function TaskItem({ task, completing, onComplete }) {
  const priorityKey = normalize(task.priority);
  const statusKey = normalize(task.status);
  const priority = PRIORITY[priorityKey] || { label: task.priority || 'Sin prioridad', background: colors.background, color: colors.textMuted };
  const status = STATUS[statusKey] || { label: task.status || 'Sin estado', background: colors.background, color: colors.textMuted };
  const isCompleted = statusKey === 'completada';

  return (
    <View style={styles.card}>
      <Text style={[styles.title, isCompleted && styles.titleCompleted]}>{task.title}</Text>
      <Text style={styles.date}>{formatDate(task.dueDate)}</Text>

      <View style={styles.footer}>
        <View style={styles.pills}>
          <Pill label={`Prioridad ${priority.label.toLowerCase()}`} background={priority.background} color={priority.color} />
          <Pill label={status.label} background={status.background} color={status.color} />
        </View>

        {isCompleted ? null : (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              completing && styles.buttonDisabled,
            ]}
            onPress={() => onComplete(task.id)}
            disabled={completing}
            accessibilityRole="button"
            accessibilityLabel={`Completar ${task.title}`}
            accessibilityState={{ disabled: completing, busy: completing }}
          >
            {completing ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Completar</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  titleCompleted: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  date: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexShrink: 1,
    gap: spacing.xs,
  },
  pill: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    minWidth: 100,
    minHeight: 36,
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '700',
  },
});

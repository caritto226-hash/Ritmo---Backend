import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { completeTask, getTasks } from '../api/tasks';
import TaskItem from '../components/TaskItem';
import { colors, radius, spacing } from '../theme';

const SESSION_EXPIRED = 'Tu sesión expiró. Inicia sesión de nuevo.';
const BANNER_DURATION_MS = 3500;

export default function TasksScreen({ token, onLogout }) {
  // 'loading' al entrar, 'ready' con la lista cargada o 'error' si la primera carga falló.
  const [screenState, setScreenState] = useState('loading');
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [completingIds, setCompletingIds] = useState([]);
  const [banner, setBanner] = useState(null);
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);
  const bannerTimeoutRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearTimeout(bannerTimeoutRef.current);
    };
  }, []);

  function showBanner(type, text) {
    clearTimeout(bannerTimeoutRef.current);
    setBanner({ type, text });
    bannerTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setBanner(null);
      }
    }, BANNER_DURATION_MS);
  }

  // Devuelve true si el error era un 401 y ya se cerró la sesión.
  function handleUnauthorized(error) {
    if (error.status === 401) {
      onLogout(SESSION_EXPIRED);
      return true;
    }

    return false;
  }

  const loadTasks = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setScreenState('loading');
    }

    try {
      const data = await getTasks(token);

      if (!mountedRef.current) {
        return;
      }

      hasLoadedRef.current = true;
      setTasks(data);
      setScreenState('ready');
    } catch (error) {
      if (!mountedRef.current || handleUnauthorized(error)) {
        return;
      }

      // Si ya había una lista, se conserva y el error se muestra arriba; si no, se muestra la pantalla de error.
      if (hasLoadedRef.current) {
        showBanner('error', error.message);
      } else {
        setErrorMessage(error.message);
        setScreenState('error');
      }
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [token]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleComplete(id) {
    if (completingIds.includes(id)) {
      return;
    }

    setCompletingIds((current) => [...current, id]);

    try {
      await completeTask(token, id);

      if (!mountedRef.current) {
        return;
      }

      setTasks((current) => current.map((task) => (
        task.id === id ? { ...task, status: 'completada' } : task
      )));
      showBanner('success', 'Tarea completada');
    } catch (error) {
      if (!mountedRef.current || handleUnauthorized(error)) {
        return;
      }

      showBanner('error', error.message);
    } finally {
      if (mountedRef.current) {
        setCompletingIds((current) => current.filter((currentId) => currentId !== id));
      }
    }
  }

  let body;

  if (screenState === 'loading') {
    body = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>Cargando tus tareas…</Text>
      </View>
    );
  } else if (screenState === 'error') {
    body = (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>No pudimos cargar tus tareas</Text>
        <Text style={styles.message}>{errorMessage}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          onPress={() => loadTasks()}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={tasks}
        keyExtractor={(task) => String(task.id)}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            completing={completingIds.includes(item.id)}
            onComplete={handleComplete}
          />
        )}
        contentContainerStyle={[styles.list, tasks.length === 0 && styles.listEmpty]}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTasks({ isRefresh: true })}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        )}
        ListEmptyComponent={(
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Todo en orden</Text>
            <Text style={styles.message}>No tienes tareas por ahora. Desliza hacia abajo para actualizar.</Text>
          </View>
        )}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis tareas</Text>
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
          onPress={() => onLogout()}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>

      {banner ? (
        <Text
          style={[styles.banner, banner.type === 'success' ? styles.bannerSuccess : styles.bannerError]}
          accessibilityLiveRegion="polite"
        >
          {banner.text}
        </Text>
      ) : null}

      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
  },
  logoutText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  banner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.control,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    overflow: 'hidden',
  },
  bannerSuccess: {
    backgroundColor: colors.successSoft,
    color: colors.success,
  },
  bannerError: {
    backgroundColor: colors.errorSoft,
    color: colors.error,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  listEmpty: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  message: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  retryText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});

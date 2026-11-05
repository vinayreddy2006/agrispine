import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import notificationService from '../../services/notificationService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/formatters';

const getNotificationIcon = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'booking':
    case 'rental':
      return { name: 'tractor', color: '#0284C7', bg: '#E0F2FE' };
    case 'chat':
    case 'message':
      return { name: 'message-text', color: '#BE123C', bg: '#FFE4E6' };
    case 'group':
    case 'work':
      return { name: 'handshake', color: '#6D28D9', bg: '#EDE9FE' };
    case 'weather':
      return { name: 'weather-partly-cloudy', color: '#0D9488', bg: '#CCFBF1' };
    default:
      return { name: 'bell-ring', color: colors.primary, bg: '#DCFCE7' };
  }
};

const NotificationsScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Error loading notifications:', err.message);
      setError('Unable to load notifications. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.log('Error marking all notifications as read:', err.message);
    }
  };

  const handleNotificationPress = async (item) => {
    // Mark as read
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
      } catch (e) {}
    }

    // Deep navigation
    const type = (item.type || '').toLowerCase();
    if (type.includes('booking') || type.includes('rental')) {
      navigation.navigate('MyBookings');
    } else if (type.includes('chat') || type.includes('message')) {
      navigation.navigate('Conversations');
    } else if (type.includes('group') || type.includes('work')) {
      navigation.navigate('Groups');
    } else if (type.includes('crop')) {
      navigation.navigate('Crops');
    } else if (type.includes('weather')) {
      navigation.navigate('Weather');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderItem = ({ item }) => {
    const isUnread = !item.isRead;
    const iconConfig = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleNotificationPress(item)}
      >
        <Card
          style={[
            styles.notificationCard,
            isUnread && styles.notificationCardUnread,
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: iconConfig.bg }]}>
            <MaterialCommunityIcons
              name={iconConfig.name}
              size={22}
              color={iconConfig.color}
            />
          </View>

          <View style={styles.textCol}>
            <View style={styles.cardHeader}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title || 'AgriSpine Notification'}
              </Text>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={styles.message} numberOfLines={3}>
              {item.message || item.text || item.description}
            </Text>
          </View>

          {isUnread && <View style={styles.unreadIndicator} />}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('nav.notifications', 'Notifications')}
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread ${unreadCount === 1 ? 'alert' : 'alerts'}`
            : 'All caught up'
        }
        onBack={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Mark Read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {loading ? (
        <View style={{ padding: 16 }}>
          <ListSkeleton count={4} />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={loadNotifications} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="bell-check-outline"
              title="No Notifications"
              description="You have no notifications or booking alerts at this moment."
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  markAllBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  notificationCardUnread: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textCol: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 8,
  },
  message: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    marginLeft: 6,
  },
});

export default NotificationsScreen;


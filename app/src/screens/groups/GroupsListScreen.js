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
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import groupService from '../../services/groupService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency } from '../../utils/formatters';

const GroupsListScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [groups, setGroups] = useState([]);
  const [personalStats, setPersonalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadGroupsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [gRes, pRes] = await Promise.allSettled([
        groupService.getUserGroups(),
        groupService.getPersonalDashboard(),
      ]);

      if (gRes.status === 'fulfilled') {
        setGroups(Array.isArray(gRes.value) ? gRes.value : []);
      }
      if (pRes.status === 'fulfilled') {
        setPersonalStats(pRes.value);
      }
    } catch (err) {
      console.log('Error loading groups:', err.message);
      setError('Unable to load workgroups. Please check your network.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroupsData();
  }, [loadGroupsData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupsData();
    setRefreshing(false);
  };

  const renderGroupCard = ({ item }) => {
    const memberCount = Array.isArray(item.members) ? item.members.length : 1;
    const isOwnerOrAdmin = item.isAdmin || item.role === 'admin' || item.createdBy;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('GroupDetails', { groupId: item._id })}
      >
        <Card style={styles.groupCard}>
          <View style={styles.cardHeader}>
            <View style={styles.groupIconCircle}>
              <MaterialCommunityIcons name="account-group" size={26} color="#6D28D9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.groupVillage}>
                {item.village || 'Telangana'} • {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
              </Text>
            </View>
            <Badge status={isOwnerOrAdmin ? 'admin' : 'member'} />
          </View>

          {item.description ? (
            <Text style={styles.groupDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.cardFooter}>
            <View style={styles.wageCol}>
              <Text style={styles.wageLabel}>Standard Labor Rate</Text>
              <Text style={styles.wageVal}>
                {formatCurrency(item.hourlyRate || 350)} /day
              </Text>
            </View>
            <View style={styles.viewRow}>
              <Text style={styles.viewText}>Work History & Log</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={colors.primary} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('dashboard.work_groups', 'Work Groups')}
        subtitle="Cooperative Labor & Shared Work"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.createGroupBtn}
            onPress={() => navigation.navigate('CreateGroup')}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.createGroupBtnText}>New Group</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        renderItem={renderGroupCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          personalStats && (
            <Card style={styles.statsBanner}>
              <Text style={styles.statsBannerTitle}>Personal Labor Balance</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Days Contributed</Text>
                  <Text style={styles.statNum}>{personalStats.totalHoursContributed || 0}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Net Settlement</Text>
                  <Text
                    style={[
                      styles.statNum,
                      {
                        color:
                          (personalStats.netBalance || 0) >= 0
                            ? colors.primary
                            : colors.error,
                      },
                    ]}
                  >
                    {formatCurrency(personalStats.netBalance || 0)}
                  </Text>
                </View>
              </View>
            </Card>
          )
        }
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="account-group-outline"
              title="No Workgroups Joined"
              description="Form cooperative labor groups with neighboring farmers to coordinate transplanting, weeding, and harvesting."
              actionTitle="Create First Workgroup"
              onAction={() => navigation.navigate('CreateGroup')}
            />
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createGroupBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsBanner: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  statsBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6D28D9',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 2,
  },
  groupCard: {
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  groupIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  groupVillage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  groupDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  wageCol: {},
  wageLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  wageVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 1,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default GroupsListScreen;


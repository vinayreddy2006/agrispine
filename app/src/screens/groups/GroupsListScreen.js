import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import NoSearchResults from '../../components/NoSearchResults';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import groupService from '../../services/groupService';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency } from '../../utils/formatters';

const GroupsListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

  const [groups, setGroups] = useState([]);
  const [personalStats, setPersonalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter & Navigation states
  const [activeSection, setActiveSection] = useState('my_groups'); // 'my_groups' | 'admin_dashboard'
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'owner' | 'admin' | 'member'
  const [showStats, setShowStats] = useState(true);

  // Helper: check if user is admin or owner of a group
  const isUserAdminOfGroup = useCallback((group) => {
    if (!currentUserId || !group) return false;
    const isOwner = String(group.createdBy) === String(currentUserId);
    const isAdmin = Array.isArray(group.admins) && group.admins.some((admin) => {
      const adminId = admin?._id ? String(admin._id) : String(admin);
      return adminId === String(currentUserId);
    });
    return isOwner || isAdmin;
  }, [currentUserId]);

  // Helper: get user's specific role in a group
  const getUserRoleInGroup = useCallback((group) => {
    if (!currentUserId || !group) return 'Member';
    if (String(group.createdBy) === String(currentUserId)) return 'Owner';
    const isAdmin = Array.isArray(group.admins) && group.admins.some((admin) => {
      const adminId = admin?._id ? String(admin._id) : String(admin);
      return adminId === String(currentUserId);
    });
    if (isAdmin) return 'Admin';
    return 'Member';
  }, [currentUserId]);

  // Has admin access in at least one group
  const hasAdminAccess = useMemo(() => {
    return groups.some((g) => isUserAdminOfGroup(g));
  }, [groups, isUserAdminOfGroup]);

  // Load groups and personal stats
  const loadGroupsData = useCallback(async () => {
    try {
      setError(null);
      const [gRes, pRes] = await Promise.allSettled([
        groupService.getUserGroups(),
        groupService.getPersonalDashboard(),
      ]);

      if (gRes.status === 'fulfilled') {
        const raw = gRes.value;
        const fetchedGroups = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.groups)
          ? raw.groups
          : [];
        setGroups(fetchedGroups);
      } else {
        throw new Error('Unable to fetch workgroups');
      }

      if (pRes.status === 'fulfilled') {
        const rawP = pRes.value;
        const fetchedStats = rawP?.stats || rawP?.data?.stats || rawP?.data || rawP;
        setPersonalStats(fetchedStats);
      }
    } catch (err) {
      console.log('Error loading groups:', err.message);
      setError('Unable to load workgroups. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload data every time screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadGroupsData();
    }, [loadGroupsData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupsData();
    setRefreshing(false);
  };

  // Filtered groups based on active section, search, and role filter
  const displayedGroups = useMemo(() => {
    let list = activeSection === 'admin_dashboard'
      ? groups.filter((g) => isUserAdminOfGroup(g))
      : groups;

    // Role filter
    if (activeSection === 'my_groups' && roleFilter !== 'all') {
      list = list.filter((g) => {
        const role = getUserRoleInGroup(g).toLowerCase();
        return role === roleFilter.toLowerCase();
      });
    }

    // Search query filter (name or village)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((g) => {
        const name = (g.name || '').toLowerCase();
        const village = (g.village || '').toLowerCase();
        return name.includes(q) || village.includes(q);
      });
    }

    return list;
  }, [groups, activeSection, roleFilter, searchQuery, isUserAdminOfGroup, getUserRoleInGroup]);

  const renderGroupCard = ({ item }) => {
    const memberCount = Array.isArray(item.members)
      ? item.members.filter((m) => m.status !== 'removed').length
      : 1;
    const role = getUserRoleInGroup(item);
    const isOwner = role === 'Owner';
    const isAdmin = role === 'Admin';
    const isClosed = item.status === 'closed';

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => navigation.navigate('GroupDetails', { groupId: item._id })}
      >
        <Card style={[styles.groupCard, isClosed && styles.groupCardClosed]}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.groupIconCircle,
                isOwner
                  ? { backgroundColor: '#FEF3C7' }
                  : isAdmin
                  ? { backgroundColor: '#EDE9FE' }
                  : { backgroundColor: '#D1FAE5' },
              ]}
            >
              <MaterialCommunityIcons
                name="account-group"
                size={26}
                color={isOwner ? '#D97706' : isAdmin ? '#7C3AED' : '#059669'}
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.groupName} numberOfLines={1}>
                  {item.name}
                </Text>
                {isClosed && (
                  <View style={styles.closedTag}>
                    <Text style={styles.closedTagText}>Closed</Text>
                  </View>
                )}
              </View>
              <Text style={styles.groupVillage}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.textSecondary} />
                {' '}{item.village || 'Telangana'} • {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
              </Text>
            </View>

            {/* Role Badge */}
            <View
              style={[
                styles.roleBadge,
                isOwner
                  ? styles.roleBadgeOwner
                  : isAdmin
                  ? styles.roleBadgeAdmin
                  : styles.roleBadgeMember,
              ]}
            >
              <MaterialCommunityIcons
                name={isOwner ? 'crown' : isAdmin ? 'shield-check' : 'account-check'}
                size={13}
                color={isOwner ? '#B45309' : isAdmin ? '#6D28D9' : '#047857'}
              />
              <Text
                style={[
                  styles.roleBadgeText,
                  isOwner
                    ? styles.roleBadgeTextOwner
                    : isAdmin
                    ? styles.roleBadgeTextAdmin
                    : styles.roleBadgeTextMember,
                ]}
              >
                {role}
              </Text>
            </View>
          </View>

          {item.description ? (
            <Text style={styles.groupDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.cardFooter}>
            <View style={styles.wageCol}>
              <Text style={styles.wageLabel}>Cooperative Labor Pool</Text>
              <Text style={styles.wageVal}>
                Active Sharing
              </Text>
            </View>

            <View style={styles.viewRow}>
              <Text style={styles.viewText}>
                {activeSection === 'admin_dashboard' ? t('groups_ui.manage_workgroup', 'Manage Workgroup') : t('groups_ui.open_workgroup', 'Open Workgroup')}
              </Text>
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
        title={t('groups_ui.title', 'Workgroups')}
        subtitle={t('groups_ui.cooperative_labor', 'Cooperative Labor & Shared Work')}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.createGroupBtn}
            onPress={() => navigation.navigate('CreateGroup')}
            accessibilityLabel="Create New Workgroup"
          >
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.createGroupBtnText}>{t('groups_ui.new_group', 'New Group')}</Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={loadGroupsData} />
        </View>
      ) : (
        <FlatList
          data={displayedGroups}
          keyExtractor={(item) => item._id}
          renderItem={renderGroupCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              {/* Personal Earnings & Contribution Summary Card */}
              {personalStats && (
                <Card style={styles.statsCard}>
                  <TouchableOpacity
                    style={styles.statsCardHeader}
                    activeOpacity={0.7}
                    onPress={() => setShowStats(!showStats)}
                  >
                    <View style={styles.statsHeaderLeft}>
                      <View style={styles.statsIconBadge}>
                        <MaterialCommunityIcons name="handshake" size={20} color="#047857" />
                      </View>
                      <View>
                        <Text style={styles.statsTitle}>{t('groups_ui.personal_labor_summary', 'Personal Labor Summary')}</Text>
                        <Text style={styles.statsSubtitle}>{t('groups_ui.labor_summary_sub', 'Your shared work contributions across groups')}</Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons
                      name={showStats ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {showStats && (
                    <View style={styles.statsGrid}>
                      <View style={styles.statBox}>
                        <Text style={styles.statBoxLabel}>{t('groups_ui.total_earned', 'Total Earned')}</Text>
                        <Text style={[styles.statBoxValue, { color: '#059669' }]}>
                          {formatCurrency(personalStats.totalEarned || 0)}
                        </Text>
                      </View>

                      <View style={styles.statBox}>
                        <Text style={styles.statBoxLabel}>{t('groups_ui.settled', 'Settled')}</Text>
                        <Text style={[styles.statBoxValue, { color: '#2563EB' }]}>
                          {formatCurrency(personalStats.settledEarned || 0)}
                        </Text>
                      </View>

                      <View style={styles.statBox}>
                        <Text style={styles.statBoxLabel}>{t('groups_ui.pending', 'Pending')}</Text>
                        <Text style={[styles.statBoxValue, { color: '#D97706' }]}>
                          {formatCurrency(personalStats.pendingEarned || 0)}
                        </Text>
                      </View>

                      <View style={styles.statBox}>
                        <Text style={styles.statBoxLabel}>{t('groups_ui.days_worked', 'Days Worked')}</Text>
                        <Text style={styles.statBoxValue}>
                          {personalStats.daysWorked || 0}
                        </Text>
                      </View>
                    </View>
                  )}
                </Card>
              )}

              {/* Section Tabs: My Workgroups vs Admin Dashboard */}
              <View style={styles.sectionTabs}>
                <TouchableOpacity
                  style={[
                    styles.sectionTabBtn,
                    activeSection === 'my_groups' && styles.sectionTabBtnActive,
                  ]}
                  onPress={() => setActiveSection('my_groups')}
                >
                  <MaterialCommunityIcons
                    name="account-group"
                    size={18}
                    color={activeSection === 'my_groups' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.sectionTabBtnText,
                      activeSection === 'my_groups' && styles.sectionTabBtnTextActive,
                    ]}
                  >
                    {t('groups_ui.my_groups', 'My Workgroups')} ({groups.length})
                  </Text>
                </TouchableOpacity>

                {hasAdminAccess && (
                  <TouchableOpacity
                    style={[
                      styles.sectionTabBtn,
                      activeSection === 'admin_dashboard' && styles.sectionTabBtnActive,
                    ]}
                    onPress={() => setActiveSection('admin_dashboard')}
                  >
                    <MaterialCommunityIcons
                      name="shield-account"
                      size={18}
                      color={activeSection === 'admin_dashboard' ? '#7C3AED' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.sectionTabBtnText,
                        activeSection === 'admin_dashboard' && { color: '#7C3AED', fontWeight: '800' },
                      ]}
                    >
                      Admin Dashboard ({groups.filter((g) => isUserAdminOfGroup(g)).length})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Search Bar */}
              <View style={styles.searchBar}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search workgroups by name or village..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Role Filter Chips (in My Workgroups section) */}
              {activeSection === 'my_groups' && groups.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {['all', 'owner', 'admin', 'member'].map((r) => {
                    const isSelected = roleFilter === r;
                    const label =
                      r === 'all'
                        ? 'All Roles'
                        : r.charAt(0).toUpperCase() + r.slice(1);
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[styles.filterChip, isSelected && styles.filterChipActive]}
                        onPress={() => setRoleFilter(r)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isSelected && styles.filterChipTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          }
          ListEmptyComponent={
            groups.length === 0 ? (
              <EmptyState
                icon="account-group-outline"
                title="No Workgroups Joined"
                description="Form cooperative labor groups with neighboring farmers to coordinate transplanting, weeding, and harvesting."
                actionTitle="Create First Workgroup"
                onAction={() => navigation.navigate('CreateGroup')}
              />
            ) : (
              <NoSearchResults
                query={searchQuery || roleFilter}
                onReset={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                }}
              />
            )
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
  loadingContainer: {
    padding: 16,
    gap: 12,
  },
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
  headerContainer: {
    marginBottom: 12,
  },
  statsCard: {
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statsIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  statsSubtitle: {
    fontSize: 11,
    color: '#047857',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
    gap: 8,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
  },
  statBoxLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
    gap: 6,
  },
  sectionTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sectionTabBtnActive: {
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTabBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sectionTabBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  groupCard: {
    padding: 16,
    marginBottom: 12,
  },
  groupCardClosed: {
    opacity: 0.75,
    backgroundColor: '#F8FAFC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  groupIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closedTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  closedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  groupVillage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeOwner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  roleBadgeAdmin: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  roleBadgeMember: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  roleBadgeTextOwner: {
    color: '#B45309',
  },
  roleBadgeTextAdmin: {
    color: '#6D28D9',
  },
  roleBadgeTextMember: {
    color: '#047857',
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
    marginTop: 4,
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

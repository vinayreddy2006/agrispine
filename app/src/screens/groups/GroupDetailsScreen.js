import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import groupService from '../../services/groupService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId } = route.params || {};
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [workRecords, setWorkRecords] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState('work'); // 'work', 'members', 'settlements'

  // Log Work Modal
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [workForm, setWorkForm] = useState({
    workerName: '',
    activity: 'Transplanting',
    hours: '8',
    notes: '',
  });
  const [savingWork, setSavingWork] = useState(false);

  const loadGroupDetails = useCallback(async () => {
    if (!groupId) {
      setError('Group reference missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [gRes, wRes, sRes] = await Promise.allSettled([
        groupService.getGroupById(groupId),
        groupService.getWorkRecords(groupId),
        groupService.getSettlements(groupId),
      ]);

      if (gRes.status === 'fulfilled') {
        const g = gRes.value.group || gRes.value;
        setGroup(g);
      } else {
        throw new Error('Group details could not be retrieved');
      }

      if (wRes.status === 'fulfilled' && Array.isArray(wRes.value)) {
        setWorkRecords(wRes.value);
      }

      if (sRes.status === 'fulfilled' && Array.isArray(sRes.value)) {
        setSettlements(sRes.value);
      }
    } catch (err) {
      console.log('Error loading group details:', err.message);
      setError(err.message || 'Unable to load group information');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroupDetails();
  }, [loadGroupDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupDetails();
    setRefreshing(false);
  };

  // Submit Work Record
  const handleSaveWork = async () => {
    if (!workForm.workerName.trim()) {
      Alert.alert('Required', 'Please enter member name who performed the work.');
      return;
    }

    try {
      setSavingWork(true);
      const payload = {
        workerName: workForm.workerName.trim(),
        activity: workForm.activity,
        hours: parseFloat(workForm.hours) || 8,
        notes: workForm.notes.trim(),
        date: new Date().toISOString(),
      };

      await groupService.createWorkRecord(groupId, payload);
      setIsWorkModalOpen(false);
      setWorkForm({ workerName: '', activity: 'Transplanting', hours: '8', notes: '' });
      Alert.alert('Work Logged! 🌾', 'Labor record added to the group ledger.');
      loadGroupDetails();
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to record work.');
    } finally {
      setSavingWork(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header title="Workgroup Details" onBack={() => navigation.goBack()} />
        <View style={{ padding: 16 }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !group) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header title="Workgroup Details" onBack={() => navigation.goBack()} />
        <View style={{ padding: 16 }}>
          <ErrorState message={error || 'Group not found'} onRetry={loadGroupDetails} />
        </View>
      </SafeAreaView>
    );
  }

  const members = group.members || [];
  const isLeader = group.createdBy === (user?._id || user?.id) || group.isAdmin;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={group.name}
        subtitle={`${group.village || 'Telangana'} • ${members.length} Members`}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.logWorkHeaderBtn}
            onPress={() => setIsWorkModalOpen(true)}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.logWorkHeaderText}>Log Labor</Text>
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('work')}
          style={[styles.tabBtn, activeTab === 'work' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'work' && styles.tabBtnTextActive]}>
            Work Log ({workRecords.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('members')}
          style={[styles.tabBtn, activeTab === 'members' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'members' && styles.tabBtnTextActive]}>
            Members ({members.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('settlements')}
          style={[styles.tabBtn, activeTab === 'settlements' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'settlements' && styles.tabBtnTextActive]}>
            Settlements
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {activeTab === 'work' && (
          <>
            <View style={styles.summaryBar}>
              <Text style={styles.summaryBarLabel}>Standard Group Daily Wage</Text>
              <Text style={styles.summaryBarVal}>{formatCurrency(group.hourlyRate || 350)} /day</Text>
            </View>

            {workRecords.length === 0 ? (
              <Card style={styles.emptyCard}>
                <MaterialCommunityIcons name="clipboard-text-clock-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Work Logged Yet</Text>
                <Text style={styles.emptySub}>
                  Record cooperative labor sessions (e.g. transplanting, harvesting) to balance shared work.
                </Text>
                <Button
                  title="Log First Work Record"
                  onPress={() => setIsWorkModalOpen(true)}
                  size="small"
                  style={{ marginTop: 12 }}
                />
              </Card>
            ) : (
              workRecords.map((record) => (
                <Card key={record._id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordLeft}>
                      <View style={styles.recordIconBox}>
                        <MaterialCommunityIcons name="account-hard-hat" size={20} color="#6D28D9" />
                      </View>
                      <View>
                        <Text style={styles.workerName}>{record.workerName || 'Member'}</Text>
                        <Text style={styles.recordActivity}>
                          {record.activity || 'Field Labor'} • {record.hours || 8} Hours
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.recordDate}>{formatDate(record.date || record.createdAt)}</Text>
                  </View>

                  {record.notes ? (
                    <Text style={styles.recordNotes}>{record.notes}</Text>
                  ) : null}
                </Card>
              ))
            )}
          </>
        )}

        {activeTab === 'members' && (
          <View style={styles.membersContainer}>
            {members.map((member, idx) => {
              const mName = member.name || member.userId?.name || 'Farmer Member';
              const mVillage = member.village || member.userId?.village || 'Telangana';
              const mRole = member.role || (idx === 0 ? 'admin' : 'member');

              return (
                <Card key={member._id || idx} style={styles.memberCard}>
                  <Avatar
                    source={member.profileImage || member.userId?.profileImage}
                    name={mName}
                    size={40}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{mName}</Text>
                    <Text style={styles.memberVillage}>{mVillage}</Text>
                  </View>
                  <Badge status={mRole} size="small" />
                </Card>
              );
            })}
          </View>
        )}

        {activeTab === 'settlements' && (
          <View style={styles.settlementsContainer}>
            <Card style={styles.settlementBanner}>
              <Text style={styles.settlementBannerTitle}>Cooperative Balance Ledger</Text>
              <Text style={styles.settlementBannerSub}>
                Hours are calculated against the group rate to show net contributions.
              </Text>
            </Card>

            {settlements.length === 0 ? (
              <Card style={styles.emptyCard}>
                <MaterialCommunityIcons name="scale-balance" size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>All Labor Balanced</Text>
                <Text style={styles.emptySub}>
                  No outstanding balances. Work contributions across members are balanced.
                </Text>
              </Card>
            ) : (
              settlements.map((s, idx) => (
                <Card key={s._id || idx} style={styles.settlementItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settlementFarmer}>{s.farmerName || 'Member'}</Text>
                    <Text style={styles.settlementHours}>{s.hoursBalance || 0} Hours logged</Text>
                  </View>
                  <Text
                    style={[
                      styles.settlementAmount,
                      { color: (s.amount || 0) >= 0 ? colors.primary : colors.error },
                    ]}
                  >
                    {formatCurrency(s.amount || 0)}
                  </Text>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Log Work Modal */}
      <Modal visible={isWorkModalOpen} animationType="slide" transparent onRequestClose={() => setIsWorkModalOpen(false)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Work Record 🌾</Text>
              <TouchableOpacity onPress={() => setIsWorkModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Worker Name"
              placeholder="e.g. Ramesh, Srinivas, Ravi"
              value={workForm.workerName}
              onChangeText={(v) => setWorkForm({ ...workForm, workerName: v })}
              required
            />

            <Input
              label="Agricultural Activity"
              placeholder="e.g. Paddy Transplanting, Weeding, Spraying"
              value={workForm.activity}
              onChangeText={(v) => setWorkForm({ ...workForm, activity: v })}
              required
            />

            <Input
              label="Hours Worked"
              placeholder="8"
              value={workForm.hours}
              keyboardType="numeric"
              onChangeText={(v) => setWorkForm({ ...workForm, hours: v })}
              required
            />

            <Input
              label="Notes / Field Plot"
              placeholder="e.g. North field near the well"
              value={workForm.notes}
              onChangeText={(v) => setWorkForm({ ...workForm, notes: v })}
            />

            <Button
              title="Save Work Record"
              onPress={handleSaveWork}
              loading={savingWork}
              disabled={savingWork}
              size="large"
              style={{ marginTop: 14 }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logWorkHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  logWorkHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  summaryBarLabel: {
    fontSize: 12.5,
    color: '#6D28D9',
    fontWeight: '700',
  },
  summaryBarVal: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#6D28D9',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  recordCard: {
    padding: 14,
    marginBottom: 10,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recordIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  recordActivity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  recordDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  recordNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  membersContainer: {
    gap: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6D28D9',
  },
  memberName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  memberVillage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  settlementsContainer: {
    gap: 10,
  },
  settlementBanner: {
    padding: 14,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    marginBottom: 4,
  },
  settlementBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  settlementBannerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  settlementFarmer: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  settlementHours: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});

export default GroupDetailsScreen;


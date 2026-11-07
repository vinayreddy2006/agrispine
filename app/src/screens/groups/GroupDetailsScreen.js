import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import groupService from '../../services/groupService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COMMON_ACTIVITIES = [
  'Transplanting',
  'Sowing',
  'Weeding',
  'Harvesting',
  'Spraying',
  'Tilling',
  'Plowing',
  'Threshing',
];

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId } = route.params || {};
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

  const [group, setGroup] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [records, setRecords] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Role & View Mode: 'member' | 'admin'
  const [viewMode, setViewMode] = useState('member');

  // Member View Sub-Tab: 'overview' | 'work' | 'settlements' | 'members'
  const [memberTab, setMemberTab] = useState('overview');

  // Admin View Sub-Tab: 'overview' | 'members' | 'work' | 'settlements' | 'reports'
  const [adminTab, setAdminTab] = useState('overview');

  // --- Modals State ---
  // Record Work Modal
  const [isRecordWorkModalOpen, setIsRecordWorkModalOpen] = useState(false);
  const [workForm, setWorkForm] = useState({
    date: new Date().toISOString().split('T')[0],
    isInternalFarm: false,
    internalMemberId: '',
    landOwnerName: '',
    crop: '',
    activityType: 'Transplanting',
    acres: '',
    ratePerAcre: '',
    additionalCharges: '0',
    attendance: [], // Array of member _id strings
  });
  const [savingWork, setSavingWork] = useState(false);

  // Add Member Modal
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ name: '', phone: '', village: '' });
  const [addingMember, setAddingMember] = useState(false);

  // Member Action Modal (Promote / Demote / Remove / Transfer)
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMemberActionModalOpen, setIsMemberActionModalOpen] = useState(false);

  // Work Record Details Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isRecordDetailsModalOpen, setIsRecordDetailsModalOpen] = useState(false);

  // Settlement Processing Modal
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementViewTab, setSettlementViewTab] = useState('process'); // 'process' | 'history'
  const [selectedSettlementRecords, setSelectedSettlementRecords] = useState([]);
  const [selectedSettlementMembers, setSelectedSettlementMembers] = useState({});
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [settlementRemarks, setSettlementRemarks] = useState('');
  const [processingSettlement, setProcessingSettlement] = useState(false);

  // Fetch all group details, analytics, records, settlements
  const fetchGroupData = useCallback(async () => {
    if (!groupId) {
      setError('Group reference missing');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [gRes, aRes, wRes, sRes] = await Promise.allSettled([
        groupService.getGroupById(groupId),
        groupService.getAnalytics(groupId),
        groupService.getWorkRecords(groupId),
        groupService.getSettlements(groupId),
      ]);

      if (gRes.status === 'fulfilled' && gRes.value) {
        const fetchedGroup = gRes.value.group || gRes.value;
        setGroup(fetchedGroup);
      } else {
        throw new Error('Group details could not be retrieved');
      }

      if (aRes.status === 'fulfilled') {
        setAnalytics(aRes.value.analytics || aRes.value || null);
      }

      if (wRes.status === 'fulfilled') {
        const rawW = wRes.value;
        const fetchedRecords = Array.isArray(rawW)
          ? rawW
          : Array.isArray(rawW?.records)
          ? rawW.records
          : [];
        setRecords(fetchedRecords);
      }

      if (sRes.status === 'fulfilled') {
        const rawS = sRes.value;
        const fetchedSettlements = Array.isArray(rawS)
          ? rawS
          : Array.isArray(rawS?.settlements)
          ? rawS.settlements
          : [];
        setSettlements(fetchedSettlements);
      }
    } catch (err) {
      console.log('Error loading group data:', err.message);
      setError(err.message || 'Unable to load group information');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroupData();
    setRefreshing(false);
  };

  // Determine user permissions in this group
  const isOwner = useMemo(() => {
    if (!group || !currentUserId) return false;
    return String(group.createdBy) === String(currentUserId);
  }, [group, currentUserId]);

  const isAdmin = useMemo(() => {
    if (!group || !currentUserId) return false;
    if (isOwner) return true;
    return Array.isArray(group.admins) && group.admins.some((admin) => {
      const adminId = admin?._id ? String(admin._id) : String(admin);
      return adminId === String(currentUserId);
    });
  }, [group, currentUserId, isOwner]);

  const activeMembers = useMemo(() => {
    if (!group || !Array.isArray(group.members)) return [];
    return group.members.filter((m) => m.status !== 'removed');
  }, [group]);

  // Current user's member object in this group
  const currentUserMember = useMemo(() => {
    if (!group || !currentUserId) return null;
    return group.members.find((m) => {
      if (!m.user) return false;
      const uid = m.user?._id ? String(m.user._id) : String(m.user);
      return uid === String(currentUserId);
    }) || null;
  }, [group, currentUserId]);

  // Personal statistics within this group
  const personalGroupStats = useMemo(() => {
    if (!analytics || !currentUserMember) {
      return { daysWorked: 0, earned: 0, pending: 0, owed: 0, net: 0 };
    }
    const memberId = String(currentUserMember._id);
    const ms = analytics.memberStats?.[memberId] || { daysWorked: 0, earned: 0, pending: 0, owed: 0 };
    const earned = ms.earned || 0;
    const owed = ms.owed || 0;
    return {
      daysWorked: ms.daysWorked || 0,
      earned,
      pending: ms.pending || 0,
      owed,
      net: earned - owed,
    };
  }, [analytics, currentUserMember]);

  // --- RECORD WORK HANDLERS ---
  const handleOpenRecordWork = () => {
    // Reset form and default attendance to all active members
    setWorkForm({
      date: new Date().toISOString().split('T')[0],
      isInternalFarm: false,
      internalMemberId: '',
      landOwnerName: '',
      crop: '',
      activityType: 'Transplanting',
      acres: '',
      ratePerAcre: '',
      additionalCharges: '0',
      attendance: activeMembers.map((m) => m._id),
    });
    setIsRecordWorkModalOpen(true);
  };

  const toggleAttendanceMember = (memberId) => {
    setWorkForm((prev) => {
      const isSelected = prev.attendance.includes(memberId);
      return {
        ...prev,
        attendance: isSelected
          ? prev.attendance.filter((id) => id !== memberId)
          : [...prev.attendance, memberId],
      };
    });
  };

  const handleSaveWorkRecord = async () => {
    if (!workForm.crop.trim()) {
      Alert.alert('Required', 'Please enter crop name (e.g. Cotton, Paddy).');
      return;
    }
    if (!workForm.acres || parseFloat(workForm.acres) <= 0) {
      Alert.alert('Required', 'Please enter valid acres worked.');
      return;
    }
    if (!workForm.ratePerAcre || parseFloat(workForm.ratePerAcre) <= 0) {
      Alert.alert('Required', 'Please enter labor rate per acre (₹).');
      return;
    }
    if (workForm.isInternalFarm && !workForm.internalMemberId) {
      Alert.alert('Required', "Please select the group member who owns this farm.");
      return;
    }
    if (!workForm.isInternalFarm && !workForm.landOwnerName.trim()) {
      Alert.alert('Required', 'Please enter external land owner name.');
      return;
    }
    if (workForm.attendance.length === 0) {
      Alert.alert('Required', 'Please select at least one attending member who worked.');
      return;
    }

    try {
      setSavingWork(true);
      const payload = {
        date: workForm.date,
        isInternalFarm: workForm.isInternalFarm,
        internalMemberId: workForm.isInternalFarm ? workForm.internalMemberId : undefined,
        landOwnerName: workForm.isInternalFarm
          ? (activeMembers.find((m) => m._id === workForm.internalMemberId)?.name || 'Member Farm')
          : workForm.landOwnerName.trim(),
        crop: workForm.crop.trim(),
        activityType: workForm.activityType.trim(),
        acres: parseFloat(workForm.acres),
        ratePerAcre: parseFloat(workForm.ratePerAcre),
        additionalCharges: parseFloat(workForm.additionalCharges) || 0,
        attendance: workForm.attendance,
      };

      await groupService.createWorkRecord(groupId, payload);
      setIsRecordWorkModalOpen(false);
      Alert.alert('Success! 🌾', 'Daily work session logged into cooperative ledger.');
      fetchGroupData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to record work.');
    } finally {
      setSavingWork(false);
    }
  };

  // --- MEMBER MANAGEMENT HANDLERS ---
  const handleAddMemberSubmit = async () => {
    if (!newMemberForm.name.trim()) {
      Alert.alert('Required', 'Member name is required.');
      return;
    }
    try {
      setAddingMember(true);
      await groupService.addMember(groupId, {
        name: newMemberForm.name.trim(),
        phone: newMemberForm.phone.trim(),
        village: newMemberForm.village.trim(),
      });
      setIsAddMemberModalOpen(false);
      setNewMemberForm({ name: '', phone: '', village: '' });
      Alert.alert('Member Added 🤝', `${newMemberForm.name} is now registered in ${group.name}.`);
      fetchGroupData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add member.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleUpdateRole = async (member, newRole) => {
    setIsMemberActionModalOpen(false);
    try {
      await groupService.updateMemberRole(groupId, member._id, newRole);
      Alert.alert('Role Updated', `${member.name}'s role changed to ${newRole}.`);
      fetchGroupData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update role.');
    }
  };

  const handleRemoveMember = async (member) => {
    setIsMemberActionModalOpen(false);
    Alert.alert(
      'Remove Member?',
      `Remove ${member.name} from the workgroup? Their past work history will remain preserved in the ledger.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.removeMember(groupId, member._id);
              Alert.alert('Removed', `${member.name} has been removed.`);
              fetchGroupData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to remove member.');
            }
          },
        },
      ]
    );
  };

  const handleTransferOwnership = async (member) => {
    setIsMemberActionModalOpen(false);
    if (!member.user) {
      Alert.alert('Error', 'Cannot transfer ownership to an offline member. User must be registered on AgriSpine.');
      return;
    }
    Alert.alert(
      'Transfer Group Ownership?',
      `Transfer full ownership of "${group.name}" to ${member.name}? You will step down to Administrator.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: async () => {
            try {
              const newOwnerId = member.user?._id || member.user;
              await groupService.transferOwnership(groupId, newOwnerId);
              Alert.alert('Ownership Transferred', `Ownership transferred to ${member.name}.`);
              fetchGroupData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to transfer ownership.');
            }
          },
        },
      ]
    );
  };

  // --- CLOSE / DELETE GROUP HANDLERS ---
  const handleCloseGroup = () => {
    Alert.alert(
      'Close Workgroup?',
      'Closing the group freezes all labor logging and settlements. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Group',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.closeGroup(groupId);
              Alert.alert('Closed', 'Workgroup has been closed.');
              fetchGroupData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to close group.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group Permanently?',
      'This will wipe all work records, attendance, and member data permanently. This CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.deleteGroup(groupId);
              Alert.alert('Deleted', 'Workgroup has been permanently deleted.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete group.');
            }
          },
        },
      ]
    );
  };

  // --- SETTLEMENT MANAGEMENT HANDLERS ---
  const pendingRecords = useMemo(() => {
    return records.filter((r) => r.paymentStatus !== 'SETTLED');
  }, [records]);

  // Calculate settlement preview for pending records
  const settlementPreview = useMemo(() => {
    let memberEarned = {};
    let memberOwed = {};

    const activeRecs = pendingRecords.filter((r) => selectedSettlementRecords.includes(r._id));
    activeRecs.forEach((r) => {
      const settledIds = (r.settledMembers || []).map(String);

      if (r.isInternalFarm && r.internalMemberId) {
        let ownerOwedRec = 0;
        r.attendance.forEach((mId) => {
          const mStr = String(mId);
          if (!settledIds.includes(mStr) && mStr !== String(r.internalMemberId)) {
            ownerOwedRec += r.wagePerPerson;
          }
        });
        if (ownerOwedRec > 0) {
          const intStr = String(r.internalMemberId);
          memberOwed[intStr] = (memberOwed[intStr] || 0) + ownerOwedRec;
        }
      }

      r.attendance.forEach((mId) => {
        const mStr = String(mId);
        if (!settledIds.includes(mStr)) {
          memberEarned[mStr] = (memberEarned[mStr] || 0) + r.wagePerPerson;
        }
      });
    });

    let netBalances = {};
    const allIds = [...new Set([...Object.keys(memberEarned), ...Object.keys(memberOwed)])];
    allIds.forEach((id) => {
      const earned = memberEarned[id] || 0;
      const owed = memberOwed[id] || 0;
      netBalances[id] = { earned, owed, net: earned - owed };
    });

    return { netBalances, activeRecs };
  }, [pendingRecords, selectedSettlementRecords]);

  const handleOpenSettlements = () => {
    setSelectedSettlementRecords(pendingRecords.map((r) => r._id));
    const initMembers = {};
    activeMembers.forEach((m) => {
      initMembers[String(m._id)] = true;
    });
    setSelectedSettlementMembers(initMembers);
    setIsSettlementModalOpen(true);
  };

  const handleProcessSettlementSubmit = async () => {
    if (selectedSettlementRecords.length === 0) {
      Alert.alert('Warning', 'Please select at least one work record to settle.');
      return;
    }

    const activeDistributions = Object.keys(settlementPreview.netBalances)
      .filter((mId) => selectedSettlementMembers[mId])
      .map((mId) => ({
        memberId: mId,
        amountPaid: settlementPreview.netBalances[mId].net,
      }));

    if (activeDistributions.length === 0) {
      Alert.alert('Warning', 'Please select at least one member to settle.');
      return;
    }

    const totalVolume = activeDistributions.reduce(
      (acc, curr) => acc + Math.abs(curr.amountPaid),
      0
    );

    try {
      setProcessingSettlement(true);
      const payload = {
        settlementType:
          activeDistributions.length === Object.keys(settlementPreview.netBalances).length
            ? 'GROUP_WIDE'
            : 'NET_SETTLEMENT',
        totalAmount: totalVolume,
        workRecordsIncluded: selectedSettlementRecords,
        distributions: activeDistributions,
        paymentMode,
        remarks: settlementRemarks.trim(),
        notes: 'Net Settlement Processed via Mobile App',
      };

      await groupService.processSettlement(groupId, payload);
      setIsSettlementModalOpen(false);
      Alert.alert('Settlement Complete! 💰', 'Cooperative ledger balances updated successfully.');
      fetchGroupData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to process settlement.');
    } finally {
      setProcessingSettlement(false);
    }
  };

  // Helper to get member name by subdoc _id
  const getMemberName = (id) => {
    if (!group) return 'Member';
    const found = group.members.find((m) => String(m._id) === String(id));
    return found ? found.name : 'Member';
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
          <ErrorState message={error || 'Group not found'} onRetry={fetchGroupData} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Screen Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {group.name}
            </Text>
            {group.status === 'closed' && (
              <View style={styles.closedTag}>
                <Text style={styles.closedTagText}>Closed</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSub}>
            {group.village || 'Telangana'} • {activeMembers.length} Members
          </Text>
        </View>

        {/* View Mode Switcher Pill (for Admins / Owners) */}
        {isAdmin && (
          <View style={styles.roleTogglePill}>
            <TouchableOpacity
              style={[
                styles.roleToggleBtn,
                viewMode === 'member' && styles.roleToggleBtnActiveMember,
              ]}
              onPress={() => setViewMode('member')}
            >
              <MaterialCommunityIcons
                name="account-group"
                size={14}
                color={viewMode === 'member' ? '#047857' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.roleToggleText,
                  viewMode === 'member' && { color: '#047857', fontWeight: '800' },
                ]}
              >
                Member
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleToggleBtn,
                viewMode === 'admin' && styles.roleToggleBtnActiveAdmin,
              ]}
              onPress={() => setViewMode('admin')}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={14}
                color={viewMode === 'admin' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.roleToggleText,
                  viewMode === 'admin' && { color: '#FFFFFF', fontWeight: '800' },
                ]}
              >
                Admin
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sub-Tabs: Member View vs Admin View */}
      {viewMode === 'member' ? (
        <View style={styles.subTabBar}>
          {[
            { id: 'overview', label: 'Overview', icon: 'view-dashboard-outline' },
            { id: 'work', label: `Work (${records.length})`, icon: 'clipboard-text-outline' },
            { id: 'settlements', label: 'Settlements', icon: 'cash-multiple' },
            { id: 'members', label: `Members (${activeMembers.length})`, icon: 'account-multiple-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.subTabBtn, memberTab === tab.id && styles.subTabBtnActive]}
              onPress={() => setMemberTab(tab.id)}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={16}
                color={memberTab === tab.id ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.subTabText, memberTab === tab.id && styles.subTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.subTabBar}>
          {[
            { id: 'overview', label: 'Overview', icon: 'chart-pie' },
            { id: 'members', label: `Members (${activeMembers.length})`, icon: 'account-cog-outline' },
            { id: 'work', label: `Work (${records.length})`, icon: 'clipboard-list-outline' },
            { id: 'settlements', label: 'Settlements', icon: 'scale-balance' },
            { id: 'reports', label: 'Reports', icon: 'file-chart-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.subTabBtn, adminTab === tab.id && styles.subTabBtnActiveAdmin]}
              onPress={() => setAdminTab(tab.id)}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={16}
                color={adminTab === tab.id ? '#7C3AED' : colors.textSecondary}
              />
              <Text style={[styles.subTabText, adminTab === tab.id && { color: '#7C3AED', fontWeight: '800' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* ============================================================ */}
        {/* MEMBER VIEW CONTENT */}
        {/* ============================================================ */}
        {viewMode === 'member' && (
          <>
            {/* 1. MEMBER OVERVIEW & STATS */}
            {memberTab === 'overview' && (
              <View style={styles.tabContent}>
                {/* Personal Labor & Financial Summary */}
                <Card style={styles.memberStatsBanner}>
                  <Text style={styles.memberStatsTitle}>My Labor & Balance in this Group</Text>
                  <View style={styles.statsQuadGrid}>
                    <View style={styles.statsQuadBox}>
                      <Text style={styles.statsQuadLabel}>Days Worked</Text>
                      <Text style={styles.statsQuadVal}>{personalGroupStats.daysWorked}</Text>
                    </View>
                    <View style={styles.statsQuadBox}>
                      <Text style={styles.statsQuadLabel}>Total Earned</Text>
                      <Text style={[styles.statsQuadVal, { color: '#059669' }]}>
                        {formatCurrency(personalGroupStats.earned)}
                      </Text>
                    </View>
                    <View style={styles.statsQuadBox}>
                      <Text style={styles.statsQuadLabel}>Pending Settlement</Text>
                      <Text style={[styles.statsQuadVal, { color: '#D97706' }]}>
                        {formatCurrency(personalGroupStats.pending)}
                      </Text>
                    </View>
                    <View style={styles.statsQuadBox}>
                      <Text style={styles.statsQuadLabel}>Net Balance</Text>
                      <Text
                        style={[
                          styles.statsQuadVal,
                          { color: personalGroupStats.net >= 0 ? '#059669' : '#DC2626' },
                        ]}
                      >
                        {formatCurrency(personalGroupStats.net)}
                      </Text>
                    </View>
                  </View>
                </Card>

                {/* Group Info Summary */}
                <Card style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Cooperative Group Information</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Location / Village:</Text>
                    <Text style={styles.infoVal}>{group.village || 'Telangana'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Active Members:</Text>
                    <Text style={styles.infoVal}>{activeMembers.length} Farmers</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Standard Daily Wage:</Text>
                    <Text style={styles.infoVal}>
                      {formatCurrency(group.hourlyRate || 350)} / day
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Established:</Text>
                    <Text style={styles.infoVal}>
                      {formatDate(group.createdAt)}
                    </Text>
                  </View>
                </Card>

                {/* Announcements Card */}
                <Card style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#2563EB" />
                    <Text style={styles.announcementTitle}>Group Announcements</Text>
                  </View>
                  <Text style={styles.announcementDesc}>
                    Admins haven't published any new group announcements today. All cooperative farming activities are running according to schedule.
                  </Text>
                </Card>

                {/* Upcoming Work Card */}
                <Card style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <MaterialCommunityIcons name="calendar-clock" size={20} color="#059669" />
                    <Text style={styles.announcementTitle}>Upcoming Field Labor</Text>
                  </View>
                  <Text style={styles.announcementDesc}>
                    Check with group leaders or Village Chat for scheduled transplanting and harvesting dates.
                  </Text>
                </Card>
              </View>
            )}

            {/* 2. MEMBER WORK HISTORY */}
            {memberTab === 'work' && (
              <View style={styles.tabContent}>
                {records.length === 0 ? (
                  <EmptyState
                    icon="clipboard-text-clock-outline"
                    title="No Work Records Yet"
                    description="When work sessions are logged by group admins, individual labor hours and wage breakdowns will appear here."
                  />
                ) : (
                  records.map((record) => {
                    const isAttending =
                      currentUserMember &&
                      record.attendance?.some((id) => String(id) === String(currentUserMember._id));
                    const isInternal =
                      currentUserMember &&
                      String(record.internalMemberId) === String(currentUserMember._id);

                    return (
                      <TouchableOpacity
                        key={record._id}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedRecord(record);
                          setIsRecordDetailsModalOpen(true);
                        }}
                      >
                        <Card style={styles.recordCard}>
                          <View style={styles.recordHeader}>
                            <View style={styles.recordTitleBox}>
                              <Text style={styles.recordCrop}>{record.crop || 'Crop Labor'}</Text>
                              <Text style={styles.recordActivity}>
                                {record.activityType} • {record.acres} Acres
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.statusBadge,
                                record.paymentStatus === 'SETTLED'
                                  ? styles.statusSettled
                                  : record.paymentStatus === 'PARTIAL'
                                  ? styles.statusPartial
                                  : styles.statusPending,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  record.paymentStatus === 'SETTLED'
                                    ? { color: '#047857' }
                                    : record.paymentStatus === 'PARTIAL'
                                    ? { color: '#B45309' }
                                    : { color: '#B91C1C' },
                                ]}
                              >
                                {record.paymentStatus || 'PENDING'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.recordMetaRow}>
                            <Text style={styles.recordMetaItem}>
                              <MaterialCommunityIcons name="account" size={13} color={colors.textSecondary} />
                              {' '}Landowner: {record.landOwnerName}
                            </Text>
                            <Text style={styles.recordMetaItem}>
                              <MaterialCommunityIcons name="calendar" size={13} color={colors.textSecondary} />
                              {' '}{formatDate(record.date)}
                            </Text>
                          </View>

                          <View style={styles.recordFooter}>
                            <View>
                              <Text style={styles.recordFooterLabel}>Total Group Earning</Text>
                              <Text style={styles.recordFooterVal}>
                                {formatCurrency(record.totalAmount)}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.recordFooterLabel}>Wage / Worker</Text>
                              <Text style={[styles.recordFooterVal, { color: colors.primary }]}>
                                {formatCurrency(record.wagePerPerson)}
                              </Text>
                            </View>
                          </View>

                          {isAttending && (
                            <View style={styles.attendingPill}>
                              <MaterialCommunityIcons name="check-circle" size={13} color="#059669" />
                              <Text style={styles.attendingPillText}>You Participated in this Session</Text>
                            </View>
                          )}
                          {isInternal && (
                            <View style={[styles.attendingPill, { backgroundColor: '#FEF3C7' }]}>
                              <MaterialCommunityIcons name="home-account" size={13} color="#B45309" />
                              <Text style={[styles.attendingPillText, { color: '#B45309' }]}>
                                Work Performed on Your Farm
                              </Text>
                            </View>
                          )}
                        </Card>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {/* 3. MEMBER SETTLEMENTS */}
            {memberTab === 'settlements' && (
              <View style={styles.tabContent}>
                {settlements.length === 0 ? (
                  <EmptyState
                    icon="scale-balance"
                    title="No Settlements Recorded"
                    description="When group settlements are calculated and distributed, receipts and ledger balances will be displayed here."
                  />
                ) : (
                  settlements.map((s) => (
                    <Card key={s._id} style={styles.settlementItemCard}>
                      <View style={styles.settlementHeaderRow}>
                        <View>
                          <Text style={styles.settlementType}>{s.settlementType || 'Group Settlement'}</Text>
                          <Text style={styles.settlementDate}>{formatDate(s.date || s.createdAt)}</Text>
                        </View>
                        <Text style={styles.settlementAmount}>{formatCurrency(s.totalAmount)}</Text>
                      </View>
                      <View style={styles.settlementMetaRow}>
                        <Text style={styles.settlementMetaText}>
                          Mode: {s.paymentMode || 'CASH'}
                        </Text>
                        <Text style={styles.settlementMetaText}>
                          Records: {s.workRecordsIncluded?.length || 0}
                        </Text>
                      </View>
                      {s.remarks ? (
                        <Text style={styles.settlementRemarks}>"{s.remarks}"</Text>
                      ) : null}
                    </Card>
                  ))
                )}
              </View>
            )}

            {/* 4. MEMBER ROSTER (READ-ONLY) */}
            {memberTab === 'members' && (
              <View style={styles.tabContent}>
                {activeMembers.map((m, idx) => {
                  const mRole = m.role || (String(group.createdBy) === String(m.user?._id || m.user) ? 'owner' : 'member');
                  const isUserHimself = currentUserMember && String(m._id) === String(currentUserMember._id);

                  return (
                    <Card key={m._id || idx} style={styles.memberCard}>
                      <Avatar name={m.name} size={42} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.memberName}>{m.name}</Text>
                          {isUserHimself && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>You</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.memberSub}>
                          {m.phone ? m.phone : 'Member'} • Joined {formatDate(m.joinedAt || group.createdAt)}
                        </Text>
                      </View>
                      <Badge status={mRole} size="small" />
                    </Card>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* ADMIN VIEW CONTENT */}
        {/* ============================================================ */}
        {viewMode === 'admin' && (
          <>
            {/* 1. ADMIN OVERVIEW & ANALYTICS */}
            {adminTab === 'overview' && (
              <View style={styles.tabContent}>
                {/* 4 Key Analytics Cards */}
                <View style={styles.statsGrid}>
                  <Card style={[styles.analyticsCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                    <MaterialCommunityIcons name="currency-inr" size={24} color="#059669" />
                    <Text style={styles.analyticsLabel}>Total Earned</Text>
                    <Text style={[styles.analyticsVal, { color: '#065F46' }]}>
                      {formatCurrency(analytics?.totalEarnings || 0)}
                    </Text>
                  </Card>

                  <Card style={[styles.analyticsCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                    <MaterialCommunityIcons name="clock-alert-outline" size={24} color="#D97706" />
                    <Text style={styles.analyticsLabel}>Pending Payments</Text>
                    <Text style={[styles.analyticsVal, { color: '#92400E' }]}>
                      {formatCurrency(analytics?.pendingPayments || 0)}
                    </Text>
                  </Card>

                  <Card style={[styles.analyticsCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                    <MaterialCommunityIcons name="land-plots" size={24} color="#2563EB" />
                    <Text style={styles.analyticsLabel}>Total Acres Worked</Text>
                    <Text style={[styles.analyticsVal, { color: '#1E40AF' }]}>
                      {(analytics?.totalAcres || 0).toFixed(1)}
                    </Text>
                  </Card>

                  <Card style={[styles.analyticsCard, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}>
                    <MaterialCommunityIcons name="calendar-check" size={24} color="#7C3AED" />
                    <Text style={styles.analyticsLabel}>Total Work Days</Text>
                    <Text style={[styles.analyticsVal, { color: '#6B21A8' }]}>
                      {analytics?.totalWorkDays || records.length}
                    </Text>
                  </Card>
                </View>

                {/* Quick Action Buttons Bar */}
                <View style={styles.adminActionsBar}>
                  <TouchableOpacity
                    style={[styles.adminActionBtn, { backgroundColor: colors.primary }]}
                    onPress={handleOpenRecordWork}
                  >
                    <MaterialCommunityIcons name="plus-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.adminActionBtnText}>Record Daily Work</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.adminActionBtn, { backgroundColor: '#7C3AED' }]}
                    onPress={handleOpenSettlements}
                  >
                    <MaterialCommunityIcons name="scale-balance" size={18} color="#FFFFFF" />
                    <Text style={styles.adminActionBtnText}>Process Settlement</Text>
                  </TouchableOpacity>
                </View>

                {/* Member Contributions Breakdown */}
                <Text style={styles.sectionHeading}>Member Contributions Breakdown</Text>
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                  {activeMembers.map((member, idx) => {
                    const stats = analytics?.memberStats?.[String(member._id)] || {
                      daysWorked: 0,
                      earned: 0,
                      pending: 0,
                    };
                    return (
                      <View
                        key={member._id}
                        style={[
                          styles.contributionRow,
                          idx < activeMembers.length - 1 && styles.borderBottom,
                        ]}
                      >
                        <View style={{ flex: 1.2 }}>
                          <Text style={styles.contribName}>{member.name}</Text>
                          <Text style={styles.contribRole}>{member.role || 'Member'}</Text>
                        </View>
                        <View style={{ flex: 0.8, alignItems: 'center' }}>
                          <Text style={styles.contribVal}>{stats.daysWorked} Days</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <Text style={[styles.contribVal, { color: '#059669' }]}>
                            {formatCurrency(stats.earned)}
                          </Text>
                          <Text style={styles.contribPending}>
                            P: {formatCurrency(stats.pending)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </Card>

                {/* Danger Zone (Owner Only) */}
                {isOwner && group.status !== 'closed' && (
                  <View style={styles.dangerZone}>
                    <Text style={styles.dangerTitle}>Group Administration Controls</Text>
                    <View style={styles.dangerButtonsRow}>
                      <TouchableOpacity style={styles.closeGroupBtn} onPress={handleCloseGroup}>
                        <MaterialCommunityIcons name="lock" size={16} color="#DC2626" />
                        <Text style={styles.closeGroupBtnText}>Close Group</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.deleteGroupBtn} onPress={handleDeleteGroup}>
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.deleteGroupBtnText}>Delete Permanently</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* 2. ADMIN MEMBERS MANAGEMENT */}
            {adminTab === 'members' && (
              <View style={styles.tabContent}>
                <View style={styles.listHeaderRow}>
                  <Text style={styles.listHeaderCount}>
                    {activeMembers.length} Registered Farmers
                  </Text>
                  <TouchableOpacity
                    style={styles.addMemberBtn}
                    onPress={() => setIsAddMemberModalOpen(true)}
                  >
                    <MaterialCommunityIcons name="account-plus" size={16} color="#FFFFFF" />
                    <Text style={styles.addMemberBtnText}>Add Member</Text>
                  </TouchableOpacity>
                </View>

                {activeMembers.map((member) => {
                  const mRole = member.role || (String(group.createdBy) === String(member.user?._id || member.user) ? 'owner' : 'member');
                  const isCurrent = currentUserMember && String(member._id) === String(currentUserMember._id);

                  return (
                    <Card key={member._id} style={styles.memberCard}>
                      <Avatar name={member.name} size={42} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberSub}>
                          {member.phone ? member.phone : 'Offline Member'} • {member.village || 'Telangana'}
                        </Text>
                      </View>

                      <Badge status={mRole} size="small" />

                      {/* Member Action Menu Trigger */}
                      {(!isCurrent && (isOwner || (isAdmin && mRole === 'member'))) && (
                        <TouchableOpacity
                          style={styles.memberActionDots}
                          onPress={() => {
                            setSelectedMember(member);
                            setIsMemberActionModalOpen(true);
                          }}
                        >
                          <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}

            {/* 3. ADMIN WORK HISTORY & RECORD WORK */}
            {adminTab === 'work' && (
              <View style={styles.tabContent}>
                <View style={styles.listHeaderRow}>
                  <Text style={styles.listHeaderCount}>{records.length} Work Sessions Logged</Text>
                  <TouchableOpacity style={styles.addMemberBtn} onPress={handleOpenRecordWork}>
                    <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                    <Text style={styles.addMemberBtnText}>Record Work</Text>
                  </TouchableOpacity>
                </View>

                {records.length === 0 ? (
                  <EmptyState
                    icon="clipboard-plus-outline"
                    title="No Daily Work Logged"
                    description="Record field sessions including landowner, crop, acres, rate, and participating member attendance."
                    actionTitle="Record First Session"
                    onAction={handleOpenRecordWork}
                  />
                ) : (
                  records.map((record) => (
                    <TouchableOpacity
                      key={record._id}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedRecord(record);
                        setIsRecordDetailsModalOpen(true);
                      }}
                    >
                      <Card style={styles.recordCard}>
                        <View style={styles.recordHeader}>
                          <View style={styles.recordTitleBox}>
                            <Text style={styles.recordCrop}>{record.crop || 'Field Work'}</Text>
                            <Text style={styles.recordActivity}>
                              {record.activityType} • {record.acres} Acres
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              record.paymentStatus === 'SETTLED'
                                ? styles.statusSettled
                                : record.paymentStatus === 'PARTIAL'
                                ? styles.statusPartial
                                : styles.statusPending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                record.paymentStatus === 'SETTLED'
                                  ? { color: '#047857' }
                                  : record.paymentStatus === 'PARTIAL'
                                  ? { color: '#B45309' }
                                  : { color: '#B91C1C' },
                              ]}
                            >
                              {record.paymentStatus || 'PENDING'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.recordMetaRow}>
                          <Text style={styles.recordMetaItem}>
                            Landowner: {record.landOwnerName}
                          </Text>
                          <Text style={styles.recordMetaItem}>
                            {formatDate(record.date)}
                          </Text>
                        </View>

                        <View style={styles.recordFooter}>
                          <View>
                            <Text style={styles.recordFooterLabel}>Total Amount</Text>
                            <Text style={styles.recordFooterVal}>
                              {formatCurrency(record.totalAmount)}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.recordFooterLabel}>
                              Attendance ({record.attendance?.length || 0})
                            </Text>
                            <Text style={[styles.recordFooterVal, { color: colors.primary }]}>
                              {formatCurrency(record.wagePerPerson)} / person
                            </Text>
                          </View>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* 4. ADMIN SETTLEMENTS */}
            {adminTab === 'settlements' && (
              <View style={styles.tabContent}>
                <View style={styles.settlementSubTabs}>
                  <TouchableOpacity
                    style={[
                      styles.settlementSubTabBtn,
                      settlementViewTab === 'process' && styles.settlementSubTabBtnActive,
                    ]}
                    onPress={() => setSettlementViewTab('process')}
                  >
                    <Text
                      style={[
                        styles.settlementSubTabText,
                        settlementViewTab === 'process' && styles.settlementSubTabTextActive,
                      ]}
                    >
                      Process Net Settlement ({pendingRecords.length} Pending)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.settlementSubTabBtn,
                      settlementViewTab === 'history' && styles.settlementSubTabBtnActive,
                    ]}
                    onPress={() => setSettlementViewTab('history')}
                  >
                    <Text
                      style={[
                        styles.settlementSubTabText,
                        settlementViewTab === 'history' && styles.settlementSubTabTextActive,
                      ]}
                    >
                      History ({settlements.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {settlementViewTab === 'process' ? (
                  <View>
                    <Card style={styles.settleInfoCard}>
                      <Text style={styles.settleInfoTitle}>Net Settlement Overview</Text>
                      <Text style={styles.settleInfoSub}>
                        Calculates net balances between days worked and labor received on members' own farms.
                      </Text>
                      <TouchableOpacity
                        style={styles.processSettleActionBtn}
                        onPress={handleOpenSettlements}
                      >
                        <MaterialCommunityIcons name="calculator" size={18} color="#FFFFFF" />
                        <Text style={styles.processSettleActionBtnText}>
                          Calculate & Settle Pending Balances
                        </Text>
                      </TouchableOpacity>
                    </Card>

                    {pendingRecords.length === 0 ? (
                      <EmptyState
                        icon="check-decagram-outline"
                        title="All Work Records Settled"
                        description="There are currently no unsettled labor sessions in this workgroup."
                      />
                    ) : (
                      pendingRecords.map((r) => (
                        <Card key={r._id} style={styles.pendingRecordRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.pendingCrop}>{r.crop} • {r.activityType}</Text>
                            <Text style={styles.pendingOwner}>Host: {r.landOwnerName}</Text>
                            <Text style={styles.pendingDate}>{formatDate(r.date)}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.pendingAmount}>{formatCurrency(r.totalAmount)}</Text>
                            <Text style={styles.pendingWage}>{formatCurrency(r.wagePerPerson)} / worker</Text>
                          </View>
                        </Card>
                      ))
                    )}
                  </View>
                ) : (
                  <View>
                    {settlements.length === 0 ? (
                      <EmptyState
                        icon="history"
                        title="No Settlement History"
                        description="Past completed settlement transactions will be recorded here."
                      />
                    ) : (
                      settlements.map((s) => (
                        <Card key={s._id} style={styles.settlementItemCard}>
                          <View style={styles.settlementHeaderRow}>
                            <View>
                              <Text style={styles.settlementType}>{s.settlementType}</Text>
                              <Text style={styles.settlementDate}>{formatDate(s.date || s.createdAt)}</Text>
                            </View>
                            <Text style={styles.settlementAmount}>{formatCurrency(s.totalAmount)}</Text>
                          </View>
                          <Text style={styles.settlementMetaText}>Payment Mode: {s.paymentMode}</Text>
                          {s.remarks ? <Text style={styles.settlementRemarks}>"{s.remarks}"</Text> : null}
                        </Card>
                      ))
                    )}
                  </View>
                )}
              </View>
            )}

            {/* 5. ADMIN REPORTS */}
            {adminTab === 'reports' && (
              <View style={styles.tabContent}>
                <Card style={styles.reportSummaryCard}>
                  <Text style={styles.reportTitle}>Workgroup Performance Summary</Text>
                  <View style={styles.reportMetricsRow}>
                    <View style={styles.reportMetric}>
                      <Text style={styles.reportMetricVal}>{records.length}</Text>
                      <Text style={styles.reportMetricLabel}>Work Sessions</Text>
                    </View>
                    <View style={styles.reportMetric}>
                      <Text style={styles.reportMetricVal}>{(analytics?.totalAcres || 0).toFixed(1)}</Text>
                      <Text style={styles.reportMetricLabel}>Total Acres</Text>
                    </View>
                    <View style={styles.reportMetric}>
                      <Text style={[styles.reportMetricVal, { color: '#059669' }]}>
                        {formatCurrency(analytics?.totalEarnings || 0)}
                      </Text>
                      <Text style={styles.reportMetricLabel}>Total Wages</Text>
                    </View>
                  </View>
                </Card>

                <Card style={styles.reportInfoCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.primary} />
                    <Text style={styles.reportCardTitle}>Cooperative Work Ledger</Text>
                  </View>
                  <Text style={styles.reportCardDesc}>
                    Complete audit trail of all field labor, member attendance, and financial settlements stored permanently in the AgriSpine decentralized agronomy database.
                  </Text>
                </Card>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ============================================================ */}
      {/* MODAL 1: RECORD WORK MODAL */}
      {/* ============================================================ */}
      <Modal
        visible={isRecordWorkModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsRecordWorkModalOpen(false)}
      >
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalSheetContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="clipboard-plus" size={22} color={colors.primary} />
                <Text style={styles.modalTitle}>Record Daily Work</Text>
              </View>
              <TouchableOpacity onPress={() => setIsRecordWorkModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '82%' }}>
              {/* Farm Type Switch */}
              <Text style={styles.inputLabel}>Farm Location Type</Text>
              <View style={styles.farmTypeToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.farmTypeOption,
                    !workForm.isInternalFarm && styles.farmTypeOptionActive,
                  ]}
                  onPress={() =>
                    setWorkForm({ ...workForm, isInternalFarm: false, internalMemberId: '' })
                  }
                >
                  <Text
                    style={[
                      styles.farmTypeOptionText,
                      !workForm.isInternalFarm && styles.farmTypeOptionTextActive,
                    ]}
                  >
                    External Farm Owner
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.farmTypeOption,
                    workForm.isInternalFarm && styles.farmTypeOptionActive,
                  ]}
                  onPress={() =>
                    setWorkForm({ ...workForm, isInternalFarm: true, landOwnerName: '' })
                  }
                >
                  <Text
                    style={[
                      styles.farmTypeOptionText,
                      workForm.isInternalFarm && styles.farmTypeOptionTextActive,
                    ]}
                  >
                    Group Member's Farm
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Host Farmer / Landowner Name */}
              {workForm.isInternalFarm ? (
                <View style={{ marginBottom: 14 }}>
                  <Text style={styles.inputLabel}>Select Group Member Host *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {activeMembers.map((m) => (
                      <TouchableOpacity
                        key={m._id}
                        style={[
                          styles.memberChip,
                          workForm.internalMemberId === m._id && styles.memberChipActive,
                        ]}
                        onPress={() => setWorkForm({ ...workForm, internalMemberId: m._id })}
                      >
                        <Text
                          style={[
                            styles.memberChipText,
                            workForm.internalMemberId === m._id && styles.memberChipTextActive,
                          ]}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <View style={{ marginBottom: 14 }}>
                  <Text style={styles.inputLabel}>External Landowner Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Ramesh Reddy"
                    placeholderTextColor={colors.textMuted}
                    value={workForm.landOwnerName}
                    onChangeText={(v) => setWorkForm({ ...workForm, landOwnerName: v })}
                  />
                </View>
              )}

              {/* Date Input */}
              <Text style={styles.inputLabel}>Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.textInput}
                value={workForm.date}
                onChangeText={(v) => setWorkForm({ ...workForm, date: v })}
              />

              {/* Crop & Activity */}
              <Text style={styles.inputLabel}>Crop (e.g. Cotton, Paddy, Chilli) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Paddy"
                placeholderTextColor={colors.textMuted}
                value={workForm.crop}
                onChangeText={(v) => setWorkForm({ ...workForm, crop: v })}
              />

              <Text style={styles.inputLabel}>Activity / Task *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 12 }}>
                {COMMON_ACTIVITIES.map((act) => (
                  <TouchableOpacity
                    key={act}
                    style={[
                      styles.activityChip,
                      workForm.activityType === act && styles.activityChipActive,
                    ]}
                    onPress={() => setWorkForm({ ...workForm, activityType: act })}
                  >
                    <Text
                      style={[
                        styles.activityChipText,
                        workForm.activityType === act && styles.activityChipTextActive,
                      ]}
                    >
                      {act}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Acres & Rate Per Acre */}
              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Acres Worked *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 2.5"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={workForm.acres}
                    onChangeText={(v) => setWorkForm({ ...workForm, acres: v })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Rate / Acre (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 800"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={workForm.ratePerAcre}
                    onChangeText={(v) => setWorkForm({ ...workForm, ratePerAcre: v })}
                  />
                </View>
              </View>

              {/* Additional Charges */}
              <Text style={styles.inputLabel}>Additional Equipment Charges (₹, Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={workForm.additionalCharges}
                onChangeText={(v) => setWorkForm({ ...workForm, additionalCharges: v })}
              />

              {/* Worker Attendance Checkboxes */}
              <Text style={styles.inputLabel}>
                Member Attendance ({workForm.attendance.length} of {activeMembers.length} selected) *
              </Text>
              <View style={styles.attendanceGrid}>
                {activeMembers.map((m) => {
                  const isChecked = workForm.attendance.includes(m._id);
                  return (
                    <TouchableOpacity
                      key={m._id}
                      style={[styles.attendCheckRow, isChecked && styles.attendCheckRowActive]}
                      onPress={() => toggleAttendanceMember(m._id)}
                    >
                      <MaterialCommunityIcons
                        name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={20}
                        color={isChecked ? colors.primary : colors.textMuted}
                      />
                      <Text style={[styles.attendCheckText, isChecked && styles.attendCheckTextActive]}>
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Total Calculated Wage Card */}
              <View style={styles.calcTotalCard}>
                <View>
                  <Text style={styles.calcTotalLabel}>Total Group Earning</Text>
                  <Text style={styles.calcTotalVal}>
                    {formatCurrency(
                      (parseFloat(workForm.acres) || 0) * (parseFloat(workForm.ratePerAcre) || 0) +
                        (parseFloat(workForm.additionalCharges) || 0)
                    )}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.calcTotalLabel}>Wage / Worker</Text>
                  <Text style={[styles.calcTotalVal, { color: colors.primary }]}>
                    {workForm.attendance.length > 0
                      ? formatCurrency(
                          ((parseFloat(workForm.acres) || 0) * (parseFloat(workForm.ratePerAcre) || 0) +
                            (parseFloat(workForm.additionalCharges) || 0)) /
                            workForm.attendance.length
                        )
                      : '₹0'}
                  </Text>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.modalSubmitBtn, savingWork && { opacity: 0.6 }]}
                onPress={handleSaveWorkRecord}
                disabled={savingWork}
              >
                {savingWork ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Save Work Record</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 2: ADD MEMBER MODAL */}
      {/* ============================================================ */}
      <Modal
        visible={isAddMemberModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsAddMemberModalOpen(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalCenterCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Member</Text>
              <TouchableOpacity onPress={() => setIsAddMemberModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Enter farmer name and 10-digit mobile number. If the farmer is registered on AgriSpine, their account will be connected automatically.
            </Text>

            <Text style={styles.inputLabel}>Farmer Full Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor={colors.textMuted}
              value={newMemberForm.name}
              onChangeText={(v) => setNewMemberForm({ ...newMemberForm, name: v })}
            />

            <Text style={styles.inputLabel}>Mobile Phone Number (10 Digits)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876543210"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={newMemberForm.phone}
              onChangeText={(v) => setNewMemberForm({ ...newMemberForm, phone: v })}
            />

            <Text style={styles.inputLabel}>Village / Town</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Lingamvarigudem"
              placeholderTextColor={colors.textMuted}
              value={newMemberForm.village}
              onChangeText={(v) => setNewMemberForm({ ...newMemberForm, village: v })}
            />

            <View style={styles.centerBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddMemberModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, addingMember && { opacity: 0.6 }]}
                onPress={handleAddMemberSubmit}
                disabled={addingMember}
              >
                {addingMember ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Add Member</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 3: MEMBER ACTIONS MODAL (Promote / Demote / Remove) */}
      {/* ============================================================ */}
      {selectedMember && (
        <Modal
          visible={isMemberActionModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMemberActionModalOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlayCenter}
            activeOpacity={1}
            onPress={() => setIsMemberActionModalOpen(false)}
          >
            <View style={styles.modalCenterCard}>
              <Text style={styles.modalTitle}>{selectedMember.name}</Text>
              <Text style={styles.modalDesc}>
                Role: {selectedMember.role} • {selectedMember.phone || 'Offline'}
              </Text>

              <View style={styles.actionsList}>
                {isOwner && selectedMember.role === 'member' && (
                  <TouchableOpacity
                    style={styles.actionItemBtn}
                    onPress={() => handleUpdateRole(selectedMember, 'admin')}
                  >
                    <MaterialCommunityIcons name="shield-star" size={20} color="#7C3AED" />
                    <Text style={styles.actionItemText}>Promote to Administrator</Text>
                  </TouchableOpacity>
                )}

                {isOwner && selectedMember.role === 'admin' && (
                  <TouchableOpacity
                    style={styles.actionItemBtn}
                    onPress={() => handleUpdateRole(selectedMember, 'member')}
                  >
                    <MaterialCommunityIcons name="account-arrow-down" size={20} color="#6B7280" />
                    <Text style={styles.actionItemText}>Demote to Member</Text>
                  </TouchableOpacity>
                )}

                {isOwner && (
                  <TouchableOpacity
                    style={styles.actionItemBtn}
                    onPress={() => handleTransferOwnership(selectedMember)}
                  >
                    <MaterialCommunityIcons name="crown" size={20} color="#D97706" />
                    <Text style={styles.actionItemText}>Transfer Group Ownership</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionItemBtn, { borderBottomWidth: 0 }]}
                  onPress={() => handleRemoveMember(selectedMember)}
                >
                  <MaterialCommunityIcons name="account-remove" size={20} color="#DC2626" />
                  <Text style={[styles.actionItemText, { color: '#DC2626' }]}>
                    Remove from Workgroup
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: WORK RECORD DETAILS MODAL */}
      {/* ============================================================ */}
      {selectedRecord && (
        <Modal
          visible={isRecordDetailsModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsRecordDetailsModalOpen(false)}
        >
          <View style={styles.modalOverlayBottom}>
            <View style={styles.modalSheetContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Work Session Details</Text>
                <TouchableOpacity onPress={() => setIsRecordDetailsModalOpen(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '80%' }}>
                {/* Status banner */}
                <View
                  style={[
                    styles.detailsStatusBanner,
                    selectedRecord.paymentStatus === 'SETTLED'
                      ? styles.statusSettled
                      : styles.statusPending,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={selectedRecord.paymentStatus === 'SETTLED' ? 'check-circle' : 'clock-alert'}
                    size={18}
                    color={selectedRecord.paymentStatus === 'SETTLED' ? '#047857' : '#B91C1C'}
                  />
                  <Text style={{ fontWeight: '800', fontSize: 13 }}>
                    Status: {selectedRecord.paymentStatus || 'PENDING'}
                  </Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Crop & Task:</Text>
                  <Text style={styles.detailsVal}>
                    {selectedRecord.crop} • {selectedRecord.activityType}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Host Landowner:</Text>
                  <Text style={styles.detailsVal}>{selectedRecord.landOwnerName}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Date of Labor:</Text>
                  <Text style={styles.detailsVal}>{formatDate(selectedRecord.date)}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Acres Worked:</Text>
                  <Text style={styles.detailsVal}>{selectedRecord.acres} Acres</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Rate / Acre:</Text>
                  <Text style={styles.detailsVal}>₹{selectedRecord.ratePerAcre}</Text>
                </View>
                {selectedRecord.additionalCharges > 0 && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Additional Charges:</Text>
                    <Text style={styles.detailsVal}>₹{selectedRecord.additionalCharges}</Text>
                  </View>
                )}
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Total Session Earning:</Text>
                  <Text style={[styles.detailsVal, { color: '#059669', fontWeight: '900' }]}>
                    {formatCurrency(selectedRecord.totalAmount)}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Wage / Attending Farmer:</Text>
                  <Text style={[styles.detailsVal, { color: colors.primary, fontWeight: '900' }]}>
                    {formatCurrency(selectedRecord.wagePerPerson)}
                  </Text>
                </View>

                {/* Attending Members */}
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                  Attending Farmers ({selectedRecord.attendance?.length || 0})
                </Text>
                <View style={styles.attendanceNameTagsWrap}>
                  {selectedRecord.attendance?.map((mId) => (
                    <View key={String(mId)} style={styles.nameTag}>
                      <MaterialCommunityIcons name="account-check" size={14} color="#047857" />
                      <Text style={styles.nameTagText}>{getMemberName(mId)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: SETTLEMENT PROCESS MODAL */}
      {/* ============================================================ */}
      <Modal
        visible={isSettlementModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsSettlementModalOpen(false)}
      >
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalSheetContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="scale-balance" size={22} color="#7C3AED" />
                <Text style={styles.modalTitle}>Process Net Settlement</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSettlementModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '82%' }}>
              <Text style={styles.inputLabel}>
                Include Work Records ({selectedSettlementRecords.length} of {pendingRecords.length})
              </Text>
              {pendingRecords.map((r) => {
                const isSelected = selectedSettlementRecords.includes(r._id);
                return (
                  <TouchableOpacity
                    key={r._id}
                    style={[styles.attendCheckRow, isSelected && styles.attendCheckRowActive]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedSettlementRecords(selectedSettlementRecords.filter((id) => id !== r._id));
                      } else {
                        setSelectedSettlementRecords([...selectedSettlementRecords, r._id]);
                      }
                    }}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={20}
                      color={isSelected ? '#7C3AED' : colors.textMuted}
                    />
                    <Text style={{ flex: 1, fontSize: 13, color: colors.textPrimary }}>
                      {r.crop} ({r.landOwnerName}) - {formatCurrency(r.totalAmount)}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Net Balances per Member */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                Net Balances Distribution
              </Text>
              {Object.keys(settlementPreview.netBalances).map((mId) => {
                const item = settlementPreview.netBalances[mId];
                const isChecked = selectedSettlementMembers[mId] !== false;
                return (
                  <TouchableOpacity
                    key={mId}
                    style={styles.settleMemberRow}
                    onPress={() =>
                      setSelectedSettlementMembers({
                        ...selectedSettlementMembers,
                        [mId]: !isChecked,
                      })
                    }
                  >
                    <MaterialCommunityIcons
                      name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={20}
                      color={isChecked ? '#7C3AED' : colors.textMuted}
                    />
                    <Text style={{ flex: 1, marginLeft: 8, fontSize: 13, fontWeight: '700' }}>
                      {getMemberName(mId)}
                    </Text>
                    <Text
                      style={{
                        fontWeight: '800',
                        fontSize: 14,
                        color: item.net >= 0 ? '#059669' : '#DC2626',
                      }}
                    >
                      {item.net >= 0 ? `+${formatCurrency(item.net)}` : formatCurrency(item.net)}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Payment Mode */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Payment Mode</Text>
              <View style={styles.paymentModeRow}>
                {['CASH', 'UPI', 'BANK_TRANSFER'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.paymentModeBtn, paymentMode === mode && styles.paymentModeBtnActive]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text
                      style={[
                        styles.paymentModeText,
                        paymentMode === mode && styles.paymentModeTextActive,
                      ]}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Remarks */}
              <Text style={styles.inputLabel}>Remarks / Notes</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Sowing & Transplanting settlement for October"
                placeholderTextColor={colors.textMuted}
                value={settlementRemarks}
                onChangeText={setSettlementRemarks}
              />

              <TouchableOpacity
                style={[styles.processBtn, processingSettlement && { opacity: 0.6 }]}
                onPress={handleProcessSettlementSubmit}
                disabled={processingSettlement}
              >
                {processingSettlement ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.processBtnText}>Confirm & Process Settlement</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  closedTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  closedTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  roleTogglePill: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 3,
  },
  roleToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  roleToggleBtnActiveMember: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  roleToggleBtnActiveAdmin: {
    backgroundColor: '#7C3AED',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  roleToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabBtnActive: {
    borderBottomColor: colors.primary,
  },
  subTabBtnActiveAdmin: {
    borderBottomColor: '#7C3AED',
  },
  subTabText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subTabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tabContent: {
    gap: 12,
  },
  memberStatsBanner: {
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  memberStatsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 12,
  },
  statsQuadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statsQuadBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
  },
  statsQuadLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statsQuadVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 2,
  },
  infoCard: {
    padding: 16,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  announcementCard: {
    padding: 14,
    backgroundColor: colors.surface,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  announcementTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  announcementDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  recordCard: {
    padding: 14,
    marginBottom: 10,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordTitleBox: {
    flex: 1,
  },
  recordCrop: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  recordActivity: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusSettled: {
    backgroundColor: '#D1FAE5',
  },
  statusPartial: {
    backgroundColor: '#FEF3C7',
  },
  statusPending: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  recordMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recordMetaItem: {
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  recordFooterLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  recordFooterVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  attendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  attendingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  settlementItemCard: {
    padding: 14,
    marginBottom: 10,
  },
  settlementHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  settlementType: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  settlementDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  settlementMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  settlementMetaText: {
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  settlementRemarks: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: 4,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  memberName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  memberSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  youBadge: {
    backgroundColor: colors.primaryLight + '35',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  memberActionDots: {
    padding: 6,
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  analyticsCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  analyticsLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  analyticsVal: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  adminActionsBar: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  adminActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  adminActionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contribName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  contribRole: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  contribVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  contribPending: {
    fontSize: 10.5,
    color: '#B45309',
    marginTop: 1,
  },
  dangerZone: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  dangerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  closeGroupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 10,
  },
  closeGroupBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  deleteGroupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#DC2626',
    borderRadius: 10,
  },
  deleteGroupBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listHeaderCount: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addMemberBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settlementSubTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    padding: 3,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  settlementSubTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  settlementSubTabBtnActive: {
    backgroundColor: colors.surface,
  },
  settlementSubTabText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  settlementSubTabTextActive: {
    color: '#7C3AED',
    fontWeight: '800',
  },
  settleInfoCard: {
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
    borderWidth: 1,
  },
  settleInfoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B21A8',
  },
  settleInfoSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 6,
  },
  processSettleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  processSettleActionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pendingRecordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
  },
  pendingCrop: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pendingOwner: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pendingDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  pendingAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  pendingWage: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  reportSummaryCard: {
    padding: 16,
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  reportMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportMetric: {
    alignItems: 'center',
  },
  reportMetricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  reportMetricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reportInfoCard: {
    padding: 14,
    backgroundColor: colors.surface,
  },
  reportCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  reportCardDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheetContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  farmTypeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  farmTypeOption: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  farmTypeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '25',
  },
  farmTypeOptionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  farmTypeOptionTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  memberChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  memberChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  memberChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  activityChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activityChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attendanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  attendCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  attendCheckRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  attendCheckText: {
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  attendCheckTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  calcTotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    marginBottom: 16,
  },
  calcTotalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  calcTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 2,
  },
  modalSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCenterCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },
  centerBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionsList: {
    marginTop: 10,
  },
  actionItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionItemText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailsStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailsLabel: {
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  detailsVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  attendanceNameTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 16,
  },
  nameTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
  },
  nameTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
  },
  settleMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 6,
  },
  paymentModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  paymentModeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  paymentModeBtnActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  paymentModeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  paymentModeTextActive: {
    color: '#7C3AED',
    fontWeight: '800',
  },
  processBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  processBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default GroupDetailsScreen;

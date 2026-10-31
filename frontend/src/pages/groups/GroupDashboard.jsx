import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, Plus, IndianRupee, Briefcase, CheckCircle2, TrendingUp, 
    LayoutGrid, Table, Search, ShieldCheck, ArrowRight, MapPin, 
    Shield, UserCheck, AlertCircle, Filter, X
} from 'lucide-react';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import NoSearchResults from '../../components/ui/NoSearchResults';
import PermissionDenied from '../../components/ui/PermissionDenied';
import { CardSkeleton, StatCardSkeleton, TableRowSkeleton } from '../../components/ui/LoadingSkeleton';
import { getUserGroups, getPersonalDashboard } from '../../api/groupService';

const GroupDashboard = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [personalStats, setPersonalStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Navigation and View state
    // activeSection: 'my_groups' | 'admin_dashboard'
    const [activeSection, setActiveSection] = useState('my_groups');
    // viewMode: 'card' | 'table'
    const [viewMode, setViewMode] = useState('card');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'owner' | 'admin' | 'member'
    const [showEarningsSummary, setShowEarningsSummary] = useState(false);

    const userStr = localStorage.getItem('user');
    const currentUserId = userStr ? (JSON.parse(userStr).id || JSON.parse(userStr)._id) : null;

    // Helper: Determine if user is admin/owner of a specific group
    const isUserAdminOfGroup = (group) => {
        if (!currentUserId) return false;
        const isOwner = String(group.createdBy) === String(currentUserId);
        const isAdmin = Array.isArray(group.admins) && group.admins.some(admin => {
            const adminId = admin?._id ? String(admin._id) : String(admin);
            return adminId === String(currentUserId);
        });
        return isOwner || isAdmin;
    };

    // Helper: Get user's role in a group
    const getUserRoleInGroup = (group) => {
        if (!currentUserId) return 'Member';
        if (String(group.createdBy) === String(currentUserId)) return 'Owner';
        const isAdmin = Array.isArray(group.admins) && group.admins.some(admin => {
            const adminId = admin?._id ? String(admin._id) : String(admin);
            return adminId === String(currentUserId);
        });
        if (isAdmin) return 'Admin';
        return 'Member';
    };

    // User is an admin of at least one group
    const hasAdminAccess = useMemo(() => {
        return groups.some(g => isUserAdminOfGroup(g));
    }, [groups, currentUserId]);

    // Admin-only groups
    const adminManagedGroups = useMemo(() => {
        return groups.filter(g => isUserAdminOfGroup(g));
    }, [groups, currentUserId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [groupsRes, statsRes] = await Promise.all([
                getUserGroups(),
                getPersonalDashboard()
            ]);
            setGroups(Array.isArray(groupsRes.data?.groups) ? groupsRes.data.groups : []);
            setPersonalStats(statsRes.data?.data || statsRes.data?.stats || null);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
            setError("Could not load workgroup information. Please verify your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtered groups based on active section and search/filters
    const displayedGroups = useMemo(() => {
        let list = activeSection === 'admin_dashboard' ? adminManagedGroups : groups;

        // Role filter (only applicable in My Workgroups)
        if (activeSection === 'my_groups' && roleFilter !== 'all') {
            list = list.filter(g => {
                const role = getUserRoleInGroup(g).toLowerCase();
                if (roleFilter === 'admin_or_owner') {
                    return role === 'owner' || role === 'admin';
                }
                return role === roleFilter;
            });
        }

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(g => 
                (g.name || '').toLowerCase().includes(q) ||
                (g.village || '').toLowerCase().includes(q)
            );
        }

        return list;
    }, [groups, adminManagedGroups, activeSection, roleFilter, searchQuery]);

    if (loading) {
        return (
            <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-gray-200 dark:bg-slate-700/60 rounded-xl animate-pulse" />
                    <div className="h-4 w-96 bg-gray-200 dark:bg-slate-700/60 rounded-lg animate-pulse" />
                </div>
                <StatCardSkeleton count={3} />
                <CardSkeleton count={3} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="pb-24 max-w-2xl mx-auto px-4 pt-16">
                <ErrorState
                    title="Unable to Load Workgroups"
                    message={error}
                    onRetry={fetchData}
                />
            </div>
        );
    }

    return (
        <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 animate-in fade-in duration-300">
            
            {/* Top Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Agricultural Workgroups
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
                        Coordinate labor teams, manage daily farm tasks, and track settlements
                    </p>
                </div>

                {/* Primary Section Switcher: My Workgroups vs Admin Dashboard */}
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs self-start md:self-center">
                    {/* Tab 1: My Workgroups */}
                    <button
                        onClick={() => setActiveSection('my_groups')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                            activeSection === 'my_groups'
                                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Workgroups you belong to as a member or manager"
                    >
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>My Workgroups</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {groups.length}
                        </span>
                    </button>

                    {/* Tab 2: Admin Dashboard (Only accessible if user has group admin rights) */}
                    {hasAdminAccess ? (
                        <button
                            onClick={() => setActiveSection('admin_dashboard')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                                activeSection === 'admin_dashboard'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title="Administrative management for groups you administer"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Admin Dashboard</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                activeSection === 'admin_dashboard' 
                                    ? 'bg-emerald-700 text-white' 
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                                {adminManagedGroups.length}
                            </span>
                        </button>
                    ) : (
                        <div 
                            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 cursor-not-allowed select-none"
                            title="You need group administrator privileges to access the Admin Dashboard"
                        >
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                            <span>Admin (No Groups)</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Personal Earnings Drawer / Toggle */}
            {personalStats && (
                <div className="mb-6">
                    <div className="flex items-center justify-between pb-2">
                        <button
                            onClick={() => setShowEarningsSummary(prev => !prev)}
                            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                        >
                            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{showEarningsSummary ? 'Hide My Work & Earnings' : 'View My Work & Earnings Summary'}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                                ₹{Math.round(personalStats?.totalEarned || 0)} Total
                            </span>
                        </button>
                    </div>

                    {showEarningsSummary && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200 mb-2">
                            <Card className="p-5 bg-gradient-to-br from-emerald-600 to-green-700 text-white border-none shadow-sm relative overflow-hidden">
                                <IndianRupee className="absolute -right-3 -bottom-3 w-24 h-24 opacity-10" />
                                <div className="relative z-10">
                                    <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Total Earned</p>
                                    <h3 className="text-2xl font-bold mt-1">₹{Math.round(personalStats?.totalEarned || 0)}</h3>
                                    <p className="text-xs text-emerald-100/90 mt-2 flex items-center gap-1">
                                        <TrendingUp className="w-3.5 h-3.5" /> Lifetime farm earnings
                                    </p>
                                </div>
                            </Card>

                            <Card className="p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 relative overflow-hidden">
                                <CheckCircle2 className="absolute -right-3 -bottom-3 w-24 h-24 text-amber-500/10" />
                                <div className="relative z-10">
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending Payments</p>
                                    <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">₹{Math.round(personalStats?.pendingEarned || 0)}</h3>
                                    <p className="text-xs text-slate-400 mt-2">Awaiting settlement from landowners</p>
                                </div>
                            </Card>

                            <Card className="p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 relative overflow-hidden">
                                <Briefcase className="absolute -right-3 -bottom-3 w-24 h-24 text-blue-500/10" />
                                <div className="relative z-10">
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Days Worked</p>
                                    <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{personalStats?.daysWorked || 0} Days</h3>
                                    <p className="text-xs text-slate-400 mt-2">Logged across {personalStats?.groupsCount || groups.length} workgroups</p>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* Admin Dashboard Notice (if unauthorized user somehow views admin section) */}
            {activeSection === 'admin_dashboard' && !hasAdminAccess && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 mb-6 text-center">
                    <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
                    <h3 className="font-bold text-slate-900 dark:text-white">Admin Privileges Required</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        You are currently not registered as an administrator or creator of any workgroups. 
                        Once you create a workgroup or are appointed as an admin, administrative controls will appear here.
                    </p>
                    <button
                        onClick={() => navigate('/groups/create')}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                    >
                        Create Workgroup
                    </button>
                </div>
            )}

            {/* Admin Overview Cards (Shown in Admin Dashboard) */}
            {activeSection === 'admin_dashboard' && hasAdminAccess && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Managed Groups</span>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{adminManagedGroups.length}</h4>
                            <p className="text-xs text-emerald-600 font-semibold mt-1">Full management access</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Team Members</span>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                                {adminManagedGroups.reduce((acc, g) => acc + (g.members?.length || 0), 0)}
                            </h4>
                            <p className="text-xs text-blue-600 font-semibold mt-1">Across all managed groups</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Quick Action</span>
                            <p className="text-xs text-slate-500 mt-1">Form another farm team</p>
                            <button
                                onClick={() => navigate('/groups/create')}
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Create Group</span>
                            </button>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                            <Plus className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* TOOLBAR: Search, Filters, and Clear View Switching Controls     */}
            {/* ============================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs mb-6 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0" />
                        <input
                            type="text"
                            placeholder="Search workgroups by name, village..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full !pl-11 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Role Filter (in My Workgroups) */}
                    {activeSection === 'my_groups' && (
                        <div className="flex items-center gap-2">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Roles</option>
                                <option value="admin_or_owner">Admin / Owner</option>
                                <option value="member">Member Only</option>
                            </select>
                        </div>
                    )}

                    {/* View Switching Options (Clearly Labelled Card View & Table View) */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 self-end sm:self-auto">
                        {/* Option 1: Card View */}
                        <button
                            onClick={() => setViewMode('card')}
                            className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'card'
                                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                            title="Display workgroups as visual cards"
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span>Card View</span>
                        </button>

                        {/* Option 2: Table View */}
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'table'
                                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                            title="Display workgroups in a structured tabular layout"
                        >
                            <Table className="w-4 h-4" />
                            <span>Table View</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* ============================================================== */}
            {/* WORKGROUPS DISPLAY: Card View or Table View                    */}
            {/* ============================================================== */}
            {activeSection === 'admin_dashboard' && !hasAdminAccess ? (
                <PermissionDenied
                    title="Group Admin Privileges Required"
                    message="You do not currently own or manage any agricultural workgroups. Create a workgroup to manage member attendance and payouts."
                    requiredRole="Workgroup Admin / Owner"
                />
            ) : displayedGroups.length === 0 ? (
                searchQuery || roleFilter !== 'all' ? (
                    <NoSearchResults
                        query={searchQuery || (roleFilter !== 'all' ? `Role: ${roleFilter}` : '')}
                        onClear={() => { setSearchQuery(''); setRoleFilter('all'); }}
                        suggestions={[
                            "Search by workgroup name or village location",
                            "Set the role filter dropdown back to 'All Roles'",
                            "Clear your search query to see all your active workgroups"
                        ]}
                    />
                ) : (
                    <EmptyState
                        title={activeSection === 'admin_dashboard' ? "No Admin Workgroups" : "No Workgroups Joined Yet"}
                        description={activeSection === 'admin_dashboard' 
                            ? "You do not currently manage any workgroups as an admin or owner."
                            : "Form a collaborative farm labor team for daily field operations or ask your village group admin to add your phone number."}
                        tip="Workgroups help farmers coordinate seasonal harvesting labor, record daily field work, and compute transparent wage settlements."
                        icon={Users}
                        actionText="Create New Group"
                        onAction={() => navigate('/groups/create')}
                    />
                )
            ) : viewMode === 'card' ? (
                /* CARD VIEW (Responsive Grid) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                    {/* Create New Group Card */}
                    <div 
                        onClick={() => navigate('/groups/create')}
                        className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md min-h-[220px]"
                    >
                        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-xs">
                            <Plus className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-200">Create New Group</h3>
                        <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 text-center max-w-xs font-medium">
                            Form a collaborative farm labor team for daily field operations
                        </p>
                    </div>

                    {displayedGroups.map((group) => {
                        const userRole = getUserRoleInGroup(group);
                        const isGroupAdmin = userRole === 'Owner' || userRole === 'Admin';

                        return (
                            <Card 
                                key={group._id} 
                                className="p-6 cursor-pointer hover:shadow-lg hover:border-emerald-300/80 dark:hover:border-emerald-700/80 transition-all duration-200 relative overflow-hidden group border border-slate-200/80 dark:border-slate-700/80 rounded-3xl min-h-[220px] flex flex-col justify-between"
                                onClick={() => navigate(`/groups/${group._id}`)}
                            >
                                <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Users className="w-28 h-28 text-emerald-600" />
                                </div>
                                
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2 relative z-10">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                                            {group.name}
                                        </h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wider ${
                                            userRole === 'Owner' 
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60' 
                                                : userRole === 'Admin'
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                            {userRole}
                                        </span>
                                    </div>

                                    {group.village && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5 relative z-10 font-medium">
                                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>{group.village}</span>
                                        </p>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/70 relative z-10">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        <Users className="w-4 h-4 text-emerald-600" />
                                        <span>{group.members?.length || 0} Members</span>
                                    </div>

                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                                        <span>{isGroupAdmin ? 'Manage' : 'Open'}</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                /* TABLE VIEW (Structured Tabular Layout) */
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden animate-in fade-in duration-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-200/80 dark:border-slate-700/80">
                                <tr>
                                    <th className="px-6 py-4">Workgroup</th>
                                    <th className="px-6 py-4">Village / Location</th>
                                    <th className="px-6 py-4">Members</th>
                                    <th className="px-6 py-4">My Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {displayedGroups.map((group) => {
                                    const userRole = getUserRoleInGroup(group);
                                    const isGroupAdmin = userRole === 'Owner' || userRole === 'Admin';

                                    return (
                                        <tr 
                                            key={group._id} 
                                            onClick={() => navigate(`/groups/${group._id}`)}
                                            className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition cursor-pointer"
                                        >
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                                {group.name}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>{group.village || 'Not specified'}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                                                {group.members?.length || 0} workers
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                    userRole === 'Owner' 
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' 
                                                        : userRole === 'Admin'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                }`}>
                                                    {userRole}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                    {group.status || 'Active'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/groups/${group._id}`);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                                                >
                                                    <span>{isGroupAdmin ? 'Manage Group' : 'View Group'}</span>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

export default GroupDashboard;

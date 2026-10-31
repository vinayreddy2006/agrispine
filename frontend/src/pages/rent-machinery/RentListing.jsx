import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import { 
    MapPin, User, Filter, Search, Tractor, IndianRupee, 
    Calendar, CheckCircle, Clock, ShieldCheck, ArrowRight, 
    X, Phone, MessageSquare, ChevronDown, SlidersHorizontal, 
    RotateCcw, Sparkles, Star, Tag, Eye, Info
} from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

const CATEGORIES = [
    "All",
    "Tractor",
    "Harvester",
    "Rotavator",
    "Drone",
    "JCB",
    "Rice Planter",
    "Dozer",
    "Baler",
    "Ridger"
];

// Fallback high-resolution machine images
const CATEGORY_IMAGES = {
    tractor: '/machines/tractor.png',
    harvester: '/machines/harvestor.png',
    harvestor: '/machines/harvestor.png',
    rotavator: '/machines/rotavator.png',
    drone: '/machines/drone_spray.png',
    'drone spray': '/machines/drone_spray.png',
    jcb: '/machines/jcb.png',
    'rice planter': '/machines/rice_planter.png',
    dozer: '/machines/dozer.png',
    baler: '/machines/baler.png',
    ridger: '/machines/ridger.png'
};

const getMachineImage = (machine) => {
    if (machine?.image && machine.image.startsWith('http') && !machine.image.includes('cdn-icons-png.flaticon.com')) {
        return machine.image;
    }
    const cat = (machine?.type || '').toLowerCase().trim();
    return CATEGORY_IMAGES[cat] || '/machines/tractor.png';
};

const RentListing = () => {
    const { t } = useTranslation();
    const { type } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Raw Data State
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    // Selected location (Defaults to user profile village, customizable by user)
    const [userLocation, setUserLocation] = useState({
        village: '',
        district: ''
    });
    const [isChangingLocation, setIsChangingLocation] = useState(false);
    const [tempVillageInput, setTempVillageInput] = useState('');

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [selectedCategory, setSelectedCategory] = useState(
        type && type.toLowerCase() !== 'all' ? type : 'All'
    );
    const [selectedVillage, setSelectedVillage] = useState('All');
    const [selectedProximity, setSelectedProximity] = useState('all'); // 'all' | 'village' | 'district'
    const [selectedAvailability, setSelectedAvailability] = useState('all'); // 'all' | 'available' | 'booked'
    const [selectedUnit, setSelectedUnit] = useState('all'); // 'all' | 'hour' | 'acre' | 'day'
    const [selectedCondition, setSelectedCondition] = useState('all'); // 'all' | 'Excellent' | 'Good' | 'Fair'
    const [selectedRating, setSelectedRating] = useState('all'); // 'all' | '4' | '3'
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'nearest' | 'price_asc' | 'price_desc' | 'rating_desc'
    
    // UI Drawer / Filter Modal for Mobile
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Load Logged in User Profile
    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const u = JSON.parse(userStr);
                setCurrentUser(u);
                setUserLocation({
                    village: u.village || '',
                    district: u.district || ''
                });
                setTempVillageInput(u.village || '');
            } catch (e) {
                console.error("Error parsing user from localStorage:", e);
            }
        }
    }, []);

    // Fetch All Machines from Backend so that all public listings remain accessible
    useEffect(() => {
        const fetchMachines = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const headers = token ? { "auth-token": token } : {};

                const { data } = await api.get('/machines/fetchall', { headers });
                setMachines(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch machinery listings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMachines();
    }, []);

    const handleCategoryChange = (cat) => {
        setSelectedCategory(cat);
        const target = (!cat || cat.toLowerCase() === 'all') ? '/rent/list/all' : `/rent/list/${encodeURIComponent(cat)}`;
        navigate(target, { replace: true });
    };

    // Keep Category in sync with route param if changed
    useEffect(() => {
        if (type && type.toLowerCase() !== 'all') {
            setSelectedCategory(type);
        } else {
            setSelectedCategory('All');
        }
    }, [type]);

    // Available unique villages in the dataset for dropdown filter
    const availableVillages = useMemo(() => {
        const set = new Set();
        machines.forEach(m => {
            const v = m.user?.village || m.village;
            if (v && v.trim()) set.add(v.trim());
        });
        return Array.from(set).sort();
    }, [machines]);

    // Calculate Price Bounds
    const { minPriceAcrossList, maxPriceAcrossList } = useMemo(() => {
        if (!machines.length) return { minPriceAcrossList: 0, maxPriceAcrossList: 5000 };
        const prices = machines.map(m => Number(m.price) || 0).filter(p => p > 0);
        if (!prices.length) return { minPriceAcrossList: 0, maxPriceAcrossList: 5000 };
        return {
            minPriceAcrossList: Math.min(...prices),
            maxPriceAcrossList: Math.max(...prices)
        };
    }, [machines]);

    // --------------------------------------------------------------------------
    // RELEVANCE RANKING ALGORITHM (Intelligent Prioritization)
    // 1. Machines in user's village
    // 2. Machines in nearby villages (same district)
    // 3. Lower rental price
    // 4. Currently available for booking
    // 5. Better ratings (if genuine rating exists)
    // --------------------------------------------------------------------------
    const calculateRelevanceScore = (machine) => {
        let score = 0;
        const myVillage = (userLocation.village || '').trim().toLowerCase();
        const myDistrict = (userLocation.district || '').trim().toLowerCase();
        
        const machineVillage = (machine.user?.village || machine.village || '').trim().toLowerCase();
        const machineDistrict = (machine.user?.district || machine.district || '').trim().toLowerCase();

        // 1. Proximity: Exact Village Match (Highest Weight: 45 pts)
        if (myVillage && machineVillage && machineVillage === myVillage) {
            score += 45;
        } else if (myDistrict && machineDistrict && machineDistrict === myDistrict) {
            // Nearby village in same district (25 pts)
            score += 25;
        }

        // 2. Availability: Currently Available (Weight: 25 pts)
        if (machine.available !== false) {
            score += 25;
        }

        // 3. Affordability: Lower Rental Price (Weight: 20 pts)
        if (machine.price && maxPriceAcrossList > minPriceAcrossList) {
            const priceRatio = (Number(machine.price) - minPriceAcrossList) / (maxPriceAcrossList - minPriceAcrossList);
            score += Math.round((1 - priceRatio) * 20);
        } else if (machine.price) {
            score += 10;
        }

        // 4. Genuine Rating Boost (Weight: 10 pts, only if rating exists)
        if (machine.rating && machine.rating > 0) {
            score += Math.min(10, (machine.rating / 5) * 10);
        }

        return score;
    };

    // Filter and Sort Machines
    const filteredAndSortedMachines = useMemo(() => {
        let list = [...machines];

        // 1. Category Filter
        if (selectedCategory && selectedCategory !== 'All') {
            list = list.filter(m => (m.type || '').toLowerCase() === selectedCategory.toLowerCase());
        }

        // 2. Village / Location Filter
        if (selectedVillage && selectedVillage !== 'All') {
            list = list.filter(m => {
                const v = m.user?.village || m.village || '';
                return v.toLowerCase() === selectedVillage.toLowerCase();
            });
        }

        // 3. Proximity Filter
        if (selectedProximity === 'village' && userLocation.village) {
            list = list.filter(m => {
                const v = (m.user?.village || m.village || '').toLowerCase();
                return v === userLocation.village.toLowerCase();
            });
        } else if (selectedProximity === 'district' && userLocation.district) {
            list = list.filter(m => {
                const d = (m.user?.district || m.district || '').toLowerCase();
                return d === userLocation.district.toLowerCase();
            });
        }

        // 4. Availability Filter
        if (selectedAvailability === 'available') {
            list = list.filter(m => m.available !== false);
        } else if (selectedAvailability === 'booked') {
            list = list.filter(m => m.available === false);
        }

        // 5. Pricing Unit Filter
        if (selectedUnit && selectedUnit !== 'all') {
            list = list.filter(m => (m.priceUnit || 'hour').toLowerCase() === selectedUnit.toLowerCase());
        }

        // 6. Condition Filter
        if (selectedCondition && selectedCondition !== 'all') {
            list = list.filter(m => (m.condition || 'Good').toLowerCase() === selectedCondition.toLowerCase());
        }

        // 6b. Rating Filter
        if (selectedRating === '4') {
            list = list.filter(m => (m.rating || 0) >= 4);
        } else if (selectedRating === '3') {
            list = list.filter(m => (m.rating || 0) >= 3);
        }

        // 7. Price Range Filter
        if (minPrice) {
            list = list.filter(m => Number(m.price) >= Number(minPrice));
        }
        if (maxPrice) {
            list = list.filter(m => Number(m.price) <= Number(maxPrice));
        }

        // 8. Search Query Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(m => 
                (m.name || '').toLowerCase().includes(q) ||
                (m.type || '').toLowerCase().includes(q) ||
                (m.description || '').toLowerCase().includes(q) ||
                (m.user?.name || '').toLowerCase().includes(q) ||
                (m.user?.village || '').toLowerCase().includes(q) ||
                (m.village || '').toLowerCase().includes(q)
            );
        }

        // 9. Sorting
        list.sort((a, b) => {
            if (sortBy === 'recommended') {
                return calculateRelevanceScore(b) - calculateRelevanceScore(a);
            }
            if (sortBy === 'nearest') {
                const myVillage = (userLocation.village || '').toLowerCase();
                const aNear = (a.user?.village || a.village || '').toLowerCase() === myVillage ? 1 : 0;
                const bNear = (b.user?.village || b.village || '').toLowerCase() === myVillage ? 1 : 0;
                if (aNear !== bNear) return bNear - aNear;
                return (Number(a.price) || 0) - (Number(b.price) || 0);
            }
            if (sortBy === 'price_asc') {
                return (Number(a.price) || 0) - (Number(b.price) || 0);
            }
            if (sortBy === 'price_desc') {
                return (Number(b.price) || 0) - (Number(a.price) || 0);
            }
            if (sortBy === 'rating_desc') {
                return (Number(b.rating) || 0) - (Number(a.rating) || 0);
            }
            return 0;
        });

        return list;
    }, [
        machines, selectedCategory, selectedVillage, selectedProximity, 
        selectedAvailability, selectedUnit, selectedCondition, selectedRating, 
        minPrice, maxPrice, searchQuery, sortBy, userLocation, 
        minPriceAcrossList, maxPriceAcrossList
    ]);

    // Count Active Filters
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedCategory !== 'All') count++;
        if (selectedVillage !== 'All') count++;
        if (selectedProximity !== 'all') count++;
        if (selectedAvailability !== 'all') count++;
        if (selectedUnit !== 'all') count++;
        if (selectedCondition !== 'all') count++;
        if (selectedRating !== 'all') count++;
        if (minPrice || maxPrice) count++;
        if (searchQuery.trim()) count++;
        return count;
    }, [selectedCategory, selectedVillage, selectedProximity, selectedAvailability, selectedUnit, selectedCondition, minPrice, maxPrice, searchQuery]);

    const handleResetFilters = () => {
        setSelectedCategory('All');
        setSelectedVillage('All');
        setSelectedProximity('all');
        setSelectedAvailability('all');
        setSelectedUnit('all');
        setSelectedCondition('all');
        setSelectedRating('all');
        setMinPrice('');
        setMaxPrice('');
        setSearchQuery('');
        setSortBy('recommended');
    };

    // Helper: Location label
    const getProximityBadge = (machine) => {
        const myVillage = (userLocation.village || '').trim().toLowerCase();
        const myDistrict = (userLocation.district || '').trim().toLowerCase();
        const machineVillage = (machine.user?.village || machine.village || '').trim();
        const machineDistrict = (machine.user?.district || machine.district || '').trim();

        if (myVillage && machineVillage && machineVillage.toLowerCase() === myVillage) {
            return {
                label: 'In Your Village',
                color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            };
        }
        if (myDistrict && machineDistrict && machineDistrict.toLowerCase() === myDistrict) {
            return {
                label: machineVillage ? `${machineVillage} (Nearby)` : 'Same District',
                color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            };
        }
        if (machineVillage) {
            return {
                label: machineVillage,
                color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            };
        }
        return null;
    };

    // Chat / Message Provider
    const handleStartChat = async (e, machine) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }
            if (!machine.user?._id) {
                navigate(`/rent/details/${machine._id}`, { state: { machine } });
                return;
            }
            await api.post("/chat/conversations", {
                participantIds: [machine.user._id],
                isGroup: false
            }, { headers: { "auth-token": token } });
            navigate("/messages");
        } catch (err) {
            navigate(`/rent/details/${machine._id}`, { state: { machine } });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-28">
            
            {/* Header Navbar */}
            <PageHeader 
                title={
                    <span className="flex items-center gap-2">
                        <Tractor className="w-6 h-6 text-emerald-600" />
                        <span>Agricultural Machinery Rental</span>
                    </span>
                }
                subtitle="Compare verified tractors, harvesters, drones & farm implements from providers near you"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-5">
                
                {/* ============================================================== */}
                {/* 1. LOCATION CONTEXT & MARKETPLACE BANNER                       */}
                {/* ============================================================== */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
                            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Current Farm Location:
                                </span>
                                {isChangingLocation ? (
                                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                        <input
                                            type="text"
                                            value={tempVillageInput}
                                            onChange={(e) => setTempVillageInput(e.target.value)}
                                            placeholder="Enter village name..."
                                            className="px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <button
                                            onClick={() => {
                                                setUserLocation(prev => ({ ...prev, village: tempVillageInput.trim() }));
                                                setIsChangingLocation(false);
                                            }}
                                            className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                                        >
                                            Apply
                                        </button>
                                        <button
                                            onClick={() => {
                                                setTempVillageInput(userLocation.village);
                                                setIsChangingLocation(false);
                                            }}
                                            className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>{userLocation.village ? userLocation.village : 'Location Not Set'}</span>
                                        {userLocation.district && <span className="text-xs text-slate-400 font-normal">({userLocation.district})</span>}
                                        <button
                                            onClick={() => setIsChangingLocation(true)}
                                            className="text-xs font-bold text-emerald-600 hover:underline"
                                        >
                                            Change
                                        </button>
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Showing equipment ranked by proximity to your farm, affordability, and availability
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Badge */}
                    <div className="flex items-center gap-3 self-start md:self-auto">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-700/60">
                            {filteredAndSortedMachines.length} machines available
                        </span>
                        <button
                            onClick={() => navigate("/rent-machinery")}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline"
                        >
                            All Categories
                        </button>
                    </div>
                </div>

                {/* ============================================================== */}
                {/* 2. SEARCH BAR & CONTROLS TOOLBAR                               */}
                {/* ============================================================== */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
                    
                    {/* Top Row: Search Input + Sorting Dropdown + Filter Toggle */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by machine model, provider name, village..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Sort Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:inline">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            >
                                <option value="recommended">Recommended (Smart Match)</option>
                                <option value="nearest">Nearest Location First</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="rating_desc">Highest Rated</option>
                            </select>
                        </div>

                        {/* Filter Toggle Button */}
                        <button
                            onClick={() => setShowMobileFilters(prev => !prev)}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
                                activeFiltersCount > 0 || showMobileFilters
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                            }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Filters</span>
                            {activeFiltersCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-white text-emerald-700 text-xs flex items-center justify-center font-bold">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Horizontal Scrollable Category Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 text-xs">
                        {CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                            const count = cat === 'All' 
                                ? machines.length 
                                : machines.filter(m => (m.type || '').toLowerCase() === cat.toLowerCase()).length;

                            return (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`px-3 py-1.5 rounded-full whitespace-nowrap font-bold transition flex items-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                    }`}
                                >
                                    <span>{cat}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                        isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200/80 dark:bg-slate-600 text-slate-500 dark:text-slate-300'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Collapsible / Drawer Filters Section */}
                    {showMobileFilters && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-200">
                            
                            {/* Village Location Filter */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                    Village / Location
                                </label>
                                <select
                                    value={selectedVillage}
                                    onChange={(e) => setSelectedVillage(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                                >
                                    <option value="All">All Locations</option>
                                    {availableVillages.map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Availability Filter */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                    Availability Status
                                </label>
                                <select
                                    value={selectedAvailability}
                                    onChange={(e) => setSelectedAvailability(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                                >
                                    <option value="all">Any Status</option>
                                    <option value="available">Available Now</option>
                                    <option value="booked">Currently Booked</option>
                                </select>
                            </div>

                            {/* Rental Pricing Unit */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                    Pricing Unit
                                </label>
                                <select
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                                >
                                    <option value="all">All Units</option>
                                    <option value="hour">Per Hour</option>
                                    <option value="acre">Per Acre</option>
                                    <option value="day">Per Day</option>
                                </select>
                            </div>

                            {/* Equipment Condition */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                    Equipment Condition
                                </label>
                                <select
                                    value={selectedCondition}
                                    onChange={(e) => setSelectedCondition(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                                >
                                    <option value="all">Any Condition</option>
                                    <option value="Excellent">Excellent</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                </select>
                            </div>

                            {/* Minimum Rating */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                    Minimum Rating
                                </label>
                                <select
                                    value={selectedRating}
                                    onChange={(e) => setSelectedRating(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                                >
                                    <option value="all">All Ratings</option>
                                    <option value="4">⭐ 4.0+ Stars</option>
                                    <option value="3">⭐ 3.0+ Stars</option>
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="sm:col-span-2 flex items-center gap-2">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                        Min Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Min ₹"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                        Max Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Max ₹"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                                    />
                                </div>
                            </div>

                            {/* Reset Actions */}
                            <div className="sm:col-span-2 flex items-end justify-end gap-2 pt-2">
                                <button
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset Filters</span>
                                </button>
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                                >
                                    Apply Filters
                                </button>
                            </div>

                        </div>
                    )}

                    {/* Active Filter Chips */}
                    {activeFiltersCount > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                            <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">Active Filters:</span>
                            {selectedCategory !== 'All' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 font-semibold">
                                    Category: {selectedCategory}
                                    <button onClick={() => setSelectedCategory('All')}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {selectedVillage !== 'All' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 font-semibold">
                                    Village: {selectedVillage}
                                    <button onClick={() => setSelectedVillage('All')}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {selectedAvailability !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 font-semibold">
                                    Status: {selectedAvailability}
                                    <button onClick={() => setSelectedAvailability('all')}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {selectedUnit !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 font-semibold">
                                    Unit: {selectedUnit}
                                    <button onClick={() => setSelectedUnit('all')}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {(minPrice || maxPrice) && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                                    Price: ₹{minPrice || 0} - ₹{maxPrice || 'Any'}
                                    <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                                    Keyword: "{searchQuery}"
                                    <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            <button
                                onClick={handleResetFilters}
                                className="text-[11px] font-bold text-red-600 hover:underline ml-1"
                            >
                                Clear All
                            </button>
                        </div>
                    )}

                </div>

                {/* ============================================================== */}
                {/* 3. EQUIPMENT LISTINGS GRID                                      */}
                {/* ============================================================== */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 animate-pulse space-y-4">
                                <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full"></div>
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredAndSortedMachines.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-700/80 text-center shadow-xs">
                        <EmptyState 
                            title={t('rent.no_found', { defaultValue: 'No machinery found matching your filters' })}
                            description="Try clearing your search keyword, adjusting the price range, or selecting another equipment category."
                            icon={Tractor}
                            actionText="Reset All Filters"
                            onAction={handleResetFilters}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                        {filteredAndSortedMachines.map((machine) => {
                            const proximity = getProximityBadge(machine);
                            const machineImg = getMachineImage(machine);
                            const providerName = machine.user?.name || "Local Provider";
                            const providerPhone = machine.user?.phone || "";
                            const isAvailable = machine.available !== false;
                            const isCurrentUsersMachine = currentUser && machine.user && (
                                String(currentUser._id || currentUser.id) === String(machine.user._id || machine.user)
                            );

                            return (
                                <div
                                    key={machine._id}
                                    onClick={() => navigate(`/rent/details/${machine._id}`, { state: { machine } })}
                                    className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/90 dark:border-slate-700/90 shadow-xs hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 flex flex-col justify-between overflow-hidden group cursor-pointer"
                                >
                                    <div>
                                        {/* Image Section */}
                                        <div className="relative w-full h-52 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                                            <img
                                                src={machineImg}
                                                alt={machine.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = CATEGORY_IMAGES[(machine.type || '').toLowerCase()] || '/machines/tractor.png';
                                                }}
                                            />

                                            {/* Gradient Overlay for badges */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>

                                            {/* Top Badges: Category & Availability */}
                                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                                                <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-xs border border-white/40">
                                                    {machine.type || 'Machinery'}
                                                </span>

                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-xs flex items-center gap-1 ${
                                                    isAvailable 
                                                        ? 'bg-emerald-600/95 text-white' 
                                                        : 'bg-amber-600/95 text-white'
                                                }`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                                    <span>{isAvailable ? 'Available Now' : 'Currently Booked'}</span>
                                                </span>
                                            </div>

                                            {/* Bottom Overlay: Proximity badge if available */}
                                            {proximity && (
                                                <div className="absolute bottom-3 left-3">
                                                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border backdrop-blur-md shadow-xs flex items-center gap-1 ${proximity.color}`}>
                                                        <MapPin className="w-3 h-3" />
                                                        <span>{proximity.label}</span>
                                                    </span>
                                                </div>
                                            )}

                                            {/* Rating Badge (Only if genuine rating data exists) */}
                                            {machine.rating && machine.rating > 0 && (
                                                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-amber-300 text-xs font-bold flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span>{machine.rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Content Body */}
                                        <div className="p-5">
                                            {/* Machine Title & Price Row */}
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 leading-snug">
                                                    {machine.name}
                                                </h3>
                                            </div>

                                            {/* Price Display */}
                                            <div className="flex items-baseline gap-1.5 mb-3">
                                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                                    ₹{machine.price}
                                                </span>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                    / {machine.priceUnit === 'hour' ? 'hr' : machine.priceUnit === 'acre' ? 'acre' : 'day'}
                                                </span>
                                            </div>

                                            {/* Agricultural Tasks Badge */}
                                            {machine.tasks && machine.tasks.length > 0 && (
                                                <div className="mb-3 px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/50 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                                                    <span className="font-bold flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-emerald-600" />
                                                        <span>{machine.tasks.length} Operations Offered</span>
                                                    </span>
                                                    <span className="text-slate-500 text-[10px] truncate max-w-[140px]">
                                                        {machine.tasks.map(t => t.name).slice(0, 2).join(', ')}{machine.tasks.length > 2 ? '...' : ''}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Specifications / Condition Pill */}
                                            <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                                                    Condition: {machine.condition || 'Good'}
                                                </span>
                                                {machine.specs && (
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold text-[11px] truncate max-w-[150px]">
                                                        {machine.specs}
                                                    </span>
                                                )}
                                                {machine.modelYear && (
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                                                        {machine.modelYear}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Description snippet */}
                                            {machine.description && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                                                    {machine.description}
                                                </p>
                                            )}

                                            {/* Owner / Provider Row */}
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/70 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs overflow-hidden">
                                                        {machine.user?.profileImage ? (
                                                            <img src={machine.user.profileImage} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            providerName[0]?.toUpperCase() || 'P'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[130px]">
                                                            {providerName}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 block">
                                                            {machine.user?.village ? machine.user.village : 'Verified Provider'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Contact Owner Action */}
                                                {!isCurrentUsersMachine && (
                                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                        {providerPhone && (
                                                            <a
                                                                href={`tel:${providerPhone}`}
                                                                className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition border border-emerald-100 dark:border-emerald-900"
                                                                title={`Call ${providerName}`}
                                                            >
                                                                <Phone className="w-3.5 h-3.5" />
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleStartChat(e, machine)}
                                                            className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition border border-blue-100 dark:border-blue-900"
                                                            title="Chat with owner"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="px-5 pb-5 pt-1 flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/rent/details/${machine._id}`, { state: { machine } });
                                            }}
                                            className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>View Details</span>
                                        </button>

                                        {!isCurrentUsersMachine ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/rent/details/${machine._id}`, { state: { machine } });
                                                }}
                                                className={`py-2.5 px-4 rounded-2xl text-xs font-bold text-white transition flex items-center justify-center gap-1 shadow-xs ${
                                                    isAvailable 
                                                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                                                        : 'bg-slate-500 hover:bg-slate-600'
                                                }`}
                                            >
                                                <span>{isAvailable ? 'Book / Rent' : 'Request'}</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        ) : (
                                            <span className="text-[11px] font-bold text-slate-400 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                                Your Machine
                                            </span>
                                        )}
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
};

export default RentListing;

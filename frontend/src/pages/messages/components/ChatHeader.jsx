import React from 'react';
import { ArrowLeft, Search, MoreVertical, X, CheckSquare, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';

const ChatHeader = ({
    currentUser,
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    toggleGroupInfo,
    headerMenuOpen,
    setHeaderMenuOpen,
    setSelectionMode,
    setShowThemeModal,
    clearChat,
    handleLogout,
    t
}) => {
    const navigate = useNavigate();

    if (isSearching) {
        return (
            <div className="bg-surface px-4 py-3 flex items-center gap-3 shadow-sm border-b border-border z-20 shrink-0 h-[64px] animate-in slide-in-from-top-2">
                <button onClick={() => { setIsSearching(false); setSearchQuery(""); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-text-secondary"><ArrowLeft className="w-6 h-6" /></button>
                <input type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('village.search', { defaultValue: "Search messages..." })} className="flex-1 outline-none text-text-primary bg-transparent text-sm" />
                {searchQuery && <button onClick={() => setSearchQuery("")} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>}
            </div>
        );
    }

    return (
        <div className="bg-primary px-4 py-3 flex items-center justify-between text-white shadow-md z-20 shrink-0 relative">
            <div className="flex items-center gap-3 cursor-pointer" onClick={toggleGroupInfo}>
                <button onClick={(e) => { e.stopPropagation(); navigate("/dashboard"); }} className="p-1 hover:bg-white/20 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">{currentUser?.village?.charAt(0) || "V"}</div>
                <div className="overflow-hidden"><h1 className="font-bold text-lg leading-tight truncate max-w-[180px] md:max-w-xs text-white">{currentUser?.village || "Village"}</h1><p className="text-xs text-primary-light hover:underline truncate">{t('village.click_info', { defaultValue: 'click for info' })}</p></div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 relative">
                <Search className="w-5 h-5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsSearching(true)} />
                <div className="relative">
                    <MoreVertical className="w-5 h-5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setHeaderMenuOpen(!headerMenuOpen)} />
                    {headerMenuOpen && (
                        <div className="absolute right-0 top-10 w-56 bg-surface text-text-primary rounded-xl shadow-xl py-2 z-50 border border-border animate-in fade-in zoom-in-95">
                            <button className="w-full text-left px-4 py-3 hover:bg-background text-sm font-medium transition-colors" onClick={() => { toggleGroupInfo(); setHeaderMenuOpen(false); }}>{t('village.group_info', { defaultValue: "Group Info" })}</button>
                            <button className="w-full text-left px-4 py-3 hover:bg-background text-sm font-medium flex items-center gap-3 transition-colors" onClick={() => { setSelectionMode(true); setHeaderMenuOpen(false); }}><CheckSquare className="w-4 h-4 text-text-muted" /> {t('village.select_msgs', { defaultValue: "Select Messages" })}</button>
                            <button className="w-full text-left px-4 py-3 hover:bg-background text-sm font-medium flex items-center gap-3 transition-colors" onClick={() => { setShowThemeModal(true); setHeaderMenuOpen(false); }}><ImageIcon className="w-4 h-4 text-text-muted" /> {t('village.change_theme', { defaultValue: "Change Theme" })}</button>
                            <div className="h-px bg-border my-1"></div>
                            <button className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium text-red-600 transition-colors" onClick={clearChat}>{t('village.clear_chat', { defaultValue: "Clear Chat" })}</button>
                            <button className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium text-red-600 flex items-center gap-3 transition-colors" onClick={handleLogout}><LogOut className="w-4 h-4" /> {t('common.logout', { defaultValue: "Log out" })}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;

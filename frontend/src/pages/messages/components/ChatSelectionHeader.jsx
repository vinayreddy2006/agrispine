import React from 'react';
import { X, Reply, Star, Trash2, MoreVertical, Forward, Copy, Info } from 'lucide-react';

const ChatSelectionHeader = ({
    selectedMessages,
    cancelSelection,
    handleReplySelected,
    handleBulkStar,
    handleBulkDelete,
    selectionMenuOpen,
    setSelectionMenuOpen,
    handleCopySelected,
    handleInfoSelected,
    t
}) => {
    return (
        <div className="bg-[#f0f8ff] dark:bg-[#1f2c34] px-4 py-3 flex items-center justify-between text-text-primary shadow-md z-20 shrink-0 border-b border-border select-none animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-4">
                <button onClick={cancelSelection} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                <span className="font-bold text-lg">{selectedMessages.length} {t('village.selected', { defaultValue: 'Selected' })}</span>
            </div>
            <div className="flex items-center gap-1">
                {selectedMessages.length === 1 && <button onClick={handleReplySelected} className="p-2 hover:bg-white/20 rounded-full transition-colors" title={t('community.reply', { defaultValue: "Reply" })}><Reply className="w-5 h-5" /></button>}
                <button onClick={handleBulkStar} className="p-2 hover:bg-white/20 rounded-full transition-colors" title={t('village.star', { defaultValue: "Star" })}><Star className="w-5 h-5" /></button>
                <button onClick={handleBulkDelete} className="p-2 hover:bg-white/20 rounded-full transition-colors" title={t('common.delete', { defaultValue: "Delete" })}><Trash2 className="w-5 h-5" /></button>
                <div className="relative">
                    <button onClick={() => setSelectionMenuOpen(!selectionMenuOpen)} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="More"><MoreVertical className="w-5 h-5" /></button>
                    {selectionMenuOpen && (
                        <div className="absolute right-0 top-12 w-48 bg-surface text-text-primary rounded-xl shadow-xl py-2 z-50 border border-border animate-in fade-in zoom-in-95">
                            <button className="w-full text-left px-4 py-3 hover:bg-background text-sm font-medium flex items-center gap-3 transition-colors"><Forward className="w-4 h-4 text-text-muted" /> {t('village.forward', { defaultValue: "Forward" })}</button>
                            <button className="w-full text-left px-4 py-3 hover:bg-background text-sm font-medium flex items-center gap-3 transition-colors" onClick={handleCopySelected}><Copy className="w-4 h-4 text-text-muted" /> {t('village.copy', { defaultValue: "Copy" })}</button>
                            {selectedMessages.length === 1 && <button className="w-full text-left px-4 py-3 hover:bg-background text-sm font-medium flex items-center gap-3 transition-colors" onClick={handleInfoSelected}><Info className="w-4 h-4 text-text-muted" /> {t('village.info', { defaultValue: "Info" })}</button>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatSelectionHeader;

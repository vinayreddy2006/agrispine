import React from 'react';
import { X, Upload, Check } from 'lucide-react';

const ThemeModal = ({ 
  showThemeModal, 
  setShowThemeModal, 
  chatBackground, 
  handleThemeSelect, 
  handleCustomUpload, 
  AGRI_THEMES, 
  t 
}) => {
  if (!showThemeModal) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">{t('village.choose_theme', { defaultValue: "Chat Appearance" })}</h3>
            <p className="text-sm text-text-secondary">{t('village.theme_subtitle', { defaultValue: "Personalize your village chat background" })}</p>
          </div>
          <button onClick={() => setShowThemeModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-text-secondary hover:text-text-primary">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto bg-background/50">
          
          <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Custom</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-8">
            <label className="cursor-pointer group relative aspect-[4/5] rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center bg-surface transition-all overflow-hidden shadow-sm hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                {t('village.upload_custom', { defaultValue: "Upload Photo" })}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />
            </label>
          </div>

          <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Presets</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {AGRI_THEMES.map((theme) => {
              const isSelected = chatBackground.id === theme.id;
              return (
                <div 
                  key={theme.id} 
                  onClick={() => handleThemeSelect(theme)} 
                  className={`
                    relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-200
                    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'ring-1 ring-border hover:ring-gray-300'}
                  `}
                >
                  <img 
                    src={theme.url} 
                    alt={theme.name} 
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-105' : 'hover:scale-105'}`} 
                    onError={(e) => { e.target.src = 'https://www.transparenttextures.com/patterns/cubes.png'; }} 
                  />
                  
                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none flex flex-col justify-end p-4">
                    <span className="text-white font-medium text-sm drop-shadow-md">{theme.name}</span>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-primary text-white p-1.5 rounded-full shadow-lg animate-in zoom-in">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-surface border-t border-border flex justify-between items-center">
          <p className="text-xs text-text-muted">
            {t('village.theme_hint', { defaultValue: "Changes are saved to your device automatically." })}
          </p>
          <button onClick={() => setShowThemeModal(false)} className="px-6 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors text-sm shadow-sm">
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default ThemeModal;

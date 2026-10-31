import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const MediaLightbox = ({ isOpen, onClose, media = [], initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex, isOpen]);

    const handlePrev = useCallback(() => {
        setCurrentIndex(prev => (prev === 0 ? media.length - 1 : prev - 1));
    }, [media.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex(prev => (prev === media.length - 1 ? 0 : prev + 1));
    }, [media.length]);

    // Handle escape and arrow keys
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose, handlePrev, handleNext]);

    if (!isOpen || !media || media.length === 0) return null;

    const currentItem = media[currentIndex] || media[0];
    const total = media.length;

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Top Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20 pointer-events-auto">
                <span className="text-sm font-semibold tracking-wide bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md">
                    {currentIndex + 1} of {total}
                </span>

                <div className="flex items-center gap-2">
                    <a
                        href={currentItem.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition"
                        title="Open Original"
                    >
                        <Download className="w-5 h-5" />
                    </a>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition"
                        title="Close (Esc)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Media Content */}
            <div 
                className="relative max-w-6xl max-h-[85vh] w-full mx-4 flex items-center justify-center select-none"
                onClick={(e) => e.stopPropagation()}
            >
                {currentItem.type === 'video' ? (
                    <video
                        src={currentItem.url}
                        controls
                        autoPlay
                        playsInline
                        className="max-h-[82vh] max-w-full rounded-2xl shadow-2xl object-contain"
                    />
                ) : (
                    <img
                        src={currentItem.url}
                        alt={`Preview ${currentIndex + 1}`}
                        className="max-h-[82vh] max-w-full rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-150"
                    />
                )}
            </div>

            {/* Navigation Buttons */}
            {total > 1 && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrev();
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md transition shadow-2xl z-20"
                        title="Previous (Left arrow)"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNext();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md transition shadow-2xl z-20"
                        title="Next (Right arrow)"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}
        </div>
    );
};

export default MediaLightbox;


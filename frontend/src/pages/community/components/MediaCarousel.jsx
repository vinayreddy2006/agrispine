import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Maximize2, Image as ImageIcon } from 'lucide-react';

const MediaCarousel = ({ media = [], onOpenLightbox, onMediaClick, altTitle = 'Post media' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);

    if (!Array.isArray(media) || media.length === 0) return null;

    const currentItem = media[currentIndex] || media[0];
    const total = media.length;

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
    };

    // Mobile swipe handlers
    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const diff = touchStartX.current - touchEndX.current;
        if (diff > 50) {
            // Swiped left -> next
            setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
        } else if (diff < -50) {
            // Swiped right -> prev
            setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    return (
        <div 
            className="relative w-full bg-slate-900 rounded-2xl overflow-hidden my-3 select-none group border border-slate-200/80 dark:border-slate-800"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Main Media Display */}
            <div 
                className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[520px] flex items-center justify-center bg-black/90 cursor-pointer"
                onClick={(e) => {
                    if (onMediaClick) {
                        e.stopPropagation();
                        onMediaClick(currentIndex);
                    }
                }}
            >
                {currentItem.type === 'video' ? (
                    <video
                        src={currentItem.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <img
                        src={currentItem.url}
                        alt={`${altTitle} - ${currentIndex + 1}`}
                        className="w-full h-full object-contain cursor-pointer transition-transform duration-200"
                        onClick={(e) => {
                            if (onMediaClick) {
                                e.stopPropagation();
                                onMediaClick(currentIndex);
                            } else if (onOpenLightbox) {
                                e.stopPropagation();
                                onOpenLightbox(currentIndex);
                            }
                        }}
                        loading="lazy"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80";
                        }}
                    />
                )}

                {/* Enlarge / Fullscreen Button for images */}
                {currentItem.type !== 'video' && onOpenLightbox && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenLightbox(currentIndex);
                        }}
                        className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition shadow-md"
                        title="View Fullscreen"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                )}

                {/* 1/N Counter Badge (Instagram Style) */}
                {total > 1 && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold tracking-wider shadow">
                        {currentIndex + 1} / {total}
                    </div>
                )}
            </div>

            {/* Navigation Arrows (Instagram Style) */}
            {total > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition shadow-lg opacity-80 hover:opacity-100 z-10"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition shadow-lg opacity-80 hover:opacity-100 z-10"
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Pagination Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md z-10">
                        {media.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentIndex(idx);
                                }}
                                className={`transition-all rounded-full ${
                                    idx === currentIndex
                                        ? 'w-5 h-2 bg-emerald-500'
                                        : 'w-2 h-2 bg-white/60 hover:bg-white'
                                }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default MediaCarousel;


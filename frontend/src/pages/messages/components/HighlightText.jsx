import React from 'react';

const HighlightText = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ?
                    <span key={i} className="bg-yellow-200 text-gray-900">{part}</span> : part
            )}
        </span>
    );
};

export default HighlightText;

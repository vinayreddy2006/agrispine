export const getMessageDate = (dateString, t) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return t('date.today', { defaultValue: "Today" });
    if (date.toDateString() === yesterday.toDateString()) return t('date.yesterday', { defaultValue: "Yesterday" });
    return date.toLocaleDateString();
};

export const groupMessagesByDate = (msgs, isSearching, searchQuery, t) => {
    const filtered = isSearching
        ? msgs.filter(m => m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()))
        : msgs;

    const groups = {};
    filtered.forEach(msg => {
        const date = getMessageDate(msg.createdAt, t);
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
    });
    return groups;
};

export const getUserColor = (name) => {
    const colors = ["text-red-500", "text-orange-500", "text-purple-500", "text-blue-500", "text-pink-600", "text-teal-600"];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
};

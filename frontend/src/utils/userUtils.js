export const renderName = (user, currentUser) => {
    if (!user) return '';
    if (!currentUser) return user.name || '';
    
    const userId = user._id || user.id;
    const currentId = currentUser._id || currentUser.id;
    
    return userId === currentId ? `${user.name} (You)` : user.name;
};

export const getAvatarUrl = (user) => {
    if (!user) return 'https://ui-avatars.com/api/?name=User&background=random';
    if (user.profileImage) return user.profileImage;
    if (user.name) return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
    return 'https://ui-avatars.com/api/?name=User&background=random';
};

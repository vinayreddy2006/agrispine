import React from 'react';
import Button from '../../../components/ui/Button';

const NewPostForm = ({ newPost, setNewPost, handlePostSubmit, t }) => {
    return (
        <div className="bg-surface dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-900/30 mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-text-primary dark:text-white mb-1">{t('community.create')}</h3>
            <p className="text-sm text-text-muted dark:text-gray-400 mb-4">{t('community.ask_hint', { defaultValue: 'Ask about crops, diseases, or machinery.' })}</p>
            <form onSubmit={handlePostSubmit} className="space-y-4">
                <input
                    placeholder={t('community.topic_ph', { defaultValue: "Topic Title..." })}
                    className="w-full px-4 py-3 border border-border dark:border-gray-600 bg-surface dark:bg-gray-700 text-text-primary dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    required
                />
                <textarea
                    rows="4"
                    placeholder={t('community.desc_ph', { defaultValue: "Describe details..." })}
                    className="w-full px-4 py-3 border border-border dark:border-gray-600 bg-surface dark:bg-gray-700 text-text-primary dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    required
                />
                <div className="flex justify-end">
                    <Button type="submit" variant="primary" className="bg-purple-600 hover:bg-purple-700 px-8">
                        {t('community.post')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default NewPostForm;

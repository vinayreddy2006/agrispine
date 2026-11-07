import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    X, Image as ImageIcon, Video, HelpCircle, Sparkles, Tag, 
    Upload, AlertCircle, Loader2, Check, ArrowRight, ShieldCheck 
} from 'lucide-react';
import api from '../../../utils/api';
import Swal from 'sweetalert2';

const CATEGORIES = [
    'Crop Management',
    'Pest & Disease',
    'Irrigation',
    'Fertilizers & Nutrients',
    'Weather',
    'Equipment',
    'Market Prices',
    'General Agriculture',
    'Others'
];

const POST_TYPES = [
    { id: 'general', label: 'General Post', icon: Sparkles, desc: 'Share thoughts or farm news' },
    { id: 'question', label: 'Ask Question', icon: HelpCircle, desc: 'Get advice from expert farmers' },
    { id: 'experience', label: 'Share Experience', icon: ShieldCheck, desc: 'Tips, yields & learnings' },
    { id: 'update', label: 'Field Update', icon: Tag, desc: 'Live crop & weather conditions' }
];

const CreatePostModal = ({ isOpen, onClose, onPostCreated, currentUser, initialType = 'general' }) => {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [postType, setPostType] = useState(initialType || 'general');
    const [category, setCategory] = useState('General Agriculture');
    const [customTopic, setCustomTopic] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    // Handle file selection (Images & Videos)
    const handleFiles = (files) => {
        const fileList = Array.from(files);
        const validFiles = [];
        const newPreviews = [];

        for (const file of fileList) {
            // Check size (20MB max)
            if (file.size > 20 * 1024 * 1024) {
                Swal.fire('File too large', `"${file.name}" exceeds the 20MB limit.`, 'warning');
                continue;
            }

            const isImage = file.mimetype ? file.mimetype.startsWith('image/') : file.type.startsWith('image/');
            const isVideo = file.mimetype ? file.mimetype.startsWith('video/') : file.type.startsWith('video/');

            if (!isImage && !isVideo) {
                Swal.fire('Unsupported format', `"${file.name}" is not a supported image or video file.`, 'warning');
                continue;
            }

            validFiles.push(file);
            newPreviews.push({
                file,
                url: URL.createObjectURL(file),
                type: isVideo ? 'video' : 'image',
                name: file.name,
                size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
            });
        }

        // Limit to max 10 files total
        setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 10));
        setPreviews(prev => [...prev, ...newPreviews].slice(0, 10));
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            // Revoke object URL to avoid memory leaks
            if (prev[index]?.url) URL.revokeObjectURL(prev[index].url);
            return prev.filter((_, i) => i !== index);
        });
    };

    // Drag and drop handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    // Form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedContent = content.trim();
        const trimmedTitle = title.trim();

        if (!trimmedContent && !trimmedTitle && selectedFiles.length === 0) {
            Swal.fire('Empty Post', 'Please add some text, a question, or upload photos/videos.', 'info');
            return;
        }

        if (category === 'Others' && !customTopic.trim()) {
            Swal.fire('Topic Required', 'Please enter your custom topic under "Specify Your Topic".', 'info');
            return;
        }

        const resolvedCategory = category === 'Others' ? customTopic.trim() : category;

        setIsUploading(true);
        setUploadProgress(10);

        try {
            const token = localStorage.getItem('token');
            let uploadedMedia = [];

            // 1. Upload media files if any
            if (selectedFiles.length > 0) {
                const formData = new FormData();
                selectedFiles.forEach(file => {
                    formData.append('files', file);
                });

                setUploadProgress(30);

                const uploadRes = await api.post('/community/upload', formData, {
                    headers: {
                        'auth-token': token,
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percent = Math.round((progressEvent.loaded * 70) / (progressEvent.total || 1));
                        setUploadProgress(30 + percent);
                    }
                });

                if (uploadRes.data?.files) {
                    uploadedMedia = uploadRes.data.files;
                }
            }

            setUploadProgress(90);

            // 2. Create the post in backend
            const postPayload = {
                title: trimmedTitle,
                content: trimmedContent,
                postType,
                category: resolvedCategory,
                customTopic: customTopic.trim(),
                media: uploadedMedia
            };

            const response = await api.post('/community/add', postPayload, {
                headers: { 'auth-token': token }
            });

            setUploadProgress(100);

            Swal.fire({
                title: 'Published!',
                text: 'Your post is now live in the community.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            // Clean up previews
            previews.forEach(p => p.url && URL.revokeObjectURL(p.url));
            setTitle('');
            setContent('');
            setCustomTopic('');
            setSelectedFiles([]);
            setPreviews([]);

            if (onPostCreated) {
                onPostCreated(response.data);
            }
            onClose();

        } catch (err) {
            console.error('Failed to create post:', err);
            Swal.fire('Error', err.response?.data?.message || 'Could not publish post. Please try again.', 'error');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                            {currentUser?.name ? currentUser.name[0].toUpperCase() : 'F'}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                                {currentUser?.name || 'Farmer'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Post to AgriSpine Community
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Post Type Selector */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Post Type
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {POST_TYPES.map((pt) => {
                                const Icon = pt.icon;
                                const isSelected = postType === pt.id;
                                return (
                                    <button
                                        key={pt.id}
                                        type="button"
                                        onClick={() => setPostType(pt.id)}
                                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                                            isSelected
                                                ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm'
                                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                                        <span className="text-xs">{pt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category Selector */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Category / Agricultural Topic
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        {/* Custom Topic Input if Others is selected */}
                        {category === 'Others' && (
                            <div className="mt-2.5 animate-in fade-in duration-150">
                                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5" />
                                    Specify Your Topic <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter your topic..."
                                    value={customTopic}
                                    onChange={(e) => setCustomTopic(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-500 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                />
                            </div>
                        )}
                    </div>

                    {/* Title Input */}
                    <div>
                        <input
                            type="text"
                            placeholder={
                                postType === 'question' 
                                    ? "What is your agricultural question? (e.g. Yellow leaves on cotton)" 
                                    : "Title / Topic summary..."
                            }
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                        />
                    </div>

                    {/* Content Textarea */}
                    <div>
                        <textarea
                            rows={4}
                            placeholder={
                                postType === 'question'
                                    ? "Describe your field issue, crop symptoms, soil type, and what fertilizers you recently used..."
                                    : postType === 'experience'
                                    ? "Share your farming experience, yield results, technique, or pesticide recipe..."
                                    : "What would you like to share with the farmer community? Describe details, tips or field updates..."
                            }
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition"
                        />
                    </div>

                    {/* Media Upload & Preview Section (Instagram-Style) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                                Photos & Videos ({previews.length}/10)
                            </label>
                            <span className="text-[11px] text-slate-400">Max 20MB per file</span>
                        </div>

                        {/* Drop Zone */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${
                                dragActive
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Click or drag photos and videos here
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    Add crop photos, pest signs, or field harvest clips (Instagram carousel supported)
                                </p>
                            </div>
                        </div>

                        {/* Previews Grid */}
                        {previews.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                                {previews.map((item, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group shadow-sm">
                                        {item.type === 'video' ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-2">
                                                <Video className="w-8 h-8 text-emerald-400 mb-1" />
                                                <span className="text-[10px] truncate max-w-full font-medium">{item.name}</span>
                                                <span className="text-[9px] text-slate-400">{item.size}</span>
                                            </div>
                                        ) : (
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}

                                        {/* Remove button */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(idx);
                                            }}
                                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-red-600 text-white transition shadow-md"
                                            title="Remove"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Counter badge */}
                                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                                            #{idx + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upload Progress Bar */}
                    {isUploading && (
                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                <span>Uploading media & publishing post...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-200 rounded-full"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isUploading}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading || (!content.trim() && !title.trim() && selectedFiles.length === 0)}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('common.loading', 'Publishing...')}
                                </>
                            ) : (
                                <>
                                    {t('community_extra.create_post', 'Publish Post')}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;


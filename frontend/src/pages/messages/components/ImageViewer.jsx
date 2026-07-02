import React from 'react';
import { User, Star, Reply, Forward, Download, X } from 'lucide-react';

const ImageViewer = ({ 
  viewImage, 
  setViewImage, 
  getSenderImage, 
  getFileUrl, 
  currentUser, 
  starMessage, 
  setReplyingTo, 
  downloadImage 
}) => {
  if (!viewImage) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col animate-in fade-in duration-200">
        <div className="flex items-center justify-between p-4 bg-black/40 text-white backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                    {getSenderImage(viewImage) ? <img src={getSenderImage(viewImage)} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-400" />}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm">{viewImage.senderName}</span>
                    <span className="text-xs text-gray-300">{new Date(viewImage.createdAt).toLocaleString()}</span>
                </div>
            </div>
            <div className="flex gap-4">
                <button className="p-2 hover:bg-white/10 rounded-full transition" title="Star" onClick={() => starMessage(viewImage._id)}>
                  <Star className={`w-6 h-6 ${viewImage.starredBy?.includes(currentUser.id || currentUser._id) ? "fill-yellow-500 text-yellow-500" : ""}`} />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition" title="Reply" onClick={() => { setViewImage(null); setReplyingTo(viewImage); }}>
                  <Reply className="w-6 h-6" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition" title="Forward">
                  <Forward className="w-6 h-6" />
                </button>
                <button onClick={() => downloadImage(viewImage.image)} className="p-2 hover:bg-white/10 rounded-full transition" title="Download">
                  <Download className="w-6 h-6" />
                </button>
                <button onClick={() => setViewImage(null)} className="p-2 hover:bg-white/10 rounded-full transition">
                  <X className="w-6 h-6" />
                </button>
            </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img src={getFileUrl(viewImage.image)} alt="Full View" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        </div>
        {viewImage.text && <div className="p-4 bg-black/40 text-white text-center backdrop-blur-md"><p>{viewImage.text}</p></div>}
    </div>
  );
};

export default ImageViewer;

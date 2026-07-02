import React from 'react';
import { X, CheckCheck, Check, User, MessageSquare, Star, Ban } from 'lucide-react';
import api from '../../../utils/api';
import Swal from 'sweetalert2';
import { renderName, getAvatarUrl } from '../../../utils/userUtils';

const ChatInfoSidebar = ({ 
  showGroupInfo, 
  setShowGroupInfo, 
  showMessageInfo, 
  setShowMessageInfo, 
  showPollInfo,
  setShowPollInfo,
  currentUser, 
  members, 
  loadingMembers, 
  t,
  onStartPrivateChat,
  activeChat,
  refetchUser,
  fetchConversations
}) => {
  const [isUploadingIcon, setIsUploadingIcon] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const startPrivateChat = async (user) => {
    try {
        const token = localStorage.getItem("token");
        const { data } = await api.post("/chat/conversations", {
            participantIds: [user._id],
            isGroup: false
        }, { headers: { "auth-token": token } });
        
        setShowGroupInfo(false);
        if (onStartPrivateChat) onStartPrivateChat(data);
    } catch (err) {
        Swal.fire("Error", "Could not start chat", "error");
    }
  };

  if (!showGroupInfo && !showMessageInfo && !showPollInfo) return null;

  const getOtherParticipant = () => {
    if (!activeChat || activeChat.isGroup) return null;
    if (activeChat.participants.length === 1) return currentUser; 
    return activeChat.participants.find(p => p._id !== (currentUser.id || currentUser._id)) || currentUser;
  };

  const otherUser = getOtherParticipant();

  const isBlocked = !activeChat?.isGroup && currentUser?.blockedUsers?.some(u => {
      const id = u._id || u;
      return id === otherUser?._id;
  });

  const handleBlockUser = async () => {
      if (!otherUser) return;
      try {
          const token = localStorage.getItem("token");
          const action = isBlocked ? "unblock" : "block";
          
          const confirm = await Swal.fire({
              title: isBlocked ? "Unblock User?" : "Block User?",
              text: isBlocked ? "They will be able to message you again." : "They will no longer be able to message you.",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: isBlocked ? "#10b981" : "#ef4444",
              confirmButtonText: "Yes",
              cancelButtonText: "Cancel"
          });

          if (!confirm.isConfirmed) return;

          await api.post(`/auth/${action}/${otherUser._id}`, {}, { headers: { "auth-token": token } });
          if (refetchUser) await refetchUser();
          
          Swal.fire({
              toast: true,
              position: 'bottom',
              icon: 'success',
              title: `User ${action}ed successfully`,
              showConfirmButton: false,
              timer: 2000
          });
      } catch (err) {
          Swal.fire("Error", "Action failed", "error");
      }
  };

  const handleGroupIconUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setIsUploadingIcon(true);
      const formData = new FormData();
      formData.append("image", file);
      
      try {
          const token = localStorage.getItem("token");
          await api.put(`/chat/conversations/${activeChat._id}/icon`, formData, {
              headers: { "auth-token": token, "Content-Type": "multipart/form-data" }
          });
          
          if (fetchConversations) fetchConversations();
          Swal.fire({ toast: true, position: 'bottom', icon: 'success', title: 'Group icon updated', showConfirmButton: false, timer: 1500 });
      } catch (err) {
          Swal.fire("Error", "Could not upload image", "error");
      } finally {
          setIsUploadingIcon(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
      }
  };

  return (
    <div className="absolute right-0 top-0 h-full w-80 lg:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 h-[64px] px-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <button onClick={() => { setShowGroupInfo(false); setShowMessageInfo(null); setShowPollInfo(null); }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">
              {showPollInfo ? "Poll Details" : showMessageInfo ? t('village.msg_info', { defaultValue: "Message Info" }) : (activeChat?.isGroup ? "Group Info" : "Contact Info")}
            </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
            {showPollInfo ? (
                <div className="pb-6">
                    <div className="bg-white dark:bg-gray-900 shadow-sm p-4 mb-2">
                        <p className="text-xl font-bold text-gray-800 dark:text-white mb-2">{showPollInfo.poll.question}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total votes: {showPollInfo.poll.options.reduce((sum, o) => sum + o.votes.length, 0)}</p>
                    </div>
                    {showPollInfo.poll.options.map((opt, i) => {
                        if (opt.votes.length === 0) return null;
                        return (
                            <div key={i} className="bg-white dark:bg-gray-900 shadow-sm mb-2">
                                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{opt.text}</span>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{opt.votes.length} votes</span>
                                </div>
                                <div>
                                    {members
                                        .filter(m => opt.votes.includes(m._id))
                                        .map(m => (
                                            <div key={m._id} className="flex items-center gap-3 p-3 border-b border-gray-50 dark:border-gray-800 mx-2">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                                                    <img src={getAvatarUrl(m)} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-medium dark:text-gray-200">{renderName(m, currentUser)}</h3>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : showMessageInfo ? (
                <div>
                    <div className="p-6 bg-white dark:bg-gray-900 shadow-sm mb-2 border-b border-gray-200 dark:border-gray-800">
                        <div className={`p-3 rounded-lg ${showMessageInfo.senderId === (currentUser.id || currentUser._id) ? "bg-[#d9fdd3] dark:bg-[#005c4b]" : "bg-white dark:bg-gray-800 border dark:border-gray-700"} w-fit max-w-[85%] mx-auto`}>
                            {showMessageInfo.image && <img src={showMessageInfo.image} className="w-full h-auto rounded mb-2" />}
                            {showMessageInfo.text && <p className="text-sm dark:text-gray-200">{showMessageInfo.text}</p>}
                            <div className="flex justify-end mt-1"><span className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(showMessageInfo.createdAt).toLocaleTimeString()} <CheckCheck className="w-3 h-3 inline text-blue-500" /></span></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 mb-2">
                        <div className="px-4 py-3 flex items-center gap-3">
                            <CheckCheck className="w-5 h-5 text-blue-500" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Read</p>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(showMessageInfo.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="px-4 py-3 flex items-center gap-3 border-t border-gray-100 dark:border-gray-800">
                            <CheckCheck className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Delivered</p>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(showMessageInfo.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="px-4 py-3 flex items-center gap-3 border-t border-gray-100 dark:border-gray-800">
                            <Check className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Sent</p>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(showMessageInfo.createdAt).toLocaleTimeString()}</span>
                        </div>
                    </div>

                    {activeChat?.isGroup && (
                        <div className="bg-white dark:bg-gray-900 shadow-sm">
                            <div className="p-4 text-gray-500 dark:text-gray-400 text-sm font-bold flex items-center gap-2 border-b border-gray-200 dark:border-gray-800"><CheckCheck className="w-4 h-4 text-blue-500" /> Read by</div>
                            {members
                                .filter(m =>
                                    showMessageInfo.readBy &&
                                    showMessageInfo.readBy.includes(m._id) &&
                                    m._id !== showMessageInfo.senderId
                                )
                                .map((m) => (
                                    <div key={m._id} className="flex items-center gap-3 p-3 border-b border-gray-50 dark:border-gray-800">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"><img src={getAvatarUrl(m)} className="w-full h-full object-cover" /></div>
                                        <div>
                                            <h3 className="text-sm font-medium dark:text-gray-200">{renderName(m, currentUser)}</h3>
                                            <p className="text-xs text-gray-400">Viewed</p>
                                        </div>
                                    </div>
                                ))}

                            <div className="p-4 text-gray-500 dark:text-gray-400 text-sm font-bold flex items-center gap-2 border-y border-gray-200 dark:border-gray-800 mt-2"><CheckCheck className="w-4 h-4 text-gray-400" /> Delivered to</div>
                            {members
                                .filter(m =>
                                    (!showMessageInfo.readBy || !showMessageInfo.readBy.includes(m._id)) &&
                                    m._id !== showMessageInfo.senderId
                                )
                                .map((m) => (
                                    <div key={m._id} className="flex items-center gap-3 p-3 border-b border-gray-50 dark:border-gray-800">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"><img src={getAvatarUrl(m)} className="w-full h-full object-cover" /></div>
                                        <div>
                                            <h3 className="text-sm font-medium dark:text-gray-200">{renderName(m, currentUser)}</h3>
                                            <p className="text-xs text-gray-400">Delivered</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            ) : activeChat?.isGroup ? (
                <div>
                    <div className="bg-white dark:bg-gray-900 p-6 mb-2 shadow-sm flex flex-col items-center border-b dark:border-gray-800">
                      <div 
                          className="w-24 h-24 md:w-32 md:h-32 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 text-5xl font-bold mb-4 overflow-hidden cursor-pointer relative group"
                          onClick={() => fileInputRef.current?.click()}
                      >
                          {activeChat.groupIcon ? <img src={activeChat.groupIcon} className="w-full h-full object-cover" /> : activeChat.groupName?.charAt(0)}
                          <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center text-white text-xs font-medium">
                              {isUploadingIcon ? "Uploading..." : "Change Icon"}
                          </div>
                      </div>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleGroupIconUpload} />
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center">{activeChat.groupName}</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{members.length} {t('village.participants', { defaultValue: "participants" })}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 shadow-sm pb-6">
                      <div className="p-4 text-green-600 dark:text-green-500 font-bold text-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">{members.length} {t('village.participants', { defaultValue: "participants" })}</div>
                      {loadingMembers ? (
                        <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
                      ) : (
                        <div>
                          {members.map((member) => (
                            <div key={member._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition border-b border-gray-50 dark:border-gray-800 mx-2 cursor-pointer">
                              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                <img src={getAvatarUrl(member)} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">{renderName(member, currentUser)}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.bio || member.role || "Member"}</p>
                              </div>
                              {member._id !== (currentUser.id || currentUser._id) && (
                                  <button onClick={(e) => { e.stopPropagation(); startPrivateChat(member); }} className="p-2 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-full transition-colors" title="Message">
                                      <MessageSquare className="w-5 h-5" />
                                  </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                </div>
            ) : (
                <div>
                    {otherUser && (
                        <div className="bg-white dark:bg-gray-900 p-6 mb-2 shadow-sm flex flex-col items-center border-b dark:border-gray-800">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 text-5xl font-bold mb-4 overflow-hidden">
                                <img src={getAvatarUrl(otherUser)} className="w-full h-full object-cover" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center">{renderName(otherUser, currentUser)}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{otherUser.role || "Farmer"}</p>
                            {otherUser.status && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{otherUser.status}</p>}
                        </div>
                    )}
                    
                    <div className="bg-white dark:bg-gray-900 shadow-sm p-2 mt-2 border-y border-gray-200 dark:border-gray-800">
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg text-gray-700 dark:text-gray-200">
                            <Star className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">Star Messages</span>
                        </button>
                        <button onClick={handleBlockUser} className={`w-full flex items-center gap-3 p-3 transition-colors rounded-lg mt-1 ${isBlocked ? 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-500' : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-500'}`}>
                            <Ban className={`w-5 h-5 ${isBlocked ? 'text-green-500' : 'text-red-500'}`} />
                            <span className="font-medium">{isBlocked ? "Unblock User" : "Block User"}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default ChatInfoSidebar;

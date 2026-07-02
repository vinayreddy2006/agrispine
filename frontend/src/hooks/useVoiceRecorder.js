import { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import api from '../utils/api';

export const useVoiceRecorder = (socket, currentUser, t, conversationId) => {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const timerRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            Swal.fire("Error", t('village.mic_error', { defaultValue: "Microphone access denied" }), "error");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        clearInterval(timerRef.current);
    };

    const cancelRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        clearInterval(timerRef.current);
        setIsRecording(false);
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const sendAudioMessage = async () => {
        if (!audioBlob) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append("image", audioBlob, "voice-note.webm");

        try {
            const token = localStorage.getItem("token");
            const { data } = await api.post("/chat/upload", formData, {
                headers: { "auth-token": token, "Content-Type": "multipart/form-data" }
            });

            const messageData = {
                senderId: currentUser.id || currentUser._id,
                senderName: currentUser.name,
                senderImage: currentUser.profileImage,
                conversationId: conversationId,
                village: currentUser.village, // for backward comp
                text: "",
                audio: data.imageUrl,
                createdAt: new Date()
            };

            await socket.emit("send_message", messageData);
            cancelRecording();
        } catch (err) {
            Swal.fire("Error", t('village.audio_fail', { defaultValue: "Failed to send audio" }), "error");
        } finally {
            setIsUploading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return {
        isRecording,
        recordingTime,
        isUploading,
        startRecording,
        stopRecording,
        cancelRecording,
        sendAudioMessage,
        formatTime
    };
};

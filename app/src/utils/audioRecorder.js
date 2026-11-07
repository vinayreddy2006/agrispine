import { Platform, Linking, Alert } from 'react-native';

// Dynamically load expo-audio (primary for Expo SDK 58+)
let ExpoAudio = null;
try {
  ExpoAudio = require('expo-audio');
} catch (e) {
  ExpoAudio = null;
}

// Dynamically load expo-av (fallback for older runtimes)
let ExpoAV = null;
try {
  ExpoAV = require('expo-av');
} catch (e) {
  ExpoAV = null;
}

/**
 * Check if audio recording is supported in the current runtime
 */
export const isAudioRecordingSupported = () => {
  return !!(ExpoAudio || (ExpoAV && ExpoAV.Audio));
};

let activeRecorder = null;
let activeEngine = null; // 'expo-audio' | 'expo-av'

/**
 * Check and request microphone permissions with friendly alerts and deep link to Settings
 */
export const requestMicrophonePermission = async () => {
  try {
    if (ExpoAudio && typeof ExpoAudio.requestRecordingPermissionsAsync === 'function') {
      const response = await ExpoAudio.requestRecordingPermissionsAsync();
      return {
        granted: response.granted,
        status: response.status,
        canAskAgain: response.canAskAgain,
      };
    }

    if (ExpoAV && ExpoAV.Audio && typeof ExpoAV.Audio.requestPermissionsAsync === 'function') {
      const response = await ExpoAV.Audio.requestPermissionsAsync();
      return {
        granted: response.granted,
        status: response.status,
        canAskAgain: response.canAskAgain,
      };
    }

    return {
      granted: false,
      status: 'unsupported',
      canAskAgain: false,
    };
  } catch (error) {
    console.warn('[AudioRecorder] Permission request failed:', error);
    return {
      granted: false,
      status: 'error',
      canAskAgain: false,
      error,
    };
  }
};

/**
 * Prompt user when microphone permission is denied, offering direct navigation to App Settings
 */
export const promptPermissionDenied = () => {
  Alert.alert(
    'Microphone Access Required',
    'GramSathi AI needs microphone access to listen to your voice query. Please enable microphone permission in device settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'android' || Platform.OS === 'ios') {
            Linking.openSettings().catch(() => {
              Alert.alert('Notice', 'Please open your phone Settings > Apps > AgriSpine > Permissions and enable Microphone.');
            });
          }
        },
      },
    ]
  );
};

/**
 * Start native audio recording
 * Returns { success: boolean, error?: string, permissionDenied?: boolean }
 */
export const startRecording = async () => {
  // 1. Ensure any previous recording is cleaned up
  await cancelRecording();

  // 2. Verify permission
  const perm = await requestMicrophonePermission();
  if (!perm.granted) {
    if (perm.status === 'unsupported') {
      Alert.alert('Unsupported', 'Audio recording module is not available in this runtime.');
    } else {
      promptPermissionDenied();
    }
    return { success: false, permissionDenied: true };
  }

  // 3. Attempt recording with expo-audio (SDK 58 standard)
  if (ExpoAudio) {
    try {
      if (typeof ExpoAudio.setAudioModeAsync === 'function') {
        await ExpoAudio.setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        }).catch((e) => console.log('[AudioRecorder] setAudioModeAsync notice:', e));
      }

      // Check AudioModule.AudioRecorder or create options
      const AudioModule = ExpoAudio.AudioModule || (ExpoAudio.default && ExpoAudio.default.AudioModule);
      const presets = ExpoAudio.RecordingPresets || {};
      const options = presets.HIGH_QUALITY || {};

      let recorder = null;
      if (AudioModule && AudioModule.AudioRecorder) {
        recorder = new AudioModule.AudioRecorder(options);
      } else if (typeof ExpoAudio.AudioRecorder === 'function') {
        recorder = new ExpoAudio.AudioRecorder(options);
      }

      if (recorder) {
        if (typeof recorder.prepareToRecordAsync === 'function') {
          await recorder.prepareToRecordAsync();
        }
        if (typeof recorder.record === 'function') {
          recorder.record();
        } else if (typeof recorder.start === 'function') {
          recorder.start();
        }

        activeRecorder = recorder;
        activeEngine = 'expo-audio';
        return { success: true, engine: 'expo-audio' };
      }
    } catch (err) {
      console.warn('[AudioRecorder] expo-audio start failed, trying fallback:', err);
    }
  }

  // 4. Fallback to expo-av if expo-audio failed or is unavailable
  if (ExpoAV && ExpoAV.Audio) {
    try {
      await ExpoAV.Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await ExpoAV.Audio.Recording.createAsync(
        ExpoAV.Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      activeRecorder = recording;
      activeEngine = 'expo-av';
      return { success: true, engine: 'expo-av' };
    } catch (err) {
      console.error('[AudioRecorder] expo-av start failed:', err);
      Alert.alert('Recording Error', 'Unable to initialize microphone recording: ' + (err.message || 'Unknown error'));
      return { success: false, error: err.message };
    }
  }

  Alert.alert('Unsupported', 'Audio recording is not supported in this runtime.');
  return { success: false, error: 'No compatible recording engine found' };
};

/**
 * Stop active recording and return the recorded audio URI
 * Returns { success: boolean, uri?: string, error?: string }
 */
export const stopRecording = async () => {
  if (!activeRecorder) {
    return { success: false, error: 'No active recording found' };
  }

  try {
    let uri = null;

    if (activeEngine === 'expo-audio') {
      if (typeof activeRecorder.stop === 'function') {
        await activeRecorder.stop();
      }
      uri = activeRecorder.uri;
    } else if (activeEngine === 'expo-av') {
      await activeRecorder.stopAndUnloadAsync();
      uri = activeRecorder.getURI();
    }

    activeRecorder = null;
    activeEngine = null;

    if (!uri) {
      return { success: false, error: 'Recording produced no audio URI' };
    }

    return {
      success: true,
      uri,
    };
  } catch (err) {
    console.error('[AudioRecorder] Stop recording error:', err);
    activeRecorder = null;
    activeEngine = null;
    return { success: false, error: err.message };
  }
};

/**
 * Cancel and discard active recording cleanly
 */
export const cancelRecording = async () => {
  if (!activeRecorder) return;

  try {
    if (activeEngine === 'expo-audio') {
      if (typeof activeRecorder.stop === 'function') {
        await activeRecorder.stop();
      }
    } else if (activeEngine === 'expo-av') {
      await activeRecorder.stopAndUnloadAsync();
    }
  } catch (e) {
    // Ignore cleanup errors during cancel
  } finally {
    activeRecorder = null;
    activeEngine = null;
  }
};

export default {
  isAudioRecordingSupported,
  requestMicrophonePermission,
  promptPermissionDenied,
  startRecording,
  stopRecording,
  cancelRecording,
};


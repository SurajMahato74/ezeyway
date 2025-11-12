import React, { useEffect, useRef, useState } from 'react';
import useCallSystem from '../hooks/useCallSystem';

interface CallInterfaceProps {
  authToken: string | null;
  userId: number | null;
  onCallEnd?: () => void;
}

const CallInterface: React.FC<CallInterfaceProps> = ({ authToken, userId, onCallEnd }) => {
  const {
    isCallActive,
    isIncomingCall,
    isOutgoingCall,
    currentCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    connectionQuality,
    duration,
    isLoading,
    error,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    updateCallQuality,
  } = useCallSystem(authToken, userId);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);
  const [showCallControls, setShowCallControls] = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');

  // Set up video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Show incoming call modal
  useEffect(() => {
    if (isIncomingCall && currentCall) {
      setShowIncomingCallModal(true);
    }
  }, [isIncomingCall, currentCall]);

  // Handle call end
  useEffect(() => {
    if (!isCallActive && !isIncomingCall && !isOutgoingCall) {
      setShowIncomingCallModal(false);
      setShowCallControls(false);
      onCallEnd?.();
    }
  }, [isCallActive, isIncomingCall, isOutgoingCall, onCallEnd]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInitiateCall = async () => {
    if (!targetUserId) return;
    try {
      await initiateCall(targetUserId, callType);
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  };

  const handleAnswerCall = async () => {
    if (!currentCall) return;
    try {
      await answerCall(currentCall.call_id);
      setShowIncomingCallModal(false);
    } catch (error) {
      console.error('Failed to answer call:', error);
    }
  };

  const handleRejectCall = async () => {
    if (!currentCall) return;
    try {
      await rejectCall(currentCall.call_id);
      setShowIncomingCallModal(false);
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  };

  const handleEndCall = async () => {
    if (!currentCall) return;
    try {
      await endCall(currentCall.call_id);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const getQualityIndicator = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return '🟢';
      case 'good':
        return '🟡';
      case 'poor':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const renderIncomingCallModal = () => {
    if (!showIncomingCallModal || !currentCall) return null;

    const isVideoCall = currentCall.call_type === 'video';
    const callerName = currentCall.caller?.name || 'Unknown User';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">📞</span>
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Incoming {isVideoCall ? 'Video' : 'Voice'} Call</h3>
            <p className="text-gray-600 mb-6">{callerName} is calling you</p>
            
            {isVideoCall && (
              <div className="text-sm text-gray-500 mb-4">
                Video call from {callerName}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={handleRejectCall}
                className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAnswerCall}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCallInterface = () => {
    if (!isCallActive && !isOutgoingCall) return null;

    const isVideoCall = currentCall?.call_type === 'video';
    const otherUserName = currentCall?.callee?.name || currentCall?.caller?.name || 'Unknown';

    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col z-40">
        {/* Video Area */}
        <div className="flex-1 relative">
          {isVideoCall && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-6xl">👤</span>
                </div>
                <h3 className="text-xl font-medium">{otherUserName}</h3>
                <p className="text-gray-300">
                  {isCallActive ? `Call in progress - ${formatDuration(duration)}` : 'Connecting...'}
                </p>
              </div>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          {isVideoCall && localStream && (
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            </div>
          )}

          {/* Connection Quality Indicator */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {getQualityIndicator(connectionQuality)} {connectionQuality}
          </div>

          {/* Call Duration */}
          {isCallActive && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
              {formatDuration(duration)}
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="bg-gray-800 p-6">
          <div className="flex justify-center items-center space-x-6">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isMuted ? 'bg-red-500' : 'bg-gray-600'
              } text-white hover:bg-opacity-80 transition-colors`}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>

            {/* Video Toggle (only for video calls) */}
            {isVideoCall && (
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  !isVideoEnabled ? 'bg-red-500' : 'bg-gray-600'
                } text-white hover:bg-opacity-80 transition-colors`}
              >
                {isVideoEnabled ? '📹' : '📷'}
              </button>
            )}

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
            >
              📞
            </button>

            {/* Show/Hide Controls Button */}
            <button
              onClick={() => setShowCallControls(!showCallControls)}
              className="w-14 h-14 rounded-full bg-gray-600 text-white hover:bg-opacity-80 transition-colors"
            >
              ⚙️
            </button>
          </div>

          {/* Additional Controls */}
          {showCallControls && (
            <div className="mt-4 text-center text-gray-400 text-sm">
              <div className="space-y-2">
                <div>Call ID: {currentCall?.call_id}</div>
                <div>Type: {currentCall?.call_type}</div>
                <div>Status: {currentCall?.status}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCallInitiator = () => {
    if (isCallActive || isIncomingCall || isOutgoingCall) return null;

    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-6 max-w-sm">
        <h3 className="text-lg font-semibold mb-4">Start a Call</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="number"
              value={targetUserId || ''}
              onChange={(e) => setTargetUserId(parseInt(e.target.value) || null)}
              placeholder="Enter user ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call Type
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setCallType('audio')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  callType === 'audio'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🎤 Audio
              </button>
              <button
                onClick={() => setCallType('video')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  callType === 'video'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📹 Video
              </button>
            </div>
          </div>

          <button
            onClick={handleInitiateCall}
            disabled={!targetUserId || isLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Starting...' : `Start ${callType} Call`}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {renderCallInitiator()}
      {renderIncomingCallModal()}
      {renderCallInterface()}
    </div>
  );
};

export default CallInterface;
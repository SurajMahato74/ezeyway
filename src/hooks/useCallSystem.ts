import { useState, useEffect, useRef, useCallback } from 'react';

interface CallUser {
  id: number;
  name: string;
  username: string;
}

interface CallData {
  call_id: string;
  call_type: 'audio' | 'video';
  status: 'initiated' | 'ringing' | 'answered' | 'ended' | 'rejected' | 'declined';
  initiated_at: string;
  answered_at?: string;
  ended_at?: string;
  caller: CallUser;
  callee?: CallUser;
  participants?: number[];
}

interface IncomingCallData {
  call_id: string;
  caller_name: string;
  caller_id: number;
  call_type: 'audio' | 'video';
  action: string;
}

interface CallState {
  isCallActive: boolean;
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  currentCall: CallData | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  connectionQuality: 'good' | 'poor' | 'excellent' | 'unknown';
  duration: number;
  isLoading: boolean;
  error: string | null;
}

interface CallActions {
  initiateCall: (userId: number, callType: 'audio' | 'video') => Promise<void>;
  answerCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: (callId: string) => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  updateCallQuality: (quality: string, networkInfo: any) => void;
}

const useCallSystem = (authToken: string | null, userId: number | null): CallState & CallActions => {
  const [callState, setCallState] = useState<CallState>({
    isCallActive: false,
    isIncomingCall: false,
    isOutgoingCall: false,
    currentCall: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoEnabled: true,
    connectionQuality: 'unknown',
    duration: 0,
    isLoading: false,
    error: null,
  });

  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const qualityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC Configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for production
      // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
    ],
  };

  // Helper function to send WebSocket messages
  const sendWebSocketMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Initialize simple call status polling (fallback when WebSocket fails)
  useEffect(() => {
    if (!authToken || !userId) return;

    // For now, we'll implement a simple polling mechanism
    // WebSocket can be added later once the basic system is stable
    console.log('📞 Call system initialized with polling mode');
    
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      if (qualityTimerRef.current) {
        clearInterval(qualityTimerRef.current);
      }
    };
  }, [authToken, userId]);

  // Handle incoming call
  const handleIncomingCall = useCallback((data: IncomingCallData) => {
    console.log('Incoming call:', data);
    setCallState(prev => ({
      ...prev,
      isIncomingCall: true,
      isOutgoingCall: false,
      isCallActive: false,
      error: null,
    }));
  }, []);

  // Handle WebRTC offer
  const handleOffer = useCallback(async (data: any) => {
    console.log('Received offer:', data);
    
    if (!peerConnectionRef.current) {
      await createPeerConnection();
    }

    const pc = peerConnectionRef.current!;
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendWebSocketMessage({
        type: 'answer',
        answer: answer,
        call_id: data.call_id,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
      setCallState(prev => ({ ...prev, error: 'Failed to handle call offer' }));
    }
  }, [sendWebSocketMessage]);

  // Handle WebRTC answer
  const handleAnswer = useCallback(async (data: any) => {
    console.log('Received answer:', data);
    
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (data: any) => {
    console.log('Received ICE candidate:', data);
    
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }, []);

  // Handle call status updates
  const handleCallStatus = useCallback((data: any) => {
    console.log('Call status update:', data);
    setCallState(prev => ({
      ...prev,
      currentCall: prev.currentCall ? {
        ...prev.currentCall,
        status: data.status,
      } : null,
    }));
  }, []);

  // Handle call answered
  const handleCallAnswered = useCallback((data: any) => {
    console.log('Call answered:', data);
    setCallState(prev => ({
      ...prev,
      isCallActive: true,
      isIncomingCall: false,
      isOutgoingCall: false,
    }));
    startCallTimer();
  }, []);

  // Handle call rejected
  const handleCallRejected = useCallback((data: any) => {
    console.log('Call rejected:', data);
    endCallSession();
  }, []);

  // Handle call ended
  const handleCallEnded = useCallback((data: any) => {
    console.log('Call ended:', data);
    endCallSession();
  }, []);

  // Handle call quality updates
  const handleCallQuality = useCallback((data: any) => {
    console.log('Call quality update:', data);
    setCallState(prev => ({
      ...prev,
      connectionQuality: data.connection_quality,
    }));
  }, []);

  // Handle user joined (for group calls)
  const handleUserJoined = useCallback((data: any) => {
    console.log('User joined call:', data);
  }, []);

  // Handle user left
  const handleUserLeft = useCallback((data: any) => {
    console.log('User left call:', data);
  }, []);

  // Handle media toggle
  const handleMediaToggle = useCallback((data: any) => {
    console.log('Media toggle:', data);
  }, []);

  // Handle call state
  const handleCallState = useCallback((data: any) => {
    console.log('Call state:', data);
    setCallState(prev => ({
      ...prev,
      currentCall: data.call,
      isCallActive: data.call.status === 'answered',
    }));
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(async () => {
    const pc = new RTCPeerConnection(rtcConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWebSocketMessage({
          type: 'ice_candidate',
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Remote stream received:', event.streams[0]);
      setCallState(prev => ({
        ...prev,
        remoteStream: event.streams[0],
      }));
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('Peer connection state:', state);
      
      if (state === 'connected') {
        setCallState(prev => ({ ...prev, connectionQuality: 'good' }));
        startQualityMonitoring();
      } else if (state === 'failed') {
        setCallState(prev => ({ ...prev, connectionQuality: 'poor' }));
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('Signaling state:', pc.signalingState);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [sendWebSocketMessage]);

  // Get user media
  const getUserMedia = useCallback(async (callType: 'audio' | 'video') => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'video' ? { width: 640, height: 480 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCallState(prev => ({
        ...prev,
        localStream: stream,
        isVideoEnabled: callType === 'video',
      }));

      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      setCallState(prev => ({ 
        ...prev, 
        error: 'Failed to access camera/microphone' 
      }));
      throw error;
    }
  }, []);

  // Add stream to peer connection
  const addStreamToPeerConnection = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
  }, []);

  // Start call timer
  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    callTimerRef.current = setInterval(() => {
      setCallState(prev => ({
        ...prev,
        duration: prev.duration + 1,
      }));
    }, 1000);
  }, []);

  // Start quality monitoring
  const startQualityMonitoring = useCallback(() => {
    if (qualityTimerRef.current) {
      clearInterval(qualityTimerRef.current);
    }

    qualityTimerRef.current = setInterval(async () => {
      if (peerConnectionRef.current) {
        try {
          const stats = await peerConnectionRef.current.getStats();
          let bytesReceived = 0;
          let bytesSent = 0;
          let packetsLost = 0;
          let packetsReceived = 0;

          stats.forEach((report) => {
            if (report.type === 'inbound-rtp') {
              bytesReceived += report.bytesReceived || 0;
              packetsLost += report.packetsLost || 0;
              packetsReceived += report.packetsReceived || 0;
            } else if (report.type === 'outbound-rtp') {
              bytesSent += report.bytesSent || 0;
            }
          });

          // Calculate quality based on statistics
          let quality: 'excellent' | 'good' | 'poor' = 'good';
          const lossRate = packetsLost / (packetsReceived + packetsLost);
          
          if (lossRate < 0.01) {
            quality = 'excellent';
          } else if (lossRate > 0.05) {
            quality = 'poor';
          }

          setCallState(prev => ({ ...prev, connectionQuality: quality }));

          // Update server with quality metrics
          sendWebSocketMessage({
            type: 'call_quality',
            connection_quality: quality,
            network_info: {
              bytes_received: bytesReceived,
              bytes_sent: bytesSent,
              packets_lost: packetsLost,
              loss_rate: lossRate,
            },
          });
        } catch (error) {
          console.error('Error getting call stats:', error);
        }
      }
    }, 5000); // Check every 5 seconds
  }, [sendWebSocketMessage]);

  // End call session
  const endCallSession = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    if (qualityTimerRef.current) {
      clearInterval(qualityTimerRef.current);
    }

    // Stop all tracks
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setCallState({
      isCallActive: false,
      isIncomingCall: false,
      isOutgoingCall: false,
      currentCall: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoEnabled: true,
      connectionQuality: 'unknown',
      duration: 0,
      isLoading: false,
      error: null,
    });
  }, [callState.localStream]);

  // Action functions
  const initiateCall = useCallback(async (toUserId: number, callType: 'audio' | 'video') => {
    try {
      setCallState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get user media
      const stream = await getUserMedia(callType);

      // Create peer connection
      const pc = await createPeerConnection();
      addStreamToPeerConnection(pc, stream);

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer through WebSocket
      sendWebSocketMessage({
        type: 'offer',
        offer: offer,
        call_type: callType,
      });

      // Initiate call via API
      const response = await fetch('http://localhost:8000/api/messaging/calls/initiate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify({
          recipient_id: toUserId,
          call_type: callType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }

      setCallState(prev => ({
        ...prev,
        isOutgoingCall: true,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error initiating call:', error);
      setCallState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initiate call',
      }));
    }
  }, [authToken, getUserMedia, createPeerConnection, addStreamToPeerConnection, sendWebSocketMessage]);

  const answerCall = useCallback(async (callId: string) => {
    try {
      setCallState(prev => ({ ...prev, isLoading: true, error: null }));

      // Answer call via API
      const response = await fetch(`/api/accounts/calls/answer/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify({
          call_id: callId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to answer call');
      }

      // Get user media (assuming call type from current call)
      const currentCallType = callState.currentCall?.call_type || 'audio';
      const stream = await getUserMedia(currentCallType);

      // Add stream to existing peer connection
      if (peerConnectionRef.current) {
        addStreamToPeerConnection(peerConnectionRef.current, stream);
      }

      setCallState(prev => ({
        ...prev,
        isIncomingCall: false,
        isCallActive: true,
        isLoading: false,
      }));

      startCallTimer();
    } catch (error) {
      console.error('Error answering call:', error);
      setCallState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to answer call',
      }));
    }
  }, [authToken, getUserMedia, addStreamToPeerConnection, startCallTimer, callState.currentCall]);

  const rejectCall = useCallback(async (callId: string) => {
    try {
      const response = await fetch(`/api/accounts/calls/reject/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify({
          call_id: callId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject call');
      }

      setCallState(prev => ({
        ...prev,
        isIncomingCall: false,
      }));
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  }, [authToken]);

  const endCall = useCallback(async (callId: string) => {
    try {
      const response = await fetch(`/api/accounts/calls/end/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify({
          call_id: callId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to end call');
      }

      endCallSession();
    } catch (error) {
      console.error('Error ending call:', error);
      endCallSession(); // End locally even if API fails
    }
  }, [authToken, endCallSession]);

  const toggleMute = useCallback(() => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({
          ...prev,
          isMuted: !audioTrack.enabled,
        }));

        // Notify other participant
        sendWebSocketMessage({
          type: 'toggle_media',
          media_type: 'audio',
          enabled: audioTrack.enabled,
        });
      }
    }
  }, [callState.localStream, sendWebSocketMessage]);

  const toggleVideo = useCallback(() => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({
          ...prev,
          isVideoEnabled: videoTrack.enabled,
        }));

        // Notify other participant
        sendWebSocketMessage({
          type: 'toggle_media',
          media_type: 'video',
          enabled: videoTrack.enabled,
        });
      }
    }
  }, [callState.localStream, sendWebSocketMessage]);

  const updateCallQuality = useCallback((quality: string, networkInfo: any) => {
    if (callState.currentCall) {
      sendWebSocketMessage({
        type: 'call_quality',
        connection_quality: quality,
        network_info: networkInfo,
      });
    }
  }, [callState.currentCall, sendWebSocketMessage]);

  return {
    ...callState,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    updateCallQuality,
  };
};

export default useCallSystem;
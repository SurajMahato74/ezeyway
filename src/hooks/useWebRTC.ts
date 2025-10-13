import { useRef, useState, useCallback } from 'react';
import { getWsUrl } from '@/config/api';

export const useWebRTC = (callId: number) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>('idle');
  
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const initializeWebRTC = useCallback(async () => {
    try {
      // Get user media (audio only)
      localStream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });

      // Create peer connection
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Add local stream to peer connection
      localStream.current.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, localStream.current!);
      });

      // Handle remote stream
      peerConnection.current.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate && ws.current) {
          ws.current.send(JSON.stringify({
            type: 'ice_candidate',
            candidate: event.candidate
          }));
        }
      };

      // Connect to call WebSocket
      const token = localStorage.getItem('token');
      ws.current = new WebSocket(getWsUrl(`/ws/calls/${callId}/`));

      ws.current.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'offer':
            await handleOffer(message.offer);
            break;
          case 'answer':
            await handleAnswer(message.answer);
            break;
          case 'ice_candidate':
            await handleIceCandidate(message.candidate);
            break;
          case 'call_status':
            setCallStatus(message.status);
            if (message.status === 'ended') {
              endCall();
            }
            break;
        }
      };

    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
    }
  }, [callId]);

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return;
    
    await peerConnection.current.setRemoteDescription(offer);
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    
    ws.current?.send(JSON.stringify({
      type: 'answer',
      answer: answer
    }));
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return;
    await peerConnection.current.setRemoteDescription(answer);
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnection.current) return;
    await peerConnection.current.addIceCandidate(candidate);
  };

  const startCall = async () => {
    await initializeWebRTC();
    
    if (!peerConnection.current) return;
    
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    
    ws.current?.send(JSON.stringify({
      type: 'offer',
      offer: offer
    }));
    
    setIsCallActive(true);
    setCallStatus('calling');
  };

  const answerCall = async () => {
    await initializeWebRTC();
    setIsCallActive(true);
    setCallStatus('connected');
  };

  const endCall = () => {
    // Close peer connection
    peerConnection.current?.close();
    peerConnection.current = null;

    // Stop local stream
    localStream.current?.getTracks().forEach(track => track.stop());
    localStream.current = null;

    // Close WebSocket
    ws.current?.close();
    ws.current = null;

    // Send end call status
    ws.current?.send(JSON.stringify({
      type: 'call_status',
      status: 'ended'
    }));

    setIsCallActive(false);
    setCallStatus('ended');
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  return {
    isCallActive,
    isMuted,
    callStatus,
    localAudioRef,
    remoteAudioRef,
    startCall,
    answerCall,
    endCall,
    toggleMute,
  };
};
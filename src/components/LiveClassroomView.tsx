import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eraser,
  ExternalLink,
  Hand,
  HelpCircle,
  Lock,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  PanelTopClose,
  PanelTopOpen,
  PenTool,
  Pin,
  Play,
  Radio,
  Send,
  ShieldCheck,
  ShoppingBag,
  Square,
  Trash2,
  UserCheck,
  UserX,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DIAMOND_PACKAGE } from '../data/seedData';
import type {
  LiveClass,
  LiveClassMediaMode,
  LiveClassMessage,
  LiveClassMessageType,
  LiveClassParticipant,
  LiveClassStroke,
} from '../types';
import { toPersianDigits } from '../utils/formatters';

const PEN_COLORS = [
  { id: 'emerald', hex: '#34d399', label: 'سبز' },
  { id: 'white', hex: '#f8fafc', label: 'سفید' },
  { id: 'amber', hex: '#fbbf24', label: 'زرد' },
  { id: 'sky', hex: '#38bdf8', label: 'آبی' },
  { id: 'rose', hex: '#fb7185', label: 'قرمز' },
];

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ],
};

interface SignalEnvelope {
  channel: 'host-to-student' | 'student-to-host';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

const StreamVideo: React.FC<{
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}> = ({ stream, muted = false, className = '' }) => {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    if (stream) {
      el.play().catch(() => {
        // Browser autoplay policy may hold unmuted audio until click
      });
    }
  }, [stream]);

  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
};

export const LiveClassroomView: React.FC = () => {
  const {
    user,
    isAdmin,
    hasDiamondAccess,
    courses,
    liveClasses,
    selectedLiveClassId,
    openLiveClass,
    openCourseDetail,
    addToCart,
    setIsCartOpen,
    isEnrolledInCourse,
    setView,
    signInWithGoogle,
    setLiveClassStatus,
    toggleLiveClassBoard,
    updateHostMediaState,
    updateLiveClassBoard,
    subscribeLiveClassMessages,
    sendLiveClassMessage,
    updateLiveClassMessageModeration,
    deleteLiveClassMessage,
    subscribeLiveClassStrokes,
    addLiveClassStroke,
    clearLiveClassStrokes,
    subscribeLiveClassParticipants,
    upsertMyLiveClassPresence,
    setParticipantMediaPermission,
    subscribeLiveClassSignals,
    sendLiveClassSignal,
    consumeLiveClassSignal,
    notify,
  } = useApp();

  const activeClass: LiveClass | undefined = useMemo(() => {
    if (selectedLiveClassId) {
      const found = liveClasses.find((c) => c.id === selectedLiveClassId);
      if (found) return found;
    }
    return liveClasses.find((c) => c.status === 'live') ?? liveClasses[0];
  }, [liveClasses, selectedLiveClassId]);

  const linkedCourse = useMemo(
    () => (activeClass ? courses.find((c) => c.id === activeClass.courseId) : undefined),
    [courses, activeClass]
  );

  // Course / Diamond access check
  const hasClassAccess = useMemo(() => {
    if (!activeClass) return false;
    if (isAdmin) return true;
    if (activeClass.isFree) return true;
    if (!user) return false;
    if (activeClass.courseId === 'general') return hasDiamondAccess;
    return isEnrolledInCourse(activeClass.courseId);
  }, [activeClass, isAdmin, user, hasDiamondAccess, isEnrolledInCourse]);

  const [messages, setMessages] = useState<LiveClassMessage[]>([]);
  const [strokes, setStrokes] = useState<LiveClassStroke[]>([]);
  const [participants, setParticipants] = useState<LiveClassParticipant[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'participants'>('chat');

  const [messageInput, setMessageInput] = useState('');
  const [messageType, setMessageType] = useState<LiveClassMessageType>('chat');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Instructor live board editor state
  const [boardTitleInput, setBoardTitleInput] = useState('');
  const [boardContentInput, setBoardContentInput] = useState('');
  const [streamUrlInput, setStreamUrlInput] = useState('');
  const [savingBoard, setSavingBoard] = useState(false);

  // Drawing canvas state (admin/instructor only)
  const [penColor, setPenColor] = useState('#34d399');
  const [penWidth, setPenWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftPath, setDraftPath] = useState('');
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Instructor local media state (webcam / screen share + mic)
  const [localHostStream, setLocalHostStream] = useState<MediaStream | null>(null);
  const localHostStreamRef = useRef<MediaStream | null>(null);
  const extraCleanupTracksRef = useRef<MediaStreamTrack[]>([]);
  const [mediaMode, setMediaMode] = useState<LiveClassMediaMode>('none');
  const [hostMicEnabled, setHostMicEnabled] = useState(true);

  // Student local media state (strictly gated by myParticipant.canPublishMedia)
  const [localStudentStream, setLocalStudentStream] = useState<MediaStream | null>(null);
  const localStudentStreamRef = useRef<MediaStream | null>(null);
  const [studentMicEnabled, setStudentMicEnabled] = useState(true);

  // Remote WebRTC media streams
  const [remoteHostStream, setRemoteHostStream] = useState<MediaStream | null>(null);
  const [remoteHostAudioMuted, setRemoteHostAudioMuted] = useState(false);
  const [remoteStudentStreams, setRemoteStudentStreams] = useState<Record<string, MediaStream>>({});

  // WebRTC PeerConnection registries
  const hostOutboundPeersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const incomingHostPcRef = useRef<RTCPeerConnection | null>(null);
  const studentOutboundPcRef = useRef<RTCPeerConnection | null>(null);
  const incomingStudentPeersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const processedSignalsRef = useRef<Set<string>>(new Set());

  // Latest ref helpers for signal processing without stale closures
  const participantsRef = useRef<LiveClassParticipant[]>([]);
  participantsRef.current = participants;

  const activeClassId = activeClass?.id ?? '';

  const myParticipant = useMemo(
    () => (user ? participants.find((p) => p.userId === user.uid) : undefined),
    [participants, user]
  );

  const otherParticipants = useMemo(
    () => (user ? participants.filter((p) => p.userId !== user.uid) : participants),
    [participants, user]
  );

  const pendingCameraRequestsCount = useMemo(
    () => otherParticipants.filter((p) => p.role === 'student' && p.cameraRequested && !p.canPublishMedia).length,
    [otherParticipants]
  );

  const instructorUid = useMemo(() => {
    const onlineInstructor = participants.find((p) => p.role === 'instructor')?.userId;
    if (onlineInstructor) return onlineInstructor;
    if (activeClass?.hostUid) return activeClass.hostUid;
    if (activeClass?.createdBy && activeClass.createdBy !== 'seed-admin') return activeClass.createdBy;
    return '';
  }, [participants, activeClass?.hostUid, activeClass?.createdBy]);

  const isBoardOpen = activeClass?.isBoardOpen !== false;

  const closeAllPeerConnections = useCallback(() => {
    hostOutboundPeersRef.current.forEach((pc) => pc.close());
    hostOutboundPeersRef.current.clear();

    if (incomingHostPcRef.current) {
      incomingHostPcRef.current.close();
      incomingHostPcRef.current = null;
    }
    if (studentOutboundPcRef.current) {
      studentOutboundPcRef.current.close();
      studentOutboundPcRef.current = null;
    }
    incomingStudentPeersRef.current.forEach((pc) => pc.close());
    incomingStudentPeersRef.current.clear();

    pendingIceRef.current.clear();
    setRemoteHostStream(null);
    setRemoteStudentStreams({});
  }, []);

  const stopHostMedia = useCallback(
    async (syncFirestore = true, targetClassId = activeClassId) => {
      const hadStream = Boolean(localHostStreamRef.current);
      if (localHostStreamRef.current) {
        localHostStreamRef.current.getTracks().forEach((t) => t.stop());
        localHostStreamRef.current = null;
      }
      extraCleanupTracksRef.current.forEach((t) => t.stop());
      extraCleanupTracksRef.current = [];
      setLocalHostStream(null);
      setMediaMode('none');
      setHostMicEnabled(true);

      hostOutboundPeersRef.current.forEach((pc) => pc.close());
      hostOutboundPeersRef.current.clear();

      if (hadStream && syncFirestore && isAdmin && targetClassId) {
        await updateHostMediaState(targetClassId, 'none', false);
        await upsertMyLiveClassPresence(targetClassId, { cameraActive: false, micActive: false });
      }
    },
    [activeClassId, isAdmin, updateHostMediaState, upsertMyLiveClassPresence]
  );

  const stopStudentMedia = useCallback(
    async (syncFirestore = true, targetClassId = activeClassId) => {
      const hadStream = Boolean(localStudentStreamRef.current);
      if (localStudentStreamRef.current) {
        localStudentStreamRef.current.getTracks().forEach((t) => t.stop());
        localStudentStreamRef.current = null;
      }
      setLocalStudentStream(null);
      setStudentMicEnabled(true);

      if (studentOutboundPcRef.current) {
        studentOutboundPcRef.current.close();
        studentOutboundPcRef.current = null;
      }

      if (hadStream && syncFirestore && user && targetClassId) {
        await upsertMyLiveClassPresence(targetClassId, {
          cameraActive: false,
          micActive: false,
        });
      }
    },
    [activeClassId, user, upsertMyLiveClassPresence]
  );

  // Cleanup when leaving view or changing active class
  useEffect(() => {
    const classIdSnapshot = activeClassId;
    return () => {
      void stopHostMedia(true, classIdSnapshot);
      void stopStudentMedia(true, classIdSnapshot);
      closeAllPeerConnections();
      processedSignalsRef.current.clear();
    };
  }, [activeClassId, closeAllPeerConnections, stopHostMedia, stopStudentMedia]);

  // Sync instructor board inputs when switching class
  useEffect(() => {
    if (!activeClass) return;
    setBoardTitleInput(activeClass.boardTitle);
    setBoardContentInput(activeClass.boardContent);
    setStreamUrlInput(activeClass.streamUrl || '');
  }, [activeClass?.id, activeClass?.boardTitle, activeClass?.boardContent, activeClass?.streamUrl]);

  // Reset draft stroke if board is closed by instructor
  useEffect(() => {
    if (!isBoardOpen && isDrawing) {
      setIsDrawing(false);
      setDraftPath('');
    }
  }, [isBoardOpen, isDrawing]);

  // Subscribe to messages, strokes, participants (only when user has access)
  useEffect(() => {
    if (!activeClassId || !hasClassAccess) {
      setMessages([]);
      setStrokes([]);
      setParticipants([]);
      return;
    }
    const unsubMessages = subscribeLiveClassMessages(activeClassId, setMessages);
    const unsubStrokes = subscribeLiveClassStrokes(activeClassId, setStrokes);
    const unsubParticipants = subscribeLiveClassParticipants(activeClassId, setParticipants);
    return () => {
      unsubMessages();
      unsubStrokes();
      unsubParticipants();
    };
  }, [
    activeClassId,
    hasClassAccess,
    subscribeLiveClassMessages,
    subscribeLiveClassStrokes,
    subscribeLiveClassParticipants,
  ]);

  // Register presence on class entry for authorized signed-in users
  useEffect(() => {
    if (!user || !activeClassId || !hasClassAccess) return;
    void upsertMyLiveClassPresence(activeClassId, {});
  }, [user, activeClassId, hasClassAccess, upsertMyLiveClassPresence]);

  // Clear remote host video on students if instructor stopped broadcasting
  useEffect(() => {
    if (isAdmin) return;
    if (!activeClass || activeClass.hostMediaMode === 'none' || !activeClass.hostMediaMode) {
      if (incomingHostPcRef.current) {
        incomingHostPcRef.current.close();
        incomingHostPcRef.current = null;
      }
      setRemoteHostStream(null);
    }
  }, [isAdmin, activeClass?.hostMediaMode]);

  // CRITICAL: Immediately terminate student camera/mic if instructor revokes permission
  const hadPublishPermissionRef = useRef(false);
  useEffect(() => {
    if (isAdmin) return;
    const allowedNow = Boolean(myParticipant?.canPublishMedia);
    if (!allowedNow && (localStudentStreamRef.current || hadPublishPermissionRef.current)) {
      if (localStudentStreamRef.current) {
        void stopStudentMedia(true);
      }
      if (hadPublishPermissionRef.current) {
        notify('دسترسی وب‌کم و میکروفن شما توسط استاد بسته شد.', 'info');
      }
    }
    hadPublishPermissionRef.current = allowedNow;
  }, [isAdmin, myParticipant?.canPublishMedia, stopStudentMedia, notify]);

  // Remove stale remote student streams on Host if permission revoked or camera deactivated
  useEffect(() => {
    if (!isAdmin) return;
    setRemoteStudentStreams((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const uid of Object.keys(next)) {
        const p = participants.find((item) => item.userId === uid);
        if (!p || !p.canPublishMedia || !p.cameraActive) {
          incomingStudentPeersRef.current.get(uid)?.close();
          incomingStudentPeersRef.current.delete(uid);
          delete next[uid];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [isAdmin, participants]);

  // Instructor: Maintain outbound WebRTC connections from Host -> Online Students
  useEffect(() => {
    if (!isAdmin || !user || !activeClassId || !localHostStream) return;

    const studentTargets = participants.filter((p) => p.userId !== user.uid && p.role === 'student');
    const targetIds = new Set(studentTargets.map((s) => s.userId));

    // Close connections for students no longer present
    for (const [uid, pc] of hostOutboundPeersRef.current.entries()) {
      if (!targetIds.has(uid)) {
        pc.close();
        hostOutboundPeersRef.current.delete(uid);
      }
    }

    // Create connection for each connected student not yet wired
    studentTargets.forEach((student) => {
      if (hostOutboundPeersRef.current.has(student.userId)) return;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      hostOutboundPeersRef.current.set(student.userId, pc);

      localHostStream.getTracks().forEach((track) => {
        pc.addTrack(track, localHostStream);
      });

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          const envelope: SignalEnvelope = {
            channel: 'host-to-student',
            candidate: ev.candidate.toJSON(),
          };
          void sendLiveClassSignal(activeClassId, student.userId, 'ice', JSON.stringify(envelope));
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          if (hostOutboundPeersRef.current.get(student.userId) === pc) {
            hostOutboundPeersRef.current.delete(student.userId);
          }
        }
      };

      void (async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          const envelope: SignalEnvelope = {
            channel: 'host-to-student',
            sdp: pc.localDescription?.toJSON() ?? offer,
          };
          await sendLiveClassSignal(activeClassId, student.userId, 'offer', JSON.stringify(envelope));
        } catch (err) {
          console.error('Host WebRTC offer error:', err);
        }
      })();
    });
  }, [isAdmin, user, activeClassId, localHostStream, participants, sendLiveClassSignal]);

  // Permitted Student: Maintain outbound WebRTC connection Student -> Instructor
  useEffect(() => {
    if (
      isAdmin ||
      !user ||
      !activeClassId ||
      !localStudentStream ||
      !myParticipant?.canPublishMedia ||
      !instructorUid
    ) {
      return;
    }

    if (studentOutboundPcRef.current) {
      studentOutboundPcRef.current.close();
      studentOutboundPcRef.current = null;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    studentOutboundPcRef.current = pc;

    localStudentStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStudentStream);
    });

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        const envelope: SignalEnvelope = {
          channel: 'student-to-host',
          candidate: ev.candidate.toJSON(),
        };
        void sendLiveClassSignal(activeClassId, instructorUid, 'ice', JSON.stringify(envelope));
      }
    };

    void (async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const envelope: SignalEnvelope = {
          channel: 'student-to-host',
          sdp: pc.localDescription?.toJSON() ?? offer,
        };
        await sendLiveClassSignal(activeClassId, instructorUid, 'offer', JSON.stringify(envelope));
      } catch (err) {
        console.error('Student WebRTC offer error:', err);
      }
    })();

    return () => {
      if (studentOutboundPcRef.current === pc) {
        pc.close();
        studentOutboundPcRef.current = null;
      }
    };
  }, [
    isAdmin,
    user,
    activeClassId,
    localStudentStream,
    myParticipant?.canPublishMedia,
    instructorUid,
    sendLiveClassSignal,
  ]);

  // Subscribe & process incoming WebRTC signals from Firestore
  useEffect(() => {
    if (!user || !activeClassId || !hasClassAccess) return;

    const flushIce = async (key: string, pc: RTCPeerConnection) => {
      const queued = pendingIceRef.current.get(key);
      if (!queued || queued.length === 0) return;
      pendingIceRef.current.delete(key);
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // ignore stale candidate
        }
      }
    };

    const unsub = subscribeLiveClassSignals(activeClassId, (signals) => {
      signals.forEach((sig) => {
        if (processedSignalsRef.current.has(sig.id)) return;
        processedSignalsRef.current.add(sig.id);
        void consumeLiveClassSignal(activeClassId, sig.id);

        let parsed: SignalEnvelope | null = null;
        try {
          parsed = JSON.parse(sig.payload) as SignalEnvelope;
        } catch {
          return;
        }
        if (!parsed) return;

        // 1) Student receiving Host broadcast ('host-to-student')
        if (parsed.channel === 'host-to-student' && !isAdmin) {
          const iceKey = `host:${sig.fromUid}`;
          if (sig.type === 'offer' && parsed.sdp) {
            if (incomingHostPcRef.current) {
              incomingHostPcRef.current.close();
            }
            const pc = new RTCPeerConnection(RTC_CONFIG);
            incomingHostPcRef.current = pc;
            const inboundStream = new MediaStream();

            pc.ontrack = (ev) => {
              ev.streams[0]?.getTracks().forEach((t) => {
                if (!inboundStream.getTracks().some((ex) => ex.id === t.id)) {
                  inboundStream.addTrack(t);
                }
              });
              if (!inboundStream.getTracks().some((ex) => ex.id === ev.track.id)) {
                inboundStream.addTrack(ev.track);
              }
              setRemoteHostStream(new MediaStream(inboundStream.getTracks()));
            };

            pc.onicecandidate = (ev) => {
              if (ev.candidate) {
                const env: SignalEnvelope = {
                  channel: 'host-to-student',
                  candidate: ev.candidate.toJSON(),
                };
                void sendLiveClassSignal(activeClassId, sig.fromUid, 'ice', JSON.stringify(env));
              }
            };

            void (async () => {
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(parsed.sdp!));
                await flushIce(iceKey, pc);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                const env: SignalEnvelope = {
                  channel: 'host-to-student',
                  sdp: pc.localDescription?.toJSON() ?? answer,
                };
                await sendLiveClassSignal(activeClassId, sig.fromUid, 'answer', JSON.stringify(env));
              } catch (err) {
                console.error('Student handling host offer error:', err);
              }
            })();
          } else if (sig.type === 'ice' && parsed.candidate) {
            const pc = incomingHostPcRef.current;
            if (pc && pc.remoteDescription) {
              void pc.addIceCandidate(new RTCIceCandidate(parsed.candidate)).catch(() => {});
            } else {
              const list = pendingIceRef.current.get(iceKey) ?? [];
              list.push(parsed.candidate);
              pendingIceRef.current.set(iceKey, list);
            }
          }
          return;
        }

        // 2) Host receiving Student's answer to 'host-to-student' offer
        if (parsed.channel === 'host-to-student' && isAdmin) {
          const pc = hostOutboundPeersRef.current.get(sig.fromUid);
          const iceKey = `student-out:${sig.fromUid}`;
          if (!pc) return;
          if (sig.type === 'answer' && parsed.sdp) {
            void (async () => {
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(parsed.sdp!));
                await flushIce(iceKey, pc);
              } catch (err) {
                console.error('Host applying student answer error:', err);
              }
            })();
          } else if (sig.type === 'ice' && parsed.candidate) {
            if (pc.remoteDescription) {
              void pc.addIceCandidate(new RTCIceCandidate(parsed.candidate)).catch(() => {});
            } else {
              const list = pendingIceRef.current.get(iceKey) ?? [];
              list.push(parsed.candidate);
              pendingIceRef.current.set(iceKey, list);
            }
          }
          return;
        }

        // 3) Host receiving Permitted Student's webcam/mic offer ('student-to-host')
        if (parsed.channel === 'student-to-host' && isAdmin) {
          const senderParticipant = participantsRef.current.find((p) => p.userId === sig.fromUid);
          if (!senderParticipant?.canPublishMedia) {
            return; // Ignore unauthorized student stream attempts
          }
          const iceKey = `student-in:${sig.fromUid}`;
          if (sig.type === 'offer' && parsed.sdp) {
            incomingStudentPeersRef.current.get(sig.fromUid)?.close();
            const pc = new RTCPeerConnection(RTC_CONFIG);
            incomingStudentPeersRef.current.set(sig.fromUid, pc);
            const inboundStream = new MediaStream();

            pc.ontrack = (ev) => {
              ev.streams[0]?.getTracks().forEach((t) => {
                if (!inboundStream.getTracks().some((ex) => ex.id === t.id)) {
                  inboundStream.addTrack(t);
                }
              });
              if (!inboundStream.getTracks().some((ex) => ex.id === ev.track.id)) {
                inboundStream.addTrack(ev.track);
              }
              setRemoteStudentStreams((prev) => ({
                ...prev,
                [sig.fromUid]: new MediaStream(inboundStream.getTracks()),
              }));
            };

            pc.onicecandidate = (ev) => {
              if (ev.candidate) {
                const env: SignalEnvelope = {
                  channel: 'student-to-host',
                  candidate: ev.candidate.toJSON(),
                };
                void sendLiveClassSignal(activeClassId, sig.fromUid, 'ice', JSON.stringify(env));
              }
            };

            void (async () => {
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(parsed.sdp!));
                await flushIce(iceKey, pc);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                const env: SignalEnvelope = {
                  channel: 'student-to-host',
                  sdp: pc.localDescription?.toJSON() ?? answer,
                };
                await sendLiveClassSignal(activeClassId, sig.fromUid, 'answer', JSON.stringify(env));
              } catch (err) {
                console.error('Host handling student media offer error:', err);
              }
            })();
          } else if (sig.type === 'ice' && parsed.candidate) {
            const pc = incomingStudentPeersRef.current.get(sig.fromUid);
            if (pc && pc.remoteDescription) {
              void pc.addIceCandidate(new RTCIceCandidate(parsed.candidate)).catch(() => {});
            } else {
              const list = pendingIceRef.current.get(iceKey) ?? [];
              list.push(parsed.candidate);
              pendingIceRef.current.set(iceKey, list);
            }
          }
          return;
        }

        // 4) Student receiving Host's answer for 'student-to-host'
        if (parsed.channel === 'student-to-host' && !isAdmin) {
          const pc = studentOutboundPcRef.current;
          const iceKey = `my-out:${sig.fromUid}`;
          if (!pc) return;
          if (sig.type === 'answer' && parsed.sdp) {
            void (async () => {
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(parsed.sdp!));
                await flushIce(iceKey, pc);
              } catch (err) {
                console.error('Student applying host answer error:', err);
              }
            })();
          } else if (sig.type === 'ice' && parsed.candidate) {
            if (pc.remoteDescription) {
              void pc.addIceCandidate(new RTCIceCandidate(parsed.candidate)).catch(() => {});
            } else {
              const list = pendingIceRef.current.get(iceKey) ?? [];
              list.push(parsed.candidate);
              pendingIceRef.current.set(iceKey, list);
            }
          }
        }
      });
    });

    return () => {
      unsub();
    };
  }, [
    user,
    activeClassId,
    hasClassAccess,
    isAdmin,
    subscribeLiveClassSignals,
    consumeLiveClassSignal,
    sendLiveClassSignal,
  ]);

  // Instructor media actions
  const startHostCamera = async () => {
    if (!isAdmin || !activeClassId) return;
    await stopHostMedia(false, activeClassId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localHostStreamRef.current = stream;
      setLocalHostStream(stream);
      setMediaMode('camera');
      setHostMicEnabled(true);
      await updateHostMediaState(activeClassId, 'camera', true);
      await upsertMyLiveClassPresence(activeClassId, { cameraActive: true, micActive: true });
      notify('وب‌کم و میکروفن استاد متصل و برای دانش‌آموزان فعال شد.', 'success');
    } catch {
      notify('دسترسی به دوربین یا میکروفن در مرورگر مسدود است یا دستگاهی یافت نشد.', 'error');
    }
  };

  const startHostScreenShare = async () => {
    if (!isAdmin || !activeClassId) return;
    await stopHostMedia(false, activeClassId);
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const extraTracks: MediaStreamTrack[] = [];
      let hasAudio = displayStream.getAudioTracks().length > 0;

      // Capture instructor voice alongside screen share so students hear commentary
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getAudioTracks().forEach((t) => {
          displayStream.addTrack(t);
          extraTracks.push(t);
          hasAudio = true;
        });
      } catch {
        // Screen share proceeds without mic if microphone access isn't available
      }

      extraCleanupTracksRef.current = extraTracks;
      displayStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        void stopHostMedia(true, activeClassId);
      });

      localHostStreamRef.current = displayStream;
      setLocalHostStream(displayStream);
      setMediaMode('screen');
      setHostMicEnabled(hasAudio);
      await updateHostMediaState(activeClassId, 'screen', hasAudio);
      await upsertMyLiveClassPresence(activeClassId, {
        cameraActive: true,
        micActive: hasAudio,
      });
      notify('اشتراک‌گذاری صفحه نمایش استاد برای دانش‌آموزان فعال شد.', 'success');
    } catch {
      notify('اشتراک‌گذاری صفحه توسط استاد لغو شد یا در دسترس نیست.', 'info');
    }
  };

  const toggleHostMic = async () => {
    if (!isAdmin || !activeClassId || !localHostStreamRef.current) return;
    const audioTracks = localHostStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) {
      notify('تراک صوتی فعالی برای میکروفن متصل نیست.', 'info');
      return;
    }
    const nextEnabled = !hostMicEnabled;
    audioTracks.forEach((t) => {
      t.enabled = nextEnabled;
    });
    setHostMicEnabled(nextEnabled);
    await updateHostMediaState(activeClassId, mediaMode, nextEnabled);
    await upsertMyLiveClassPresence(activeClassId, { micActive: nextEnabled });
  };

  // Student media actions (strictly require canPublishMedia === true)
  const startStudentMedia = async () => {
    if (!user || !activeClassId) return;
    if (!myParticipant?.canPublishMedia) {
      notify('تا زمانی که استاد اجازه ندهد امکان باز کردن وب‌کم یا میکروفن وجود ندارد.', 'error');
      return;
    }
    await stopStudentMedia(false, activeClassId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStudentStreamRef.current = stream;
      setLocalStudentStream(stream);
      setStudentMicEnabled(true);
      await upsertMyLiveClassPresence(activeClassId, {
        cameraRequested: false,
        cameraActive: true,
        micActive: true,
      });
      notify('وب‌کم و میکروفن شما با مجوز استاد فعال شد.', 'success');
    } catch {
      notify('دسترسی مرورگر به دوربین یا میکروفن تایید نشد.', 'error');
    }
  };

  const toggleStudentMic = async () => {
    if (!activeClassId || !localStudentStreamRef.current) return;
    const audioTracks = localStudentStreamRef.current.getAudioTracks();
    const next = !studentMicEnabled;
    audioTracks.forEach((t) => {
      t.enabled = next;
    });
    setStudentMicEnabled(next);
    await upsertMyLiveClassPresence(activeClassId, { micActive: next });
  };

  const handleRequestCameraAccess = async () => {
    if (!user || !activeClassId) return;
    await upsertMyLiveClassPresence(activeClassId, { cameraRequested: true });
    notify('درخواست باز کردن وب‌کم و میکروفن برای استاد ارسال شد.', 'success');
  };

  // Drawing pointer helpers
  const getRelativePoint = (e: React.PointerEvent<SVGSVGElement>): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 800);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 420);
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isAdmin || !activeClass || !isBoardOpen) return;
    const pt = getRelativePoint(e);
    if (!pt) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setDraftPath(`M ${pt.x} ${pt.y}`);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing || !isAdmin || !isBoardOpen) return;
    const pt = getRelativePoint(e);
    if (!pt) return;
    setDraftPath((prev) => `${prev} L ${pt.x} ${pt.y}`);
  };

  const handlePointerUp = async () => {
    if (!isDrawing || !activeClass) return;
    setIsDrawing(false);
    const completed = draftPath.trim();
    setDraftPath('');
    if (completed.length > 5 && isBoardOpen) {
      await addLiveClassStroke(activeClass.id, {
        color: penColor,
        width: penWidth,
        path: completed,
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !messageInput.trim()) return;
    setSendingMsg(true);
    try {
      const ok = await sendLiveClassMessage(activeClass.id, messageInput, messageType);
      if (ok) {
        setMessageInput('');
        if (messageType === 'hand-raise') setMessageType('chat');
      }
    } finally {
      setSendingMsg(false);
    }
  };

  const handleQuickRaiseHand = async () => {
    if (!activeClass) return;
    await sendLiveClassMessage(activeClass.id, 'درخواست پرسش شفاهی / بالا بردن دست', 'hand-raise');
  };

  const handleSaveBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass) return;
    setSavingBoard(true);
    try {
      await updateLiveClassBoard(activeClass.id, boardTitleInput, boardContentInput, streamUrlInput);
    } finally {
      setSavingBoard(false);
    }
  };

  const pinnedMessages = useMemo(() => messages.filter((m) => m.isPinned), [messages]);
  const raisedHandsCount = useMemo(
    () => messages.filter((m) => m.messageType === 'hand-raise' && !m.isAnswered).length,
    [messages]
  );

  const activeHostStream = isAdmin ? localHostStream : remoteHostStream;
  const hostBroadcastActive = isAdmin
    ? mediaMode !== 'none'
    : Boolean(activeClass?.hostMediaMode && activeClass.hostMediaMode !== 'none') || Boolean(remoteHostStream);

  const remoteStudentEntries = useMemo(
    () =>
      Object.entries(remoteStudentStreams).map(([uid, stream]) => ({
        uid,
        stream,
        name: participants.find((p) => p.userId === uid)?.displayName ?? 'دانش‌آموز',
      })),
    [remoteStudentStreams, participants]
  );

  const statusMeta = (status: LiveClass['status']) => {
    switch (status) {
      case 'live':
        return {
          label: 'در حال پخش زنده',
          cls: 'text-emerald-700 dark:text-emerald-400',
          dotCls: 'bg-emerald-600 dark:bg-emerald-400',
        };
      case 'scheduled':
        return {
          label: 'برنامه‌ریزی‌شده',
          cls: 'text-amber-700 dark:text-amber-400',
          dotCls: 'bg-amber-500',
        };
      default:
        return {
          label: 'پایان‌یافته',
          cls: 'text-slate-500 dark:text-slate-400',
          dotCls: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Class Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <Radio className="w-4 h-4" />
              <span>کلاس‌های آنلاین و کارگاه‌های زنده زیست‌ماز</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {activeClass ? activeClass.title : 'تالار برگزاری کلاس آنلاین'}
            </h1>
            {activeClass && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                مدرس: {activeClass.instructorName} · {activeClass.grade} · {activeClass.courseTitle} ·{' '}
                {activeClass.scheduledLabel} ·{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeClass.isFree ? 'عمومی و رایگان' : 'اختصاصی ثبت‌نام‌شدگان دوره'}
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setView('admin-panel')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>مدیریت کلاس‌ها</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setView('courses')}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              بازگشت به دوره‌ها
            </button>
          </div>
        </div>

        {/* Class Switcher Tabs */}
        {liveClasses.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            {liveClasses.map((lc) => {
              const meta = statusMeta(lc.status);
              const isSelected = activeClass?.id === lc.id;
              return (
                <button
                  key={lc.id}
                  type="button"
                  onClick={() => openLiveClass(lc.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isSelected ? 'bg-white' : meta.dotCls
                    }`}
                  />
                  {!lc.isFree && <Lock className="w-3 h-3 shrink-0 opacity-80" />}
                  <span className="truncate max-w-[230px]">{lc.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!activeClass ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Video className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            هنوز کلاس آنلاینی تعریف نشده است
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            مدیر سیستم می‌تواند از بخش مدیریت، کلاس آنلاین جدید تعریف و آغاز کند.
          </p>
        </div>
      ) : !hasClassAccess ? (
        /* Enrolled-Only / Course Purchase Gate */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              این کلاس آنلاین اختصاصی ثبت‌نام‌شدگان دوره است
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              کلاس «{activeClass.title}» مربوط به{' '}
              <span className="font-bold text-slate-900 dark:text-slate-200">
                {activeClass.courseTitle}
              </span>{' '}
              است. برای مشاهده وب‌کم و تخته استاد و حضور در کلاس زنده باید در این دوره ثبت‌نام کرده باشید.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!user ? (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl cursor-pointer"
              >
                ورود با گوگل و بررسی وضعیت ثبت‌نام
              </button>
            ) : activeClass.courseId === 'general' ? (
              <button
                type="button"
                onClick={() => {
                  addToCart({
                    id: DIAMOND_PACKAGE.id,
                    type: 'diamond',
                    title: DIAMOND_PACKAGE.title,
                    subtitle: DIAMOND_PACKAGE.subtitle,
                    price: DIAMOND_PACKAGE.price,
                  });
                  setIsCartOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>افزودن اشتراک الماس ماز به سبد خرید</span>
              </button>
            ) : linkedCourse ? (
              <>
                <button
                  type="button"
                  onClick={() => openCourseDetail(linkedCourse.id)}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  مشاهده جزئیات دوره
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToCart({
                      id: linkedCourse.id,
                      type: 'course',
                      title: linkedCourse.title,
                      subtitle: `${linkedCourse.instructor} · ${linkedCourse.grade}`,
                      price: linkedCourse.discountPrice ?? linkedCourse.price,
                    });
                    setIsCartOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>ثبت‌نام در دوره و ورود به کلاس</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setView('courses')}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl cursor-pointer"
              >
                مشاهده لیست دوره‌ها
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Classroom Main Stage & Interactive Whiteboard (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Live Stage Header + Admin Broadcast Controls */}
            <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusMeta(activeClass.status).dotCls}`} />
                  <span className={activeClass.status === 'live' ? 'text-emerald-400' : 'text-slate-300'}>
                    {statusMeta(activeClass.status).label}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300">{activeClass.subject}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isAdmin && (
                    <>
                      {activeClass.status !== 'live' ? (
                        <button
                          type="button"
                          onClick={() => void setLiveClassStatus(activeClass, 'live')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>شروع کلاس زنده</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void setLiveClassStatus(activeClass, 'ended')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>پایان کلاس</span>
                        </button>
                      )}

                      {mediaMode !== 'camera' && (
                        <button
                          type="button"
                          onClick={() => void startHostCamera()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5 text-emerald-400" />
                          <span>وب‌کم + میکروفن</span>
                        </button>
                      )}

                      {mediaMode !== 'screen' && (
                        <button
                          type="button"
                          onClick={() => void startHostScreenShare()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          <Monitor className="w-3.5 h-3.5 text-sky-400" />
                          <span>اشتراک صفحه</span>
                        </button>
                      )}

                      {mediaMode !== 'none' && (
                        <>
                          <button
                            type="button"
                            onClick={() => void toggleHostMic()}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                              hostMicEnabled
                                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300'
                                : 'bg-amber-900/70 hover:bg-amber-800 text-amber-100'
                            }`}
                          >
                            {hostMicEnabled ? (
                              <Mic className="w-3.5 h-3.5" />
                            ) : (
                              <MicOff className="w-3.5 h-3.5" />
                            )}
                            <span>{hostMicEnabled ? 'میکروفن باز' : 'میکروفن قطع'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void stopHostMedia(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/70 hover:bg-rose-800 text-rose-100 text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            <VideoOff className="w-3.5 h-3.5" />
                            <span>توقف پخش</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => void toggleLiveClassBoard(activeClass, !isBoardOpen)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                          isBoardOpen
                            ? 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                            : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        {isBoardOpen ? (
                          <PanelTopClose className="w-3.5 h-3.5" />
                        ) : (
                          <PanelTopOpen className="w-3.5 h-3.5" />
                        )}
                        <span>{isBoardOpen ? 'بستن تخته' : 'باز کردن تخته'}</span>
                      </button>
                    </>
                  )}

                  {activeClass.streamUrl && (
                    <a
                      href={activeClass.streamUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>لینک استریم ویدیویی</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Instructor Live Video / Screen Share Stage */}
              {hostBroadcastActive && (
                <div className="bg-black border-b border-slate-800 relative">
                  {activeHostStream ? (
                    <StreamVideo
                      stream={activeHostStream}
                      muted={isAdmin || remoteHostAudioMuted}
                      className="w-full max-h-[380px] object-contain mx-auto bg-black"
                    />
                  ) : (
                    <div className="py-16 px-6 text-center space-y-2">
                      <Radio className="w-7 h-7 text-emerald-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-200">
                        {activeClass.hostMediaMode === 'screen'
                          ? 'استاد در حال اشتراک‌گذاری صفحه نمایش است'
                          : 'وب‌کم و میکروفن استاد روشن است'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {user
                          ? 'در حال برقراری ارتباط زنده تصویر و صدا با مرورگر استاد...'
                          : 'برای دریافت تصویر زنده استاد با حساب خود وارد شوید.'}
                      </p>
                    </div>
                  )}

                  <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="font-semibold">
                        {(isAdmin ? mediaMode : activeClass.hostMediaMode) === 'screen'
                          ? 'اشتراک‌گذاری صفحه نمایش مدرس'
                          : 'تصویر زنده وب‌کم مدرس'}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span
                        className={
                          (isAdmin ? hostMicEnabled : activeClass.hostMicEnabled !== false)
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }
                      >
                        {(isAdmin ? hostMicEnabled : activeClass.hostMicEnabled !== false)
                          ? 'میکروفن استاد باز'
                          : 'میکروفن استاد بی‌صدا'}
                      </span>
                    </div>

                    {!isAdmin && activeHostStream && (
                      <button
                        type="button"
                        onClick={() => setRemoteHostAudioMuted((m) => !m)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
                      >
                        {remoteHostAudioMuted ? (
                          <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{remoteHostAudioMuted ? 'وصل صدای پخش' : 'بی‌صدا کردن'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Permitted Student Webcams Grid (Visible to Instructor & Presenter) */}
              {(remoteStudentEntries.length > 0 || (!isAdmin && localStudentStream)) && (
                <div className="p-3 bg-slate-950 border-b border-slate-800 space-y-2">
                  <p className="text-xs font-semibold text-slate-400">
                    تصویر زنده دانش‌آموزان مجاز:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {!isAdmin && localStudentStream && (
                      <div className="rounded-xl overflow-hidden border border-emerald-700/60 bg-black">
                        <StreamVideo
                          stream={localStudentStream}
                          muted
                          className="w-full h-36 object-cover"
                        />
                        <div className="px-3 py-1.5 bg-slate-900 flex items-center justify-between text-xs text-slate-200">
                          <span>وب‌کم شما (پخش زنده)</span>
                          <span className="text-emerald-400">مجاز</span>
                        </div>
                      </div>
                    )}
                    {remoteStudentEntries.map((entry) => (
                      <div
                        key={entry.uid}
                        className="rounded-xl overflow-hidden border border-slate-800 bg-black"
                      >
                        <StreamVideo stream={entry.stream} className="w-full h-36 object-cover" />
                        <div className="px-3 py-1.5 bg-slate-900 flex items-center justify-between gap-2 text-xs text-slate-200">
                          <span className="truncate font-semibold">{entry.name}</span>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                void setParticipantMediaPermission(activeClass.id, entry.uid, false)
                              }
                              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer shrink-0"
                            >
                              بستن وب‌کم
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Self Camera/Mic Permission Bar */}
              {!isAdmin && user && (
                <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  {!myParticipant?.canPublishMedia ? (
                    <>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          دسترسی وب‌کم و میکروفن شما قفل است (تا زمان اجازه استاد امکان باز کردن دوربین و صدا ندارید).
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={Boolean(myParticipant?.cameraRequested)}
                        onClick={() => void handleRequestCameraAccess()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-400 text-white cursor-pointer"
                      >
                        <Hand className="w-3.5 h-3.5" />
                        <span>
                          {myParticipant?.cameraRequested
                            ? 'درخواست برای استاد ارسال شد'
                            : 'درخواست باز کردن وب‌کم و میکروفن'}
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                        <UserCheck className="w-4 h-4 shrink-0" />
                        <span>استاد مجوز استفاده از وب‌کم و میکروفن را برای شما فعال کرده است.</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {!localStudentStream ? (
                          <button
                            type="button"
                            onClick={() => void startStudentMedia()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>روشن کردن وب‌کم و میکروفن من</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => void toggleStudentMic()}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                                studentMicEnabled
                                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300'
                                  : 'bg-amber-900/70 hover:bg-amber-800 text-amber-100'
                              }`}
                            >
                              {studentMicEnabled ? (
                                <Mic className="w-3.5 h-3.5" />
                              ) : (
                                <MicOff className="w-3.5 h-3.5" />
                              )}
                              <span>{studentMicEnabled ? 'میکروفن باز' : 'میکروفن قطع'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => void stopStudentMedia(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-700 hover:bg-rose-600 text-white cursor-pointer"
                            >
                              <VideoOff className="w-3.5 h-3.5" />
                              <span>خاموش کردن وب‌کم</span>
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Whiteboard Section (Collapsible / Togglable by Instructor) */}
              {!isBoardOpen ? (
                <div className="px-6 py-8 bg-slate-950 text-center space-y-3">
                  <PanelTopClose className="w-7 h-7 text-slate-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">
                    تخته هوشمند کلاس موقتاً توسط استاد بسته شده است
                  </p>
                  <p className="text-xs text-slate-500">
                    {isAdmin
                      ? 'هر زمان نیاز بود می‌توانید دوباره تخته تدریس را برای همه دانش‌آموزان باز کنید.'
                      : 'در حال حاضر تمرکز کلاس روی تصویر زنده یا اشتراک صفحه مدرس است.'}
                  </p>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => void toggleLiveClassBoard(activeClass, true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      <PanelTopOpen className="w-4 h-4" />
                      <span>باز کردن تخته</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Whiteboard Toolbar (Admin) */}
                  {isAdmin && (
                    <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <PenTool className="w-4 h-4 text-emerald-400" />
                        <span>تخته هوشمند همگام‌سازی‌شده (روی تخته بنویسید تا دانش‌آموزان زنده ببینند):</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {PEN_COLORS.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setPenColor(c.hex)}
                            aria-label={c.label}
                            style={{ backgroundColor: c.hex }}
                            className={`w-5 h-5 rounded-full border-2 cursor-pointer ${
                              penColor === c.hex ? 'border-white scale-110' : 'border-slate-700'
                            }`}
                          />
                        ))}
                        <select
                          value={penWidth}
                          onChange={(e) => setPenWidth(Number(e.target.value))}
                          className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs"
                        >
                          <option value={2}>قلم نازک</option>
                          <option value={3}>قلم متوسط</option>
                          <option value={6}>قلم ضخیم</option>
                        </select>
                        <button
                          type="button"
                          disabled={strokes.length === 0}
                          onClick={() =>
                            void clearLiveClassStrokes(
                              activeClass.id,
                              strokes.map((s) => s.id)
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-rose-900/60 disabled:opacity-40 text-slate-200 rounded cursor-pointer"
                        >
                          <Eraser className="w-3.5 h-3.5" />
                          <span>پاک کردن تخته</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Interactive SVG Whiteboard */}
                  <div className="relative bg-slate-950 select-none">
                    <svg
                      ref={svgRef}
                      viewBox="0 0 800 420"
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={() => void handlePointerUp()}
                      onPointerLeave={() => {
                        if (isDrawing) void handlePointerUp();
                      }}
                      className={`w-full aspect-[800/420] touch-none ${
                        isAdmin ? 'cursor-crosshair' : 'cursor-default'
                      }`}
                    >
                      <defs>
                        <pattern id="board-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="rgba(148,163,184,0.12)"
                            strokeWidth="1"
                          />
                        </pattern>
                      </defs>
                      <rect width="800" height="420" fill="url(#board-grid)" />

                      {strokes.map((st) => (
                        <path
                          key={st.id}
                          d={st.path}
                          fill="none"
                          stroke={st.color}
                          strokeWidth={st.width}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ))}
                      {draftPath && (
                        <path
                          d={draftPath}
                          fill="none"
                          stroke={penColor}
                          strokeWidth={penWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>

                    {strokes.length === 0 && !draftPath && (
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                        <p className="text-sm font-bold text-slate-300">
                          {activeClass.boardTitle || 'تخته تدریس کلاس آنلاین زیست‌ماز'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {isAdmin
                            ? 'با ماوس یا قلم روی این تخته رسم کنید؛ تمام خطوط به‌صورت زنده برای دانش‌آموزان نمایش داده می‌شوند.'
                            : 'یادداشت‌ها و ترسیم‌های زنده مدرس در این بخش نمایش داده می‌شوند.'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Synced Lecture Notes Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeClass.boardTitle || 'نکات کلیدی تخته کلاس'}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  همگام‌سازی زنده با سرور
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-8 whitespace-pre-line">
                {activeClass.boardContent || 'مطلبی برای تخته ثبت نشده است.'}
              </p>
            </div>

            {/* Admin Live Notes & Stream Editor */}
            {isAdmin && (
              <form
                onSubmit={handleSaveBoard}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    کنترل تخته و لینک استریم مدرس
                  </h3>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    دسترسی استاد / مدیر
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={boardTitleInput}
                    onChange={(e) => setBoardTitleInput(e.target.value)}
                    placeholder="عنوان مبحث روی تخته"
                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <input
                    type="url"
                    value={streamUrlInput}
                    onChange={(e) => setStreamUrlInput(e.target.value)}
                    placeholder="لینک پخش خارجی (اختیاری: آپارات / اسکای‌روم / گوگل میت)"
                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <textarea
                  rows={4}
                  value={boardContentInput}
                  onChange={(e) => setBoardContentInput(e.target.value)}
                  placeholder="خلاصه نکات، تست‌ها یا فرمول‌های جلسه برای نمایش زنده به دانش‌آموزان..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={savingBoard}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {savingBoard ? 'در حال ارسال...' : 'به‌روزرسانی تخته برای دانش‌آموزان'}
                </button>
              </form>
            )}
          </div>

          {/* Right Sidebar: Live Chat & Participants Permissions (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col max-h-[820px]">
            {/* Sidebar Tab Switcher */}
            <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setSidebarTab('chat')}
                className={`py-3 px-3 flex items-center justify-center gap-1.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  sidebarTab === 'chat'
                    ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>گفت‌وگو ({toPersianDigits(messages.length)})</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('participants')}
                className={`py-3 px-3 flex items-center justify-center gap-1.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  sidebarTab === 'participants'
                    ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>حاضرین ({toPersianDigits(participants.length)})</span>
                {isAdmin && pendingCameraRequestsCount > 0 && (
                  <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">
                    · {toPersianDigits(pendingCameraRequestsCount)} درخواست
                  </span>
                )}
              </button>
            </div>

            {sidebarTab === 'participants' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[380px]">
                {!user ? (
                  <div className="py-10 text-center space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      برای مشاهده حاضرین کلاس و ارسال درخواست وب‌کم وارد حساب گوگل شوید.
                    </p>
                    <button
                      type="button"
                      onClick={() => void signInWithGoogle()}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      ورود به کلاس آنلاین
                    </button>
                  </div>
                ) : participants.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-10">
                    در حال ثبت حضور شرکت‌کنندگان در جلسه...
                  </p>
                ) : (
                  <>
                    <div className="text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>مدیریت دسترسی وب‌کم و میکروفن شرکت‌کنندگان</span>
                      {raisedHandsCount > 0 && (
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">
                          {toPersianDigits(raisedHandsCount)} دست بالا
                        </span>
                      )}
                    </div>

                    {participants.map((p) => {
                      const isInstructorParticipant = p.role === 'instructor';
                      const isSelf = p.userId === user.uid;
                      return (
                        <div
                          key={p.userId}
                          className={`p-3 rounded-xl border text-xs space-y-2 ${
                            p.cameraRequested && !p.canPublishMedia
                              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                              : p.canPublishMedia && !isInstructorParticipant
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {p.displayName} {isSelf ? '(شما)' : ''}
                            </div>
                            <span
                              className={`text-[11px] font-semibold shrink-0 ${
                                isInstructorParticipant
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : p.canPublishMedia
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : p.cameraRequested
                                      ? 'text-amber-700 dark:text-amber-400'
                                      : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {isInstructorParticipant
                                ? 'استاد / میزبان'
                                : p.canPublishMedia
                                  ? p.cameraActive
                                    ? 'وب‌کم روشن'
                                    : 'مجاز به پخش'
                                  : p.cameraRequested
                                    ? 'درخواست وب‌کم'
                                    : 'دسترسی قفل'}
                            </span>
                          </div>

                          {isAdmin && !isInstructorParticipant && (
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                وضعیت صدا: {p.micActive ? 'میکروفن باز' : 'بی‌صدا'}
                              </span>
                              {!p.canPublishMedia ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void setParticipantMediaPermission(activeClass.id, p.userId, true)
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg cursor-pointer"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>دادن دسترسی وب‌کم/صدا</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void setParticipantMediaPermission(activeClass.id, p.userId, false)
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg cursor-pointer"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>بستن دسترسی</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>پرسش‌وپاسخ زنده جلسه</span>
                  {raisedHandsCount > 0 && (
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">
                      {toPersianDigits(raisedHandsCount)} دست بالا
                    </span>
                  )}
                </div>

                {/* Pinned Questions */}
                {pinnedMessages.length > 0 && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-900 space-y-2">
                    {pinnedMessages.map((pm) => (
                      <div key={`pin-${pm.id}`} className="text-xs space-y-0.5">
                        <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <Pin className="w-3 h-3" />
                          <span>پین‌شده توسط استاد — {pm.senderName}:</span>
                        </p>
                        <p className="text-slate-800 dark:text-slate-200">{pm.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[340px]">
                  {!user ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        برای مشاهده پیام‌های کلاس و پرسیدن سوال از استاد، با حساب گوگل خود وارد شوید.
                      </p>
                      <button
                        type="button"
                        onClick={() => void signInWithGoogle()}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        ورود به کلاس آنلاین
                      </button>
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-10">
                      هنوز پیامی در این جلسه ثبت نشده است. اولین سوال یا پیام را ارسال کنید.
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isInstructor = msg.senderRole === 'instructor';
                      return (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                            isInstructor
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-900'
                              : msg.messageType === 'hand-raise'
                                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-bold">
                              <span
                                className={
                                  isInstructor
                                    ? 'text-emerald-800 dark:text-emerald-300'
                                    : 'text-slate-900 dark:text-slate-100'
                                }
                              >
                                {msg.senderName}
                              </span>
                              {isInstructor && (
                                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  (استاد)
                                </span>
                              )}
                              {msg.messageType === 'question' && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] text-sky-700 dark:text-sky-400">
                                  <HelpCircle className="w-3 h-3" />
                                  سوال
                                </span>
                              )}
                              {msg.messageType === 'hand-raise' && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                                  <Hand className="w-3 h-3" />
                                  بالا بردن دست
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {msg.isAnswered && (
                                <CheckCircle2
                                  className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                                  aria-label="پاسخ داده شد"
                                />
                              )}
                              {isAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void updateLiveClassMessageModeration(activeClass.id, msg.id, {
                                        isPinned: !msg.isPinned,
                                      })
                                    }
                                    title={msg.isPinned ? 'برداشتن پین' : 'پین کردن'}
                                    className={`p-1 rounded cursor-pointer ${
                                      msg.isPinned
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                                  >
                                    <Pin className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void updateLiveClassMessageModeration(activeClass.id, msg.id, {
                                        isAnswered: !msg.isAnswered,
                                      })
                                    }
                                    title="علامت‌گذاری به عنوان پاسخ داده‌شده"
                                    className={`p-1 rounded cursor-pointer ${
                                      msg.isAnswered
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-slate-400 hover:text-emerald-600'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {(isAdmin || msg.userId === user.uid) && (
                                <button
                                  type="button"
                                  onClick={() => void deleteLiveClassMessage(activeClass.id, msg.id)}
                                  title="حذف پیام"
                                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {msg.text}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Composer */}
                {user && (
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMessageType('chat')}
                          className={`px-2.5 py-1 rounded-lg font-medium border cursor-pointer ${
                            messageType === 'chat'
                              ? 'bg-slate-900 dark:bg-emerald-700 text-white border-slate-900 dark:border-emerald-700'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          پیام
                        </button>
                        <button
                          type="button"
                          onClick={() => setMessageType('question')}
                          className={`px-2.5 py-1 rounded-lg font-medium border cursor-pointer ${
                            messageType === 'question'
                              ? 'bg-sky-700 text-white border-sky-700'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          سوال درسی
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleQuickRaiseHand()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50"
                      >
                        <Hand className="w-3.5 h-3.5" />
                        <span>بالا بردن دست</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={
                          messageType === 'question'
                            ? 'سوال درسی خود را برای استاد بنویسید...'
                            : 'پیام خود را بنویسید...'
                        }
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <button
                        type="submit"
                        disabled={sendingMsg || !messageInput.trim()}
                        className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg cursor-pointer"
                        aria-label="ارسال پیام"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

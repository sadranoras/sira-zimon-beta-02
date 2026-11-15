import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eraser,
  ExternalLink,
  Hand,
  HelpCircle,
  MessageSquare,
  Monitor,
  PenTool,
  Pin,
  Play,
  Radio,
  Send,
  ShieldCheck,
  Square,
  Trash2,
  Video,
  VideoOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { LiveClass, LiveClassMessage, LiveClassMessageType, LiveClassStroke } from '../types';
import { toPersianDigits } from '../utils/formatters';

const PEN_COLORS = [
  { id: 'emerald', hex: '#34d399', label: 'سبز' },
  { id: 'white', hex: '#f8fafc', label: 'سفید' },
  { id: 'amber', hex: '#fbbf24', label: 'زرد' },
  { id: 'sky', hex: '#38bdf8', label: 'آبی' },
  { id: 'rose', hex: '#fb7185', label: 'قرمز' },
];

export const LiveClassroomView: React.FC = () => {
  const {
    user,
    isAdmin,
    liveClasses,
    selectedLiveClassId,
    openLiveClass,
    setView,
    signInWithGoogle,
    setLiveClassStatus,
    updateLiveClassBoard,
    subscribeLiveClassMessages,
    sendLiveClassMessage,
    updateLiveClassMessageModeration,
    deleteLiveClassMessage,
    subscribeLiveClassStrokes,
    addLiveClassStroke,
    clearLiveClassStrokes,
    notify,
  } = useApp();

  const activeClass: LiveClass | undefined = useMemo(() => {
    if (selectedLiveClassId) {
      const found = liveClasses.find((c) => c.id === selectedLiveClassId);
      if (found) return found;
    }
    return liveClasses.find((c) => c.status === 'live') ?? liveClasses[0];
  }, [liveClasses, selectedLiveClassId]);

  const [messages, setMessages] = useState<LiveClassMessage[]>([]);
  const [strokes, setStrokes] = useState<LiveClassStroke[]>([]);
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

  // Host local camera / screen share preview
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [mediaMode, setMediaMode] = useState<'none' | 'camera' | 'screen'>('none');

  const stopMediaPreview = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setMediaMode('none');
  };

  useEffect(() => {
    return () => {
      stopMediaPreview();
    };
  }, []);

  useEffect(() => {
    if (!activeClass) return;
    setBoardTitleInput(activeClass.boardTitle);
    setBoardContentInput(activeClass.boardContent);
    setStreamUrlInput(activeClass.streamUrl || '');
  }, [activeClass?.id, activeClass?.boardTitle, activeClass?.boardContent, activeClass?.streamUrl]);

  useEffect(() => {
    if (!activeClass) return;
    const unsubMessages = subscribeLiveClassMessages(activeClass.id, setMessages);
    const unsubStrokes = subscribeLiveClassStrokes(activeClass.id, setStrokes);
    return () => {
      unsubMessages();
      unsubStrokes();
    };
  }, [activeClass?.id, subscribeLiveClassMessages, subscribeLiveClassStrokes]);

  const startCameraPreview = async () => {
    stopMediaPreview();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMediaMode('camera');
      notify('دوربین و میکروفون مدرس در استودیو فعال شد.', 'success');
    } catch {
      notify('دسترسی به دوربین یا میکروفون در مرورگر امکان‌پذیر نیست.', 'error');
    }
  };

  const startScreenSharePreview = async () => {
    stopMediaPreview();
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopMediaPreview();
      });
      setMediaMode('screen');
      notify('اشتراک‌گذاری صفحه نمایش مدرس فعال شد.', 'success');
    } catch {
      notify('اشتراک‌گذاری صفحه توسط کاربر لغو شد یا در دسترس نیست.', 'info');
    }
  };

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
    if (!isAdmin || !activeClass) return;
    const pt = getRelativePoint(e);
    if (!pt) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setDraftPath(`M ${pt.x} ${pt.y}`);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing || !isAdmin) return;
    const pt = getRelativePoint(e);
    if (!pt) return;
    setDraftPath((prev) => `${prev} L ${pt.x} ${pt.y}`);
  };

  const handlePointerUp = async () => {
    if (!isDrawing || !activeClass) return;
    setIsDrawing(false);
    const completed = draftPath.trim();
    setDraftPath('');
    if (completed.length > 5) {
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
                {activeClass.scheduledLabel}
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

                      {mediaMode === 'none' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void startCameraPreview()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5 text-emerald-400" />
                            <span>وب‌کم مدرس</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void startScreenSharePreview()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            <Monitor className="w-3.5 h-3.5 text-sky-400" />
                            <span>اشتراک صفحه</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={stopMediaPreview}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/70 hover:bg-rose-800 text-rose-100 text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          <VideoOff className="w-3.5 h-3.5" />
                          <span>توقف دوربین/صفحه</span>
                        </button>
                      )}
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

              {/* Host Local Video Preview if active */}
              {mediaMode !== 'none' && (
                <div className="bg-black border-b border-slate-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-[340px] object-contain mx-auto"
                  />
                </div>
              )}

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
                  {/* Subtle grid */}
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

          {/* Live Classroom Chat & Q&A Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col max-h-[780px]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  گفت‌وگو و پرسش‌وپاسخ زنده
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {raisedHandsCount > 0 && (
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    {toPersianDigits(raisedHandsCount)} دست بالا
                  </span>
                )}
                <span>·</span>
                <span>{toPersianDigits(messages.length)} پیام</span>
              </div>
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
          </div>
        </div>
      )}
    </div>
  );
};

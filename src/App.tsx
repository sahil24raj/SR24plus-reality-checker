import React, { useState, useEffect, Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Settings, 
  Plus, 
  History as HistoryIcon, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Brain,
  Zap,
  ShieldCheck,
  ChevronRight,
  Save,
  Trash2,
  BarChart3,
  Flame,
  ShieldAlert,
  Dna,
  Fingerprint,
  Timer,
  GitBranch,
  Ghost,
  Scale,
  UserPlus,
  Target,
  Cpu,
  ChevronDown,
  EyeOff
} from 'lucide-react';
import { format, startOfDay, subDays, isSameDay } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { cn } from './lib/utils';
import { AnalysisResult, UserProfile } from './types';
import { analyzeRealityWithGemini } from './services/geminiService';
import { Mic, Square, Volume2, LogOut, LogIn, User as UserIcon, Loader2 } from 'lucide-react';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { useRef } from 'react';

// --- Neural Background ---

const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number, y: number, vx: number, vy: number, size: number }[] = [];
    const particleCount = 60;
    const connectionDistance = 150;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 243, 255, 0.5)';
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            ctx.beginPath();
            ctx.lineWidth = 1 - dist / connectionDistance;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    createParticles();
    draw();

    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 opacity-40"
    />
  );
};

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Neural Interface Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-bg p-6">
          <div className="glass-card p-8 max-w-md w-full text-center space-y-4 border-red-500/20">
            <AlertCircle className="mx-auto text-red-500" size={48} />
            <h2 className="text-2xl font-bold text-white">Neural Interface Error</h2>
            <p className="text-gray-400 text-sm">
              An unexpected error occurred in the neural link. 
              {this.state.error?.message && <span className="block mt-2 font-mono text-xs text-red-400/80">{this.state.error.message}</span>}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-neon-cyan text-black font-bold rounded-xl hover:scale-105 transition-transform"
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Components ---

const AuthScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error?.code === 'auth/unauthorized-domain') {
        setError(`Domain "${window.location.hostname}" is not authorized. Please add it to Firebase Console → Authentication → Settings → Authorized domains.`);
      } else {
        setError(error?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#050507]">
      <NeuralBackground />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 blur-[150px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        className="glass-card p-12 max-w-lg w-full text-center space-y-8 relative z-10 border-neon-cyan/10"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="space-y-4">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-neon-cyan/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative w-24 h-24 bg-dark-card rounded-3xl flex items-center justify-center border border-neon-cyan/30 shadow-[0_0_30px_rgba(0,243,255,0.2)]">
              <Brain className="text-neon-cyan" size={48} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter italic neon-text-cyan">SR24+ <span className="text-white">Reality Checker</span></h1>
            <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.4em]">Neural Reality Interface v3.1</p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-neon-cyan font-bold leading-relaxed text-lg italic tracking-wide">
            AI that analyzes your daily decisions, emotions & patterns to improve your life.
          </p>
          <p className="text-gray-400 leading-relaxed text-sm">
            Establish a neural link to begin tracking your reality, decisions, and behavioral evolution across the digital timeline.
          </p>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] group"
          >
            {loading ? <Loader2 className="animate-spin" /> : <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />}
            {loading ? 'INITIALIZING LINK...' : 'SYNC NEURAL PROFILE'}
          </button>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 text-left">
              <span className="font-bold">⚠ Login Error: </span>{error}
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-white/5 grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-neon-cyan font-bold text-xs">REAL-TIME</div>
            <div className="text-[8px] text-gray-600 font-mono uppercase tracking-widest">Tracking</div>
          </div>
          <div className="space-y-1 border-x border-white/5">
            <div className="text-neon-purple font-bold text-xs">AI CORE</div>
            <div className="text-[8px] text-gray-600 font-mono uppercase tracking-widest">Advisor</div>
          </div>
          <div className="space-y-1">
            <div className="text-neon-green font-bold text-xs">SECURE</div>
            <div className="text-[8px] text-gray-600 font-mono uppercase tracking-widest">Encrypted</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Navbar = ({ activeTab, setActiveTab, user }: { activeTab: string, setActiveTab: (t: string) => void, user: User | null }) => (
  <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 glass-card flex items-center gap-10 border-neon-cyan/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
    {[
      { id: 'dashboard', icon: Activity, label: 'Dashboard' },
      { id: 'input', icon: Plus, label: 'New Scan' },
      { id: 'history', icon: HistoryIcon, label: 'Archives' },
      { id: 'profile', icon: UserIcon, label: 'Profile' },
    ].map((item) => (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={cn(
          "flex flex-col items-center gap-1.5 transition-all duration-500 relative group",
          activeTab === item.id ? "text-neon-cyan scale-110" : "text-gray-500 hover:text-gray-300"
        )}
      >
        <div className={cn(
          "p-2 rounded-xl transition-all duration-500",
          activeTab === item.id ? "bg-neon-cyan/10 shadow-[0_0_20px_rgba(0,243,255,0.2)]" : "group-hover:bg-white/5"
        )}>
          <item.icon size={22} />
        </div>
        <span className="text-[8px] font-bold uppercase tracking-[0.2em]">{item.label}</span>
        {activeTab === item.id && (
          <motion.div 
            layoutId="nav-glow" 
            className="absolute -inset-4 bg-neon-cyan/5 blur-2xl rounded-full -z-10" 
          />
        )}
      </button>
    ))}
    <div className="w-px h-10 bg-white/5 mx-2" />
    <button
      onClick={() => logout()}
      className="flex flex-col items-center gap-1.5 text-gray-600 hover:text-red-400 transition-all group"
      title="Logout"
    >
      <div className="p-2 rounded-xl group-hover:bg-red-500/10 transition-all">
        <LogOut size={22} />
      </div>
      <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Exit</span>
    </button>
  </nav>
);

const RealityInput = ({ onAnalyze, user, entries, userGoal }: { onAnalyze: (res: AnalysisResult) => void, user: User, entries: AnalysisResult[], userGoal: string }) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setText(prev => prev + (prev ? ' ' : '') + "[Vocal context captured]");
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const pastLogs = entries.slice(-5).map(e => e.input);
      const result = await analyzeRealityWithGemini(text, pastLogs, userGoal || undefined);
      const scansPath = `users/${user.uid}/scans`;
      const scanDocRef = doc(collection(db, scansPath));
      const scanId = scanDocRef.id;

      const scanData: AnalysisResult = {
        id: scanId,
        uid: user.uid,
        timestamp: new Date().toISOString(),
        input: text,
        
        // Standard fields
        confidence: result.confidence,
        tone: result.tone,
        behavior: result.behavior,
        decisionQuality: result.decisionQuality,
        sentiment: result.sentiment,
        realityScore: result.realityScore,

        // 16-Step Intelligence fields
        coreState: result.coreState,
        realityScores: result.realityScores,
        executionGap: result.executionGap,
        triggerDetection: result.triggerDetection,
        timelineAnalysis: result.timelineAnalysis,
        personalityProfile: result.personalityProfile,
        behaviorPattern: result.behaviorPattern,
        futurePrediction: result.futurePrediction,
        burnoutRisk: result.burnoutRisk,
        burnoutExplanation: result.burnoutExplanation,
        dopamineLoop: result.dopamineLoop,
        dopamineLoopExplanation: result.dopamineLoopExplanation,
        recoveryProtocol: result.recoveryProtocol,
        actionPlan: result.actionPlan,
        goalAlignment: result.goalAlignment,
        microWins: result.microWins,
        aiCoachMessage: result.aiCoachMessage,
        brutalRealityCheck: result.brutalRealityCheck,
        deepScan: result.deepScan,
      };

      try {
        await setDoc(scanDocRef, {
          ...scanData,
          timestamp: serverTimestamp()
        });
        onAnalyze(scanData);
        setText('');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, scansPath);
      }
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pt-12 space-y-8 pb-24">
      <div className="text-center space-y-2">
        <h2 className="text-5xl font-black italic tracking-tighter neon-text-cyan">Initiate Reality Scan</h2>
        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.4em]">Neural Link Active • Syncing Behavioral Vector</p>
      </div>

      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="glass-card p-8 space-y-6 border-neon-cyan/10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
        
        <div className="flex justify-end gap-2 mb-2">
          {!isRecording ? (
            <button 
              onClick={startRecording}
              className="px-4 py-2 rounded-xl bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 transition-all flex items-center gap-2 text-[10px] font-mono tracking-widest"
            >
              <Mic size={14} />
              RECORD NEURAL AUDIO
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-2 text-[10px] font-mono tracking-widest animate-pulse"
            >
              <Square size={14} />
              STOP CAPTURE
            </button>
          )}
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Today I decided to... I felt... because..."
            className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 text-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all resize-none"
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Neural Buffer: {text.length} chars</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex gap-4 text-gray-500 text-[10px] font-mono uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-neon-cyan" />
              Words: {text.split(/\s+/).filter(Boolean).length}
            </div>
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !text.trim()}
            className={cn(
              "px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(0,243,255,0.2)]",
              isAnalyzing 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                : "bg-neon-cyan text-black hover:scale-[1.05] active:scale-95 hover:shadow-[0_0_40px_rgba(0,243,255,0.4)]"
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Zap size={20} />
                Execute Scan
              </>
            )}
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-mono text-red-400 uppercase tracking-widest mb-1">Scan Failed</div>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-neon-cyan">
            <Brain size={20} />
            <h4 className="text-xs font-mono uppercase tracking-widest">Analysis Engine</h4>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Our neural engine processes your input through behavioral vectors to detect patterns in confidence, tone, and decision logic.
          </p>
        </div>
        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-neon-purple">
            <ShieldCheck size={20} />
            <h4 className="text-xs font-mono uppercase tracking-widest">Privacy Protocol</h4>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            All reality scans are encrypted and stored within your private neural vault. No data is shared outside your timeline.
          </p>
        </div>
      </div>
    </div>
  );
};

const DeepScanResults = ({ data }: { data: AnalysisResult['deepScan'] }) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* A. LIE / EXCUSE DETECTION */}
      {data.lieDetection && (
        <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-red-400 text-[10px] font-mono uppercase tracking-widest"><Fingerprint size={14} /> Lie Detection</div>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-[8px] text-gray-500 uppercase">Input Claim</div>
              <p className="text-xs text-gray-400 line-through opacity-50">{data.lieDetection.claimed}</p>
            </div>
            <div className="space-y-1">
              <div className="text-[8px] text-neon-green uppercase">Actual Reality</div>
              <p className="text-xs text-neon-green/80 font-bold">{data.lieDetection.actual}</p>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/10">
              <span className="text-[8px] text-red-400 uppercase block mb-1">Excuse Factor</span>
              <p className="text-[10px] text-red-300 italic">"{data.lieDetection.excuse}"</p>
            </div>
          </div>
        </div>
      )}

      {/* B. TIME WASTE ANALYSIS */}
      {data.timeWaste && (
        <div className="p-5 bg-neon-purple/5 border border-neon-purple/20 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-neon-purple text-[10px] font-mono uppercase tracking-widest"><Timer size={14} /> Time Analysis</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[8px] text-gray-500 uppercase">Productive</div>
              <div className="text-xl font-black text-neon-green">{data.timeWaste.productiveTime}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[8px] text-gray-500 uppercase">Wasted</div>
              <div className="text-xl font-black text-red-500">{data.timeWaste.wastedTime}</div>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">Monthly Loss</span>
              <span className="text-red-400 font-mono">{data.timeWaste.monthlyLoss}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">Yearly Proj.</span>
              <span className="text-red-500 font-black font-mono">{data.timeWaste.yearlyLoss}</span>
            </div>
          </div>
        </div>
      )}

      {/* C. DECISION TREE */}
      {data.decisionTree && (
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-gray-400 text-[10px] font-mono uppercase tracking-widest"><GitBranch size={14} /> Decision Tree</div>
          <div className="space-y-2">
            {data.decisionTree.decisions.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-[10px] p-2 bg-white/5 rounded-lg border border-white/5">
                <div className={`w-1.5 h-1.5 rounded-full ${d.quality === 'Good' ? 'bg-neon-green' : 'bg-red-500'}`} />
                <span className="flex-1 text-gray-400 truncate">{d.activity}</span>
                <span className={`font-mono text-[8px] ${d.quality === 'Good' ? 'text-neon-green' : 'text-red-500'}`}>{d.quality}</span>
              </div>
            ))}
            <div className="mt-3 p-2 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg">
              <span className="text-[8px] text-neon-cyan uppercase font-mono">Root Cause</span>
              <p className="text-[10px] text-gray-300 font-bold">{data.decisionTree.rootCause}</p>
            </div>
          </div>
        </div>
      )}

      {/* D. RELAPSE DETECTION */}
      {data.relapseDetection && (
        <div className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-orange-400 text-[10px] font-mono uppercase tracking-widest"><HistoryIcon size={14} /> Relapse Cycle</div>
          <div className="text-2xl font-black text-white">{data.relapseDetection.daysImproved} Days <span className="text-[8px] font-mono text-gray-500 uppercase">Streak</span></div>
          <p className="text-[10px] text-orange-200/70 italic leading-relaxed">"{data.relapseDetection.relapseDescription}"</p>
        </div>
      )}

      {/* E. FOCUS DECAY */}
      {data.focusDecay && (
        <div className="p-5 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-neon-cyan text-[10px] font-mono uppercase tracking-widest"><TrendingUp size={14} /> Focus Decay</div>
          <div className="flex items-end gap-1 h-12 pt-2">
            {[data.focusDecay.start, data.focusDecay.middle, data.focusDecay.end].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-neon-cyan/20 rounded-t-sm relative" style={{ height: `${v}%` }}>
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-neon-cyan" />
                </div>
                <span className="text-[8px] font-mono text-gray-500">{['S', 'M', 'E'][i]}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed italic border-l border-neon-cyan/30 pl-3">"{data.focusDecay.insight}"</p>
        </div>
      )}

      {/* F. SELF-CONTROL SCORE */}
      {data.selfControl && (
        <div className="p-5 bg-neon-green/5 border border-neon-green/20 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-neon-green text-[10px] font-mono uppercase tracking-widest"><Scale size={14} /> Self-Control</div>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-black text-white">{data.selfControl.score}</div>
            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div className="h-full bg-neon-green rounded-full shadow-[0_0_10px_rgba(20,255,159,0.5)]" style={{ width: `${data.selfControl.score}%` }} />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 italic">"{data.selfControl.explanation}"</p>
        </div>
      )}

      {/* G. PROCRASTINATION COST */}
      {data.procrastinationCost && (
        <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center gap-2 text-red-400 text-[10px] font-mono uppercase tracking-widest"><EyeOff size={14} /> Neural Debt</div>
          <div className="mt-4 space-y-3 relative z-10">
            <div className="text-2xl font-black text-white tracking-tighter">{data.procrastinationCost.daily} <span className="text-[8px] text-red-500 font-mono">/ DAY</span></div>
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
              <div className="text-gray-500">Weekly: <span className="text-gray-300">{data.procrastinationCost.weekly}</span></div>
              <div className="text-gray-500">Yearly: <span className="text-red-400 font-bold">{data.procrastinationCost.yearly}</span></div>
            </div>
            <p className="text-[10px] text-red-500 font-black mt-2 pt-2 border-t border-red-500/20">{data.procrastinationCost.finalLine}</p>
          </div>
        </div>
      )}

      {/* H. FAILURE LOOP */}
      {data.failureLoop && (
        <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-purple-400 text-[10px] font-mono uppercase tracking-widest"><Ghost size={14} /> Loop Detection</div>
          <div className="text-[8px] text-gray-500 uppercase">Repeat Behavior</div>
          <p className="text-xs text-purple-300 font-bold line-clamp-2">"{data.failureLoop.behavior}"</p>
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[8px] text-gray-500 uppercase font-mono">Frequency</span>
            <span className="px-2 py-0.5 bg-purple-500/20 rounded text-purple-300 text-[9px] font-black border border-purple-500/30">LOCKED EVERY {data.failureLoop.frequencyDays} DAYS</span>
          </div>
        </div>
      )}

      {/* I. ALTER EGO ANALYSIS */}
      {data.alterEgo && (
        <div className="p-5 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 text-neon-cyan text-[10px] font-mono uppercase tracking-widest"><UserPlus size={14} /> Alter Ego</div>
          <div className="mt-4 grid grid-cols-2 gap-4 relative z-10">
            <div className="space-y-0.5">
              <span className="text-[8px] text-gray-600 uppercase">Current</span>
              <p className="text-[10px] text-gray-400 font-bold italic line-clamp-1">"{data.alterEgo.currentSelf}"</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[8px] text-neon-cyan uppercase">Ideal</span>
              <p className="text-[10px] text-white font-bold italic line-clamp-1">"{data.alterEgo.idealSelf}"</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
            <p className="text-[10px] text-gray-500 italic leading-relaxed line-clamp-2">"Gap: {data.alterEgo.gap}"</p>
            <p className="text-[10px] text-neon-cyan font-black uppercase tracking-wider">{data.alterEgo.finalStatement}</p>
          </div>
        </div>
      )}

      {/* J. MICRO-TASK */}
      {data.microTask && (
        <div className="md:col-span-2 lg:col-span-3 p-4 bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 border border-white/10 rounded-2xl flex items-center justify-between gap-6 hover:scale-[1.01] transition-all cursor-pointer group">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 group-hover:border-neon-cyan/50 transition-colors">
                <Target size={20} className="text-neon-cyan" />
             </div>
             <div>
                <div className="text-[9px] text-gray-500 uppercase font-mono tracking-widest">Neural Impulse</div>
                <div className="text-sm font-black text-white">{data.microTask}</div>
             </div>
          </div>
          <div className="px-4 py-2 bg-neon-cyan text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(0,243,255,0.4)] group-hover:scale-110 transition-all">Execute</div>
        </div>
      )}
    </div>
  );
};

const RealityMirrorResults = ({ entry }: { entry: AnalysisResult }) => {
  if (!entry.bestVersionToday && !entry.brutalTruth) return null;

  return (
    <div className="space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center gap-4 mb-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-neon-cyan/20" />
        <h3 className="text-[10px] font-mono text-neon-cyan uppercase tracking-[0.4em] font-black underline underline-offset-8 decoration-neon-cyan/30">Reality Mirror Interface</h3>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-neon-cyan/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. BEST VERSION TODAY */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 border-neon-cyan/20 relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={60} className="text-neon-cyan" />
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3 text-neon-cyan text-xs font-black uppercase tracking-widest">
              <Target size={18} />
              Best Version Today
            </div>
            <p className="text-gray-300 leading-relaxed italic text-sm border-l-2 border-neon-cyan/30 pl-4 py-1">
              {entry.bestVersionToday}
            </p>
          </div>
        </motion.div>

        {/* 2. REALITY GAP SCORE */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 border-red-500/20 flex flex-col justify-center items-center text-center space-y-4"
        >
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="text-white/5"
              />
              <motion.circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeDasharray="283"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 - (283 * (entry.realityGapScore || 0)) / 100 }}
                className={cn(
                  "transition-all duration-1000",
                  (entry.realityGapScore || 0) < 40 ? "text-red-500" : (entry.realityGapScore || 0) < 70 ? "text-neon-yellow" : "text-neon-green"
                )}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{(entry.realityGapScore || 0)}%</span>
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-tighter">Alignment</span>
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Reality Gap Detected</h4>
            <p className="text-[10px] text-gray-500 font-mono italic">Potential vs. Current Execution</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 3. BRUTAL TRUTH */}
        <div className="md:col-span-2 p-8 bg-red-500/5 border border-red-500/20 rounded-3xl space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/50 via-transparent to-red-500/50 opacity-30" />
          <div className="flex items-center gap-3 text-red-500 text-xs font-black uppercase tracking-widest">
            <ShieldAlert size={18} />
            Brutal Truth
          </div>
          <p className="text-red-200/80 font-bold leading-relaxed text-sm italic">
            "{entry.brutalTruth}"
          </p>
        </div>

        {/* 4. FUTURE IF CONTINUED */}
        <div className="p-8 bg-orange-500/5 border border-orange-500/20 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-orange-400 text-xs font-black uppercase tracking-widest">
            <TrendingUp size={18} />
            30-Day Drift
          </div>
          <p className="text-orange-200/70 text-[10px] leading-relaxed italic">
            {entry.futureIfContinued}
          </p>
        </div>
      </div>

      {/* 5. TOMORROW FIX PLAN */}
      {entry.tomorrowFixPlan && entry.tomorrowFixPlan.length > 0 && (
        <div className="p-8 bg-neon-green/5 border border-neon-green/20 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-neon-green text-xs font-black uppercase tracking-widest">
              <Plus size={18} />
              Tomorrow Fix Plan [LOCKED]
            </div>
            <div className="text-[8px] font-mono text-neon-green/40 uppercase tracking-widest animate-pulse">Neural Path Verified</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {entry.tomorrowFixPlan.map((step, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-neon-green/30 transition-all group">
                <span className="text-xl font-black text-neon-green/20 group-hover:text-neon-green/50 transition-colors">0{idx + 1}</span>
                <p className="text-[10px] text-gray-300 font-bold leading-tight uppercase tracking-tighter">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ entries }: { entries: AnalysisResult[] }) => {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center">
        <div className="w-24 h-24 rounded-full bg-neon-cyan/5 flex items-center justify-center border border-neon-cyan/20 animate-pulse">
          <Brain className="text-neon-cyan" size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">No Neural Data Found</h3>
          <p className="text-gray-500 max-w-xs">Start scanning your reality to generate behavioral insights.</p>
        </div>
      </div>
    );
  }

  const recentEntries = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 7).reverse();
  
  const chartData = recentEntries.map(e => ({
    time: format(new Date(e.timestamp), 'HH:mm'),
    confidence: e.confidence,
    sentiment: e.sentiment === 'Positive' ? 100 : e.sentiment === 'Negative' ? 0 : 50
  }));

  const avgConfidence = Math.round(entries.reduce((acc, e) => acc + e.confidence, 0) / entries.length);
  const correctDecisions = entries.filter(e => e.decisionQuality === 'Correct').length;
  const decisionRate = Math.round((correctDecisions / entries.length) * 100);

  // Weekly / Monthly Stats
  const last7Days = entries.filter(e => new Date(e.timestamp) > subDays(new Date(), 7));
  const last30Days = entries.filter(e => new Date(e.timestamp) > subDays(new Date(), 30));

  // Streak calculation
  let currentStreak = 0;
  const today = startOfDay(new Date());
  for (let i = 0; i < 30; i++) {
    const d = subDays(today, i);
    const hasEntry = entries.some(e => isSameDay(new Date(e.timestamp), d));
    
    // If checking today and no entry yet, don't break streak if yesterday had one
    if (i === 0 && !hasEntry && entries.some(e => isSameDay(new Date(e.timestamp), subDays(today, 1)))) {
      continue;
    }
    
    if (hasEntry) currentStreak++;
    else if (i > 0) break; // Break if missed a past day
  }

  const latestEntry = entries[entries.length - 1] || null;
  const currentRealityScore = latestEntry?.realityScore || avgConfidence;

  const rightDecisions = entries.filter(e => e.decisionQuality === 'Correct').reverse();
  const wrongDecisions = entries.filter(e => e.decisionQuality === 'Incorrect' || e.decisionQuality === 'Uncertain').reverse();
  
  const totalDecisions = rightDecisions.length + wrongDecisions.length;
  const rightPercent = totalDecisions > 0 ? Math.round((rightDecisions.length / totalDecisions) * 100) : 0;
  const wrongPercent = totalDecisions > 0 ? Math.round((wrongDecisions.length / totalDecisions) * 100) : 0;

  const allPersonalityTraits = Array.from(new Set(entries.flatMap(e => e.personalityProfile || [])));

  return (
    <div className="space-y-8 pt-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic neon-text-cyan">
            SR24+ <span className="text-white">Reality Checker</span>
          </h1>
          <p className="text-neon-cyan font-bold italic text-sm tracking-wide">
            AI that analyzes your daily decisions, emotions & patterns to improve your life.
          </p>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em]">Neural Analytics Dashboard v3.0.0</p>
            <div className="h-px flex-1 bg-gradient-to-r from-neon-cyan/50 to-transparent" />
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="text-right">
            <div className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest mb-0.5">System Status</div>
            <div className="flex items-center gap-2 text-neon-green text-xs font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-ping" />
              SYNCHRONIZED
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/20">
            <Zap size={20} className="text-neon-cyan" />
          </div>
        </div>
      </header>

      {/* Reality Mirror Engine */}
      {latestEntry && <RealityMirrorResults entry={latestEntry} />}

      {/* Neural Audit Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-1 bg-gradient-to-r from-neon-cyan/20 via-neon-purple/20 to-neon-yellow/20 rounded-[2rem] border border-white/5"
      >
        <div className="bg-dark-bg/90 backdrop-blur-3xl rounded-[1.8rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/20 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
              <Activity size={32} className="text-neon-cyan" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-neon-cyan uppercase tracking-[0.4em] mb-1">Neural Audit Summary</div>
              <h2 className="text-2xl font-black text-white tracking-tight">System Optimization: <span className="text-neon-cyan">{decisionRate}%</span></h2>
            </div>
          </div>
          
          <div className="flex items-center gap-12">
            <div className="text-center">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Success Rate</div>
              <div className="text-2xl font-black text-neon-green">{rightPercent}%</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Failure Rate</div>
              <div className="text-2xl font-black text-neon-yellow">{wrongPercent}%</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Total Scans</div>
              <div className="text-2xl font-black text-white">{entries.length}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <motion.div 
          whileHover={{ scale: 1.02, rotateY: 5 }}
          className="glass-card p-6 border-neon-cyan/20 overflow-hidden relative group"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-cyan/10 blur-3xl rounded-full group-hover:bg-neon-cyan/20 transition-all" />
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Reality Score</div>
          <div className="text-4xl font-black text-neon-cyan tracking-tighter">{currentRealityScore || 0}</div>
          <div className="mt-4 text-[10px] font-mono text-gray-500">OVERALL METRIC</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, rotateY: -5 }}
          className="glass-card p-6 border-neon-purple/20 overflow-hidden relative group"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-purple/10 blur-3xl rounded-full group-hover:bg-neon-purple/20 transition-all" />
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Day Streak</div>
          <div className="text-4xl font-black text-neon-purple tracking-tighter">{currentStreak} 🔥</div>
          <div className="mt-4 text-[10px] font-mono text-gray-500">PUMPING CONSISTENCY</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, rotateY: 5 }}
          className="glass-card p-6 border-neon-cyan/20 overflow-hidden relative group"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-cyan/10 blur-3xl rounded-full group-hover:bg-neon-cyan/20 transition-all" />
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Confidence Flux</div>
          <div className="text-4xl font-black text-neon-cyan tracking-tighter">{avgConfidence}%</div>
          <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${avgConfidence}%` }}
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple shadow-[0_0_15px_rgba(0,243,255,0.8)]"
            />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, rotateY: -5 }}
          className="glass-card p-6 border-neon-purple/20 overflow-hidden relative group"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-purple/10 blur-3xl rounded-full group-hover:bg-neon-purple/20 transition-all" />
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Decision Accuracy</div>
          <div className="text-4xl font-black text-neon-purple tracking-tighter">{decisionRate}%</div>
          <div className="mt-4 flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={cn(
                "h-2.5 flex-1 rounded-sm transition-all duration-500",
                i < (decisionRate / 100) * 10 ? "bg-neon-purple shadow-[0_0_10px_rgba(188,19,254,0.6)]" : "bg-white/5"
              )} />
            ))}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -5 }}
          className="glass-card p-6 border-neon-green/20 overflow-hidden relative group"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-green/10 blur-3xl rounded-full group-hover:bg-neon-green/20 transition-all" />
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Right Decisions</div>
          <div className="text-4xl font-black text-neon-green tracking-tighter">{rightPercent}%</div>
          <div className="mt-4 text-[10px] font-mono text-gray-500">
            {rightDecisions.length} SUCCESS VECTORS
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: 5 }}
          className="glass-card p-6 border-neon-yellow/20 overflow-hidden relative group"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-yellow/10 blur-3xl rounded-full group-hover:bg-neon-yellow/20 transition-all" />
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Wrong Decisions</div>
          <div className="text-4xl font-black text-neon-yellow tracking-tighter">{wrongPercent}%</div>
          <div className="mt-4 text-[10px] font-mono text-gray-500">
            {wrongDecisions.length} FAILURE VECTORS
          </div>
        </motion.div>
      </div>

      {/* Periodic Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Weekly Activity</div>
            <div className="text-xl font-bold">{last7Days.length} Scans</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Weekly Confidence</div>
            <div className="text-xl font-bold text-neon-cyan">
              {last7Days.length > 0 ? Math.round(last7Days.reduce((a, b) => a + b.confidence, 0) / last7Days.length) : 0}%
            </div>
          </div>
        </div>
        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Monthly Activity</div>
            <div className="text-xl font-bold">{last30Days.length} Scans</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Monthly Confidence</div>
            <div className="text-xl font-bold text-neon-purple">
              {last30Days.length > 0 ? Math.round(last30Days.reduce((a, b) => a + b.confidence, 0) / last30Days.length) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 min-h-[350px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={16} className="text-neon-cyan" />
              Confidence Flux
            </h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d0d12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#00f3ff' }}
                />
                <Area type="monotone" dataKey="confidence" stroke="#00f3ff" fillOpacity={1} fill="url(#colorConf)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 min-h-[350px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-neon-purple" />
              Sentiment Vector
            </h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d0d12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#bc13fe' }}
                />
                <Line type="stepAfter" dataKey="sentiment" stroke="#bc13fe" strokeWidth={3} dot={{ r: 4, fill: '#bc13fe' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Neural Indicators & Execution Gap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 border-neon-cyan/10 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-[0.3em] flex items-center gap-3 text-neon-cyan">
              <Activity size={18} />
              Neural Health Indicators
            </h3>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Biometric Analysis</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className={cn(
              "p-4 rounded-2xl border transition-all",
              latestEntry?.burnoutRisk === 'High' ? "bg-red-500/10 border-red-500/20" :
              latestEntry?.burnoutRisk === 'Medium' ? "bg-neon-yellow/10 border-neon-yellow/20" :
              "bg-neon-green/10 border-neon-green/20"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={14} className={latestEntry?.burnoutRisk === 'High' ? "text-red-400" : "text-neon-cyan"} />
                <span className="text-[10px] font-mono text-gray-400 uppercase">Burnout Risk</span>
              </div>
              <div className={cn(
                "text-2xl font-black",
                latestEntry?.burnoutRisk === 'High' ? "text-red-400" :
                latestEntry?.burnoutRisk === 'Medium' ? "text-neon-yellow" : "text-neon-green"
              )}>{latestEntry?.burnoutRisk || 'Low'}</div>
            </div>

            <div className={cn(
              "p-4 rounded-2xl border transition-all",
              latestEntry?.dopamineLoop ? "bg-orange-500/10 border-orange-500/20" : "bg-neon-green/10 border-neon-green/20"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Dna size={14} className={latestEntry?.dopamineLoop ? "text-orange-400" : "text-neon-green"} />
                <span className="text-[10px] font-mono text-gray-400 uppercase">Dopamine Loop</span>
              </div>
              <div className={cn(
                "text-2xl font-black",
                latestEntry?.dopamineLoop ? "text-orange-400" : "text-neon-green"
              )}>{latestEntry?.dopamineLoop ? '⚠ DETECTED' : '✓ CLEAR'}</div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 italic leading-relaxed">
            {latestEntry?.burnoutExplanation || latestEntry?.dopamineLoopExplanation || "Neural health metrics are within optimal parameters."}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 border-neon-yellow/10 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-[0.3em] flex items-center gap-3 text-neon-yellow">
              <Flame size={18} />
              Execution Gap Analysis
            </h3>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Planned vs Actual</div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-3xl font-black text-white">{latestEntry?.executionGap ? 100 - latestEntry.executionGap.gapPercent : 0}%</div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Execution Efficiency</div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-lg font-bold text-neon-yellow">{latestEntry?.executionGap?.gapPercent || 0}%</div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Missed Targets</div>
              </div>
            </div>

            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${latestEntry?.executionGap ? 100 - latestEntry.executionGap.gapPercent : 0}%` }}
                className="h-full bg-gradient-to-r from-neon-yellow to-orange-500 shadow-[0_0_20px_rgba(255,200,0,0.4)]"
              />
            </div>

            <div className="p-4 bg-neon-yellow/5 border border-neon-yellow/10 rounded-2xl">
              <div className="text-[9px] font-mono text-neon-yellow uppercase mb-1">Diagnostic</div>
              <p className="text-xs text-gray-300 leading-relaxed italic">"{latestEntry?.executionGap?.mainIssue || "Establishing baseline execution data..."}"</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Neural Balance & Profile Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Neural Balance (Right vs Wrong) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 border-neon-cyan/10 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-[0.3em] flex items-center gap-3 text-neon-cyan">
              <Zap size={18} />
              Neural Balance (Full Log)
            </h3>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Decision Analysis</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-neon-green text-[10px] font-mono uppercase tracking-widest sticky top-0 bg-dark-bg/80 backdrop-blur-md py-2 z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                Right Decisions ({rightPercent}%)
              </div>
              <div className="space-y-3">
                {rightDecisions.length > 0 ? rightDecisions.map((d, i) => (
                  <div key={i} className="p-3 bg-neon-green/5 border border-neon-green/10 rounded-xl text-xs text-gray-300 leading-relaxed group hover:bg-neon-green/10 transition-all">
                    <div className="text-[8px] text-neon-green/50 mb-1">{format(new Date(d.timestamp), 'MMM dd, HH:mm')}</div>
                    {d.behavior || d.decisionQuality}
                  </div>
                )) : (
                  <div className="text-xs text-gray-600 italic">No positive vectors recorded.</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-neon-yellow text-[10px] font-mono uppercase tracking-widest sticky top-0 bg-dark-bg/80 backdrop-blur-md py-2 z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-yellow" />
                Wrong Decisions ({wrongPercent}%)
              </div>
              <div className="space-y-3">
                {wrongDecisions.length > 0 ? wrongDecisions.map((d, i) => (
                  <div key={i} className="p-3 bg-neon-yellow/5 border border-neon-yellow/10 rounded-xl text-xs text-gray-300 leading-relaxed group hover:bg-neon-yellow/10 transition-all">
                    <div className="text-[8px] text-neon-yellow/50 mb-1">{format(new Date(d.timestamp), 'MMM dd, HH:mm')}</div>
                    {d.behavior || d.decisionQuality}
                  </div>
                )) : (
                  <div className="text-xs text-gray-600 italic">No negative vectors recorded.</div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Neural Profile Analysis (Strengths & Weaknesses) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 border-neon-purple/10 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-[0.3em] flex items-center gap-3 text-neon-purple">
              <Brain size={18} />
              Neural Profile Analysis
            </h3>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{allPersonalityTraits.length} Traits</div>
          </div>

          <div className="space-y-4">
            {allPersonalityTraits.length > 0 ? allPersonalityTraits.slice(0, 6).map((trait, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-neon-purple/5 border border-neon-purple/10 rounded-xl">
                <span className="text-neon-purple font-black text-sm">{i + 1}.</span>
                <span className="text-sm text-gray-300">{trait}</span>
              </div>
            )) : (
              <div className="text-xs text-gray-600 italic">Run a Reality Scan to build your Personality Profile.</div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Neural Optimization Metrics</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[8px] font-mono text-gray-500 uppercase mb-1">Success Ratio</div>
                <div className="text-2xl font-black text-neon-green">{rightPercent}%</div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[8px] font-mono text-gray-500 uppercase mb-1">Failure Ratio</div>
                <div className="text-2xl font-black text-neon-yellow">{wrongPercent}%</div>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple" style={{ width: `${decisionRate}%` }} />
              </div>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">{decisionRate}% Optimized</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Latest Analysis */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400">Latest Neural Scan</h3>
        <div className="glass-card p-8 border-neon-cyan/10 space-y-6">
          {/* Input + Top Scores */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">Input Fragment</div>
                <p className="text-base text-gray-300 leading-relaxed italic">"{entries[entries.length-1].input?.slice(0, 200)}{(entries[entries.length-1].input?.length || 0) > 200 ? '...' : ''}"</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <div className="text-[9px] font-mono text-gray-500 uppercase mb-1">Reality Score</div>
                  <div className="text-neon-cyan font-black text-2xl">{entries[entries.length-1].realityScore || 0}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <div className="text-[9px] font-mono text-gray-500 uppercase mb-1">Life Control</div>
                  <div className="text-neon-purple font-black text-2xl">{entries[entries.length-1].realityScores?.lifeControlScore || 0}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <div className="text-[9px] font-mono text-gray-500 uppercase mb-1">Tone</div>
                  <div className="text-neon-green font-bold text-xs mt-1">{entries[entries.length-1].tone}</div>
                </div>
              </div>

              {/* AI Coach Message */}
              {entries[entries.length-1].aiCoachMessage && (
                <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl">
                  <div className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest flex items-center gap-2 mb-2"><Brain size={13} /> AI Life Coach</div>
                  <p className="text-sm text-gray-200 italic leading-relaxed">"{entries[entries.length-1].aiCoachMessage}"</p>
                </div>
              )}

              {/* Execution Gap */}
              {entries[entries.length-1].executionGap?.mainIssue && (
                <div className="p-4 bg-neon-yellow/5 border border-neon-yellow/20 rounded-2xl space-y-2">
                  <div className="text-[10px] font-mono text-neon-yellow uppercase tracking-widest flex items-center gap-2"><BarChart3 size={13} /> Execution Gap — {entries[entries.length-1].executionGap?.gapPercent}%</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/5 p-2 rounded-lg"><span className="text-gray-500">Planned: </span><span className="text-gray-300">{entries[entries.length-1].executionGap?.plannedEffort}</span></div>
                    <div className="bg-white/5 p-2 rounded-lg"><span className="text-gray-500">Done: </span><span className="text-gray-300">{entries[entries.length-1].executionGap?.actualExecution}</span></div>
                  </div>
                  <p className="text-xs text-neon-yellow/80">{entries[entries.length-1].executionGap?.mainIssue}</p>
                </div>
              )}

              {/* Trigger */}
              {entries[entries.length-1].triggerDetection?.trigger && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
                  <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest flex items-center gap-2 mb-1"><Zap size={13} /> Trigger</div>
                  <p className="text-sm text-red-300">{entries[entries.length-1].triggerDetection?.explanation}</p>
                </div>
              )}

              {/* Burnout + Dopamine */}
              <div className="grid grid-cols-2 gap-3">
                {entries[entries.length-1].burnoutRisk && (
                  <div className={`p-3 rounded-xl border text-center ${
                    entries[entries.length-1].burnoutRisk === 'High' ? 'bg-red-500/10 border-red-500/30' :
                    entries[entries.length-1].burnoutRisk === 'Medium' ? 'bg-neon-yellow/10 border-neon-yellow/30' :
                    'bg-neon-green/10 border-neon-green/30'}`}>
                    <div className="text-[9px] font-mono text-gray-500 uppercase mb-1">Burnout Risk</div>
                    <div className={`font-black text-sm ${
                      entries[entries.length-1].burnoutRisk === 'High' ? 'text-red-400' :
                      entries[entries.length-1].burnoutRisk === 'Medium' ? 'text-neon-yellow' : 'text-neon-green'}`}>
                      {entries[entries.length-1].burnoutRisk}
                    </div>
                  </div>
                )}
                {entries[entries.length-1].dopamineLoop !== undefined && (
                  <div className={`p-3 rounded-xl border text-center ${entries[entries.length-1].dopamineLoop ? 'bg-orange-500/10 border-orange-500/30' : 'bg-neon-green/10 border-neon-green/30'}`}>
                    <div className="text-[9px] font-mono text-gray-500 uppercase mb-1">Dopamine Loop</div>
                    <div className={`font-black text-sm ${entries[entries.length-1].dopamineLoop ? 'text-orange-400' : 'text-neon-green'}`}>
                      {entries[entries.length-1].dopamineLoop ? '⚠ DETECTED' : '✓ CLEAR'}
                    </div>
                  </div>
                )}
              </div>
              {entries[entries.length-1].dopamineLoopExplanation && entries[entries.length-1].dopamineLoop && (
                <p className="text-xs text-orange-300 bg-orange-500/5 border border-orange-500/10 p-3 rounded-lg">{entries[entries.length-1].dopamineLoopExplanation}</p>
              )}

              {/* Future Prediction */}
              {entries[entries.length-1].futurePrediction && (
                <div className="p-4 bg-neon-purple/5 border border-neon-purple/20 rounded-2xl">
                  <div className="text-[10px] font-mono text-neon-purple uppercase tracking-widest flex items-center gap-2 mb-1"><TrendingUp size={13} /> Future Prediction</div>
                  <p className="text-sm text-gray-300">{entries[entries.length-1].futurePrediction}</p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="w-full md:w-72 space-y-4">
              {/* Next Day Action Plan */}
              <div className="space-y-2">
                <div className="text-xs font-black text-white uppercase tracking-widest p-3 bg-neon-cyan/20 rounded-xl flex items-center gap-2">🚀 Next Day Action Plan</div>
                <div className="space-y-2">
                  {entries[entries.length-1].actionPlan?.map((a, i) => (
                    <div key={i} className="flex gap-3 text-sm text-gray-300 p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-neon-cyan font-black shrink-0">{i+1}.</span>{a}
                    </div>
                  )) || <div className="text-xs text-gray-500 italic">No plan yet.</div>}
                </div>
              </div>

              {/* Recovery Protocol */}
              {(entries[entries.length-1].recoveryProtocol?.length || 0) > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-neon-green uppercase tracking-widest">⚡ Recovery Protocol</div>
                  <div className="space-y-1">
                    {entries[entries.length-1].recoveryProtocol?.map((s, i) => (
                      <div key={i} className="flex gap-2 text-xs text-gray-400 bg-neon-green/5 border border-neon-green/10 p-2 rounded-lg">
                        <span className="text-neon-green font-mono shrink-0">{i+1}.</span>{s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Micro Wins */}
              {(entries[entries.length-1].microWins?.length || 0) > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-neon-yellow uppercase tracking-widest">🏆 Micro Wins</div>
                  <div className="space-y-1">
                    {entries[entries.length-1].microWins?.map((w, i) => (
                      <div key={i} className="text-xs text-neon-yellow/80 bg-neon-yellow/5 border border-neon-yellow/10 p-2 rounded-lg flex items-center gap-2">
                        <span>✓</span>{w}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goal Alignment */}
              {entries[entries.length-1].goalAlignment && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-gray-500 uppercase">🎯 Goal Alignment</div>
                  <div className="text-xs text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">{entries[entries.length-1].goalAlignment}</div>
                </div>
              )}

              {/* Brutal Reality Check */}
              {entries[entries.length-1].brutalRealityCheck && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="text-[10px] font-mono text-red-400 uppercase mb-1">⚠️ Brutal Reality</div>
                  <p className="text-xs text-red-300 font-bold">{entries[entries.length-1].brutalRealityCheck}</p>
                </div>
              )}
            </div>
          </div>

          {/* DEEP SCAN ANALYSIS (ADVANCED) */}
          {entries[entries.length-1].deepScan && (
            <div className="pt-8 border-t border-white/5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neon-cyan/20 rounded-lg flex items-center justify-center border border-neon-cyan/30">
                  <Cpu size={16} className="text-neon-cyan" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-[0.4em]">Deep Scan Analysis</h4>
                  <p className="text-[10px] text-gray-500 font-mono uppercase">Neural Diagnostic v3.3 • Premium Lab Access</p>
                </div>
              </div>
              
              <DeepScanResults data={entries[entries.length-1].deepScan} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Profile = ({ user, entries, userGoal, onSaveGoal }: { user: User, entries: AnalysisResult[], userGoal: string, onSaveGoal: (g: string) => void }) => {
  const [goalInput, setGoalInput] = React.useState(userGoal);
  const [goalSaved, setGoalSaved] = React.useState(false);

  const handleSaveGoal = () => {
    onSaveGoal(goalInput);
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 2000);
  };
  return (
    <div className="max-w-4xl mx-auto pt-12 space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-4xl font-black italic tracking-tighter neon-text-cyan">Neural Profile</h2>
        <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          Vector ID: {user.uid.slice(0, 12)}
        </div>
      </div>

      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="glass-card p-10 flex flex-col md:flex-row items-center gap-10 border-neon-cyan/10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-[100px] rounded-full -mr-32 -mt-32" />
        
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full blur-xl opacity-30 group-hover:opacity-60 transition duration-1000"></div>
          <div className="relative p-1 bg-gradient-to-br from-white/20 to-transparent rounded-full">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              alt="Profile" 
              className="w-40 h-40 rounded-full border-4 border-dark-bg object-cover shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-neon-green rounded-2xl flex items-center justify-center border-4 border-dark-bg shadow-lg">
            <ShieldCheck size={18} className="text-dark-bg" />
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-6">
          <div className="space-y-1">
            <h3 className="text-4xl font-black text-white tracking-tight">{user.displayName || 'Neural Agent'}</h3>
            <p className="text-neon-cyan font-mono text-sm tracking-widest uppercase opacity-80">{user.email}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-2">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Reality Scans</div>
              <div className="text-3xl font-black text-white">{entries.length}</div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Neural Level</div>
              <div className="text-3xl font-black text-neon-purple">Lv.{Math.floor(entries.length / 5) + 1}</div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md hidden md:block">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Timeline Sync</div>
              <div className="text-sm font-black text-gray-400 mt-2">{format(new Date(user.metadata.creationTime || Date.now()), 'MMM yyyy')}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Goal Setting */}
      <motion.div whileHover={{ scale: 1.005 }} className="glass-card p-8 border-neon-yellow/20 space-y-4">
        <h4 className="text-xs font-mono uppercase tracking-[0.3em] flex items-center gap-3 text-neon-yellow">
          <Zap size={18} />
          Long-Term Goal (Used by AI Coach)
        </h4>
        <p className="text-[10px] text-gray-500 font-mono">Set your goal so the AI can evaluate your daily actions against it. e.g. "Get a software job", "Lose 10kg"</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            placeholder="My goal is to..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-yellow/50 focus:ring-1 focus:ring-neon-yellow/20 transition-all"
          />
          <button
            onClick={handleSaveGoal}
            className="px-6 py-3 bg-neon-yellow text-black font-black rounded-xl hover:scale-105 transition-all text-sm"
          >
            {goalSaved ? '✓ Saved!' : 'Save Goal'}
          </button>
        </div>
        {userGoal && (
          <div className="p-3 bg-neon-yellow/5 border border-neon-yellow/10 rounded-xl">
            <span className="text-[10px] font-mono text-neon-yellow uppercase">Active Goal: </span>
            <span className="text-sm text-gray-300">{userGoal}</span>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personality Profile */}
        <motion.div whileHover={{ y: -5 }} className="glass-card p-8 border-neon-cyan/10">
          <h4 className="text-xs font-mono uppercase tracking-[0.3em] mb-6 flex items-center gap-3 text-neon-cyan">
            <Brain size={18} />
            Aggregated Neural Profile
          </h4>
          <div className="space-y-3">
            {entries.length > 0 ? Array.from(new Set(entries.flatMap(e => e.personalityProfile || []))).slice(0, 8).map((trait, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-neon-cyan/5 border border-neon-cyan/10 rounded-xl">
                <span className="text-neon-cyan font-black text-sm mt-0.5">{i + 1}.</span>
                <span className="text-sm text-gray-300">{trait}</span>
              </div>
            )) : (
              <span className="text-xs text-gray-600 italic">No neural data analyzed yet. Run a scan to synthesize your profile.</span>
            )}
          </div>
        </motion.div>

        {/* Dynamic Behavior DNA */}
        <motion.div whileHover={{ y: -5 }} className="glass-card p-8 border-neon-purple/10">
          <h4 className="text-xs font-mono uppercase tracking-[0.3em] mb-6 flex items-center gap-3 text-neon-purple">
            <Activity size={18} />
            Recent Behavioral DNA
          </h4>
          <div className="space-y-4">
            {entries.length > 0 ? (
              <div className="space-y-6">
                <p className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-neon-purple/30 pl-4">
                  "{entries[entries.length - 1].behaviorPattern}"
                </p>
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Core Behavioral Triggers</div>
                  {entries.slice(-3).reverse().map((e, i) => e.triggerDetection && (
                    <div key={i} className="flex items-center gap-3 text-[10px] text-gray-400">
                      <Zap size={10} className="text-red-400" />
                      <span className="line-clamp-1">{e.triggerDetection.trigger}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-600 italic">No behavioral dna detected yet.</span>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div whileHover={{ y: -5 }} className="glass-card p-8 border-neon-purple/10">
          <h4 className="text-xs font-mono uppercase tracking-[0.3em] mb-6 flex items-center gap-3 text-neon-purple">
            <ShieldCheck size={18} />
            Security Protocol
          </h4>
          <div className="space-y-4">
            {[
              { label: 'Neural Link', status: 'ENCRYPTED', color: 'text-neon-green' },
              { label: 'Biometric Sync', status: 'ACTIVE', color: 'text-neon-green' },
              { label: 'Data Sovereignty', status: 'USER-OWNED', color: 'text-gray-400' },
              { label: 'Quantum Shield', status: 'ENABLED', color: 'text-neon-cyan' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-gray-500 font-medium">{item.label}</span>
                <span className={cn("text-xs font-black tracking-widest", item.color)}>{item.status}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="glass-card p-8 border-neon-cyan/10">
          <h4 className="text-xs font-mono uppercase tracking-[0.3em] mb-6 flex items-center gap-3 text-neon-cyan">
            <Settings size={18} />
            Neural Interface
          </h4>
          <div className="space-y-6">
            <div className="flex items-center justify-between group cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-sm text-gray-300 font-medium group-hover:text-neon-cyan transition-colors">Neural Feedback</span>
                <p className="text-[10px] text-gray-600">Haptic response on scan completion</p>
              </div>
              <div className="w-12 h-6 bg-neon-cyan/20 rounded-full relative p-1">
                <div className="absolute right-1 top-1 w-4 h-4 bg-neon-cyan rounded-lg shadow-[0_0_10px_rgba(0,243,255,0.8)]"></div>
              </div>
            </div>
            <div className="flex items-center justify-between group cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-sm text-gray-300 font-medium group-hover:text-neon-cyan transition-colors">High-Contrast Mode</span>
                <p className="text-[10px] text-gray-600">Enhanced visual clarity protocol</p>
              </div>
              <div className="w-12 h-6 bg-white/10 rounded-full relative p-1">
                <div className="absolute left-1 top-1 w-4 h-4 bg-gray-600 rounded-lg"></div>
              </div>
            </div>
            <div className="flex items-center justify-between group cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-sm text-gray-300 font-medium group-hover:text-neon-cyan transition-colors">Auto-Archive</span>
                <p className="text-[10px] text-gray-600">Sync scans to neural vault automatically</p>
              </div>
              <div className="w-12 h-6 bg-neon-cyan/20 rounded-full relative p-1">
                <div className="absolute right-1 top-1 w-4 h-4 bg-neon-cyan rounded-lg shadow-[0_0_10px_rgba(0,243,255,0.8)]"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const HistoryItem: React.FC<{ entry: AnalysisResult, onDelete: (id: string) => void }> = ({ entry, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // ... rest of the implementation is the same, just changing the signature to satisfy the linter
  // I need to provide the FULL implementation of the component since I'm replacing the block
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-card group transition-all relative overflow-hidden",
        isExpanded ? "p-8 border-neon-cyan/40" : "p-6 cursor-pointer hover:border-white/20"
      )}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-neon-cyan to-neon-purple opacity-40" />
      
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  {format(new Date(entry.timestamp), 'MMM dd, yyyy • HH:mm')}
                </span>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                entry.decisionQuality === 'Correct' ? "bg-neon-green/10 border-neon-green/20 text-neon-green" :
                entry.decisionQuality === 'Incorrect' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                "bg-gray-500/10 border-white/10 text-gray-400"
              )}>
                {entry.decisionQuality}
              </div>
              {entry.burnoutRisk === 'High' && (
                <div className="px-2 py-1 bg-red-500/20 rounded border border-red-500/30 text-red-400 text-[8px] font-bold uppercase flex items-center gap-1.5">
                  <ShieldAlert size={10} /> Burnout Risk
                </div>
              )}
              {entry.dopamineLoop && (
                <div className="px-2 py-1 bg-orange-500/20 rounded border border-orange-500/30 text-orange-400 text-[8px] font-bold uppercase flex items-center gap-1.5">
                  <Dna size={10} /> Dopamine Loop
                </div>
              )}
            </div>
            
            <p className={cn(
              "text-gray-200 leading-relaxed italic font-medium transition-all",
              isExpanded ? "text-xl" : "text-base line-clamp-1"
            )}>
              "{entry.input}"
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isExpanded && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <Plus className="rotate-45" size={20} />
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
              className="p-2 bg-red-500/5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {!isExpanded && (
          <div className="flex gap-8 border-t border-white/5 pt-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Reality Score</span>
              <span className="text-lg font-black text-neon-cyan">{entry.realityScore}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Tone Matrix</span>
              <span className="text-lg font-black text-neon-purple">{entry.tone}</span>
            </div>
            {entry.executionGap && (
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Execution</span>
                <span className="text-lg font-black text-neon-yellow">{100 - entry.executionGap.gapPercent}%</span>
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 pt-6 border-t border-white/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-[9px] font-mono text-gray-500 uppercase mb-1">Life Control</div>
                      <div className="text-neon-cyan font-black text-xl">{entry.realityScores?.lifeControlScore || entry.realityScore}%</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-[9px] font-mono text-gray-500 uppercase mb-1">Discipline</div>
                      <div className="text-neon-purple font-black text-xl">{entry.realityScores?.disciplineScore || entry.confidence}%</div>
                    </div>
                  </div>

                  {entry.aiCoachMessage && (
                    <div className="p-5 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl italic text-sm text-gray-300 leading-relaxed shadow-inner">
                      <div className="text-[9px] font-mono text-neon-cyan uppercase mb-2 flex items-center gap-2"><Brain size={12} /> AI Coach Reflection</div>
                      "{entry.aiCoachMessage}"
                    </div>
                  )}

                  {entry.executionGap && (
                    <div className="p-5 bg-neon-yellow/5 border border-neon-yellow/20 rounded-2xl space-y-3">
                      <div className="text-[9px] font-mono text-neon-yellow uppercase flex items-center gap-2"><Flame size={12}/> Execution Gap — {entry.executionGap.gapPercent}%</div>
                      <p className="text-xs text-neon-yellow/80 font-medium font-mono">{entry.executionGap.mainIssue}</p>
                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <div className="bg-white/5 p-2 rounded-lg"><span className="text-gray-500">Target: </span>{entry.executionGap.plannedEffort}</div>
                        <div className="bg-white/5 p-2 rounded-lg"><span className="text-gray-500">Actual: </span>{entry.executionGap.actualExecution}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="text-[10px] font-mono text-white uppercase tracking-widest bg-white/10 p-3 rounded-xl flex items-center gap-2">🚀 Tactical Action Plan</div>
                    <div className="space-y-2">
                      {entry.actionPlan?.map((step, i) => (
                        <div key={i} className="flex gap-3 text-xs text-gray-400 p-3 bg-white/5 rounded-xl border border-white/5">
                          <span className="text-neon-cyan font-black">{i+1}.</span>{step}
                        </div>
                      ))}
                    </div>
                  </div>

                  {entry.brutalRealityCheck && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                      <div className="text-[10px] font-mono text-red-500 uppercase mb-2 flex items-center gap-2">⚠️ Brutal Reality</div>
                      <p className="text-[11px] text-red-300 italic">"{entry.brutalRealityCheck}"</p>
                    </div>
                  )}

                  {/* DEEP SCAN INTEGRATION IN HISTORY */}
                  {entry.deepScan && (
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-neon-cyan uppercase tracking-widest">
                        <Cpu size={12} /> Deep Scan Results
                      </div>
                      <DeepScanResults data={entry.deepScan} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const History = ({ entries, onDelete }: { entries: AnalysisResult[], onDelete: (id: string) => void }) => {
  return (
    <div className="max-w-4xl mx-auto pt-12 space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black italic tracking-tighter neon-text-cyan">Neural Archives</h2>
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.3em]">Chronological Behavioral Timeline</p>
        </div>
        <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          {entries.length} Synced Records
        </div>
      </div>

      <div className="space-y-4">
        {entries.length > 0 ? (
          entries.slice().reverse().map((entry) => (
            <HistoryItem key={entry.id} entry={entry} onDelete={onDelete} />
          ))
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">Vault is empty. Awaiting first scan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [entries, setEntries] = useState<AnalysisResult[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userGoal, setUserGoal] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
    });

    // Fallback if onAuthStateChanged doesn't fire (rare, but possible if Firebase hangs)
    const timeout = setTimeout(() => {
      setIsAuthReady(true);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    // Sync user profile to Firestore
    const syncProfile = async () => {
      const userRef = doc(db, 'users', user.uid);
      try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp()
          });
        } else {
          const data = userDoc.data();
          if (data.longTermGoal) setUserGoal(data.longTermGoal);
        }
      } catch (err) {
        console.error('Profile sync failed:', err);
      }
    };

    syncProfile();

    // Subscribe to scans
    const scansPath = `users/${user.uid}/scans`;
    const q = query(
      collection(db, scansPath),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeScans = onSnapshot(q, (snapshot) => {
      const newEntries: AnalysisResult[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp
        } as AnalysisResult;
      });
      setEntries(newEntries);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, scansPath);
    });

    return () => unsubscribeScans();
  }, [user]);

  const handleNewEntry = (entry: AnalysisResult) => {
    setActiveTab('dashboard');
  };

  const handleSaveGoal = async (goal: string) => {
    setUserGoal(goal);
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { longTermGoal: goal }, { merge: true });
    } catch (err) {
      console.error('Failed to save goal:', err);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/scans/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <ErrorBoundary>
      {!isAuthReady ? (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center">
          <NeuralBackground />
          <Loader2 className="text-neon-cyan animate-spin" size={48} />
        </div>
      ) : !user ? (
        <AuthScreen />
      ) : (
        <div className="min-h-screen bg-dark-bg text-gray-100 selection:bg-neon-cyan/30 overflow-x-hidden">
          <NeuralBackground />
          
          {/* Background Effects */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-cyan/5 blur-[150px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-purple/5 blur-[150px] rounded-full" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
          </div>

          <main className="container mx-auto px-6 max-w-6xl relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {activeTab === 'dashboard' && <Dashboard entries={entries} />}
                {activeTab === 'input' && <RealityInput onAnalyze={handleNewEntry} user={user} entries={entries} userGoal={userGoal} />}
                {activeTab === 'history' && <History entries={entries} onDelete={handleDeleteEntry} />}
                {activeTab === 'profile' && <Profile user={user} entries={entries} userGoal={userGoal} onSaveGoal={handleSaveGoal} />}
              </motion.div>
            </AnimatePresence>
          </main>

          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
        </div>
      )}
    </ErrorBoundary>
  );
}

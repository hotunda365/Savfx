/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Monitor, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Cloud, 
  MousePointer2, 
  Battery, 
  Film, 
  Box, 
  MessageSquare, 
  Mail, 
  Phone, 
  ChevronRight, 
  Play, 
  CheckCircle2,
  Menu,
  X,
  Users,
  Briefcase,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Save,
  LogIn,
  LogOut,
  ArrowLeft,
  XCircle,
  LayoutGrid,
  AlertCircle,
  Camera,
  Upload,
  UploadCloud,
  Loader2,
  Database,
  ChevronDown,
  Pencil,
  FolderOpen
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged, 
  signOut,
  User
} from './localAuth';
import { auth } from './localAuth';
import { FaYoutube, FaFacebook, FaInstagram } from 'react-icons/fa';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const authInfo = {
    userId: auth.currentUser?.uid,
    email: auth.currentUser?.email,
    emailVerified: auth.currentUser?.emailVerified,
    isAnonymous: auth.currentUser?.isAnonymous,
    tenantId: auth.currentUser?.tenantId,
    providerInfo: auth.currentUser?.providerData.map(provider => ({
      providerId: provider.providerId,
      displayName: provider.displayName,
      email: provider.email,
      photoUrl: provider.photoURL
    })) || []
  };
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo,
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const apiPath = (collection: string, id?: string) => id ? `/api/collections/${collection}/${id}` : `/api/collections/${collection}`;

async function apiFetchCollection(collection: string, limit?: number, offset?: number) {
  let url = apiPath(collection);
  const params = new URLSearchParams();
  if (limit !== undefined) params.append('limit', limit.toString());
  if (offset !== undefined) params.append('offset', offset.toString());
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch collection: ${collection}`);
  return res.json();
}

async function apiGetDoc(collection: string, id: string) {
  const res = await fetch(apiPath(collection, id));
  if (!res.ok) throw new Error(`Failed to fetch document ${collection}/${id}`);
  return res.json();
}

async function apiSetDoc(collection: string, id: string, data: any) {
  const res = await fetch(apiPath(collection, id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to save document ${collection}/${id}`);
  return res.json();
}

async function apiAddDoc(collection: string, data: any) {
  const res = await fetch(apiPath(collection), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to add document to ${collection}`);
  return res.json();
}

async function apiDeleteDoc(collection: string, id: string) {
  const res = await fetch(apiPath(collection, id), { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete document ${collection}/${id}`);
  return res.json();
}

async function apiBulkSet(collection: string, items: Array<{ id: string; [key: string]: any }>) {
  await Promise.all(items.map(item => apiSetDoc(collection, item.id.toString(), item)));
}

async function apiDeleteDocs(collection: string, ids: string[]) {
  await Promise.all(ids.map(id => apiDeleteDoc(collection, id.toString())));
}

// --- Custom Masks (SVG Paths) ---
type CustomMask = { id: string; name: string; path: string };

const BUILTIN_MASKS: { id: string; name: string }[] = [
  { id: 'mask-graduation-cap', name: '畢業帽' },
  { id: 'mask-book',           name: '書本' },
  { id: 'mask-dream',          name: '夢想' },
  { id: 'mask-film',           name: '底片' },
  { id: 'mask-notebook',       name: '筆記本' },
  { id: 'mask-cloud',          name: '雲朵' },
];

const SVGMasks = ({ custom = [] }: { custom?: CustomMask[] }) => (
  <svg width="0" height="0" className="absolute">
    <defs>
      <clipPath id="mask-graduation-cap" clipPathUnits="objectBoundingBox">
        <path d="M0.5,0 L0,0.3 L0.5,0.6 L1,0.3 Z M0.1,0.4 V0.7 C0.1,0.8 0.3,0.9 0.5,0.9 C0.7,0.9 0.9,0.8 0.9,0.7 V0.4 L0.5,0.65 Z M0.9,0.3 L0.9,0.6" />
      </clipPath>
      <clipPath id="mask-book" clipPathUnits="objectBoundingBox">
        <path d="M0.1,0.1 H0.9 V0.9 H0.1 Z M0.2,0.2 V0.8 H0.8 V0.2 Z" />
      </clipPath>
      <clipPath id="mask-dream" clipPathUnits="objectBoundingBox">
        <path d="M0.5,0.1 C0.2,0.1 0,0.3 0,0.5 C0,0.6 0.1,0.7 0.2,0.8 C0.2,0.9 0.1,1 0,1 C0.1,1 0.3,0.9 0.4,0.8 C0.4,0.8 0.5,0.9 0.5,0.9 C0.8,0.9 1,0.7 1,0.5 C1,0.3 0.8,0.1 0.5,0.1" />
      </clipPath>
      <clipPath id="mask-film" clipPathUnits="objectBoundingBox">
        <path d="M0,0.2 H1 V0.9 H0 Z M0.1,0 L0.2,0.2 H0.3 L0.2,0 Z M0.4,0 L0.5,0.2 H0.6 L0.5,0 Z M0.7,0 L0.8,0.2 H0.9 L0.8,0 Z" />
      </clipPath>
      <clipPath id="mask-notebook" clipPathUnits="objectBoundingBox">
        <path d="M0.1,0.1 H0.9 V0.7 H0.1 Z M0,0.75 H1 V0.85 C1,0.9 0.9,0.95 0.85,0.95 H0.15 C0.1,0.95 0,0.9 0,0.85 Z" />
      </clipPath>
      <clipPath id="mask-cloud" clipPathUnits="objectBoundingBox">
        <path d="M0.25,0.4 C0.1,0.4 0,0.5 0,0.65 C0,0.8 0.1,0.9 0.25,0.9 H0.75 C0.9,0.9 1,0.8 1,0.65 C1,0.5 0.9,0.4 0.75,0.4 C0.75,0.2 0.6,0.1 0.45,0.1 C0.35,0.1 0.25,0.2 0.25,0.4" />
      </clipPath>
      {custom.map(m => (
        <clipPath key={m.id} id={`mask-custom-${m.id}`} clipPathUnits="objectBoundingBox">
          <path d={m.path} />
        </clipPath>
      ))}
    </defs>
  </svg>
);

// --- Components ---

const BlueShape = ({ className = "" }: { className?: string }) => (
  <div className={`absolute pointer-events-none ${className}`}>
    <div className="w-full h-full border-[12px] border-[#0055FF] rounded-tl-[100%] rounded-tr-[100%] rounded-br-[100%] rounded-bl-none overflow-hidden bg-transparent opacity-20" />
  </div>
);

const MaskedImage = ({ src, maskId, className = "" }: { src: string, maskId: string, className?: string }) => (
  <div className={`relative overflow-hidden ${className}`} style={{ clipPath: `url(#${maskId})` }}>
    <img src={src} alt="Masked" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" referrerPolicy="no-referrer" />
  </div>
);

type StudentWork = {
  id?: string;
  title: string;
  youtubeUrl: string;
  studentName?: string;
  courseTag?: string;
  year?: string;
  description?: string;
  featured?: boolean;
  sortOrder?: string | number;
};

const EMPTY_STUDENT_WORK: StudentWork = {
  title: '',
  youtubeUrl: '',
  studentName: '',
  courseTag: '',
  year: '',
  description: '',
  featured: false,
  sortOrder: ''
};

const getYouTubeEmbedUrl = (input: string): string => {
  if (!input) return '';
  const raw = input.trim();
  if (!raw) return '';

  if (raw.includes('/embed/')) {
    return raw;
  }

  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = parsed.hostname.replace('www.', '');
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/embed/${id}` : raw;
    }
    if (host.includes('youtube.com')) {
      const watchId = parsed.searchParams.get('v');
      if (watchId) return `https://www.youtube.com/embed/${watchId}`;
      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      const liveMatch = parsed.pathname.match(/\/live\/([^/?]+)/);
      if (liveMatch?.[1]) return `https://www.youtube.com/embed/${liveMatch[1]}`;
    }
  } catch {
    // Fallback below for non-URL inputs.
  }

  const matchedId = raw.match(/(?:v=|be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{6,})/)?.[1];
  return matchedId ? `https://www.youtube.com/embed/${matchedId}` : raw;
};

const getStudentWorkSortValue = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 9999;
};

const sortStudentWorks = (works: StudentWork[]): StudentWork[] => {
  return [...works].sort((a, b) => {
    const featuredA = a.featured ? 0 : 1;
    const featuredB = b.featured ? 0 : 1;
    if (featuredA !== featuredB) return featuredA - featuredB;
    const sortDiff = getStudentWorkSortValue(a.sortOrder) - getStudentWorkSortValue(b.sortOrder);
    if (sortDiff !== 0) return sortDiff;
    return (a.title || '').localeCompare(b.title || '', 'zh-Hant');
  });
};

const StudentWorksGrid = ({ works }: { works: StudentWork[] }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
    {works.map((w, i) => (
      <motion.div
        key={w.id || i}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.06, duration: 0.4 }}
        viewport={{ once: true }}
        className={`group flex flex-col gap-0 bg-black rounded-[2rem] overflow-hidden border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] ${w.featured ? 'ring-4 ring-[#FFEF00] ring-offset-4 ring-offset-[#FFEF00]' : ''}`}
      >
        <div className="aspect-video relative overflow-hidden">
          <iframe
            className="w-full h-full"
            src={getYouTubeEmbedUrl(w.youtubeUrl || '')}
            title={w.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {w.featured && (
            <div className="absolute top-3 left-3 bg-[#FFEF00] text-black text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-black z-10 pointer-events-none">⭐ 精選</div>
          )}
        </div>
        <div className="p-4 sm:p-5 flex-1 flex flex-col gap-2">
          <p className="font-black text-[#FFEF00] text-base sm:text-lg leading-snug">{w.title}</p>
          {w.description && <p className="text-white/60 text-xs sm:text-sm font-bold line-clamp-2 leading-relaxed">{w.description}</p>}
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {w.studentName && (
              <span className="text-[10px] sm:text-xs font-black bg-white/10 text-white px-2.5 py-1 rounded-full">👤 {w.studentName}</span>
            )}
            {w.courseTag && (
              <span className="text-[10px] sm:text-xs font-black bg-[#FFEF00] text-black px-2.5 py-1 rounded-full border border-black/20">{w.courseTag}</span>
            )}
            {w.year && (
              <span className="text-[10px] sm:text-xs font-black bg-white/10 text-white/70 px-2.5 py-1 rounded-full">{w.year}</span>
            )}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const StudentWorksFilter = ({ works, allTags }: { works: StudentWork[]; allTags: string[] }) => {
  const [activeTag, setActiveTag] = React.useState<string>('全部');
  const tags = ['全部', ...allTags];
  const filtered = activeTag === '全部' ? works : works.filter(w => w.courseTag === activeTag);
  return (
    <div>
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-10">
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-5 py-2.5 rounded-full font-black text-sm border-[3px] transition-all ${
              activeTag === tag
                ? 'bg-black text-[#FFEF00] border-black scale-105 shadow-[4px_4px_0px_rgba(0,0,0,0.4)]'
                : 'bg-white text-black border-black hover:bg-black/10'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      <StudentWorksGrid works={filtered} />
    </div>
  );
};

const SectionTitle = ({ children, subtitle }: { children: React.ReactNode, subtitle?: string, reverse?: boolean }) => (
  <div className="mb-16 text-center px-2 md:px-0">
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="font-black uppercase tracking-tighter text-black mb-3 leading-tight w-full whitespace-nowrap"
      style={{ fontSize: 'clamp(1rem, 7.5vw, 4.5rem)' }}
    >
      {children}
    </motion.h2>
    {subtitle && <p className="text-black/60 font-black uppercase tracking-wide text-[clamp(1rem,4vw,1.5rem)] md:text-2xl mt-1">{subtitle}</p>}
    <div className="w-24 h-2 bg-black mx-auto mt-4" />
  </div>
);

type HeroGalleryItem = {
  id: string;
  url: string;
  title: string;
  date: string;
  order: number;
};

const HERO_FONT_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Noto Sans TC', value: 'Noto Sans TC' },
  { label: 'Noto Serif TC', value: 'Noto Serif TC' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Bebas Neue', value: 'Bebas Neue' }
];

const HERO_GOOGLE_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;600;700;900&family=Noto+Sans+TC:wght@400;700;900&family=Noto+Serif+TC:wght@400;700;900&family=Oswald:wght@400;600;700&family=Playfair+Display:wght@400;700;900&display=swap';

const buildDefaultHeroGallery = (): HeroGalleryItem[] => (
  Array.from({ length: 6 }, (_, index) => ({
    id: `hero-${index}`,
    url: `https://picsum.photos/seed/hero-${index}/400/400`,
    title: `作品 ${index + 1}`,
    date: '',
    order: index + 1
  }))
);

const normalizeHeroGalleryItem = (item: any, index: number): HeroGalleryItem => ({
  id: item?.id?.toString() || `hero-fallback-${index}`,
  url: item?.url || item?.img || '',
  title: item?.title || '',
  date: item?.date || '',
  order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1
});

const getResponsiveFontSize = (mobile: number, desktop: number) => (
  `clamp(${mobile}px, calc(${mobile}px + (${desktop} - ${mobile}) * ((100vw - 375px) / 1065)), ${desktop}px)`
);

const clampRgbChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const normalizeHexColor = (value: string | undefined, fallback: string) => {
  const raw = (value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const shortHex = raw.slice(1);
    return `#${shortHex.split('').map(ch => `${ch}${ch}`).join('').toUpperCase()}`;
  }
  return fallback.toUpperCase();
};

const hexToRgb = (hex: string) => {
  const normalized = normalizeHexColor(hex, '#000000').slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
};

const rgbToHex = (rgb: { r: number; g: number; b: number }) => {
  const r = clampRgbChannel(rgb.r).toString(16).padStart(2, '0');
  const g = clampRgbChannel(rgb.g).toString(16).padStart(2, '0');
  const b = clampRgbChannel(rgb.b).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
};

const RGBColorTool = ({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (nextColor: string) => void;
}) => {
  const safeColor = normalizeHexColor(value, '#000000');
  const rgb = hexToRgb(safeColor);

  const setChannel = (channel: 'r' | 'g' | 'b', nextValue: number) => {
    onChange(rgbToHex({ ...rgb, [channel]: nextValue }));
  };

  return (
    <div className="space-y-2 border-2 border-black rounded-xl p-3 bg-white">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[10px] font-black uppercase">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={safeColor}
            onChange={e => onChange(e.target.value.toUpperCase())}
            className="h-7 w-10 border-2 border-black rounded cursor-pointer"
            aria-label={`${label} 色盤`}
          />
          <span className="text-[10px] font-black">{safeColor}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(['r', 'g', 'b'] as const).map(channel => (
          <div key={channel} className="space-y-1">
            <label className="text-[10px] font-black uppercase">{channel.toUpperCase()}</label>
            <input
              type="range"
              min={0}
              max={255}
              value={rgb[channel]}
              onChange={e => setChannel(channel, Number(e.target.value))}
              className="w-full"
            />
            <input
              type="number"
              min={0}
              max={255}
              value={rgb[channel]}
              onChange={e => setChannel(channel, Number(e.target.value) || 0)}
              className="w-full border-2 border-black rounded-md px-2 py-1 text-[10px] font-black"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFEF00] flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white border-8 border-black p-10 rounded-[3rem] shadow-[20px_20px_0px_rgba(0,0,0,1)]">
            <h1 className="text-4xl font-black mb-6 uppercase tracking-tighter">Oops!</h1>
            <p className="text-xl font-bold mb-8">
              Something went wrong. Please try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-black text-[#FFEF00] px-8 py-4 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Refresh Page
            </button>
            <div className="mt-8 p-4 bg-red-50 text-red-600 text-xs text-left overflow-auto rounded-xl border-2 border-red-100 max-h-40">
              {this.state.error?.toString()}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedLightboxItem, setSelectedLightboxItem] = useState<HeroGalleryItem | null>(null);
  const [heroVisibleCount, setHeroVisibleCount] = useState(6);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<any | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number>(2);
  const [selectedUnits, setSelectedUnits] = useState<number[]>([]);
  const [briefingForm, setBriefingForm] = useState({ email: '', phone: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // --- Firebase State ---
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState('overview');
  const [adminUnitsSubTab, setAdminUnitsSubTab] = useState<'list' | 'groups'>('list');
  const [adminGroups, setAdminGroups] = useState<{ name: string; description?: string; customId?: string }[]>([]);
  const [editingGroup, setEditingGroup] = useState<{ name: string; description?: string; customId?: string } | null>(null);
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);
  const [groupAddSelection, setGroupAddSelection] = useState<{ [groupName: string]: number[] }>({});
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [unitFilterGroup, setUnitFilterGroup] = useState('all');
  const [unitFilterMandatory, setUnitFilterMandatory] = useState<'all' | 'mandatory' | 'optional'>('all');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupId, setNewGroupId] = useState('');
  const [courseMenuExpanded, setCourseMenuExpanded] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  // --- State ---
  const [siteSettings, setSiteSettings] = useState(() => {
    const saved = localStorage.getItem('savfx_settings_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse settings draft:", e);
      }
    }
    const defaultHeroGallery = buildDefaultHeroGallery();
    return {
      siteName: 'SAVFX',
      logoUrl: '',
      heroTitle: '掌握 AI 視覺技術<br />開啟動畫新紀元',
      heroTitleFont: 'Noto Sans TC',
      heroTitleSizeMobile: 48,
      heroTitleSizeDesktop: 110,
      heroTitleColor: '#000000',
      heroTaglineFont: 'Montserrat',
      heroTaglineSizeMobile: 20,
      heroTaglineSizeDesktop: 40,
      heroTaglineColor: '#1A1A1A',
      heroMainWordColor: '#FFFFFF',
      heroSubtitleFont: 'Noto Sans TC',
      heroSubtitleSizeMobile: 20,
      heroSubtitleSizeDesktop: 32,
      heroSubtitleColor: '#000000',
      heroSubtitle: '全港首個專為創意人設計的 AI 動畫與多媒體課程，從零開始，助你成為業界頂尖專家。',
      contactEmail: 'info@savfx.edu.hk',
      contactPhone: '+852 2345 6789',
      address: '香港九龍...',
      youtubeUrl: 'https://youtube.com/savfx',
      facebookUrl: 'https://facebook.com/savfx',
      instagramUrl: 'https://instagram.com/savfx',
      heroTagline: 'Professional AI Animation School',
      heroEst: 'EST. 2024',
      heroImages: defaultHeroGallery.map(item => item.url),
      heroGallery: defaultHeroGallery,
      coursesIntroTitle: '課程介紹',
      coursesIntroSubtitle: '專業文憑與證書課程',
      personalCourseTitle: '個人課程',
      personalCourseSubtitle: '選擇您的專業路徑與單元組合',
      groupCourseTitle: '團體課程',
      groupCourseSubtitle: '適合學校、社福機構及私人團體',
      businessCoopTitle: '商業合作',
      businessCoopSubtitle: '專業動畫製作與 AI 方案',
      businessCoopContent: '我們承接各類商業動畫製作。結合傳統藝術與尖端 AI 技術，為您的品牌提供最具競爭力的視覺方案。',
      businessCoopFeatures: [
        '專業角色設計與建模',
        'AI 輔助高效動畫流程',
        '影視級後期合成特效'
      ],
      studentWorksTitle: '學生作品',
      studentWorksSubtitle: '優秀學員作品展示',
      studentWorksContent: '我們的學生以 AI 與傳統動畫技術創作出色作品，每一件作品都是創意與技術的完美結合。',
      studentWorksYoutubeUrl: '',
      briefingTitle: '課程簡介會',
      briefingSubtitle: '留下您的聯絡資料，我們將把 YouTube 簡介會影片傳送給您。',
      partnersTitle: '曾合作機構',
      certCourseDesc: '本證書課程包含 4 個核心 AI 單元，旨在快速提升您的 AI 視覺應用能力。',
      diplomaCourseDesc: '本一年制文憑課程包含核心必修單元，並允許學生根據興趣自由加選其他單元。',
      priceItem1: '單元 1-4：$1,600 / 每個',
      priceItem2: '其他單元：$3,000 / 每個',
      priceItemExtra: '超過 16 個單元後，額外單元享 8 折優惠！'
    };
  });

  // Sync settings to localStorage as draft
  useEffect(() => {
    localStorage.setItem('savfx_settings_draft', JSON.stringify(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    if (document.getElementById('savfx-google-fonts')) return;
    const link = document.createElement('link');
    link.id = 'savfx-google-fonts';
    link.rel = 'stylesheet';
    link.href = HERO_GOOGLE_FONT_HREF;
    document.head.appendChild(link);
  }, []);

  const [settingsLoadStatus, setSettingsLoadStatus] = useState<'loading' | 'success' | 'error' | 'not-found'>('loading');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingUnits, setIsSavingUnits] = useState(false);
  const [isSavingCourses, setIsSavingCourses] = useState(false);
  const [isSavingActivities, setIsSavingActivities] = useState(false);
  const [isSavingTutors, setIsSavingTutors] = useState(false);
  const [isSubmittingBriefing, setIsSubmittingBriefing] = useState(false);
  const [savingTutorPriorityId, setSavingTutorPriorityId] = useState<string | null>(null);
  const [savingTutorMaskId, setSavingTutorMaskId] = useState<string | null>(null);
  const [isSavingTestimonials, setIsSavingTestimonials] = useState(false);
  const [isSavingGroupCourses, setIsSavingGroupCourses] = useState(false);
  const [customMasks, setCustomMasks] = useState<CustomMask[]>([]);
  const [isSavingMasks, setIsSavingMasks] = useState(false);
  const [newMask, setNewMask] = useState<{ name: string; path: string }>({ name: '', path: '' });
  const [editingMask, setEditingMask] = useState<CustomMask | null>(null);
  const [dataLoaded, setDataLoaded] = useState({
    settings: false,
    units: false,
    courses: false,
    activities: false,
    tutors: false,
    testimonials: false,
    groupCourses: false,
    briefingLeads: false
  });

  const handleSeedData = async () => {
    showConfirm("初始化資料", "這將會為您的網站建立預設的單元與課程組合。確定要繼續嗎？", async () => {
      setIsSavingUnits(true);
      try {
        const defaultUnits = [
          { id: 0, name: "色彩學", price: 3000, isMandatory: false },
          { id: 1, name: "水彩", price: 3000, isMandatory: false },
          { id: 2, name: "漫畫設計", price: 3000, isMandatory: true },
          { id: 3, name: "2D動畫1", price: 3000, isMandatory: true },
          { id: 4, name: "2D動畫作品2", price: 3000, isMandatory: true },
          { id: 5, name: "3D 機械動畫", price: 3000, isMandatory: true },
          { id: 6, name: "3D虛擬骨骼1", price: 3000, isMandatory: false },
          { id: 7, name: "電腦合成", price: 3000, isMandatory: false },
          { id: 8, name: "3D動畫作品1", price: 3000, isMandatory: false },
          { id: 9, name: "AI應用3：2D 動畫", price: 3000, isMandatory: false }
        ];

        const defaultCourses = [
          { id: 1, name: "專業證書課程", type: "Certificate", mandatory: [2, 3, 4, 5], minUnits: 4, allowExtra: false, title: "專業證書課程", subtitle: "Professional Certificate", desc: "快速提升 AI 視覺應用能力", startDate: "", classTime: "", tuition: "", mask: "mask-graduation-cap", img: "course-1" },
          { id: 2, name: "一年制文憑課程", type: "Diploma", mandatory: [2, 3, 4, 5], minUnits: 16, allowExtra: true, title: "一年制文憑課程", subtitle: "One-Year Diploma", desc: "全面掌握動畫與特效技術", startDate: "", classTime: "", tuition: "", mask: "mask-book", img: "course-2" }
        ];

        const defaultGroupCourses = [
          { id: 'default-0', title: "學校工作坊", desc: "為中小學設計的 AI 動畫體驗課程", mask: "mask-cloud", img: "https://picsum.photos/seed/school/800/600" },
          { id: 'default-1', title: "社福機構合作", desc: "透過視覺藝術提升學員創意與自信", mask: "mask-dream", img: "https://picsum.photos/seed/charity/800/600" },
          { id: 'default-2', title: "企業培訓", desc: "提升團隊 AI 工具應用效率與視覺傳達能力", mask: "mask-star", img: "https://picsum.photos/seed/corp/800/600" }
        ];

        await apiBulkSet('units', defaultUnits.map(unit => ({ id: unit.id.toString(), ...unit })));
        await apiBulkSet('courses', defaultCourses.map(course => ({ id: course.id.toString(), ...course })));
        await apiBulkSet('groupCourses', defaultGroupCourses.map(gc => ({ id: gc.id.toString(), ...gc })));
        showToast("資料初始化成功！");
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'seed');
      } finally {
        setIsSavingUnits(false);
      }
    });
  };

  // --- State with LocalStorage Caching ---
  const getInitialList = <T,>(key: string, defaultValue: T[]): T[] => {
    const saved = localStorage.getItem(`savfx_cache_${key}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(`Failed to parse ${key} cache:`, e); }
    }
    return defaultValue;
  };

  const [activities, setActivities] = useState<any[]>(() => getInitialList('activities', []));
  const [activitiesPage, setActivitiesPage] = useState(0);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ACTIVITIES_PER_PAGE = 12;

  const [groupCourses, setGroupCourses] = useState<any[]>(() => getInitialList('groupCourses', []));
  const [unitNames, setUnitNames] = useState<any[]>(() => getInitialList('units', []));
  const [adminUnitNames, setAdminUnitNames] = useState<any[]>(() => getInitialList('units', []));
  const [courses, setCourses] = useState<any[]>(() => getInitialList('courses', []));
  const [tutors, setTutors] = useState<any[]>(() => getInitialList('tutors', []));
  const [testimonials, setTestimonials] = useState<any[]>(() => getInitialList('testimonials', []));
  const [studentWorks, setStudentWorks] = useState<any[]>(() => getInitialList('studentWorks', []));
  const [briefingLeads, setBriefingLeads] = useState<any[]>(() => getInitialList('briefingLeads', []));

  // Persistence Effects
  useEffect(() => { localStorage.setItem('savfx_cache_activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('savfx_cache_groupCourses', JSON.stringify(groupCourses)); }, [groupCourses]);
  useEffect(() => { localStorage.setItem('savfx_cache_units', JSON.stringify(unitNames)); }, [unitNames]);
  useEffect(() => { localStorage.setItem('savfx_cache_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('savfx_cache_tutors', JSON.stringify(tutors)); }, [tutors]);
  useEffect(() => { localStorage.setItem('savfx_cache_testimonials', JSON.stringify(testimonials)); }, [testimonials]);
  useEffect(() => { localStorage.setItem('savfx_cache_studentWorks', JSON.stringify(studentWorks)); }, [studentWorks]);
  useEffect(() => { localStorage.setItem('savfx_cache_briefingLeads', JSON.stringify(briefingLeads)); }, [briefingLeads]);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
    loading: boolean;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    loading: false,
  });
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  const [adminGroupCourseForm, setAdminGroupCourseForm] = useState({
    title: '',
    desc: '',
    mask: 'mask-cloud',
    img: ''
  });
  const [adminEditingGroupCourseId, setAdminEditingGroupCourseId] = useState<string | null>(null);
  const [expandedHeroItems, setExpandedHeroItems] = useState<Set<string>>(new Set());
  const toggleHeroItem = (id: string) => setExpandedHeroItems(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const showConfirm = (title: string, message: string, onConfirm: () => Promise<void> | void) => {
    setConfirmModal({ show: true, title, message, onConfirm, loading: false });
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const FileUploader = ({ onUpload, currentImage, label }: { onUpload: (url: string) => void, currentImage?: string, label: string }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const compressImage = (file: File): Promise<Blob> => {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Compression timed out, using original file");
          resolve(file);
        }, 3000);

        const reader = new FileReader();
        reader.onerror = () => {
          clearTimeout(timeout);
          resolve(file);
        };
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.onerror = () => {
            clearTimeout(timeout);
            resolve(file);
          };
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            const MAX_SIZE = 1200;
            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            console.log(`Resizing image to: ${width}x${height}`);
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
              clearTimeout(timeout);
              if (blob) {
                console.log(`Compressed blob size: ${(blob.size / 1024).toFixed(2)} KB`);
                resolve(blob);
              } else {
                console.warn("Canvas toBlob failed, using original file");
                resolve(file);
              }
            }, 'image/jpeg', 0.8);
          };
        };
      });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      console.log(`[Uploader] Starting upload for: ${file.name}`);
      
      if (!auth.currentUser) {
        console.error("[Uploader] No user logged in");
        showToast("請先登入後再上傳", "error");
        return;
      }

      setUploading(true);
      setProgress(10);
      
      try {
        let blobToUpload: Blob = file;
        try {
          console.log("[Uploader] Compressing...");
          blobToUpload = await compressImage(file);
          setProgress(30);
        } catch (err) {
          console.warn("[Uploader] Compression failed, using original", err);
          setProgress(30);
        }

        const formData = new FormData();
        formData.append('image', new File([blobToUpload], file.name, { type: file.type }));

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(errorBody || 'Upload failed');
        }

        const data = await response.json();
        setProgress(100);
        console.log("[Uploader] Success! Image URL:", data.url);
        onUpload(data.url);
        showToast("圖片上傳成功");
      } catch (error: any) {
        console.error("[Uploader] Error:", error);
        showToast(`處理失敗: ${error.message || "未知錯誤"}`, "error");
      } finally {
        setUploading(false);
        setProgress(0);
      }
    };

    const cancelUpload = () => {
      if ((window as any).currentUploadTask) {
        (window as any).currentUploadTask.cancel();
        setUploading(false);
        setProgress(0);
      }
    };

    return (
      <div className="space-y-2">
        <label className="block text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">{label}</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 border-2 border-black rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
            {currentImage ? (
              <img src={currentImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-black/20">
                <Camera size={24} />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col gap-1">
                <div className="text-[10px] font-black text-white">{progress}%</div>
                <div className="w-8 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <label className="block cursor-pointer">
              <div className="bg-white border-2 border-black p-3 rounded-xl font-bold text-center hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-1 text-xs min-h-[52px]">
                {uploading ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span>正在上傳... {progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-black transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload size={16} />
                    <span>選擇圖片</span>
                  </div>
                )}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
            </label>
            {uploading && (
              <button 
                onClick={cancelUpload}
                className="w-full text-[10px] font-black uppercase text-red-500 hover:text-red-600 transition-colors"
              >
                取消上傳
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Auth Effect ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && (user.email === 'admin@savfx.edu.hk' || user.email === 'hello@theprizm.app')) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Ensure mandatory units are always selected
  useEffect(() => {
    if (courses.length > 0 && unitNames.length > 0) {
      const currentCourse = courses.find(c => c.id === selectedCourse) || courses[1];
      if (currentCourse) {
        const globalMandatory = unitNames.filter(u => u.isMandatory).map(u => u.id);
        const allMandatory = [...new Set([...(currentCourse.mandatory || []), ...globalMandatory])];
        
        const missing = allMandatory.filter(id => !selectedUnits.includes(id));
        if (missing.length > 0) {
          setSelectedUnits(prev => [...new Set([...prev, ...allMandatory])]);
        }
      }
    }
  }, [selectedCourse, courses, unitNames, selectedUnits]);

  // --- Data Fetching Effects ---
  useEffect(() => {
    console.log("Initializing backend data fetch...");

    const loadSettings = async () => {
      try {
        const data = await apiGetDoc('settings', 'global');
        const mappedHeroGallery = Array.isArray(data?.heroGallery) && data.heroGallery.length > 0
          ? data.heroGallery.map((item: any, index: number) => normalizeHeroGalleryItem(item, index))
          : Array.isArray(data?.heroImages) && data.heroImages.length > 0
            ? data.heroImages.map((url: string, index: number) => normalizeHeroGalleryItem({
                id: `hero-${index}`,
                url,
                title: '',
                date: '',
                order: index + 1
              }, index))
            : buildDefaultHeroGallery();

        const normalizedSettings = {
          ...data,
          heroTitleFont: data?.heroTitleFont || 'Noto Sans TC',
          heroTitleSizeMobile: Number(data?.heroTitleSizeMobile) || 48,
          heroTitleSizeDesktop: Number(data?.heroTitleSizeDesktop) || 110,
          heroTitleColor: normalizeHexColor(data?.heroTitleColor, '#000000'),
          heroTaglineFont: data?.heroTaglineFont || 'Montserrat',
          heroTaglineSizeMobile: Number(data?.heroTaglineSizeMobile) || 20,
          heroTaglineSizeDesktop: Number(data?.heroTaglineSizeDesktop) || 40,
          heroTaglineColor: normalizeHexColor(data?.heroTaglineColor, '#1A1A1A'),
          heroMainWordColor: normalizeHexColor(data?.heroMainWordColor, '#FFFFFF'),
          heroSubtitleFont: data?.heroSubtitleFont || 'Noto Sans TC',
          heroSubtitleSizeMobile: Number(data?.heroSubtitleSizeMobile) || 20,
          heroSubtitleSizeDesktop: Number(data?.heroSubtitleSizeDesktop) || 32,
          heroSubtitleColor: normalizeHexColor(data?.heroSubtitleColor, '#000000'),
          heroGallery: mappedHeroGallery,
          heroImages: mappedHeroGallery.map((item: HeroGalleryItem) => item.url),
          certCourseDesc: data?.certCourseDesc ?? '本證書課程包含 4 個核心 AI 單元，旨在快速提升您的 AI 視覺應用能力。',
          diplomaCourseDesc: data?.diplomaCourseDesc ?? '本一年制文憑課程包含核心必修單元，並允許學生根據興趣自由加選其他單元。',
          priceItem1: data?.priceItem1 ?? '單元 1-4：$1,600 / 每個',
          priceItem2: data?.priceItem2 ?? '其他單元：$3,000 / 每個',
          priceItemExtra: data?.priceItemExtra ?? '超過 16 個單元後，額外單元享 8 折優惠！'
        };

        setSiteSettings(normalizedSettings);
        localStorage.setItem('savfx_settings_draft', JSON.stringify(normalizedSettings));
        setSettingsLoadStatus('success');
      } catch (error: any) {
        if (error.message?.includes('Not found')) {
          setSettingsLoadStatus('not-found');
          setSiteSettings(prev => {
            if ((prev.heroImages?.length || 0) > 0 || (prev.heroGallery?.length || 0) > 0) return prev;
            const fallbackHeroGallery = buildDefaultHeroGallery();
            return {
              ...prev,
              heroImages: fallbackHeroGallery.map(item => item.url),
              heroGallery: fallbackHeroGallery
            };
          });
        } else {
          console.error("Settings fetch error:", error);
          setSettingsLoadStatus('error');
        }
      } finally {
        setDataLoaded(prev => ({ ...prev, settings: true }));
      }
    };

    const fetchData = async () => {
      const fetchCollection = async (
        name: string,
        fetcher: () => Promise<void>,
        loadedKey: keyof typeof dataLoaded
      ) => {
        try {
          await fetcher();
          setDataLoaded(prev => ({ ...prev, [loadedKey]: true }));
        } catch (error: any) {
          console.error(`Error fetching ${name}:`, error);
          setDataLoaded(prev => ({ ...prev, [loadedKey]: true }));
        }
      };

      fetchCollection('activities', async () => {
        const items = await apiFetchCollection('activities', ACTIVITIES_PER_PAGE, 0);
        setActivities(sortActivitiesByDateDesc(items.map(normalizeActivity)));
        setActivitiesPage(0);
        setHasMoreActivities(items.length >= ACTIVITIES_PER_PAGE);
      }, 'activities');

      fetchCollection('groupCourses', async () => {
        const items = await apiFetchCollection('groupCourses');
        setGroupCourses(items);
      }, 'groupCourses');

      fetchCollection('units', async () => {
        const items = await apiFetchCollection('units');
        const sorted = items.sort((a: any, b: any) => Number(a.id) - Number(b.id));
        setUnitNames(sorted);
        setAdminUnitNames(sorted);
        // Derive groups from unit data
        const seenGroups = new Set<string>();
        const derivedGroups: { name: string; description?: string; customId?: string }[] = [];
        sorted.forEach((u: any) => {
          const g = u.group;
          if (g && g !== '未分類' && !seenGroups.has(g)) {
            seenGroups.add(g);
            derivedGroups.push({ name: g, description: u.groupDescription, customId: u.groupCustomId });
          }
        });
        if (derivedGroups.length > 0) {
          setAdminGroups(derivedGroups);
        }
      }, 'units');

      fetchCollection('courses', async () => {
        const items = await apiFetchCollection('courses');
        const coursesData = items.sort((a: any, b: any) => Number(a.id) - Number(b.id));
        setCourses(coursesData);
        if (coursesData.length > 0 && adminSelectedCourseId === null) {
          setAdminSelectedCourseId(coursesData[0].id.toString());
        }
      }, 'courses');

      fetchCollection('tutors', async () => {
        const items = await apiFetchCollection('tutors');
        setTutors(items);
      }, 'tutors');

      fetchCollection('testimonials', async () => {
        const items = await apiFetchCollection('testimonials');
        setTestimonials(items);
      }, 'testimonials');

      fetchCollection('studentWorks', async () => {
        const items = await apiFetchCollection('studentWorks');
        setStudentWorks(sortStudentWorks(items));
      }, 'studentWorks');

      fetchCollection('briefingLeads', async () => {
        const items = await apiFetchCollection('briefingLeads');
        const sorted = items.sort((a: any, b: any) => {
          const aTime = Date.parse(a.createdAt || '') || Number(a.id) || 0;
          const bTime = Date.parse(b.createdAt || '') || Number(b.id) || 0;
          return bTime - aTime;
        });
        setBriefingLeads(sorted);
      }, 'briefingLeads');

      // Load custom masks (non-critical, no dataLoaded key needed)
      apiFetchCollection('masks').then((items: CustomMask[]) => setCustomMasks(items)).catch(() => {});
    };

    loadSettings();
    fetchData();

    const timeout = setTimeout(() => {
      setDataLoaded(prev => {
        const allLoaded = Object.values(prev).every(v => v);
        if (!allLoaded) {
          console.warn("Backend data loading timed out. Unlocking UI...");
          return {
            settings: true,
            units: true,
            courses: true,
            activities: true,
            tutors: true,
            testimonials: true,
            groupCourses: true,
            briefingLeads: true
          };
        }
        return prev;
      });
    }, 8000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const handleLogin = async () => {
    const email = 'admin@savfx.edu.hk';
    try {
      await signInWithEmailAndPassword(auth, email, loginPassword);
      setShowLoginModal(false);
      setLoginPassword('');
      setLoginError('');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // Check if user exists by trying to sign in (Firebase doesn't give user-not-found easily for security)
        // In this simple local management, we'll allow creation if it's the first time
        if (loginPassword === 'admin123') {
          try {
            await createUserWithEmailAndPassword(auth, email, loginPassword);
            setShowLoginModal(false);
            setLoginPassword('');
            setLoginError('');
            showToast("管理員帳號已成功初始化，密碼為 admin123");
          } catch (createError: any) {
            // If user already exists, it will fail here, then we know it was just a wrong password
            if (createError.code === 'auth/email-already-in-use') {
              setLoginError('密碼錯誤');
            } else {
              setLoginError('登入失敗: ' + createError.message);
            }
          }
        } else {
          setLoginError('密碼錯誤 (首次登入請使用 admin123)');
        }
      } else if (error.code === 'auth/wrong-password') {
        setLoginError('密碼錯誤');
      } else {
        setLoginError('登入失敗: ' + error.message);
      }
    }
  };

  const handleLogout = () => signOut(auth);

  const [newActivity, setNewActivity] = useState({ title: '', content: '', date: '', img: '', tags: '#SAVFX, #AI, #動畫' });
  const [newTutor, setNewTutor] = useState({ name: '', role: '', desc: '', img: '', priority: 0, mask: 'mask-notebook' });
  const [tutorPriorityDrafts, setTutorPriorityDrafts] = useState<Record<string, number>>({});
  const [tutorMaskDrafts, setTutorMaskDrafts] = useState<Record<string, string>>({});
  const [newTestimonial, setNewTestimonial] = useState({ name: '', text: '', img: '' });
  const [newStudentWork, setNewStudentWork] = useState<StudentWork>(EMPTY_STUDENT_WORK);
  const [editingStudentWorkId, setEditingStudentWorkId] = useState<string | null>(null);
  const [isSavingStudentWorks, setIsSavingStudentWorks] = useState(false);
  const [studentWorksSearch, setStudentWorksSearch] = useState('');
  const [studentWorksFilterTag, setStudentWorksFilterTag] = useState('全部課程');
  const [studentWorksFilterYear, setStudentWorksFilterYear] = useState('全部年份');
  const [studentWorksFilterFeatured, setStudentWorksFilterFeatured] = useState<'all' | 'featured' | 'normal'>('all');
  const [studentWorksSortBy, setStudentWorksSortBy] = useState<'manual' | 'title' | 'year'>('manual');
  const [newCourse, setNewCourse] = useState({ 
    name: '', 
    type: 'Diploma', 
    categories: ['regular'] as string[],
    mandatory: [] as number[], 
    elective: [] as number[],
    mandatoryGroups: [] as string[],
    minUnits: 16, 
    allowExtra: true,
    title: '',
    subtitle: '',
    desc: '',
    startDate: '',
    classTime: '',
    tuition: '',
    mask: 'mask-book',
    img: ''
  });
  const [adminSelectedCourseId, setAdminSelectedCourseId] = useState<any>(null);
  const [adminSelectedUnitIndex, setAdminSelectedUnitIndex] = useState<number | null>(null);
  const [showAddCombinationModal, setShowAddCombinationModal] = useState(false);
  const [showEditCombinationModal, setShowEditCombinationModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [courseSort, setCourseSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'name', dir: 'asc' });

  const sortedCourses = (list: any[]) => {
    if (!courseSort.col) return list;
    return [...list].sort((a, b) => {
      let va = '', vb = '';
      if (courseSort.col === 'name') { va = (a.name || a.title || '').toLowerCase(); vb = (b.name || b.title || '').toLowerCase(); }
      else if (courseSort.col === 'type') { va = (a.type || '').toLowerCase(); vb = (b.type || '').toLowerCase(); }
      else if (courseSort.col === 'cat') {
        va = (a.categories || [a.category || 'regular']).join(',');
        vb = (b.categories || [b.category || 'regular']).join(',');
      }
      return courseSort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  };

  const SortTh = ({ col, children }: { col: string; children: React.ReactNode }) => {
    const active = courseSort.col === col;
    return (
      <th
        onClick={() => setCourseSort(prev => prev.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })}
        className="px-4 py-3 text-left font-black cursor-pointer select-none group"
      >
        <span className="flex items-center gap-1">
          {children}
          <span className={`text-[10px] transition-opacity ${active ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'}`}>
            {active && courseSort.dir === 'desc' ? '↓' : '↑'}
          </span>
        </span>
      </th>
    );
  };


  const normalizeLegacySavfxImageUrl = (url?: string) => {
    if (!url) return '';
    let normalized = url.trim();
    if (!normalized) return '';

    if (normalized.startsWith('//')) {
      normalized = `https:${normalized}`;
    } else if (normalized.startsWith('/')) {
      normalized = `https://www.savfx.com.hk${normalized}`;
    }

    // Scraper produced "https://www.savfx.com.hk_XXXX.jpg" (missing slash+path).
    // Real URL is https://www.savfx.com.hk/images/lib/_XXXX.jpg
    return normalized.replace(
      /^https?:\/\/www\.savfx\.com\.hk_(.+)$/i,
      'https://www.savfx.com.hk/images/lib/_$1'
    );
  };

  const normalizeActivity = (item: any) => {
    const imgRaw = (item?.img || item?.image || '').toString();
    const tags = Array.isArray(item?.tags)
      ? item.tags
      : Array.isArray(item?.hashtags)
        ? item.hashtags
        : (item?.tags || item?.hashtags || '')
            .toString()
            .split(',')
            .map((t: string) => t.trim())
            .filter((t: string) => t !== '');

    return {
      ...item,
      img: normalizeLegacySavfxImageUrl(imgRaw),
      tags
    };
  };

  const getActivityImageUrl = (item: any) => {
    const normalized = normalizeActivity(item);
    return normalized.img || 'https://picsum.photos/seed/activity-fallback/900/1200';
  };

  const parseActivityDateForSort = (dateStr: string): number => {
    const m = String(dateStr || '').match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
    if (m) return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
    const t = Date.parse(String(dateStr || ''));
    return isNaN(t) ? 0 : t;
  };

  // Sort newest first (higher date number = newer)
  const sortActivitiesByDateDesc = (items: any[]): any[] =>
    [...items].sort((a, b) => parseActivityDateForSort(b.date) - parseActivityDateForSort(a.date));

  // Helper: check if course belongs to a category (handles both old string and new array format)
  const hasCategory = (c: any, cat: string) =>
    Array.isArray(c.categories) ? c.categories.includes(cat) : c.category === cat;

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    // Group course → save to groupCourses collection
    if (newCourse.categories.length === 1 && newCourse.categories.includes('group')) {
      setIsSavingGroupCourses(true);
      try {
        const groupData = { title: newCourse.title, desc: newCourse.desc, mask: newCourse.mask, img: newCourse.img };
        const result = await apiAddDoc('groupCourses', groupData);
        setGroupCourses(prev => [...prev, { id: result.id, ...groupData }]);
        setShowAddCombinationModal(false);
        setNewCourse({ name: '', type: 'Diploma', categories: ['regular'], mandatory: [], elective: [], mandatoryGroups: [], minUnits: 4, allowExtra: true, title: '', subtitle: '', desc: '', startDate: '', classTime: '', tuition: '', mask: 'mask-book', img: '' });
        showToast("已新增團體課程");
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'groupCourses');
      } finally {
        setIsSavingGroupCourses(false);
      }
      return;
    }
    setIsSavingCourses(true);
    const id = Date.now();
    const course = {
      ...newCourse,
      id
    };
    try {
      await apiSetDoc('courses', id.toString(), course);
      setCourses(prev => [...prev, course]);
      setShowAddCombinationModal(false);
      setAdminSelectedCourseId(id.toString());
      setNewCourse({ 
        name: '', 
        type: 'Diploma', 
        categories: ['regular'],
        mandatory: [], 
        elective: [],
        mandatoryGroups: [],
        minUnits: 4, 
        allowExtra: true,
        title: '',
        subtitle: '',
        desc: '',
        startDate: '',
        classTime: '',
        tuition: '',
        mask: 'mask-book',
        img: 'https://picsum.photos/seed/course/800/600'
      });
      showToast("課程已新增");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `courses/${id}`);
    } finally {
      setIsSavingCourses(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    // Group course → save to groupCourses collection
    const editCats = editingCourse.categories || [editingCourse.category || 'regular'];
    if (editCats.length === 1 && editCats.includes('group')) {
      setIsSavingGroupCourses(true);
      try {
        const groupData = { title: editingCourse.title, desc: editingCourse.desc, mask: editingCourse.mask, img: editingCourse.img };
        await apiSetDoc('groupCourses', editingCourse.id.toString(), groupData);
        setGroupCourses(prev => prev.map(gc => gc.id.toString() === editingCourse.id.toString() ? { ...gc, ...groupData } : gc));
        setShowEditCombinationModal(false);
        setEditingCourse(null);
        showToast("已更新團體課程");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `groupCourses/${editingCourse.id}`);
      } finally {
        setIsSavingGroupCourses(false);
      }
      return;
    }
    setIsSavingCourses(true);
    try {
      await apiSetDoc('courses', editingCourse.id.toString(), editingCourse);
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? editingCourse : c));
      setShowEditCombinationModal(false);
      setEditingCourse(null);
      showToast("課程已更新");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `courses/${editingCourse.id}`);
    } finally {
      setIsSavingCourses(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    showConfirm("確定刪除", "確定刪除此課程？", async () => {
      try {
        await apiDeleteDoc('courses', id);
        setCourses(prev => prev.filter(c => c.id.toString() !== id.toString()));
        showToast("課程已刪除");
      } catch (error: any) {
        console.error("Error deleting course:", error);
        showToast(error.message || "刪除失敗", "error");
      }
    });
  };

  const toggleCourseMandatory = async (courseId: string, unitId: number) => {
    const course = courses.find(c => c.id.toString() === courseId.toString());
    if (!course) return;
    
    let newMandatory = [...(course.mandatory || [])];
    if (newMandatory.includes(unitId)) {
      newMandatory = newMandatory.filter(id => id !== unitId);
    } else {
      newMandatory.push(unitId);
    }
    
    const { id, ...courseData } = course;
    try {
      await apiSetDoc('courses', courseId.toString(), { ...courseData, mandatory: newMandatory });
      setCourses(prev => prev.map(c => c.id.toString() === courseId.toString() ? { ...c, mandatory: newMandatory } : c));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `courses/${courseId}`);
    }
  };

  const setAllCourseMandatory = async (courseId: string, selectAll: boolean) => {
    const course = courses.find(c => c.id.toString() === courseId.toString());
    if (!course) return;
    
    const newMandatory = selectAll ? adminUnitNames.map((_, i) => i) : [];
    
    const { id, ...courseData } = course;
    try {
      await apiSetDoc('courses', courseId.toString(), { ...courseData, mandatory: newMandatory });
      setCourses(prev => prev.map(c => c.id.toString() === courseId.toString() ? { ...c, mandatory: newMandatory } : c));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `courses/${courseId}`);
    }
  };

  const getAdminGroupsForCourseSelection = () => {
    const groupsFromUnits = Array.from(
      new Map(
        adminUnitNames
          .filter((u: any) => u.group && u.group !== '未分類')
          .map((u: any) => [u.group, { name: u.group, description: u.groupDescription, customId: u.groupCustomId }])
      ).values()
    ) as { name: string; description?: string; customId?: string }[];

    return groupsFromUnits.length > 0 ? groupsFromUnits : adminGroups;
  };

  const getUnitPrice = (unit: any): number => {
    const value = Number(unit?.price);
    return Number.isFinite(value) ? value : 0;
  };

  const getGroupPrice = (groupName: string, units: any[] = adminUnitNames): number => {
    return units
      .filter((u: any) => (u.group || '未分類') === groupName)
      .reduce((sum: number, unit: any) => sum + getUnitPrice(unit), 0);
  };

  const setAllCourseMandatoryGroups = async (courseId: string, selectAll: boolean) => {
    const course = courses.find(c => c.id.toString() === courseId.toString());
    if (!course) return;

    const allGroupNames = getAdminGroupsForCourseSelection().map(g => g.name);
    const newMandatoryGroups = selectAll ? allGroupNames : [];

    const { id, ...courseData } = course;
    try {
      await apiSetDoc('courses', courseId.toString(), { ...courseData, mandatoryGroups: newMandatoryGroups });
      setCourses(prev => prev.map(c => c.id.toString() === courseId.toString() ? { ...c, mandatoryGroups: newMandatoryGroups } : c));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `courses/${courseId}`);
    }
  };

  const handleLoadMoreActivities = async () => {
    if (isLoadingMore || !hasMoreActivities) return;
    setIsLoadingMore(true);
    try {
      const nextOffset = (activitiesPage + 1) * ACTIVITIES_PER_PAGE;
      const newItems = await apiFetchCollection('activities', ACTIVITIES_PER_PAGE, nextOffset);
      if (newItems.length > 0) {
        setActivities(prev => sortActivitiesByDateDesc([...prev, ...newItems.map(normalizeActivity)]));
        setActivitiesPage(prev => prev + 1);
      }
      if (newItems.length < ACTIVITIES_PER_PAGE) {
        setHasMoreActivities(false);
      }
    } catch (err) {
      console.error("Failed to load more activities:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingActivities(true);
    const id = Date.now();
    const activity = normalizeActivity({
      ...newActivity,
      id,
      tags: newActivity.tags.split(',').map(t => t.trim()).filter(t => t !== '')
    });
    try {
      await apiSetDoc('activities', id.toString(), activity);
      setActivities(prev => [activity, ...prev]);
      setNewActivity({ title: '', content: '', date: '', img: '', tags: '#SAVFX, #AI, #動畫' });
      setShowAddForm(false);
      showToast("活動已新增");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `activities/${id}`);
    } finally {
      setIsSavingActivities(false);
    }
  };

  const renderMaskOptions = () => (
    <>
      {BUILTIN_MASKS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      {customMasks.length > 0 && <optgroup label="── 自訂遮罩 ──">
        {customMasks.map(m => <option key={m.id} value={`mask-custom-${m.id}`}>{m.name}</option>)}
      </optgroup>}
    </>
  );

  const handleAddMask = async () => {
    if (!newMask.name.trim() || !newMask.path.trim()) { showToast('請填寫名稱與 SVG Path', 'error'); return; }
    setIsSavingMasks(true);
    try {
      const id = Date.now().toString();
      const maskData: CustomMask = { id, name: newMask.name.trim(), path: newMask.path.trim() };
      await apiSetDoc('masks', id, maskData);
      setCustomMasks(prev => [...prev, maskData]);
      setNewMask({ name: '', path: '' });
      showToast('遮罩已新增');
    } catch (error) {
      showToast('新增失敗', 'error');
    } finally {
      setIsSavingMasks(false);
    }
  };

  const handleUpdateMask = async () => {
    if (!editingMask) return;
    setIsSavingMasks(true);
    try {
      await apiSetDoc('masks', editingMask.id, editingMask);
      setCustomMasks(prev => prev.map(m => m.id === editingMask.id ? editingMask : m));
      setEditingMask(null);
      showToast('遮罩已更新');
    } catch (error) {
      showToast('更新失敗', 'error');
    } finally {
      setIsSavingMasks(false);
    }
  };

  const handleDeleteMask = async (id: string) => {
    showConfirm('確定刪除', '確定刪除此自訂遮罩？刪除後使用此遮罩的元素將顯示異常。', async () => {
      try {
        await apiDeleteDoc('masks', id);
        setCustomMasks(prev => prev.filter(m => m.id !== id));
        showToast('遮罩已刪除');
      } catch (error: any) {
        showToast(error.message || '刪除失敗', 'error');
      }
    });
  };

  const handleDeleteActivity = async (id: string) => {
    showConfirm("確定刪除", "確定刪除此活動？", async () => {
      try {
        await apiDeleteDoc('activities', id);
        setActivities(prev => prev.filter(a => a.id !== id));
        showToast("活動已刪除");
      } catch (error: any) {
        console.error("Error deleting activity:", error);
        showToast(error.message || "刪除失敗", "error");
      }
    });
  };

  const handleAddTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTutors(true);
    const id = Date.now().toString();
    const priority = Number.isFinite(Number(newTutor.priority)) ? Number(newTutor.priority) : 0;
    const tutorPayload = { ...newTutor, priority };
    try {
      await apiSetDoc('tutors', id, tutorPayload);
      setTutors(prev => [...prev, { id, ...tutorPayload }]);
      setNewTutor({ name: '', role: '', desc: '', img: '', priority: 0, mask: 'mask-notebook' });
      showToast("導師已新增");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `tutors/${id}`);
    } finally {
      setIsSavingTutors(false);
    }
  };

  const handleUpdateTutorPriority = async (id: string) => {
    const tutor = tutors.find(t => t.id?.toString() === id.toString());
    if (!tutor) return;

    const nextPriority = Number.isFinite(Number(tutorPriorityDrafts[id])) ? Number(tutorPriorityDrafts[id]) : 0;
    const nextMask = tutorMaskDrafts[id] ?? tutor.mask ?? 'mask-notebook';
    setSavingTutorPriorityId(id.toString());

    try {
      const updatedTutor = { ...tutor, priority: nextPriority, mask: nextMask };
      await apiSetDoc('tutors', id.toString(), updatedTutor);
      setTutors(prev => prev.map(t => t.id?.toString() === id.toString() ? updatedTutor : t));
      showToast("導師資料已更新");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tutors/${id}`);
    } finally {
      setSavingTutorPriorityId(null);
    }
  };

  const handleUpdateTutorMask = async (id: string, nextMask: string) => {
    const tutor = tutors.find(t => t.id?.toString() === id.toString());
    if (!tutor) return;

    const previousMask = tutor.mask || 'mask-notebook';
    setTutorMaskDrafts(prev => ({ ...prev, [id]: nextMask }));
    setSavingTutorMaskId(id.toString());

    try {
      const updatedTutor = { ...tutor, mask: nextMask };
      await apiSetDoc('tutors', id.toString(), updatedTutor);
      setTutors(prev => prev.map(t => t.id?.toString() === id.toString() ? updatedTutor : t));
      showToast("導師遮罩已更新");
    } catch (error) {
      setTutorMaskDrafts(prev => ({ ...prev, [id]: previousMask }));
      handleFirestoreError(error, OperationType.UPDATE, `tutors/${id}`);
    } finally {
      setSavingTutorMaskId(null);
    }
  };

  const handleDeleteTutor = async (id: string) => {
    showConfirm("確定刪除", "確定刪除此導師？", async () => {
      try {
        await apiDeleteDoc('tutors', id);
        setTutors(prev => prev.filter(t => t.id !== id));
        showToast("導師已刪除");
      } catch (error: any) {
        console.error("Error deleting tutor:", error);
        showToast(error.message || "刪除失敗", "error");
      }
    });
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTestimonials(true);
    const id = Date.now().toString();
    try {
      await apiSetDoc('testimonials', id, newTestimonial);
      setTestimonials(prev => [...prev, { id, ...newTestimonial }]);
      setNewTestimonial({ name: '', text: '', img: '' });
      showToast("感想已新增");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `testimonials/${id}`);
    } finally {
      setIsSavingTestimonials(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    showConfirm("確定刪除", "確定刪除此學員感想？", async () => {
      try {
        await apiDeleteDoc('testimonials', id);
        setTestimonials(prev => prev.filter(t => t.id !== id));
        showToast("感想已刪除");
      } catch (error: any) {
        console.error("Error deleting testimonial:", error);
        showToast(error.message || "刪除失敗", "error");
      }
    });
  };

  const handleSaveStudentWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStudentWorks(true);
    const id = editingStudentWorkId || Date.now().toString();
    const normalizedWork: StudentWork = {
      title: (newStudentWork.title || '').trim(),
      youtubeUrl: (newStudentWork.youtubeUrl || '').trim(),
      studentName: (newStudentWork.studentName || '').trim(),
      courseTag: (newStudentWork.courseTag || '').trim(),
      year: (newStudentWork.year || '').trim(),
      description: (newStudentWork.description || '').trim(),
      featured: !!newStudentWork.featured,
      sortOrder: newStudentWork.sortOrder === '' ? '' : getStudentWorkSortValue(newStudentWork.sortOrder)
    };

    if (!normalizedWork.title || !normalizedWork.youtubeUrl) {
      showToast('請填寫作品標題與 YouTube 連結', 'error');
      setIsSavingStudentWorks(false);
      return;
    }

    try {
      await apiSetDoc('studentWorks', id, normalizedWork);
      if (editingStudentWorkId) {
        setStudentWorks(prev => sortStudentWorks(prev.map(w => w.id === id ? { id, ...normalizedWork } : w)));
        showToast("作品已更新");
      } else {
        setStudentWorks(prev => sortStudentWorks([...prev, { id, ...normalizedWork }]));
        showToast("作品已新增");
      }
      setNewStudentWork(EMPTY_STUDENT_WORK);
      setEditingStudentWorkId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `studentWorks/${id}`);
    } finally {
      setIsSavingStudentWorks(false);
    }
  };

  const handleDeleteStudentWork = async (id: string) => {
    showConfirm("確定刪除", "確定刪除此學生作品？", async () => {
      try {
        await apiDeleteDoc('studentWorks', id);
        setStudentWorks(prev => prev.filter(w => w.id !== id));
        showToast("作品已刪除");
      } catch (error: any) {
        showToast(error.message || "刪除失敗", "error");
      }
    });
  };

  const startEditStudentWork = (work: StudentWork) => {
    setNewStudentWork({
      title: work.title || '',
      youtubeUrl: work.youtubeUrl || '',
      studentName: work.studentName || '',
      courseTag: work.courseTag || '',
      year: work.year || '',
      description: work.description || '',
      featured: !!work.featured,
      sortOrder: work.sortOrder?.toString() || ''
    });
    setEditingStudentWorkId(work.id || null);
  };

  const resetStudentWorkForm = () => {
    setNewStudentWork(EMPTY_STUDENT_WORK);
    setEditingStudentWorkId(null);
  };

  const handleToggleStudentWorkFeatured = async (work: StudentWork) => {
    if (!work.id) return;
    const updated = { ...work, featured: !work.featured };
    try {
      await apiSetDoc('studentWorks', work.id, updated);
      setStudentWorks(prev => sortStudentWorks(prev.map(item => item.id === work.id ? updated : item)));
      showToast(updated.featured ? '已設為精選作品' : '已取消精選');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `studentWorks/${work.id}`);
    }
  };

  const handleAutoSortStudentWorks = async () => {
    const next = sortStudentWorks(studentWorks).map((work, index) => ({
      ...work,
      sortOrder: index + 1
    }));
    try {
      const payload = next.filter(work => !!work.id).map(work => ({ id: work.id!.toString(), ...work }));
      await apiBulkSet('studentWorks', payload);
      setStudentWorks(next);
      showToast('已套用自動排序');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'studentWorks/bulk-sort');
    }
  };

  useEffect(() => {
    const drafts: Record<string, number> = {};
    tutors.forEach((tutor) => {
      const tutorId = tutor.id?.toString();
      if (!tutorId) return;
      const parsedPriority = Number(tutor.priority);
      drafts[tutorId] = Number.isFinite(parsedPriority) ? parsedPriority : 0;
    });
    setTutorPriorityDrafts(drafts);
  }, [tutors]);

  useEffect(() => {
    const drafts: Record<string, string> = {};
    tutors.forEach((tutor) => {
      const tutorId = tutor.id?.toString();
      if (!tutorId) return;
      drafts[tutorId] = tutor.mask || 'mask-notebook';
    });
    setTutorMaskDrafts(drafts);
  }, [tutors]);

  const getTutorPriority = (tutor: any) => {
    const parsed = Number(tutor?.priority);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const sortedTutors = [...tutors].sort((a, b) => {
    const priorityDiff = getTutorPriority(a) - getTutorPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return a.id.toString().localeCompare(b.id.toString());
  });

  const studentWorkTagOptions = React.useMemo(() => {
    return ['全部課程', ...Array.from(new Set(studentWorks.map((w: StudentWork) => (w.courseTag || '').trim()).filter(Boolean)))];
  }, [studentWorks]);

  const studentWorkYearOptions = React.useMemo(() => {
    const years = Array.from(new Set(studentWorks.map((w: StudentWork) => (w.year || '').trim()).filter(Boolean)));
    return ['全部年份', ...years.sort((a, b) => b.localeCompare(a))];
  }, [studentWorks]);

  const adminStudentWorks = React.useMemo(() => {
    const keyword = studentWorksSearch.trim().toLowerCase();

    const filtered = studentWorks.filter((w: StudentWork) => {
      if (studentWorksFilterTag !== '全部課程' && (w.courseTag || '').trim() !== studentWorksFilterTag) return false;
      if (studentWorksFilterYear !== '全部年份' && (w.year || '').trim() !== studentWorksFilterYear) return false;
      if (studentWorksFilterFeatured === 'featured' && !w.featured) return false;
      if (studentWorksFilterFeatured === 'normal' && w.featured) return false;

      if (!keyword) return true;
      const haystack = [w.title, w.studentName, w.courseTag, w.year, w.description]
        .map(v => (v || '').toString().toLowerCase())
        .join(' ');
      return haystack.includes(keyword);
    });

    if (studentWorksSortBy === 'title') {
      return [...filtered].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'zh-Hant'));
    }
    if (studentWorksSortBy === 'year') {
      return [...filtered].sort((a, b) => (b.year || '').localeCompare(a.year || ''));
    }
    return sortStudentWorks(filtered);
  }, [studentWorks, studentWorksFilterFeatured, studentWorksFilterTag, studentWorksFilterYear, studentWorksSearch, studentWorksSortBy]);

  const featuredStudentWorkCount = React.useMemo(() => studentWorks.filter((w: StudentWork) => w.featured).length, [studentWorks]);

  const currentCourse = courses.find(c => c.id === selectedCourse) || courses[1] || { mandatory: [], allowExtra: false, name: '', minUnits: 0, type: '' };
  const currentCourseType = String(currentCourse?.type || '').toLowerCase();
  const currentCourseName = String(currentCourse?.name || '');
  const isCertificateCourse =
    !currentCourseName.includes('文憑') && !currentCourseType.includes('diploma');

  const getHeroGalleryItems = (): HeroGalleryItem[] => {
    if (Array.isArray(siteSettings.heroGallery) && siteSettings.heroGallery.length > 0) {
      return siteSettings.heroGallery.map((item: any, index: number) => normalizeHeroGalleryItem(item, index));
    }
    if (Array.isArray(siteSettings.heroImages) && siteSettings.heroImages.length > 0) {
      return siteSettings.heroImages.map((url: string, index: number) => normalizeHeroGalleryItem({
        id: `hero-${index}`,
        url,
        title: '',
        date: '',
        order: index + 1
      }, index));
    }
    return buildDefaultHeroGallery();
  };

  const updateHeroGallery = (updater: (items: HeroGalleryItem[]) => HeroGalleryItem[]) => {
    const currentItems = getHeroGalleryItems();
    const updatedItems = updater(currentItems);
    setSiteSettings({
      ...siteSettings,
      heroGallery: updatedItems,
      heroImages: updatedItems.map(item => item.url)
    });
  };

  const sortedHeroGalleryItems = [...getHeroGalleryItems()].sort((a, b) => {
    const orderDiff = Number(a.order || 0) - Number(b.order || 0);
    if (orderDiff !== 0) return orderDiff;
    return a.id.localeCompare(b.id);
  });

  const visibleHeroGalleryItems = sortedHeroGalleryItems.slice(0, heroVisibleCount);
  const hasMoreHeroItems = sortedHeroGalleryItems.length > heroVisibleCount;

  const heroTitleFont = siteSettings.heroTitleFont || 'Noto Sans TC';
  const heroTaglineFont = siteSettings.heroTaglineFont || 'Montserrat';
  const heroSubtitleFont = siteSettings.heroSubtitleFont || 'Noto Sans TC';
  const heroTitleColor = normalizeHexColor(siteSettings.heroTitleColor, '#000000');
  const heroTaglineColor = normalizeHexColor(siteSettings.heroTaglineColor, '#1A1A1A');
  const heroMainWordColor = normalizeHexColor(siteSettings.heroMainWordColor, '#FFFFFF');
  const heroSubtitleColor = normalizeHexColor(siteSettings.heroSubtitleColor, '#000000');

  const heroTitleSizeMobile = Number(siteSettings.heroTitleSizeMobile) || 48;
  const heroTitleSizeDesktop = Number(siteSettings.heroTitleSizeDesktop) || 110;
  const heroTaglineSizeMobile = Number(siteSettings.heroTaglineSizeMobile) || 20;
  const heroTaglineSizeDesktop = Number(siteSettings.heroTaglineSizeDesktop) || 40;
  const heroSubtitleSizeMobile = Number(siteSettings.heroSubtitleSizeMobile) || 20;
  const heroSubtitleSizeDesktop = Number(siteSettings.heroSubtitleSizeDesktop) || 32;

  const heroTitleStyle: React.CSSProperties = {
    fontFamily: `"${heroTitleFont}", sans-serif`,
    fontSize: getResponsiveFontSize(heroTitleSizeMobile, heroTitleSizeDesktop),
    color: heroTitleColor
  };
  const heroTaglineStyle: React.CSSProperties = {
    fontFamily: `"${heroTaglineFont}", sans-serif`,
    fontSize: getResponsiveFontSize(heroTaglineSizeMobile, heroTaglineSizeDesktop),
    color: heroTaglineColor
  };
  const heroSubtitleStyle: React.CSSProperties = {
    fontFamily: `"${heroSubtitleFont}", sans-serif`,
    fontSize: getResponsiveFontSize(heroSubtitleSizeMobile, heroSubtitleSizeDesktop),
    color: heroSubtitleColor
  };
  const heroMainWordStyle: React.CSSProperties = {
    fontFamily: `"${heroTitleFont}", sans-serif`,
    fontSize: getResponsiveFontSize(
      Math.round(heroTitleSizeMobile * 1.15),
      Math.round(heroTitleSizeDesktop * 1.8)
    ),
    color: heroMainWordColor
  };

  const handleCourseChange = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourse(courseId);
      const globalMandatory = unitNames.filter(u => u.isMandatory).map(u => u.id);
      setSelectedUnits([...new Set([...course.mandatory, ...globalMandatory])]);
    }
  };

  const toggleUnit = (id: number) => {
    if (!currentCourse || !currentCourse.mandatory) return;
    
    const isGlobalMandatory = unitNames[id]?.isMandatory;
    if (currentCourse.mandatory.includes(id) || isGlobalMandatory) return; // Cannot unselect mandatory units

    if (selectedUnits.includes(id)) {
      setSelectedUnits(selectedUnits.filter(u => u !== id));
    } else {
      setSelectedUnits([...selectedUnits, id]);
    }
  };

  const calculateTotalPrice = () => {
    let total = 0;
    // Filter to only include units that actually exist in the database
    const validSelected = selectedUnits.filter(idx => idx < unitNames.length);
    
    // Pricing logic:
    // Units 1-4 (indices 0-3): $1600
    // Others: $3000
    // Discount: If total units > 16, units beyond the 16th one get 20% off
    
    // Sort to ensure consistent pricing (cheaper units first to be fair, or mandatory first?)
    // Usually, we count the first 16 units at full price, then the rest at discount.
    // To be consistent, we sort by index.
    const sortedSelected = [...validSelected].sort((a, b) => a - b);
    
    sortedSelected.forEach((idx, order) => {
      let unitPrice = (idx < 4) ? 1600 : 3000;
      
      // If total units > 16, the 17th unit onwards gets 20% off
      if (validSelected.length > 16 && order >= 16) {
        unitPrice *= 0.8;
      }
      
      total += unitPrice;
    });

    const courseGroupNames: string[] = currentCourse?.mandatoryGroups || [];
    const groupTotal = courseGroupNames.reduce((sum: number, groupName: string) => {
      return sum + getGroupPrice(groupName, unitNames);
    }, 0);
    total += groupTotal;
    
    return total;
  };

  const currentCourseGroupTotalPrice = ((currentCourse?.mandatoryGroups || []) as string[])
    .reduce((sum: number, groupName: string) => sum + getGroupPrice(groupName, unitNames), 0);

  const totalPrice = calculateTotalPrice();

  const handleBriefingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = briefingForm.email.trim();
    const phone = briefingForm.phone.trim();
    if (!email || !phone) return;

    const id = Date.now().toString();
    const leadPayload = {
      id,
      email,
      phone,
      createdAt: new Date().toISOString()
    };

    setIsSubmittingBriefing(true);
    try {
      await apiSetDoc('briefingLeads', id, leadPayload);
      setBriefingLeads(prev => [leadPayload, ...prev]);
      setBriefingForm({ email: '', phone: '' });
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
      showToast("提交成功！我們會盡快聯絡您。", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `briefingLeads/${id}`);
    } finally {
      setIsSubmittingBriefing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFEF00] font-sans selection:bg-black selection:text-[#FFEF00] relative">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" 
           style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '100px 100px' }}></div>
      
      <SVGMasks custom={customMasks} />
      
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#FFEF00] border-8 border-black p-8 rounded-3xl max-w-md w-full shadow-[16px_16px_0px_rgba(0,0,0,1)]"
          >
            <h2 className="text-3xl font-black mb-6 uppercase">管理員登入</h2>
            <div className="space-y-4">
              <input 
                type="password" 
                placeholder="請輸入管理密碼"
                className="w-full border-4 border-black p-4 rounded-xl font-bold text-lg"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              {loginError && <p className="text-red-600 font-black text-sm">{loginError}</p>}
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleLogin}
                  className="flex-1 bg-black text-[#FFEF00] py-4 rounded-full font-black uppercase text-lg hover:scale-105 transition-transform"
                >
                  登入
                </button>
                <button 
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginPassword('');
                    setLoginError('');
                  }}
                  className="flex-1 bg-white border-4 border-black py-4 rounded-full font-black uppercase text-lg hover:scale-105 transition-transform"
                >
                  取消
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!showAdminPanel ? (
          <motion.div
            key="main-site"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#FFEF00] border-b border-black px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-10 sm:w-14 sm:h-12 rounded-3xl border-2 border-black bg-[#FFEF00] flex items-center justify-center overflow-hidden">
                {siteSettings.logoUrl ? (
                  <img src={siteSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <svg width="52" height="36" viewBox="0 0 120 80" className="stroke-[#0055FF] stroke-[4] fill-none">
                    <path d="M10,50 L20,30 L35,45 L50,20 L65,45 L80,30 L90,50 L95,80 L5,80 Z" strokeLinejoin="round" />
                    <circle cx="30" cy="60" r="3" fill="#0055FF" />
                    <circle cx="70" cy="60" r="3" fill="#0055FF" />
                  </svg>
                )}
              </div>
              <div className="leading-tight">
                <h1 className="text-xl sm:text-4xl font-black tracking-tighter text-black">SAVFX</h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/70">AI Studio</p>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex gap-4 xl:gap-6 font-bold text-sm xl:text-base text-black items-center">
            <a href="#courses" className="hover:opacity-70 transition-opacity whitespace-nowrap">個人課程</a>
            <a href="#group-courses" className="hover:opacity-70 transition-opacity whitespace-nowrap">團體課程</a>
            <a href="#student-works" className="hover:opacity-70 transition-opacity whitespace-nowrap">學生作品</a>
            <a href="#testimonials" className="hover:opacity-70 transition-opacity whitespace-nowrap">學生見證</a>
            <a href="#tutors" className="hover:opacity-70 transition-opacity whitespace-nowrap">專業團隊</a>
            <a href="#business" className="hover:opacity-70 transition-opacity whitespace-nowrap">商業合作</a>
            <a href="#activities" className="hover:opacity-70 transition-opacity whitespace-nowrap">活動回顧</a>
            <a href="#contact" className="hover:opacity-70 transition-opacity whitespace-nowrap">聯絡我們</a>
            {isAdmin && (
              <button 
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center gap-2 bg-black text-[#FFEF00] px-4 py-2 rounded-full hover:scale-105 transition-transform whitespace-nowrap"
              >
                <Settings size={18} /> 管理
              </button>
            )}
            {!isAdmin ? (
              <button onClick={() => setShowLoginModal(true)} className="hover:opacity-70 transition-opacity flex items-center gap-1 whitespace-nowrap">
                <LogIn size={18} /> 登入
              </button>
            ) : (
              <button onClick={handleLogout} className="hover:opacity-70 transition-opacity flex items-center gap-1 whitespace-nowrap">
                <LogOut size={18} /> 登出
              </button>
            )}
            <div className="flex gap-2 ml-2">
              <a href={siteSettings.youtubeUrl || 'https://www.youtube.com/'} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center hover:bg-black hover:text-[#FFEF00] transition-colors">
                <FaYoutube size={16} />
              </a>
              <a href={siteSettings.facebookUrl || 'https://www.facebook.com/'} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center hover:bg-black hover:text-[#FFEF00] transition-colors">
                <FaFacebook size={16} />
              </a>
              <a href={siteSettings.instagramUrl || 'https://www.instagram.com/'} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center hover:bg-black hover:text-[#FFEF00] transition-colors">
                <FaInstagram size={16} />
              </a>
            </div>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <div className="flex gap-1.5">
              <a href={siteSettings.youtubeUrl || 'https://www.youtube.com/'} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center hover:bg-black hover:text-[#FFEF00] transition-colors">
                <FaYoutube size={14} />
              </a>
              <a href={siteSettings.facebookUrl || 'https://www.facebook.com/'} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center hover:bg-black hover:text-[#FFEF00] transition-colors">
                <FaFacebook size={14} />
              </a>
              <a href={siteSettings.instagramUrl || 'https://www.instagram.com/'} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center hover:bg-black hover:text-[#FFEF00] transition-colors">
                <FaInstagram size={14} />
              </a>
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-40 bg-[#FFEF00] flex flex-col items-center justify-center gap-8 text-3xl font-black uppercase"
          >
            <a href="#courses" onClick={() => setIsMenuOpen(false)}>個人課程</a>
            <a href="#group-courses" onClick={() => setIsMenuOpen(false)}>團體課程</a>
            <a href="#student-works" onClick={() => setIsMenuOpen(false)}>學生作品</a>
            <a href="#testimonials" onClick={() => setIsMenuOpen(false)}>學生見證</a>
            <a href="#tutors" onClick={() => setIsMenuOpen(false)}>專業團隊</a>
            <a href="#business" onClick={() => setIsMenuOpen(false)}>商業合作</a>
            <a href="#activities" onClick={() => setIsMenuOpen(false)}>活動回顧</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)}>聯絡我們</a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <header className="pt-24 sm:pt-32 md:pt-[200px] pb-24 sm:pb-40 px-8 sm:px-16 min-h-0 sm:min-h-[80vh] flex items-start relative overflow-hidden bg-[#FFEF00]">
        {/* Decorative Shapes */}
        <BlueShape className="w-64 h-64 -top-20 -left-20 rotate-12" />
        <BlueShape className="w-96 h-96 -bottom-32 -right-32 -rotate-12" />
        
        {/* Diagonal Stripe Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]" 
             style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '60px 60px' }}></div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 items-start w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <h1 className="font-black leading-tight tracking-tighter mb-4 sm:mb-6 text-black uppercase" style={heroTitleStyle}>
              {siteSettings.heroTitle.split('<br />').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < siteSettings.heroTitle.split('<br />').length - 1 && <br />}
                </React.Fragment>
              ))}
            </h1>
            {siteSettings.heroTagline && (
              <p className="text-black/80 font-black tracking-wide uppercase mb-4 sm:mb-6 whitespace-pre-line" style={heroTaglineStyle}>
                {siteSettings.heroTagline}
              </p>
            )}
            <div className="relative">
              <h2 className="text-white font-black leading-none sm:leading-tight tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] sm:drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] mb-6 sm:mb-8 select-none" style={heroMainWordStyle}>
                {siteSettings.siteName}
              </h2>
              <div className="absolute -top-4 -right-4 bg-[#0055FF] text-white px-3 py-1 font-black text-xs rotate-12">
                {siteSettings.heroEst || 'EST. 2024'}
              </div>
            </div>
            <p className="font-black max-w-lg text-black leading-tight border-l-8 border-black pl-4 sm:pl-6 whitespace-pre-line" style={heroSubtitleStyle}>
              {siteSettings.heroSubtitle}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-10"
          >
            {visibleHeroGalleryItems.map((item, i) => (
              <button
                key={`${item.id}-${i}`}
                type="button"
                onClick={() => {
                  setSelectedLightboxItem(item);
                  setIsLightboxOpen(true);
                }}
                className="relative aspect-square group text-left"
              >
                {/* Corner Accents */}
                {i === 0 && (
                  <div className="absolute -top-4 -left-4 w-12 h-12 border-t-[12px] border-l-[12px] border-[#0055FF] z-20" />
                )}
                {i === visibleHeroGalleryItems.length - 1 && (
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-[12px] border-r-[12px] border-[#0055FF] z-20" />
                )}
                
                {/* The Shape */}
                <div className="w-full h-full border-[8px] border-[#0055FF] rounded-tl-[100%] rounded-tr-[100%] rounded-br-[100%] rounded-bl-none overflow-hidden bg-white shadow-[8px_8px_0px_rgba(0,55,255,0.2)] transition-all group-hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] group-hover:-translate-x-1 group-hover:-translate-y-1">
                  <img 
                    src={item.url || `https://picsum.photos/seed/hero-${item.order || i}/400/400`} 
                    className="w-full h-full object-cover transition-all duration-500" 
                    referrerPolicy="no-referrer" 
                  />
                  {(item.title || item.date) && (
                    <div className="absolute left-0 right-0 bottom-0 flex flex-col items-start gap-1 p-2">
                      {item.title && <span className="bg-[#0055FF] text-white text-xs sm:text-sm font-black px-2 py-0.5 rounded leading-tight">{item.title}</span>}
                      {item.date && <span className="bg-[#0055FF] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded">{item.date}</span>}
                    </div>
                  )}
                </div>
              </button>
            ))}
            {hasMoreHeroItems && (
              <div className="col-span-2 sm:col-span-3 flex justify-center mt-2 sm:mt-4">
                <button
                  onClick={() => setHeroVisibleCount(prev => prev + 6)}
                  className="bg-black text-[#FFEF00] px-8 py-3 rounded-full font-black uppercase tracking-wide hover:scale-105 transition-transform"
                >
                  瀏覽更多
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </header>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && selectedLightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
            onClick={() => {
              setIsLightboxOpen(false);
              setSelectedLightboxItem(null);
            }}
          >
            <motion.button
              className="absolute top-8 right-8 text-white hover:text-[#FFEF00] transition-colors"
              onClick={() => {
                setIsLightboxOpen(false);
                setSelectedLightboxItem(null);
              }}
            >
              <X size={48} strokeWidth={3} />
            </motion.button>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl w-full"
            >
              <img
                src={selectedLightboxItem.url || `https://picsum.photos/seed/hero-${selectedLightboxItem.order || 1}/1200/1200`}
                alt={selectedLightboxItem.title || 'Hero photo'}
                className="w-full max-h-[78vh] object-contain rounded-2xl shadow-2xl border-4 border-white/20"
                referrerPolicy="no-referrer"
              />
              {(selectedLightboxItem.title || selectedLightboxItem.date) && (
                <div className="mt-4 bg-white text-black rounded-xl px-4 py-3 border-2 border-white/40">
                  {selectedLightboxItem.title && <p className="text-lg sm:text-xl font-black leading-tight">{selectedLightboxItem.title}</p>}
                  {selectedLightboxItem.date && <p className="text-sm sm:text-base font-bold mt-1 opacity-80">{selectedLightboxItem.date}</p>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCourseDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-3 sm:p-6"
            onClick={() => setSelectedCourseDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[#FFEF00] border-4 sm:border-6 border-black rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-8 shadow-[10px_10px_0px_rgba(0,0,0,1)]"
            >
              <button
                onClick={() => setSelectedCourseDetail(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 rounded-full bg-black text-[#FFEF00] border-2 border-black flex items-center justify-center"
                aria-label="關閉課程詳情"
              >
                <X size={20} />
              </button>

              <div className="pr-10 sm:pr-12">
                <h3 className="text-2xl sm:text-4xl font-black leading-tight break-words [overflow-wrap:anywhere]">
                  {selectedCourseDetail.title || selectedCourseDetail.name}
                </h3>
                {selectedCourseDetail.subtitle && (
                  <p className="mt-1 text-sm sm:text-base font-black text-black/80 break-words [overflow-wrap:anywhere]">
                    {selectedCourseDetail.subtitle}
                  </p>
                )}
              </div>

              <div className="my-5 sm:my-6 flex justify-center">
                <MaskedImage
                  src={(selectedCourseDetail.img?.startsWith('http') || selectedCourseDetail.img?.startsWith('data:') || selectedCourseDetail.img?.startsWith('/'))
                    ? selectedCourseDetail.img
                    : `https://picsum.photos/seed/${selectedCourseDetail.img || 'course'}/700/500`}
                  maskId={selectedCourseDetail.mask || 'mask-cloud'}
                  className="w-40 h-40 sm:w-56 sm:h-56 bg-white border-2 sm:border-4 border-black"
                />
              </div>

              <div className="bg-white/60 border-2 border-black rounded-2xl p-4 sm:p-5 text-sm sm:text-base font-bold leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                {selectedCourseDetail.desc || '暫無課程介紹'}
              </div>

              {(selectedCourseDetail.startDate || selectedCourseDetail.classTime || selectedCourseDetail.tuition) && (
                <div className="mt-4 sm:mt-5 bg-black text-[#FFEF00] rounded-2xl p-4 space-y-2 text-xs sm:text-sm font-black break-words [overflow-wrap:anywhere]">
                  {selectedCourseDetail.startDate && <p className="whitespace-pre-line">開課日期: {selectedCourseDetail.startDate}</p>}
                  {selectedCourseDetail.classTime && <p className="whitespace-pre-line">上課時間: {selectedCourseDetail.classTime}</p>}
                  {selectedCourseDetail.tuition && <p className="whitespace-pre-line">課程學費: {selectedCourseDetail.tuition}</p>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Individual Courses */}
      <section id="courses-intro" className="py-12 sm:py-16 bg-white border-y-8 border-black">
        <div className="max-w-7xl mx-auto px-8 sm:px-16">
          <SectionTitle subtitle={siteSettings.coursesIntroSubtitle || "專業文憑與證書課程"}>{siteSettings.coursesIntroTitle || "課程介紹"}</SectionTitle>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {courses.filter(c => hasCategory(c, 'regular') || (!c.categories && !c.category)).map((course, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-[#FFEF00] border-4 border-black p-4 sm:p-6 flex flex-col items-start text-left rounded-3xl min-w-0 overflow-hidden"
              >
                <MaskedImage 
                  src={(course.img?.startsWith('http') || course.img?.startsWith('data:') || course.img?.startsWith('/')) ? course.img : `https://picsum.photos/seed/${course.img || 'course'}/400/400`} 
                  maskId={course.mask || 'mask-cloud'} 
                  className="w-24 h-24 sm:w-32 sm:h-32 mb-3 sm:mb-4 bg-white border-2 border-black self-center"
                />
                <h3 className="text-2xl sm:text-3xl font-black leading-tight mb-1 break-words [overflow-wrap:anywhere] w-full">{course.title || course.name}</h3>
                {course.subtitle && <p className="text-base font-black mb-2 break-words [overflow-wrap:anywhere] w-full">{course.subtitle}</p>}
                <p className="font-bold text-black/70 mb-3 text-base whitespace-pre-line break-words [overflow-wrap:anywhere] max-h-36 sm:max-h-44 overflow-y-auto pr-1 custom-scrollbar w-full">{course.desc}</p>
                {(course.startDate || course.classTime || course.tuition) && (
                  <div className="w-full text-left text-xs font-black text-black/70 mb-3 space-y-1 break-words [overflow-wrap:anywhere]">
                    {course.startDate && <p className="whitespace-pre-line">開課日期: {course.startDate}</p>}
                    {course.classTime && <p className="whitespace-pre-line">上課時間: {course.classTime}</p>}
                    {course.tuition && <p className="whitespace-pre-line">課程學費: {course.tuition}</p>}
                  </div>
                )}
                <button
                  onClick={() => setSelectedCourseDetail(course)}
                  className="mt-auto bg-black text-[#FFEF00] w-full py-3 font-bold uppercase rounded-full text-sm"
                >
                  查看詳情
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Selection Tool */}
      <section id="courses" className="py-24 sm:py-36 px-8 sm:px-16 bg-[#FFEF00] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, black 2px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <SectionTitle subtitle={siteSettings.personalCourseSubtitle || "選擇您的專業路徑與單元組合"}>{siteSettings.personalCourseTitle || "個人課程"}</SectionTitle>
          
          {/* Course Selector Tabs with arrow navigation */}
          {(() => {
            const personalCourses = courses.filter(c => hasCategory(c, 'personal'));
            const currentIdx = personalCourses.findIndex(c => c.id === selectedCourse);
            const goPrev = () => {
              if (personalCourses.length === 0) return;
              const prevIdx = (currentIdx <= 0 ? personalCourses.length : currentIdx) - 1;
              handleCourseChange(personalCourses[prevIdx].id);
            };
            const goNext = () => {
              if (personalCourses.length === 0) return;
              const nextIdx = (currentIdx + 1) % personalCourses.length;
              handleCourseChange(personalCourses[nextIdx].id);
            };
            return (
              <div className="flex items-center gap-3 mb-10 sm:mb-16 justify-center">
                <button
                  onClick={goPrev}
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black text-[#FFEF00] border-[3px] border-black font-black text-lg hover:scale-110 transition-all shadow-lg flex-shrink-0"
                >‹</button>
                <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
                  {personalCourses.map(course => (
                    <button
                      key={course.id}
                      onClick={() => handleCourseChange(course.id)}
                      className={`px-4 sm:px-10 py-2.5 sm:py-5 rounded-full font-black text-xs sm:text-sm transition-all border-[4px] shadow-lg ${
                        selectedCourse === course.id
                          ? 'bg-black text-[#FFEF00] border-black scale-105'
                          : 'bg-white text-black border-black hover:bg-black/5'
                      }`}
                    >
                      {course.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={goNext}
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black text-[#FFEF00] border-[3px] border-black font-black text-lg hover:scale-110 transition-all shadow-lg flex-shrink-0"
                >›</button>
              </div>
            );
          })()}


          <div className="bg-black text-[#FFEF00] p-4 sm:p-10 md:p-16 border-[6px] sm:border-[10px] border-white shadow-[10px_10px_0px_rgba(0,0,0,1)] sm:shadow-[20px_20px_0px_rgba(0,0,0,1)] rounded-[2rem] sm:rounded-[4rem] relative">
            <div className="grid lg:grid-cols-[0.88fr_1.12fr] gap-8 sm:gap-16 items-start">
              <div className="space-y-4 sm:space-y-6">
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tighter">
                      {currentCourse.title || currentCourse.name}
                    </p>
                    {currentCourse.subtitle && (
                      <p className="text-xl sm:text-2xl md:text-3xl font-black leading-snug opacity-80 mt-1">
                        {currentCourse.subtitle}
                      </p>
                    )}
                    {(currentCourse as any).discount && (
                      <div className="inline-flex items-center gap-2 mt-3 bg-[#FFEF00] text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-black border-2 border-white shadow-[0_0_0_2px_rgba(255,239,0,0.35),4px_4px_0px_rgba(0,0,0,0.45)] animate-pulse">
                        <span className="text-base sm:text-lg">🏷️</span>
                        <span className="tracking-tight">限時優惠 {(currentCourse as any).discount}% OFF</span>
                      </div>
                    )}
                  </div>
                  
                </div>

                <div className="flex items-end gap-3 sm:gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#FFEF00]/15 blur-2xl rounded-full scale-[2] pointer-events-none" />
                    <div className="text-6xl sm:text-8xl font-black leading-none relative z-10">{selectedUnits.filter(idx => idx < unitNames.length).length}</div>
                  </div>
                  <div className="text-base sm:text-2xl font-black mb-1 sm:mb-2">
                    <span className="opacity-50">/ {unitNames.length}</span>
                    <br />
                    <span className="text-sm sm:text-base opacity-70 tracking-wider">已選單元</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-4 sm:py-5 border border-white/10 relative overflow-hidden">
                    <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-[#FFEF00] rounded-r-full" />
                    <div className="text-xs sm:text-sm font-black uppercase tracking-widest opacity-60 mb-3">預計總學費</div>
                    {(currentCourse?.mandatoryGroups || []).length > 0 && (
                      <div className="text-xs font-black text-white/70 mb-2">
                        已包含群組總價: ${currentCourseGroupTotalPrice.toLocaleString()}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <motion.div
                        key={totalPrice}
                        initial={{ scale: 1.06, opacity: 0.6 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="text-5xl sm:text-7xl font-black text-white tracking-tighter"
                      >${totalPrice.toLocaleString()}</motion.div>
                      {selectedUnits.filter(idx => idx < unitNames.length).length > 16 && currentCourse.allowExtra && (
                        <div className="bg-[#00FF00]/20 text-[#00FF00] text-xs font-black px-3 py-1.5 rounded-md border border-[#00FF00]/30 uppercase tracking-widest">
                          已享 8 折
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    {selectedUnits.filter(idx => idx < unitNames.length).length < currentCourse.minUnits ? (
                      <div className="text-red-400 text-xs sm:text-sm font-black flex items-center gap-2 bg-red-500/10 px-3 sm:px-4 py-2 rounded-full border border-red-500/20">
                        <X size={18} /> 還差 {currentCourse.minUnits - selectedUnits.filter(idx => idx < unitNames.length).length} 個單元即可報名
                      </div>
                    ) : (
                      <div className="text-[#00FF00] text-xs sm:text-sm font-black flex items-center gap-2 bg-[#00FF00]/10 px-3 sm:px-4 py-2 rounded-full border border-[#00FF00]/30 shadow-[0_0_12px_rgba(0,255,0,0.15)]">
                        <CheckCircle2 size={18} /> 已達最低報名要求
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="opacity-50 uppercase tracking-widest">選課進度</span>
                    <span className="text-[#FFEF00]">{Math.round((selectedUnits.filter(idx => idx < unitNames.length).length / Math.max(unitNames.length, 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="bg-[#FFEF00] h-full shadow-[0_0_16px_rgba(255,239,0,0.6)] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(selectedUnits.filter(idx => idx < unitNames.length).length / Math.max(unitNames.length, 1)) * 100}%` }}
                      transition={{ type: "spring", stiffness: 50 }}
                    />
                  </div>
                </div>


              </div>
              
              <div className="relative lg:-mr-6 xl:-mr-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 h-[540px] sm:h-[640px] lg:h-[700px] overflow-y-auto p-3 sm:p-6 bg-[#1A1A1A] custom-scrollbar rounded-[2rem] sm:rounded-[3rem] border-4 border-white/10 shadow-inner w-full">
                  {unitNames.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-12 w-full col-span-full min-h-[400px]">
                      <BookOpen size={64} className="mb-6 opacity-20 text-white" />
                      <p className="font-black text-xl opacity-50 text-white">正在載入單元資料...</p>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const courseElective: number[] = currentCourse.elective || [];
                        const visibleIndices = courseElective.length > 0
                          ? unitNames.map((_, idx) => idx).filter(idx =>
                              currentCourse.mandatory.includes(idx) || unitNames[idx]?.isMandatory || courseElective.includes(idx)
                            )
                          : unitNames.map((_, idx) => idx);
                        return visibleIndices.map((i) => {
                          const unit = unitNames[i];
                          const isMandatory = currentCourse.mandatory.includes(i) || unit.isMandatory;
                          const isSelected = selectedUnits.includes(i);
                          const isHighlighted = isSelected || isMandatory;
                          const isElective = courseElective.includes(i) && !isMandatory;
                          
                          return (
                            <motion.button
                              key={i}
                              whileHover={isMandatory ? {} : { scale: 1.05, y: -2 }}
                              whileTap={isMandatory ? {} : { scale: 0.95 }}
                              onClick={() => toggleUnit(i)}
                              disabled={isMandatory}
                              className={`p-2 sm:p-3 border-[3px] flex flex-col items-center justify-center font-black text-[10px] sm:text-[13px] transition-all rounded-xl sm:rounded-2xl min-h-[94px] sm:min-h-[104px] h-auto text-center leading-tight relative shadow-xl ${
                                isHighlighted 
                                  ? 'bg-[#FFEF00] text-black border-[#FFEF00] shadow-[0_0_20px_4px_rgba(255,239,0,0.3)]' 
                                  : 'bg-[#2A2A2A] border-white/10 hover:border-white/40 hover:bg-[#333] text-white/80 hover:text-white'
                              } ${isMandatory ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                              {isHighlighted && !isMandatory && (
                                <div className="absolute top-1.5 right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-black rounded-full flex items-center justify-center shadow-md z-10">
                                  <CheckCircle2 size={11} className="text-[#FFEF00]" />
                                </div>
                              )}
                              <span
                                className="block w-full break-words leading-[1.12] text-[14px] sm:text-[18px]"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  minHeight: '2.24em',
                                }}
                              >
                                {unit.name}
                              </span>
                              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 mt-1.5">
                                <span className={`text-[10px] sm:text-[12px] ${isHighlighted ? 'text-black/70' : 'text-white/55'}`}>(U{i+1})</span>
                                {unit.price > 0 && (
                                  <span className={`text-[11px] sm:text-[14px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg ${
                                    isHighlighted
                                      ? 'text-black bg-black/10'
                                      : 'text-[#FFEF00] bg-white/15 border border-white/20'
                                  }`}>
                                    ${Number(unit.price || 0).toLocaleString()}
                                  </span>
                                )}
                                {isMandatory && (
                                  <span className="bg-black text-[#FFEF00] px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black tracking-tight border border-white/20">
                                    必修
                                  </span>
                                )}
                                {isElective && (
                                  <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black tracking-tight">
                                    選修
                                  </span>
                                )}
                              </div>
                            </motion.button>
                          );
                        });
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Group Courses */}
      <section id="group-courses" className="py-28 sm:py-40 bg-white border-y-8 border-black">
        <div className="max-w-7xl mx-auto px-8 sm:px-16">
          <SectionTitle subtitle={siteSettings.groupCourseSubtitle || "適合學校、社福機構及私人團體"}>{siteSettings.groupCourseTitle || "團體課程"}</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {groupCourses.length === 0 ? (
              [
                { title: "3D Printing 工作坊", desc: "親手體驗 3D 打印技術與建模", mask: "mask-book", img: "3d-print" },
                { title: "小學生動畫工作坊", desc: "啟發創意，製作屬於自己的短片", mask: "mask-dream", img: "kids-anim" },
                { title: "動畫輪工作坊", mask: "mask-film", desc: "探索傳統動畫與現代技術的結合", img: "zoetrope" }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  className="bg-black text-[#FFEF00] border-4 border-black p-8 flex flex-col items-center text-center rounded-3xl"
                >
                  <MaskedImage 
                    src={`https://picsum.photos/seed/group-${i}/400/400`} 
                    maskId={item.mask} 
                    className="w-48 h-48 mb-6 bg-white border-2 border-[#FFEF00]"
                  />
                  <h3 className="text-2xl font-black mb-2">{item.title}</h3>
                  <p className="font-bold opacity-70 mb-6">{item.desc}</p>
                  <button className="mt-auto bg-[#FFEF00] text-black w-full py-3 font-bold uppercase rounded-full text-sm">立即預約</button>
                </motion.div>
              ))
            ) : (
              groupCourses.map((item, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  className="bg-black text-[#FFEF00] border-4 border-black p-8 flex flex-col items-center text-center rounded-3xl"
                >
                  <MaskedImage 
                    src={(item.img?.startsWith('http') || item.img?.startsWith('data:') || item.img?.startsWith('/')) ? item.img : `https://picsum.photos/seed/group-${i}/400/400`} 
                    maskId={item.mask || 'mask-cloud'} 
                    className="w-48 h-48 mb-6 bg-white border-2 border-[#FFEF00]"
                  />
                  <h3 className="text-2xl font-black mb-2">{item.title}</h3>
                  <p className="font-bold opacity-70 mb-6">{item.desc}</p>
                  <button className="mt-auto bg-[#FFEF00] text-black w-full py-3 font-bold uppercase rounded-full text-sm">立即預約</button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Student Works */}
      <section id="student-works" className="py-28 sm:py-40 px-8 sm:px-16 bg-[#FFEF00] border-y-8 border-black">
        <div className="max-w-7xl mx-auto">
          <SectionTitle subtitle={siteSettings.studentWorksSubtitle || "優秀學員作品展示"}>{siteSettings.studentWorksTitle || "學生作品"}</SectionTitle>
          <div className="bg-black text-[#FFEF00] p-8 md:p-12 border-8 border-black rounded-[3rem]">
            <div className="mb-8">
              <h3 className="text-4xl font-black mb-4">{siteSettings.studentWorksTitle || "學生創作展示"}</h3>
              <p className="text-xl font-bold text-[#FFEF00]/80 mb-6">
                {siteSettings.studentWorksContent || "我們的學生以 AI 與傳統動畫技術創作出色作品，每一件作品都是創意與技術的完美結合。"}
              </p>
              <a 
                href={siteSettings.youtubeUrl || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#FFEF00] text-black px-8 py-3 font-black uppercase rounded-full hover:scale-105 transition-transform"
              >
                <FaYoutube size={20} /> 訂閱 YouTube 頻道
              </a>
            </div>
            {studentWorks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 text-[#FFEF00]/40 py-16">
                <FaYoutube size={64} />
                <p className="font-black uppercase text-sm">暫無作品，敬請期待</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentWorks.map((w, i) => (
                  <div key={w.id || i} className="flex flex-col gap-3">
                    <div className="aspect-video rounded-2xl overflow-hidden border-4 border-[#FFEF00]/30 bg-[#FFEF00]/10">
                      <iframe
                        className="w-full h-full"
                        src={getYouTubeEmbedUrl(w.youtubeUrl || '')}
                        title={w.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <p className="font-black text-base">{w.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Business Cooperation */}
      <section id="business" className="py-28 sm:py-40 px-8 sm:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionTitle subtitle={siteSettings.businessCoopSubtitle || "專業動畫製作與 AI 方案"}>{siteSettings.businessCoopTitle || "商業合作"}</SectionTitle>
          <div className="bg-[#FFEF00] text-black p-8 md:p-12 border-8 border-black rounded-[3rem]">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-4xl font-black mb-6">{siteSettings.businessCoopTitle || "2D / 3D / AI 動畫專案"}</h3>
                <p className="text-xl font-bold mb-8">
                  {siteSettings.businessCoopContent || "我們承接各類商業動畫製作。結合傳統藝術與尖端 AI 技術，為您的品牌提供最具競爭力的視覺方案。"}
                </p>
                <div className="space-y-4 mb-8">
                  {(siteSettings.businessCoopFeatures || [
                    '專業角色設計與建模',
                    'AI 輔助高效動畫流程',
                    '影視級後期合成特效'
                  ]).map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 font-black uppercase">
                      <CheckCircle2 className="text-black" /> {feature}
                    </div>
                  ))}
                </div>
                <button className="bg-black text-[#FFEF00] px-10 py-4 font-black uppercase rounded-full text-lg">
                  開始專案洽談
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="aspect-video bg-black rounded-2xl overflow-hidden border-4 border-black shadow-lg">
                  <iframe 
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden border-2 border-black">
                    <img src="https://picsum.photos/seed/biz1/400/225" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="aspect-video bg-black rounded-xl overflow-hidden border-2 border-black">
                    <img src="https://picsum.photos/seed/biz2/400/225" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Briefing Session Form */}
      <section className="py-28 sm:py-40 px-8 sm:px-16 bg-[#FFEF00] border-y-8 border-black">
        <div className="max-w-3xl mx-auto bg-white border-8 border-black p-14 text-center relative rounded-[3rem]">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-black rounded-full flex items-center justify-center">
            <Play className="text-[#FFEF00] fill-[#FFEF00] w-8 h-8 ml-1" />
          </div>
          <h2 className="text-4xl font-black mb-4 mt-4">{siteSettings.briefingTitle || "課程簡介會"}</h2>
          <p className="text-black/60 font-black uppercase tracking-wide text-base md:text-lg mb-8">{siteSettings.briefingSubtitle || "留下您的聯絡資料，我們將把 YouTube 簡介會影片傳送給您。"}</p>
          
          <form onSubmit={handleBriefingSubmit} className="space-y-4">
            <input 
              type="email" 
              placeholder="您的 Email" 
              required
              className="w-full border-4 border-black p-4 font-bold focus:outline-none focus:bg-[#FFEF00]/10 rounded-xl"
              value={briefingForm.email}
              onChange={e => setBriefingForm({...briefingForm, email: e.target.value})}
            />
            <input 
              type="tel" 
              placeholder="您的電話號碼" 
              required
              className="w-full border-4 border-black p-4 font-bold focus:outline-none focus:bg-[#FFEF00]/10 rounded-xl"
              value={briefingForm.phone}
              onChange={e => setBriefingForm({...briefingForm, phone: e.target.value})}
            />
            <button 
              type="submit" 
              disabled={isSubmittingBriefing}
              className={`w-full bg-black text-[#FFEF00] py-4 font-black uppercase text-xl hover:scale-[1.02] transition-transform rounded-full flex items-center justify-center gap-2 ${isSubmittingBriefing ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmittingBriefing ? <Loader2 className="animate-spin" size={20} /> : null}
              {isSubmittingBriefing ? '提交中...' : '獲取簡介會影片'}
            </button>
          </form>

          {isSubmitted && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-green-600 font-black"
            >
              提交成功！請留意您的電郵。
            </motion.div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-28 sm:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-8 sm:px-16">
          <SectionTitle subtitle="聽聽學員怎麼說">學生見證</SectionTitle>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 xl:gap-12">
            {testimonials.map((t, i) => (
              <div key={i} className="flex flex-col items-center">
                <MaskedImage 
                  src={(t.img.startsWith('http') || t.img.startsWith('data:') || t.img.startsWith('/')) ? t.img : `https://picsum.photos/seed/${t.img}/300/300`} 
                  maskId="mask-dream" 
                  className="w-40 h-40 mb-6 bg-[#FFEF00]"
                />
                <div className="bg-[#FFEF00] p-6 border-4 border-black relative rounded-2xl">
                  <p className="italic font-bold mb-4">"{t.text}"</p>
                  <div className="font-black">— {t.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tutor Profiles */}
      <section id="tutors" className="py-28 sm:py-40 bg-[#FFEF00] border-y-8 border-black">
        <div className="max-w-7xl mx-auto px-8 sm:px-16">
          <SectionTitle subtitle="業界頂尖專家親自授課">專業團隊</SectionTitle>
          <div className="grid md:grid-cols-2 gap-12">
            {sortedTutors.map((tutor, i) => (
              <motion.div 
                key={i} 
                whileHover={{ scale: 1.02 }}
                className="bg-white border-4 border-black p-6 md:p-8 flex flex-col xl:flex-row gap-6 md:gap-8 items-start rounded-3xl group shadow-[8px_8px_0px_rgba(0,0,0,1)] h-full"
              >
                <div className="relative w-32 h-32 flex-shrink-0 mx-auto xl:mx-0">
                  <MaskedImage 
                    src={(tutor.img.startsWith('http') || tutor.img.startsWith('data:') || tutor.img.startsWith('/')) ? tutor.img : `https://picsum.photos/seed/${tutor.img}/300/300`} 
                    maskId={tutorMaskDrafts[tutor.id?.toString()] || tutor.mask || 'mask-notebook'} 
                    className="w-full h-full bg-black transition-all duration-500 object-cover"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#0055FF] rounded-full border-2 border-black" />
                </div>
                <div className="flex-1 w-full flex flex-col min-w-0">
                  <h3 className="text-2xl font-black group-hover:text-[#0055FF] transition-colors text-center xl:text-left">{tutor.name}</h3>
                  <div className="text-[#FFEF00] bg-black px-2 py-1 inline-block text-xs font-black mb-4 uppercase tracking-tighter self-center xl:self-start">{tutor.role}</div>
                  <div className="font-bold text-black/70 leading-relaxed whitespace-pre-line max-h-[250px] overflow-y-auto pr-4" style={{ scrollbarWidth: 'thin' }}>
                    {tutor.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Activity Review */}
      <section id="activities" className="py-28 sm:py-40 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 sm:px-16">
          <div className="flex justify-between items-end mb-12">
            <SectionTitle subtitle="精彩瞬間與技術分享">活動回顧</SectionTitle>
          </div>

          {isAdmin && showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 bg-white border-4 border-black p-8 rounded-3xl shadow-xl"
            >
              <form onSubmit={handleAddActivity} className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="標題"
                    required
                    className="w-full border-2 border-black p-3 rounded-xl font-bold"
                    value={newActivity.title}
                    onChange={e => setNewActivity({...newActivity, title: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="日期 (如: 2025年9月10日)"
                    required
                    className="w-full border-2 border-black p-3 rounded-xl font-bold"
                    value={newActivity.date}
                    onChange={e => setNewActivity({...newActivity, date: e.target.value})}
                  />
                  <FileUploader
                    label="活動圖片"
                    currentImage={newActivity.img}
                    onUpload={(url) => setNewActivity({...newActivity, img: url})}
                  />
                  <input
                    type="url"
                    placeholder="或輸入 URL"
                    required
                    className="w-full border-2 border-black p-3 rounded-xl font-bold mt-2"
                    value={newActivity.img}
                    onChange={e => setNewActivity({...newActivity, img: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="標籤 (逗號分隔)"
                    required
                    className="w-full border-2 border-black p-3 rounded-xl font-bold"
                    value={newActivity.tags}
                    onChange={e => setNewActivity({...newActivity, tags: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <textarea
                    placeholder="內容描述"
                    required
                    rows={5}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold"
                    value={newActivity.content}
                    onChange={e => setNewActivity({...newActivity, content: e.target.value})}
                  />
                  <button type="submit" className="w-full bg-black text-[#FFEF00] py-3 rounded-full font-black uppercase">發佈活動</button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {activities.map((activity) => (
              <motion.article
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="break-inside-avoid bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,85,255,1)] transition-all duration-300 group rounded-3xl overflow-hidden flex flex-col mb-8"
              >
                <div className="relative overflow-hidden bg-gray-200 border-b-4 border-black">
                  <img
                    src={getActivityImageUrl(activity)}
                    alt={activity.title}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/activity-fallback/900/600'; }}
                  />
                </div>

                <div className="p-6 flex flex-col gap-4">
                  <p className="text-xs font-black uppercase tracking-wider text-black/60">{activity.date || '未設定日期'}</p>
                  <h3 className="text-xl font-black leading-tight">{activity.title}</h3>
                  <p className="font-bold text-black/70 leading-relaxed whitespace-pre-line">{activity.content}</p>

                  {Array.isArray(activity.tags) && activity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {activity.tags.slice(0, 5).map((tag: string, tagIndex: number) => (
                        <span
                          key={`${activity.id}-${tag}-${tagIndex}`}
                          className="bg-[#FFEF00] border-2 border-black px-3 py-1 rounded-full text-xs font-black"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>

          {hasMoreActivities && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={handleLoadMoreActivities}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-3 bg-black text-[#FFEF00] px-8 py-4 font-black uppercase rounded-full border-4 border-black hover:scale-105 transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    正在載入中...
                  </>
                ) : (
                  '瀏覽更多活動回顧'
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Partners */}
      <section className="py-28 sm:py-40 bg-[#FFEF00] border-t-8 border-black">
        <div className="max-w-7xl mx-auto px-8 sm:px-16 text-center">
          <h3 className="text-2xl font-black uppercase mb-12">{siteSettings.partnersTitle || "曾合作機構"}</h3>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 hover:opacity-100 transition-all">
            {Array.from({ length: 6 }).map((_, i) => (
              <img 
                key={i} 
                src={`https://picsum.photos/seed/logo-${i}/120/60`} 
                alt="Partner" 
                className="h-12 object-contain"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-black text-[#FFEF00] py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black mb-6 tracking-tighter">{siteSettings.siteName}</h2>
            <p className="font-bold text-white/60 mb-8">
              引領 AI 視覺藝術新時代。<br />
              專業、創新、靈活。
            </p>
            <div className="flex gap-4">
              {siteSettings.facebookUrl && (
                <a 
                  href={siteSettings.facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 border-2 border-[#FFEF00] rounded-full flex items-center justify-center hover:bg-[#FFEF00] hover:text-black transition-colors cursor-pointer"
                >
                  <Film size={20} />
                </a>
              )}
              {siteSettings.instagramUrl && (
                <a 
                  href={siteSettings.instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 border-2 border-[#FFEF00] rounded-full flex items-center justify-center hover:bg-[#FFEF00] hover:text-black transition-colors cursor-pointer"
                >
                  <Monitor size={20} />
                </a>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xl font-black uppercase mb-6">聯絡我們</h4>
            <div className="flex items-center gap-4">
              <Phone className="text-white" />
              <span className="font-bold">{siteSettings.contactPhone}</span>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="text-white" />
              <span className="font-bold">{siteSettings.contactEmail}</span>
            </div>
            <div className="flex items-center gap-4">
              <MessageSquare className="text-white" />
              <span className="font-bold">WhatsApp 查詢</span>
            </div>
            {siteSettings.address && (
              <div className="flex items-start gap-4">
                <LayoutGrid className="text-white mt-1 shrink-0" size={20} />
                <span className="font-bold">{siteSettings.address}</span>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xl font-black uppercase mb-6">訂閱最新資訊</h4>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email" 
                className="bg-white/10 border-2 border-white/20 p-3 flex-1 font-bold focus:outline-none focus:border-[#FFEF00] rounded-full px-6"
              />
              <button className="bg-[#FFEF00] text-black px-6 font-black uppercase rounded-full">GO</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t-2 border-white/10 text-center text-sm font-bold text-white/40">
          &copy; 2026 {siteSettings.siteName} 銅馬動畫及視覺特效教育. ALL RIGHTS RESERVED.
        </div>
      </footer>

      {/* Floating Action Button */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="hidden md:flex fixed bottom-8 right-8 bg-black text-[#FFEF00] w-16 h-16 rounded-full items-center justify-center shadow-2xl z-50 border-4 border-white"
      >
        <MousePointer2 />
      </motion.button>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FFEF00;
          border-radius: 10px;
        }
      `}</style>
          </motion.div>
        ) : (
          <motion.div
            key="admin-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-screen bg-white flex flex-col md:flex-row relative z-10 overflow-hidden"
          >
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-black text-white p-8 flex flex-col gap-2 shrink-0 md:h-screen md:overflow-y-auto md:sticky md:top-0">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-[#FFEF00]">後台管理</h2>
                <button onClick={() => setShowAdminPanel(false)} className="md:hidden text-white flex items-center gap-1 text-xs font-bold">
                  <ArrowLeft size={16} /> 返回
                </button>
              </div>
              
              {[
                { id: 'overview', label: '總覽', icon: Monitor },
                { id: 'landing-page', label: '首頁管理', icon: LayoutGrid },
                { id: 'settings', label: '基本設定', icon: Settings },
                { id: 'briefing-leads', label: '簡介會留名', icon: FileText },
                { id: 'tutors', label: '導師管理', icon: Users },
                { id: 'student-works', label: '學生作品', icon: Film },
                { id: 'testimonials', label: '學生見證', icon: MessageSquare },
                { id: 'activities', label: '活動管理', icon: Film },
                { id: 'masks', label: '遮罩管理', icon: Box },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAdminActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                    adminActiveTab === tab.id 
                    ? 'bg-[#FFEF00] text-black scale-105 shadow-[4px_4px_0px_rgba(255,255,255,0.3)]' 
                    : 'hover:bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <tab.icon size={20} />
                  {tab.label}
                </button>
              ))}
              
              {/* Course Management Submenu */}
              <button
                onClick={() => setCourseMenuExpanded(!courseMenuExpanded)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  courseMenuExpanded
                  ? 'bg-white/10 text-white'
                  : 'hover:bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                <GraduationCap size={20} />
                <span className="flex-1 text-left">課程管理</span>
                <ChevronDown size={16} className={`transition-transform ${courseMenuExpanded ? 'rotate-180' : ''}`} />
              </button>
              
              {courseMenuExpanded && (
                <div className="space-y-1 pl-4 border-l-2 border-white/20">
                  <button
                    onClick={() => { setAdminActiveTab('all-courses'); setCourseMenuExpanded(true); }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg font-bold transition-all w-full text-sm ${
                      adminActiveTab === 'all-courses'
                      ? 'bg-[#FFEF00] text-black'
                      : 'hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    📋 課程列表
                  </button>
                  <button
                    onClick={() => { setAdminActiveTab('regular-courses'); setCourseMenuExpanded(true); }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg font-bold transition-all w-full text-sm ${
                      adminActiveTab === 'regular-courses'
                      ? 'bg-[#FFEF00] text-black'
                      : 'hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    🎓 常規課程
                  </button>
                  <button
                    onClick={() => { setAdminActiveTab('personal-courses'); setCourseMenuExpanded(true); }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg font-bold transition-all w-full text-sm ${
                      adminActiveTab === 'personal-courses'
                      ? 'bg-[#FFEF00] text-black'
                      : 'hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    🧩 個人課程
                  </button>
                  <button
                    onClick={() => { setAdminActiveTab('group-courses'); setCourseMenuExpanded(true); }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg font-bold transition-all w-full text-sm ${
                      adminActiveTab === 'group-courses'
                      ? 'bg-[#FFEF00] text-black'
                      : 'hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    👥 團體課程
                  </button>
                  <button
                    onClick={() => { setAdminActiveTab('units'); setCourseMenuExpanded(true); setAdminUnitNames([...unitNames]); }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg font-bold transition-all w-full text-sm ${
                      adminActiveTab === 'units'
                      ? 'bg-[#FFEF00] text-black'
                      : 'hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    📚 單元管理
                  </button>
                </div>
              )}
              
              <div className="mt-auto pt-8 border-t border-white/10 space-y-2">
                <button 
                  onClick={() => setShowAdminPanel(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[#FFEF00] hover:bg-white/10 w-full transition-all"
                >
                  <ArrowLeft size={20} /> 返回前台
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 hover:bg-red-400/10 w-full transition-all"
                >
                  <LogOut size={20} /> 登出系統
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-gray-50">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={adminActiveTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {adminActiveTab === 'overview' && (
                      <div className="space-y-8">
                        <div className="bg-black text-[#FFEF00] p-8 rounded-[2rem] shadow-[8px_8px_0px_rgba(0,85,255,1)] relative overflow-hidden">
                          <div className="relative z-10">
                            <h3 className="text-4xl font-black mb-2 uppercase">儀表板總覽</h3>
                            <p className="font-bold opacity-80">歡迎回來，管理員。目前系統運行正常。</p>
                          </div>
                          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0055FF] rounded-full -translate-y-1/2 translate-x-1/3 opacity-20 blur-3xl" />
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {[
                            { label: '單元總數', value: unitNames.length, icon: BookOpen, color: 'bg-blue-500', tab: 'units' },
                            { label: '課程數量', value: courses.length, icon: GraduationCap, color: 'bg-green-500', tab: 'courses' },
                            { label: '導師人數', value: tutors.length, icon: Users, color: 'bg-purple-500', tab: 'tutors' },
                            { label: '活動記錄', value: activities.length, icon: Film, color: 'bg-orange-500', tab: 'activities' },
                            { label: '留名數量', value: briefingLeads.length, icon: FileText, color: 'bg-pink-500', tab: 'briefing-leads' },
                          ].map((stat, i) => (
                            <button 
                              key={i} 
                              onClick={() => setAdminActiveTab(stat.tab)}
                              className="bg-white border-4 border-black p-6 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform text-left"
                            >
                              <div className={`w-10 h-10 ${stat.color} text-white rounded-lg flex items-center justify-center mb-4`}>
                                <stat.icon size={20} />
                              </div>
                              <p className="text-xs font-black uppercase text-black/50">{stat.label}</p>
                              <p className="text-3xl font-black">{stat.value}</p>
                            </button>
                          ))}
                        </div>

                        <div className="bg-white border-4 border-black p-8 rounded-[2rem] shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-xl font-black uppercase flex items-center gap-2">
                              <FileText size={20} /> 最新留名資料
                            </h4>
                            <button
                              onClick={() => setAdminActiveTab('briefing-leads')}
                              className="text-xs font-black uppercase bg-black text-[#FFEF00] px-3 py-2 rounded-full"
                            >
                              查看全部
                            </button>
                          </div>
                          {briefingLeads.length === 0 ? (
                            <p className="text-sm font-bold text-black/60">暫時未有留名資料</p>
                          ) : (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                              {briefingLeads.slice(0, 5).map((lead) => (
                                <div key={lead.id} className="border-2 border-black/10 rounded-xl p-3 bg-gray-50">
                                  <p className="font-black text-sm break-words [overflow-wrap:anywhere]">{lead.email}</p>
                                  <p className="font-bold text-sm text-black/70">{lead.phone}</p>
                                  <p className="text-xs font-bold text-black/50 mt-1">{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '-'}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="bg-white border-4 border-black p-8 rounded-[2rem] shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                            <h4 className="text-xl font-black mb-6 uppercase flex items-center gap-2">
                              <MousePointer2 size={20} /> 快速操作
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => setAdminActiveTab('activities')}
                                className="flex flex-col items-center justify-center p-4 bg-gray-50 border-2 border-black rounded-xl hover:bg-[#FFEF00]/10 transition-colors gap-2"
                              >
                                <Plus size={24} />
                                <span className="font-bold text-sm">新增活動</span>
                              </button>
                              <button 
                                onClick={() => setAdminActiveTab('tutors')}
                                className="flex flex-col items-center justify-center p-4 bg-gray-50 border-2 border-black rounded-xl hover:bg-[#FFEF00]/10 transition-colors gap-2"
                              >
                                <Users size={24} />
                                <span className="font-bold text-sm">管理導師</span>
                              </button>
                              <button 
                                onClick={() => setAdminActiveTab('settings')}
                                className="flex flex-col items-center justify-center p-4 bg-gray-50 border-2 border-black rounded-xl hover:bg-[#FFEF00]/10 transition-colors gap-2"
                              >
                                <Settings size={24} />
                                <span className="font-bold text-sm">網站設定</span>
                              </button>
                              <button 
                                onClick={() => setShowAdminPanel(false)}
                                className="flex flex-col items-center justify-center p-4 bg-gray-50 border-2 border-black rounded-xl hover:bg-[#FFEF00]/10 transition-colors gap-2"
                              >
                                <Monitor size={24} />
                                <span className="font-bold text-sm">查看前台</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {adminActiveTab === 'briefing-leads' && (
                      <section>
                        <h3 className="text-3xl font-black mb-8 flex items-center gap-3">
                          <FileText size={32} /> 簡介會留名
                        </h3>

                        <div className="bg-white border-4 border-black p-6 md:p-8 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                          {briefingLeads.length === 0 ? (
                            <div className="text-center py-14 bg-black/5 rounded-3xl border-4 border-dashed border-black/10">
                              <FileText size={48} className="mx-auto mb-4 opacity-20" />
                              <p className="font-black text-black/60">暫時未有留名資料</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[680px] border-collapse">
                                <thead>
                                  <tr className="border-b-4 border-black/15">
                                    <th className="text-left py-3 px-2 text-xs font-black uppercase">時間</th>
                                    <th className="text-left py-3 px-2 text-xs font-black uppercase">Email</th>
                                    <th className="text-left py-3 px-2 text-xs font-black uppercase">電話</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {briefingLeads.map((lead) => (
                                    <tr key={lead.id} className="border-b border-black/10">
                                      <td className="py-3 px-2 text-sm font-bold text-black/60 whitespace-nowrap">{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '-'}</td>
                                      <td className="py-3 px-2 text-sm font-black break-words [overflow-wrap:anywhere]">{lead.email}</td>
                                      <td className="py-3 px-2 text-sm font-bold">{lead.phone}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {adminActiveTab === 'all-courses' && (
                      <div className="space-y-6">
                        {/* Page header + Add button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <h3 className="text-3xl font-black flex items-center gap-3">
                            📋 課程列表
                          </h3>
                          <button
                            onClick={() => { setNewCourse({ name: '', type: 'Diploma', categories: ['regular'], mandatory: [], elective: [], mandatoryGroups: [], minUnits: 16, allowExtra: true, title: '', subtitle: '', desc: '', startDate: '', classTime: '', tuition: '', mask: 'mask-book', img: '' }); setShowAddCombinationModal(true); }}
                            className="bg-black text-[#FFEF00] px-6 py-3 rounded-full font-black flex items-center gap-2 hover:scale-105 transition-transform text-sm"
                          >
                            <Plus size={20} /> 新增課程
                          </button>
                        </div>

                        {/* Unified courses table */}
                        <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                          <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-black text-[#FFEF00]">
                                  <th className="px-4 py-3 text-left font-black text-xs opacity-50">#</th>
                                  <SortTh col="name">名稱</SortTh>
                                  <SortTh col="cat">類型</SortTh>
                                  <SortTh col="type">學制</SortTh>
                                  <th className="px-4 py-3 text-left font-black">操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Regular and personal courses */}
                                {sortedCourses(courses).map((c, idx) => (
                                  <tr key={c.id} className={`transition-colors hover:bg-[#FFEF00]/10 ${idx % 2 === 0 ? 'bg-white' : 'bg-black/[0.03]'}`}>
                                    <td className="px-4 py-3 font-mono text-xs text-black/30">{idx + 1}</td>
                                    <td className="px-4 py-3 font-bold">{c.name}</td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                        hasCategory(c, 'personal')
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-green-100 text-green-700'
                                      }`}>
                                        {(c.categories || [c.category || 'regular']).map((cat: string) => cat === 'personal' ? '🧩 個人' : cat === 'group' ? '👥 團體' : '🎓 常規').join(' + ')}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-black/60 font-bold">{c.type || '—'}</td>
                                    <td className="px-4 py-3">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => { setEditingCourse({...c, categories: c.categories || [c.category || 'regular']}); setShowEditCombinationModal(true); }}
                                          className="text-blue-600 p-1 hover:bg-blue-50 rounded-lg transition-colors"
                                        ><Pencil size={16} /></button>
                                        <button
                                          onClick={() => handleDeleteCourse(c.id.toString())}
                                          className="text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors"
                                        ><Trash2 size={16} /></button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {/* Group courses */}
                                {groupCourses.map((gc, idx) => (
                                  <tr key={gc.id} className={`transition-colors hover:bg-[#FFEF00]/10 ${(courses.length + idx) % 2 === 0 ? 'bg-white' : 'bg-black/[0.03]'}`}>
                                    <td className="px-4 py-3 font-mono text-xs text-black/30">{courses.length + idx + 1}</td>
                                    <td className="px-4 py-3 font-bold">{gc.title}</td>
                                    <td className="px-4 py-3">
                                      <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-yellow-100 text-yellow-700">
                                        👥 團體
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-black/60 font-bold">—</td>
                                    <td className="px-4 py-3">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => { setEditingCourse({...gc, categories: ['group'], type: ''}); setShowEditCombinationModal(true); }}
                                          className="text-blue-600 p-1 hover:bg-blue-50 rounded-lg transition-colors"
                                        ><Pencil size={16} /></button>
                                        <button
                                          onClick={() => showConfirm('確定要刪除此課程嗎?', '刪除後將無法復原。', async () => {
                                            const result = await apiDeleteDoc('groupCourses', gc.id);
                                            if (result.status === 200) {
                                              showToast('課程已刪除', 'success');
                                              setGroupCourses(groupCourses.filter(x => x.id !== gc.id));
                                            } else {
                                              showToast('刪除失敗', 'error');
                                            }
                                          })}
                                          className="text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors"
                                        ><Trash2 size={16} /></button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {(courses.length === 0 && groupCourses.length === 0) && (
                              <div className="p-8 text-center text-black/50 font-bold">尚無課程</div>
                            )}
                        </div>
                      </div>
                    )}

                    {adminActiveTab === 'regular-courses' && (
                      <div className="space-y-6">
                        {/* Page header + Add button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <h3 className="text-3xl font-black flex items-center gap-3">
                            <GraduationCap size={32} /> 常規課程
                          </h3>
                          <button
                            onClick={() => { setNewCourse({ name: '', type: 'Diploma', categories: ['regular'], mandatory: [], elective: [], mandatoryGroups: [], minUnits: 16, allowExtra: true, title: '', subtitle: '', desc: '', startDate: '', classTime: '', tuition: '', mask: 'mask-book', img: '' }); setShowAddCombinationModal(true); }}
                            className="bg-black text-[#FFEF00] px-6 py-3 rounded-full font-black flex items-center gap-2 hover:scale-105 transition-transform text-sm"
                          >
                            <Plus size={20} /> 新增常規課程
                          </button>
                        </div>

                        {/* Unified course table */}
                        <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                          <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-black text-[#FFEF00]">
                                  <th className="px-4 py-3 text-left font-black text-xs opacity-50">#</th>
                                  <SortTh col="name">名稱</SortTh>
                                  <SortTh col="cat">類別</SortTh>
                                  <SortTh col="type">學制</SortTh>
                                  <th className="px-4 py-3 text-left font-black">操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedCourses(courses.filter(c => hasCategory(c, 'regular') || (!c.categories && !c.category))).map((c, idx) => (
                                  <tr key={c.id} className={`transition-colors hover:bg-[#FFEF00]/10 ${idx % 2 === 0 ? 'bg-white' : 'bg-black/[0.03]'}`}>
                                    <td className="px-4 py-3 font-mono text-xs text-black/30">{idx + 1}</td>
                                    <td className="px-4 py-3 font-bold">{c.name}</td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                        hasCategory(c, 'personal')
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-green-100 text-green-700'
                                      }`}>
                                        {(c.categories || [c.category || 'regular']).map((cat: string) => cat === 'personal' ? '🧩 個人' : cat === 'group' ? '👥 團體' : '🎓 常規').join(' + ')}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-black/60 font-bold">{c.type || '—'}</td>
                                    <td className="px-4 py-3">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => { setEditingCourse({...c, categories: c.categories || [c.category || 'regular']}); setShowEditCombinationModal(true); }}
                                          className="text-blue-600 p-1 hover:bg-blue-50 rounded-lg transition-colors"
                                        ><Pencil size={16} /></button>
                                        <button
                                          onClick={() => handleDeleteCourse(c.id.toString())}
                                          className="text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors"
                                        ><Trash2 size={16} /></button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                          {(courses.filter(c => hasCategory(c, 'regular') || (!c.categories && !c.category)).length === 0) && (
                            <tr>
                              <td colSpan={5} className="px-4 py-12 text-center text-black/30 font-black">
                                尚無常規課程
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                    {adminActiveTab === 'personal-courses' && (
                      <div className="space-y-6">
                        {/* Page header + Add button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <h3 className="text-3xl font-black flex items-center gap-3">
                            🧩 個人課程
                          </h3>
                          <button
                            onClick={() => { setNewCourse({ name: '', type: 'Diploma', categories: ['personal'], mandatory: [], elective: [], mandatoryGroups: [], minUnits: 4, allowExtra: true, title: '', subtitle: '', desc: '', startDate: '', classTime: '', tuition: '', mask: 'mask-cloud', img: '' }); setShowAddCombinationModal(true); }}
                            className="bg-black text-[#FFEF00] px-6 py-3 rounded-full font-black flex items-center gap-2 hover:scale-105 transition-transform text-sm"
                          >
                            <Plus size={20} /> 新增個人課程
                          </button>
                        </div>

                        {/* Section Settings Block */}
                        <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                          <h4 className="text-sm font-black uppercase tracking-widest mb-4 text-black/50">區塊設定</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-black uppercase">標題</label>
                              <input type="text" className="w-full border-4 border-black p-3 rounded-xl font-bold"
                                value={siteSettings.personalCourseTitle}
                                onChange={e => setSiteSettings({...siteSettings, personalCourseTitle: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-black uppercase">副標題</label>
                              <input type="text" className="w-full border-4 border-black p-3 rounded-xl font-bold"
                                value={siteSettings.personalCourseSubtitle}
                                onChange={e => setSiteSettings({...siteSettings, personalCourseSubtitle: e.target.value})} />
                            </div>

                          </div>
                          <button
                            onClick={async () => {
                              setIsSavingSettings(true);
                              try {
                                await apiSetDoc('settings', 'global', siteSettings);
                                showToast('設定已儲存！');
                              } catch (error) {
                                handleFirestoreError(error, OperationType.WRITE, 'settings/global');
                              } finally {
                                setIsSavingSettings(false);
                              }
                            }}
                            disabled={isSavingSettings}
                            className="mt-4 w-full bg-black text-[#FFEF00] py-3 rounded-full font-black flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
                          >
                            {isSavingSettings ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            儲存區塊設定
                          </button>
                        </div>

                        {/* Unified course table */}
                        <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-black text-[#FFEF00]">
                                <th className="px-4 py-3 text-left font-black text-xs opacity-50">#</th>
                                <SortTh col="name">名稱</SortTh>
                                <SortTh col="cat">類別</SortTh>
                                <SortTh col="type">學制</SortTh>
                                <th className="px-4 py-3 text-left font-black">操作</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedCourses(courses.filter(c => hasCategory(c, 'personal'))).map((c, idx) => (
                                <tr key={c.id} className={`transition-colors hover:bg-[#FFEF00]/10 ${idx % 2 === 0 ? 'bg-white' : 'bg-black/[0.03]'}`}>
                                  <td className="px-4 py-3 font-mono text-xs text-black/30">{idx + 1}</td>
                                  <td className="px-4 py-3 font-bold">{c.name}</td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700">
                                      🧩 個人
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-black/60 font-bold">{c.type || '—'}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => { setEditingCourse({...c, categories: c.categories || [c.category || 'regular']}); setShowEditCombinationModal(true); }}
                                        className="text-blue-600 p-1 hover:bg-blue-50 rounded-lg transition-colors"
                                      ><Pencil size={16} /></button>
                                      <button
                                        onClick={() => handleDeleteCourse(c.id.toString())}
                                        className="text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors"
                                      ><Trash2 size={16} /></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {courses.filter(c => hasCategory(c, 'personal')).length === 0 && (
                                <tr>
                                  <td colSpan={5} className="px-4 py-12 text-center text-black/30 font-black">
                                    尚無個人課程
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                      </div>
                    )}

                    {adminActiveTab === 'group-courses' && (
                      <div className="space-y-6">
                        {/* Page header + Add button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <h3 className="text-3xl font-black flex items-center gap-3">
                            👥 團體課程
                          </h3>
                          <button
                            onClick={() => { setNewCourse({ name: '', type: 'Diploma', categories: ['group'], mandatory: [], elective: [], mandatoryGroups: [], minUnits: 0, allowExtra: false, title: '', subtitle: '', desc: '', startDate: '', classTime: '', tuition: '', mask: 'mask-cloud', img: '' }); setShowAddCombinationModal(true); }}
                            className="bg-black text-[#FFEF00] px-6 py-3 rounded-full font-black flex items-center gap-2 hover:scale-105 transition-transform text-sm"
                          >
                            <Plus size={20} /> 新增團體課程
                          </button>
                        </div>

                        {/* Unified course table */}
                        <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-black text-[#FFEF00]">
                                <th className="px-4 py-3 text-left font-black text-xs opacity-50">#</th>
                                <SortTh col="name">名稱</SortTh>
                                <SortTh col="cat">類別</SortTh>
                                <th className="px-4 py-3 text-left font-black">—</th>
                                <th className="px-4 py-3 text-left font-black">操作</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedCourses(groupCourses.map(gc => ({...gc, name: gc.title || gc.name}))).map((gc, idx) => (
                                <tr key={`gc-${gc.id}`} className={`transition-colors hover:bg-[#FFEF00]/10 ${idx % 2 === 0 ? 'bg-white' : 'bg-black/[0.03]'}`}>
                                  <td className="px-4 py-3 font-mono text-xs text-black/30">{idx + 1}</td>
                                  <td className="px-4 py-3 font-bold">{gc.title}</td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-yellow-100 text-yellow-700">
                                      👥 團體
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-black/60 font-bold">—</td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => { setEditingCourse({ id: gc.id, categories: ['group'], title: gc.title, desc: gc.desc, mask: gc.mask || 'mask-cloud', img: gc.img || '', name: gc.title, type: '', mandatory: [], minUnits: 0, allowExtra: false, subtitle: '', startDate: '', classTime: '', tuition: '' }); setShowEditCombinationModal(true); }}
                                        className="text-blue-600 p-1 hover:bg-blue-50 rounded-lg transition-colors"
                                      >
                                        <Pencil size={16} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          showConfirm("刪除團體課程", `確定要刪除「${gc.title}」嗎？`, async () => {
                                            try {
                                              await apiDeleteDoc('groupCourses', gc.id.toString());
                                              setGroupCourses(prev => prev.filter(g => g.id !== gc.id));
                                              showToast("已刪除團體課程");
                                            } catch (error) {
                                              handleFirestoreError(error, OperationType.DELETE, `groupCourses/${gc.id}`);
                                            }
                                          });
                                        }}
                                        className="text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {groupCourses.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="px-4 py-12 text-center text-black/30 font-black">
                                    尚無團體課程
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {adminActiveTab === 'units' && false && (<div />)}

                    {adminActiveTab === 'landing-page' && (
                      <section className="space-y-12">
                        <div>
                          <h3 className="text-3xl font-black mb-8 flex items-center gap-3">
                            <LayoutGrid size={32} /> 首頁區塊管理
                          </h3>
                          <div className="bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-4">
                            {/* Hero 標題 */}
                            <div className="border-2 border-black rounded-2xl p-4 bg-white/70 space-y-3">
                              <p className="text-xs font-black uppercase">Hero 標題</p>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase">內容</label>
                                  <textarea 
                                    className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                    rows={4}
                                    value={siteSettings.heroTitle.replace(/<br \/>/g, '\n')}
                                    onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value.replace(/\n/g, '<br />')})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase">Google Fonts</label>
                                    <select
                                      className="w-full border-4 border-black p-3 rounded-xl font-bold text-sm"
                                      value={siteSettings.heroTitleFont || 'Noto Sans TC'}
                                      onChange={e => setSiteSettings({...siteSettings, heroTitleFont: e.target.value})}
                                    >
                                      {HERO_FONT_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <RGBColorTool
                                    label="Hero 標題顏色"
                                    value={siteSettings.heroTitleColor || '#000000'}
                                    onChange={color => setSiteSettings({...siteSettings, heroTitleColor: color})}
                                  />
                                  <RGBColorTool
                                    label="主視覺大字顏色 (白色字)"
                                    value={siteSettings.heroMainWordColor || '#FFFFFF'}
                                    onChange={color => setSiteSettings({...siteSettings, heroMainWordColor: color})}
                                  />
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase">尺寸</label>
                                    <p className="text-[10px] font-bold text-black/70">會同步影響前台白色主視覺大字</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase">手機 (px)</label>
                                        <input type="number" min={16} max={180} className="w-full border-2 border-black p-2 rounded-lg text-xs font-bold"
                                          value={siteSettings.heroTitleSizeMobile || 48}
                                          onChange={e => setSiteSettings({...siteSettings, heroTitleSizeMobile: Number(e.target.value) || 48})} />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase">桌機 (px)</label>
                                        <input type="number" min={20} max={220} className="w-full border-2 border-black p-2 rounded-lg text-xs font-bold"
                                          value={siteSettings.heroTitleSizeDesktop || 110}
                                          onChange={e => setSiteSettings({...siteSettings, heroTitleSizeDesktop: Number(e.target.value) || 110})} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Tagline */}
                            <div className="border-2 border-black rounded-2xl p-4 bg-white/70 space-y-3">
                              <p className="text-xs font-black uppercase">Tagline</p>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase">內容</label>
                                  <textarea 
                                    className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                    rows={4}
                                    value={siteSettings.heroTagline}
                                    onChange={e => setSiteSettings({...siteSettings, heroTagline: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase">Google Fonts</label>
                                    <select
                                      className="w-full border-4 border-black p-3 rounded-xl font-bold text-sm"
                                      value={siteSettings.heroTaglineFont || 'Montserrat'}
                                      onChange={e => setSiteSettings({...siteSettings, heroTaglineFont: e.target.value})}
                                    >
                                      {HERO_FONT_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <RGBColorTool
                                    label="Tagline 顏色"
                                    value={siteSettings.heroTaglineColor || '#1A1A1A'}
                                    onChange={color => setSiteSettings({...siteSettings, heroTaglineColor: color})}
                                  />
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase">尺寸</label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase">手機 (px)</label>
                                        <input type="number" min={12} max={120} className="w-full border-2 border-black p-2 rounded-lg text-xs font-bold"
                                          value={siteSettings.heroTaglineSizeMobile || 20}
                                          onChange={e => setSiteSettings({...siteSettings, heroTaglineSizeMobile: Number(e.target.value) || 20})} />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase">桌機 (px)</label>
                                        <input type="number" min={14} max={160} className="w-full border-2 border-black p-2 rounded-lg text-xs font-bold"
                                          value={siteSettings.heroTaglineSizeDesktop || 40}
                                          onChange={e => setSiteSettings({...siteSettings, heroTaglineSizeDesktop: Number(e.target.value) || 40})} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Hero 副標題 */}
                            <div className="border-2 border-black rounded-2xl p-4 bg-white/70 space-y-3">
                              <p className="text-xs font-black uppercase">Hero 副標題</p>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase">內容</label>
                                  <textarea 
                                    className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                    rows={4}
                                    value={siteSettings.heroSubtitle}
                                    onChange={e => setSiteSettings({...siteSettings, heroSubtitle: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase">Google Fonts</label>
                                    <select
                                      className="w-full border-4 border-black p-3 rounded-xl font-bold text-sm"
                                      value={siteSettings.heroSubtitleFont || 'Noto Sans TC'}
                                      onChange={e => setSiteSettings({...siteSettings, heroSubtitleFont: e.target.value})}
                                    >
                                      {HERO_FONT_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <RGBColorTool
                                    label="副標題顏色"
                                    value={siteSettings.heroSubtitleColor || '#000000'}
                                    onChange={color => setSiteSettings({...siteSettings, heroSubtitleColor: color})}
                                  />
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase">尺寸</label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase">手機 (px)</label>
                                        <input type="number" min={12} max={90} className="w-full border-2 border-black p-2 rounded-lg text-xs font-bold"
                                          value={siteSettings.heroSubtitleSizeMobile || 20}
                                          onChange={e => setSiteSettings({...siteSettings, heroSubtitleSizeMobile: Number(e.target.value) || 20})} />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase">桌機 (px)</label>
                                        <input type="number" min={14} max={120} className="w-full border-2 border-black p-2 rounded-lg text-xs font-bold"
                                          value={siteSettings.heroSubtitleSizeDesktop || 32}
                                          onChange={e => setSiteSettings({...siteSettings, heroSubtitleSizeDesktop: Number(e.target.value) || 32})} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between gap-4">
                                <label className="text-xs font-black uppercase block">Hero 圖片（不限張數，可自訂排序/標題/日期）</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateHeroGallery(prev => ([
                                      ...prev,
                                      {
                                        id: Date.now().toString(),
                                        url: '',
                                        title: '',
                                        date: '',
                                        order: prev.length + 1
                                      }
                                    ]));
                                  }}
                                  className="bg-black text-[#FFEF00] px-4 py-2 rounded-full font-black text-xs uppercase flex items-center gap-2"
                                >
                                  <Plus size={14} /> 新增圖片
                                </button>
                              </div>

                              <div className="space-y-4">
                                {sortedHeroGalleryItems.map((item, index) => {
                                  const isExpanded = expandedHeroItems.has(item.id);
                                  return (
                                    <div key={item.id} className="border-2 border-black rounded-2xl bg-white/70 overflow-hidden">
                                      <button
                                        type="button"
                                        onClick={() => toggleHeroItem(item.id)}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          {item.url && (
                                            <img src={item.url} alt="" className="w-10 h-10 object-cover rounded-lg border-2 border-black" />
                                          )}
                                          <p className="text-xs font-black uppercase">
                                            圖片 {index + 1}{item.title ? ` — ${item.title}` : ''}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); updateHeroGallery(prev => prev.filter(g => g.id !== item.id)); }}
                                            className="text-red-600 hover:text-red-800 font-black text-xs flex items-center gap-1"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                          <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                      </button>

                                      {isExpanded && (
                                        <div className="px-4 pb-4 space-y-3 border-t-2 border-black/10 pt-3">
                                          <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <FileUploader
                                                label={`上傳圖片 ${index + 1}`}
                                                currentImage={item.url}
                                                onUpload={(url) => {
                                                  updateHeroGallery(prev => prev.map(g => g.id === item.id ? { ...g, url } : g));
                                                }}
                                              />
                                              <input
                                                type="text"
                                                placeholder="或輸入圖片 URL"
                                                className="w-full border-2 border-black p-2 rounded-lg text-xs font-bold"
                                                value={item.url}
                                                onChange={e => updateHeroGallery(prev => prev.map(g => g.id === item.id ? { ...g, url: e.target.value } : g))}
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <input
                                                type="text"
                                                placeholder="圖片標題"
                                                className="w-full border-2 border-black p-2 rounded-lg text-xs font-bold"
                                                value={item.title}
                                                onChange={e => updateHeroGallery(prev => prev.map(g => g.id === item.id ? { ...g, title: e.target.value } : g))}
                                              />
                                              <input
                                                type="date"
                                                className="w-full border-2 border-black p-2 rounded-lg text-xs font-bold"
                                                value={item.date}
                                                onChange={e => updateHeroGallery(prev => prev.map(g => g.id === item.id ? { ...g, date: e.target.value } : g))}
                                              />
                                              <input
                                                type="number"
                                                min={1}
                                                placeholder="排序（數字越小越前）"
                                                className="w-full border-2 border-black p-2 rounded-lg text-xs font-bold"
                                                value={item.order}
                                                onChange={e => updateHeroGallery(prev => prev.map(g => g.id === item.id ? { ...g, order: Number(e.target.value) || 1 } : g))}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">各區塊標題與內容</h3>
                          <div className="grid md:grid-cols-2 gap-6 bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">課程介紹 - 標題</label>
                              <input 
                                type="text" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.coursesIntroTitle}
                                onChange={e => setSiteSettings({...siteSettings, coursesIntroTitle: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">課程介紹 - 副標題</label>
                              <input 
                                type="text" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.coursesIntroSubtitle}
                                onChange={e => setSiteSettings({...siteSettings, coursesIntroSubtitle: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">團體課程 - 標題</label>
                              <input 
                                type="text" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.groupCourseTitle}
                                onChange={e => setSiteSettings({...siteSettings, groupCourseTitle: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">團體課程 - 副標題</label>
                              <input 
                                type="text" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.groupCourseSubtitle}
                                onChange={e => setSiteSettings({...siteSettings, groupCourseSubtitle: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">學生作品 - 標題</label>
                              <input type="text" className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.studentWorksTitle || ''}
                                onChange={e => setSiteSettings({...siteSettings, studentWorksTitle: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">學生作品 - 副標題</label>
                              <input type="text" className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.studentWorksSubtitle || ''}
                                onChange={e => setSiteSettings({...siteSettings, studentWorksSubtitle: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">學生作品 - 內容簡介</label>
                              <input type="text" className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.studentWorksContent || ''}
                                onChange={e => setSiteSettings({...siteSettings, studentWorksContent: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">學生作品 - YouTube 連結</label>
                              <input type="url" className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.studentWorksYoutubeUrl || ''}
                                placeholder="https://www.youtube.com/watch?v=..."
                                onChange={e => setSiteSettings({...siteSettings, studentWorksYoutubeUrl: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">商業合作 - 標題</label>
                              <input 
                                type="text" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.businessCoopTitle}
                                onChange={e => setSiteSettings({...siteSettings, businessCoopTitle: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">商業合作 - 副標題</label>
                              <input 
                                type="text" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.businessCoopSubtitle}
                                onChange={e => setSiteSettings({...siteSettings, businessCoopSubtitle: e.target.value})}
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-xs font-black uppercase">商業合作 - 內容詳情</label>
                              <textarea 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                rows={3}
                                value={siteSettings.businessCoopContent}
                                onChange={e => setSiteSettings({...siteSettings, businessCoopContent: e.target.value})}
                              />
                            </div>
                            <div className="md:col-span-2 space-y-4">
                              <label className="text-xs font-black uppercase block">商業合作 - 特色列表 (3 項)</label>
                              <div className="grid md:grid-cols-3 gap-4">
                                {[0, 1, 2].map(i => (
                                  <input 
                                    key={i}
                                    type="text" 
                                    placeholder={`特色 ${i+1}`}
                                    className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                    value={siteSettings.businessCoopFeatures?.[i] || ''}
                                    onChange={e => {
                                      const newFeatures = [...(siteSettings.businessCoopFeatures || [])];
                                      newFeatures[i] = e.target.value;
                                      setSiteSettings({...siteSettings, businessCoopFeatures: newFeatures});
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">課程簡介會 - 標題</label>
                              <input 
                                type="text" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.briefingTitle}
                                onChange={e => setSiteSettings({...siteSettings, briefingTitle: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">課程簡介會 - 副標題</label>
                              <input 
                                type="text" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.briefingSubtitle}
                                onChange={e => setSiteSettings({...siteSettings, briefingSubtitle: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">曾合作機構 - 標題</label>
                              <input 
                                type="text" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.partnersTitle}
                                onChange={e => setSiteSettings({...siteSettings, partnersTitle: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-4">
                            <button 
                              onClick={async () => {
                                if (settingsLoadStatus === 'error') {
                                  showToast("注意：雲端連線失敗，目前為『草稿模式』。系統正嘗試強制儲存...", "warning");
                                }
                                setIsSavingSettings(true);
                                const saveTimeout = setTimeout(() => {
                                  setIsSavingSettings(false);
                                  showToast("儲存逾時，請檢查網路連線", "error");
                                }, 15000);
                                try {
                                  await apiSetDoc('settings', 'global', siteSettings);
                                  clearTimeout(saveTimeout);
                                  showToast("首頁設定已儲存！");
                                } catch (error) {
                                  clearTimeout(saveTimeout);
                                  handleFirestoreError(error, OperationType.WRITE, 'settings/global');
                                } finally {
                                  setIsSavingSettings(false);
                                }
                              }}
                              disabled={isSavingSettings || !dataLoaded.settings}
                              className={`w-full bg-black text-[#FFEF00] py-6 rounded-full font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-[8px_8px_0px_rgba(0,85,255,1)] ${isSavingSettings || !dataLoaded.settings ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isSavingSettings ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                              {!dataLoaded.settings ? '正在載入資料...' : (isSavingSettings ? '正在儲存...' : '儲存首頁設定')}
                            </button>
                        </div>
                      </section>
                    )}

                    {adminActiveTab === 'settings' && (
                      <section className="space-y-12">
                        <div>
                          <h3 className="text-3xl font-black mb-8 flex items-center gap-3">
                            <Settings size={32} /> 公司基本資料
                          </h3>
                          <div className="grid md:grid-cols-2 gap-6 bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">公司名稱 / 網站名稱</label>
                              <input
                                type="text"
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.siteName}
                                onChange={e => setSiteSettings({...siteSettings, siteName: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">公司 Logo</label>
                              <FileUploader
                                label="上傳 Logo"
                                currentImage={siteSettings.logoUrl}
                                onUpload={(url) => setSiteSettings({...siteSettings, logoUrl: url})}
                              />
                              {siteSettings.logoUrl && (
                                <input
                                  type="url" placeholder="Logo URL（已自動設置）"
                                  className="w-full border-2 border-gray-300 p-3 rounded-xl font-bold text-sm mt-2 bg-gray-50"
                                  value={siteSettings.logoUrl} onChange={e => setSiteSettings({...siteSettings, logoUrl: e.target.value})}
                                  disabled
                                />
                              )}
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">聯絡電郵</label>
                              <input 
                                type="email" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.contactEmail}
                                onChange={e => setSiteSettings({...siteSettings, contactEmail: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">聯絡電話</label>
                              <input 
                                type="text" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.contactPhone}
                                onChange={e => setSiteSettings({...siteSettings, contactPhone: e.target.value})}
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-xs font-black uppercase">公司地址</label>
                              <input 
                                type="text" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.address || ''}
                                onChange={e => setSiteSettings({...siteSettings, address: e.target.value})}
                                placeholder="例如: 香港九龍..."
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">Facebook 連結</label>
                              <input 
                                type="url" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.facebookUrl || ''}
                                onChange={e => setSiteSettings({...siteSettings, facebookUrl: e.target.value})}
                                placeholder="https://facebook.com/..."
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">Instagram 連結</label>
                              <input 
                                type="url" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.instagramUrl || ''}
                                onChange={e => setSiteSettings({...siteSettings, instagramUrl: e.target.value})}
                                placeholder="https://instagram.com/..."
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase">YouTube 連結</label>
                              <input 
                                type="url" 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={siteSettings.youtubeUrl || ''}
                                onChange={e => setSiteSettings({...siteSettings, youtubeUrl: e.target.value})}
                                placeholder="https://youtube.com/..."
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-4">
                            <button 
                              onClick={async () => {
                                if (settingsLoadStatus === 'error') {
                                  showToast("注意：雲端連線失敗，目前為『草稿模式』。系統正嘗試強制儲存...", "warning");
                                }
                                setIsSavingSettings(true);
                                const saveTimeout = setTimeout(() => {
                                  setIsSavingSettings(false);
                                  showToast("儲存逾時，請檢查網路連線", "error");
                                }, 15000);
                                try {
                                  await apiSetDoc('settings', 'global', siteSettings);
                                  clearTimeout(saveTimeout);
                                  showToast("基本資料已儲存！");
                                } catch (error) {
                                  clearTimeout(saveTimeout);
                                  handleFirestoreError(error, OperationType.WRITE, 'settings/global');
                                } finally {
                                  setIsSavingSettings(false);
                                }
                              }}
                              disabled={isSavingSettings || !dataLoaded.settings}
                              className={`w-full bg-black text-[#FFEF00] py-6 rounded-full font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-[8px_8px_0px_rgba(0,85,255,1)] ${isSavingSettings || !dataLoaded.settings ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isSavingSettings ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                              {!dataLoaded.settings ? '正在載入資料...' : (isSavingSettings ? '正在儲存...' : '儲存公司資料')}
                            </button>
                        </div>
                      </section>
                    )}

                    {adminActiveTab === 'units' && (
                      <section>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <BookOpen size={32} />
                            <h3 className="text-3xl font-black">📚 單元管理</h3>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                          <div className="flex items-center gap-4">
                            <div className="flex bg-black/5 p-1 rounded-2xl border-2 border-black">
                              <button 
                                onClick={() => setAdminUnitsSubTab('list')}
                                className={`px-6 py-2 rounded-xl font-black transition-all text-sm ${adminUnitsSubTab === 'list' ? 'bg-black text-[#FFEF00]' : 'text-black/40 hover:text-black'}`}
                              >
                                單元清單
                              </button>
                              <button 
                                onClick={() => setAdminUnitsSubTab('groups')}
                                className={`px-6 py-2 rounded-xl font-black transition-all text-sm ${adminUnitsSubTab === 'groups' ? 'bg-black text-[#FFEF00]' : 'text-black/40 hover:text-black'}`}
                              >
                                群組管理
                              </button>
                            </div>
                            
                            {adminUnitsSubTab === 'list' && (
                              <button 
                                onClick={() => setAdminUnitNames([{ name: "新單元", isMandatory: false, price: 0 }, ...adminUnitNames])}
                                className="bg-black text-[#FFEF00] px-6 py-2 rounded-full font-black flex items-center gap-2 hover:scale-105 transition-transform text-sm"
                              >
                                <Plus size={20} /> 新增單元
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {adminUnitsSubTab === 'list' && (
                          <div className="bg-white border-[6px] border-black p-6 rounded-[3rem] shadow-[12px_12px_0px_rgba(0,0,0,1)] relative">
                            {(() => {
                              const normalizedQuery = unitSearchQuery.trim().toLowerCase();
                              const groupOptions = Array.from(new Set(adminUnitNames.map((u: any) => u.group || '未分類')));
                              const filteredEntries = adminUnitNames
                                .map((unit: any, index: number) => ({ unit, index }))
                                .filter(({ unit }) => {
                                  const unitGroup = unit.group || '未分類';
                                  const matchesQuery = !normalizedQuery || [unit.name, unit.customId, unitGroup].filter(Boolean).some((value: any) => value.toString().toLowerCase().includes(normalizedQuery));
                                  const matchesGroup = unitFilterGroup === 'all' || unitGroup === unitFilterGroup;
                                  const matchesMandatory = unitFilterMandatory === 'all'
                                    || (unitFilterMandatory === 'mandatory' && !!unit.isMandatory)
                                    || (unitFilterMandatory === 'optional' && !unit.isMandatory);
                                  return matchesQuery && matchesGroup && matchesMandatory;
                                });

                              return (
                                <>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                    <div className="rounded-2xl border-2 border-black bg-black text-[#FFEF00] px-4 py-3">
                                      <div className="text-[11px] uppercase font-black opacity-70">總單元</div>
                                      <div className="text-2xl font-black leading-none mt-1">{adminUnitNames.length}</div>
                                    </div>
                                    <div className="rounded-2xl border-2 border-black bg-white px-4 py-3">
                                      <div className="text-[11px] uppercase font-black text-black/60">必修單元</div>
                                      <div className="text-2xl font-black leading-none mt-1">{adminUnitNames.filter((u: any) => u.isMandatory).length}</div>
                                    </div>
                                    <div className="rounded-2xl border-2 border-black bg-white px-4 py-3">
                                      <div className="text-[11px] uppercase font-black text-black/60">目前顯示</div>
                                      <div className="text-2xl font-black leading-none mt-1">{filteredEntries.length}</div>
                                    </div>
                                  </div>

                                  <div className="border-2 border-black rounded-2xl p-3 bg-black/5 mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-2">
                                      <input
                                        type="text"
                                        value={unitSearchQuery}
                                        onChange={(e) => setUnitSearchQuery(e.target.value)}
                                        placeholder="搜尋單元名稱 / ID / 群組"
                                        className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm bg-white"
                                      />
                                      <select
                                        value={unitFilterGroup}
                                        onChange={(e) => setUnitFilterGroup(e.target.value)}
                                        className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm bg-white"
                                      >
                                        <option value="all">所有群組</option>
                                        {groupOptions.map((g) => (
                                          <option key={g} value={g}>{g}</option>
                                        ))}
                                      </select>
                                      <select
                                        value={unitFilterMandatory}
                                        onChange={(e) => setUnitFilterMandatory(e.target.value as 'all' | 'mandatory' | 'optional')}
                                        className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm bg-white"
                                      >
                                        <option value="all">全部類型</option>
                                        <option value="mandatory">只看必修</option>
                                        <option value="optional">只看選修</option>
                                      </select>
                                      <button
                                        onClick={() => {
                                          setUnitSearchQuery('');
                                          setUnitFilterGroup('all');
                                          setUnitFilterMandatory('all');
                                        }}
                                        className="px-4 py-3 rounded-xl border-2 border-black bg-white font-black text-sm hover:bg-black hover:text-[#FFEF00] transition-colors"
                                      >
                                        清除篩選
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-8">
                                    <div className="space-y-3">
                                      {filteredEntries.length === 0 && (
                                        <div className="text-center py-12 bg-black/5 rounded-2xl border-4 border-dashed border-black/20">
                                          <p className="text-lg font-black text-black/40">找不到符合條件的單元</p>
                                          <p className="text-sm font-bold text-black/30 mt-2">請調整搜尋字詞或篩選條件</p>
                                        </div>
                                      )}

                                      {filteredEntries.length > 0 && (
                                        <div className="hidden md:grid grid-cols-[160px_1.5fr_1fr_120px_130px] bg-black text-[#FFEF00] rounded-t-[1.5rem] border-[4px] border-black px-4 py-3 text-sm font-black tracking-wide">
                                          <div>單元 ID</div>
                                          <div>名稱</div>
                                          <div>群組</div>
                                          <div>價格</div>
                                          <div className="text-center">操作</div>
                                        </div>
                                      )}

                                      {filteredEntries.map(({ unit, index: i }: any) => {
                                        const isEditing = editingUnitIndex === i;
                                        return (
                                          <div
                                            key={i}
                                            className={`border-x-[4px] border-black ${i === 0 ? 'md:rounded-none border-t-0' : 'border-t-0'} ${i === filteredEntries.length - 1 ? 'border-b-[4px] rounded-b-[1.5rem]' : 'border-b-2'} ${i % 2 === 0 ? 'bg-[#ececec]' : 'bg-white'}`}
                                          >
                                            <div className="grid grid-cols-1 md:grid-cols-[160px_1.5fr_1fr_120px_130px] items-center gap-3 px-4 py-3">
                                              <div className="text-sm font-black text-black/70">{unit.customId || `U${i + 1}`}</div>
                                              <div className="min-w-0">
                                                <h4 className="text-base md:text-lg font-black leading-tight truncate">{unit.name || '新單元'}</h4>
                                                <div className="mt-1 text-xs font-bold text-black/60">{unit.isMandatory ? '必修單元' : '選修單元'}</div>
                                              </div>
                                              <div className="text-sm font-bold text-black/70 truncate">{unit.group || '未分類'}</div>
                                              <div className="text-sm font-black">${(unit.price || 0).toLocaleString()}</div>
                                              <div className="flex items-center justify-start md:justify-center gap-2">
                                                <button
                                                  onClick={() => setEditingUnitIndex(isEditing ? null : i)}
                                                  className="w-9 h-9 rounded-lg border-2 border-blue-500 text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center"
                                                  title={isEditing ? '收合' : '編輯'}
                                                >
                                                  <Edit2 size={16} />
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    showConfirm("確定刪除", `確定要刪除單元 U${i+1} 嗎？`, () => {
                                                      setAdminUnitNames(prev => prev.filter((_, idx) => idx !== i));
                                                      setEditingUnitIndex(prev => (prev === i ? null : prev));
                                                    });
                                                  }}
                                                  className="w-9 h-9 rounded-lg border-2 border-red-500 text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                                                  title="刪除"
                                                >
                                                  <Trash2 size={16} />
                                                </button>
                                              </div>
                                            </div>
                                            {isEditing && (
                                              <div className="px-4 pb-4 pt-3 border-t-2 border-black/15 bg-white grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <input 
                                                  type="text" 
                                                  className="w-full border-2 border-black p-3 rounded-2xl font-bold text-sm"
                                                  placeholder="單元名稱"
                                                  value={unit.name}
                                                  onChange={(e) => {
                                                    const newUnits = [...adminUnitNames];
                                                    newUnits[i] = { ...unit, name: e.target.value };
                                                    setAdminUnitNames(newUnits);
                                                  }}
                                                />
                                                <input 
                                                  type="text" 
                                                  className="w-full border-2 border-black p-3 rounded-2xl font-bold text-sm"
                                                  placeholder="自訂 ID"
                                                  value={unit.customId || ''}
                                                  onChange={(e) => {
                                                    const newUnits = [...adminUnitNames];
                                                    newUnits[i] = { ...unit, customId: e.target.value };
                                                    setAdminUnitNames(newUnits);
                                                  }}
                                                />
                                                <input 
                                                  type="text" 
                                                  className="w-full border-2 border-black p-3 rounded-2xl font-bold text-sm"
                                                  placeholder="群組"
                                                  value={unit.group || ''}
                                                  onChange={(e) => {
                                                    const newUnits = [...adminUnitNames];
                                                    newUnits[i] = { ...unit, group: e.target.value };
                                                    setAdminUnitNames(newUnits);
                                                  }}
                                                />
                                                <input 
                                                  type="number" 
                                                  className="w-full border-2 border-black p-3 rounded-2xl font-bold text-sm"
                                                  placeholder="價格"
                                                  value={unit.price || 0}
                                                  onChange={(e) => {
                                                    const newUnits = [...adminUnitNames];
                                                    newUnits[i] = { ...unit, price: Number(e.target.value) };
                                                    setAdminUnitNames(newUnits);
                                                  }}
                                                />
                                                <button
                                                  onClick={() => {
                                                    const newUnits = [...adminUnitNames];
                                                    newUnits[i] = { ...unit, isMandatory: !unit.isMandatory };
                                                    setAdminUnitNames(newUnits);
                                                  }}
                                                  className={`px-4 py-3 rounded-2xl font-black text-sm transition-all border-2 ${
                                                    unit.isMandatory
                                                    ? 'bg-black text-[#FFEF00] border-black'
                                                    : 'bg-white text-black border-black/20 hover:border-black'
                                                  }`}
                                                >
                                                  {unit.isMandatory ? '必修' : '選修'}
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                            <div className="mt-8">
                              <button 
                                onClick={async () => {
                                  setIsSavingUnits(true);
                                  try {
                                    const unitDocs = adminUnitNames.map((unit, i) => ({ id: i.toString(), ...{ id: i, ...unit } }));
                                    await apiBulkSet('units', unitDocs);

                                    const existing = await apiFetchCollection('units');
                                    const newIds = adminUnitNames.map((_, i) => i.toString());
                                    const toDelete = existing.map((item: any) => item.id.toString()).filter((id: string) => !newIds.includes(id));
                                    if (toDelete.length > 0) {
                                      await apiDeleteDocs('units', toDelete);
                                    }

                                    setUnitNames([...adminUnitNames]);
                                    showToast("單元已更新！");
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.WRITE, 'units');
                                  } finally {
                                    setIsSavingUnits(false);
                                  }
                                }}
                                disabled={isSavingUnits || !dataLoaded.units}
                                className={`w-full bg-black text-[#FFEF00] py-6 rounded-full font-black flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all text-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] ${isSavingUnits || !dataLoaded.units ? 'opacity-70 cursor-not-allowed' : ''}`}
                              >
                                {isSavingUnits ? <Loader2 className="animate-spin" size={28} /> : <Save size={28} />}
                                {!dataLoaded.units ? '正在載入資料...' : (isSavingUnits ? '正在儲存...' : '儲存所有單元')}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Group Management */}
                        {adminUnitsSubTab === 'groups' && (
                          <div className="space-y-10">
                            {/* Add New Group Section */}
                            <div className="bg-white border-[6px] border-black p-8 rounded-[2.2rem] shadow-[10px_10px_0px_rgba(0,0,0,1)]">
                              <h3 className="text-2xl font-black mb-6">➕ 建立新群組</h3>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-black uppercase text-black/70 block mb-2">群組名稱 *</label>
                                    <input 
                                      type="text" 
                                      className="w-full bg-white text-black p-3 rounded-2xl font-black placeholder:text-black/30 border-2 border-black"
                                      placeholder="例: 基礎課程、進階課程"
                                      value={newGroupName}
                                      onChange={(e) => setNewGroupName(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-black uppercase text-black/70 block mb-2">自訂 ID (選擇性)</label>
                                    <input 
                                      type="text" 
                                      className="w-full bg-white text-black p-3 rounded-2xl font-black placeholder:text-black/30 border-2 border-black"
                                      placeholder="例: GRP-001、BASIC"
                                      value={newGroupId}
                                      onChange={(e) => setNewGroupId(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-black uppercase text-black/70 block mb-2">群組描述 (選擇性)</label>
                                  <input 
                                    type="text" 
                                    className="w-full bg-white text-black p-3 rounded-2xl font-black placeholder:text-black/30 border-2 border-black"
                                    placeholder="說明此群組的用途"
                                    value={newGroupDesc}
                                    onChange={(e) => setNewGroupDesc(e.target.value)}
                                  />
                                </div>
                                <button 
                                  onClick={() => {
                                    if (newGroupName.trim()) {
                                      setAdminGroups([...adminGroups, { name: newGroupName, description: newGroupDesc, customId: newGroupId.trim() || undefined }]);
                                      setNewGroupName('');
                                      setNewGroupDesc('');
                                      setNewGroupId('');
                                      showToast('群組已建立！');
                                    } else {
                                      showToast('請輸入群組名稱', undefined);
                                    }
                                  }}
                                  className="w-full bg-black text-[#FFEF00] py-4 rounded-2xl font-black text-lg hover:scale-[1.01] transition-transform active:scale-95"
                                >
                                  建立群組
                                </button>
                              </div>
                            </div>

                            {/* Groups List */}
                            <div className="bg-white border-[6px] border-black p-6 rounded-[2.2rem] shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                              <h3 className="text-2xl font-black mb-8">📁 現有群組</h3>
                              
                              {adminGroups.length === 0 ? (
                                <div className="text-center py-16 bg-black/5 rounded-2xl border-4 border-dashed border-black/20">
                                  <FolderOpen size={64} className="mx-auto mb-4 text-black/20" />
                                  <p className="text-lg font-black text-black/40">尚未建立任何群組</p>
                                  <p className="text-sm font-bold text-black/30 mt-2">從左邊的表單開始建立第一個群組</p>
                                </div>
                              ) : (
                                <div className="space-y-0">
                                  <div className="hidden md:grid grid-cols-[140px_1.4fr_120px_120px_160px_120px] bg-black text-[#FFEF00] rounded-t-[1.2rem] border-[4px] border-black px-4 py-3 text-sm font-black tracking-wide">
                                    <div>群組 ID</div>
                                    <div>名稱</div>
                                    <div>單元數</div>
                                    <div>必修數</div>
                                    <div>群組總價</div>
                                    <div className="text-center">操作</div>
                                  </div>
                                  {adminGroups.map((group, groupIdx) => {
                                    const unitsInGroup = adminUnitNames.filter((u: any) => (u.group || '未分類') === group.name).length;
                                    const mandatoryCount = adminUnitNames.filter((u: any) => (u.group || '未分類') === group.name && u.isMandatory).length;
                                    const unitsInGroupList = adminUnitNames
                                      .map((u: any, idx: number) => ({ unit: u, index: idx }))
                                      .filter(({ unit }) => (unit.group || '未分類') === group.name);
                                    const groupPrice = unitsInGroupList.reduce((sum: number, { unit }) => sum + getUnitPrice(unit), 0);
                                    const addableUnits = adminUnitNames
                                      .map((u: any, idx: number) => ({ unit: u, index: idx }))
                                      .filter(({ unit }) => (unit.group || '未分類') !== group.name);
                                    const isEditingGroup = editingGroup?.name === group.name;
                                    
                                    return (
                                      <div
                                        key={groupIdx}
                                        className={`border-x-[4px] border-black ${groupIdx === 0 ? 'border-t-0' : 'border-t-0'} ${groupIdx === adminGroups.length - 1 ? 'border-b-[4px] rounded-b-[1.2rem]' : 'border-b-2'} ${groupIdx % 2 === 0 ? 'bg-[#ececec]' : 'bg-white'}`}
                                      >
                                        <div className="grid grid-cols-1 md:grid-cols-[140px_1.4fr_120px_120px_160px_120px] gap-3 items-center px-4 py-3">
                                          <div className="text-sm font-black text-black/70">{group.customId || `G${groupIdx + 1}`}</div>
                                          <div className="min-w-0">
                                            <h4 className="text-base md:text-lg font-black leading-tight truncate">{group.name}</h4>
                                            {group.description && <p className="text-xs text-black/60 font-bold truncate">{group.description}</p>}
                                          </div>
                                          <div className="text-sm font-black">{unitsInGroup}</div>
                                          <div className="text-sm font-black">{mandatoryCount}</div>
                                          <div className="text-sm font-black">${groupPrice.toLocaleString()}</div>
                                          <div className="flex items-center justify-start md:justify-center gap-2">
                                                <button 
                                                  onClick={() => {
                                                    if (isEditingGroup) {
                                                      setEditingGroup(null);
                                                      setNewGroupName('');
                                                      setNewGroupDesc('');
                                                      setNewGroupId('');
                                                    } else {
                                                      setEditingGroup(group);
                                                      setNewGroupName(group.name);
                                                      setNewGroupDesc(group.description || '');
                                                      setNewGroupId(group.customId || '');
                                                    }
                                                  }}
                                                  className="w-9 h-9 rounded-lg border-2 border-blue-500 text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center"
                                                  title={isEditingGroup ? '收合' : '編輯'}
                                                >
                                                  <Edit2 size={16} />
                                                </button>
                                                <button 
                                                  onClick={() => {
                                                    showConfirm('刪除群組', `確定要刪除群組「${group.name}」嗎？其中的單元將被移到「未分類」。`, () => {
                                                      const updatedUnits = adminUnitNames.map((u: any) => 
                                                        (u.group || '未分類') === group.name ? { ...u, group: '未分類' } : u
                                                      );
                                                      setAdminUnitNames(updatedUnits);
                                                      setAdminGroups(adminGroups.filter((_, i) => i !== groupIdx));
                                                      if (editingGroup?.name === group.name) {
                                                        setEditingGroup(null);
                                                        setNewGroupName('');
                                                        setNewGroupDesc('');
                                                      }
                                                      showToast('群組已刪除，單元已移至「未分類」');
                                                    });
                                                  }}
                                                  className="w-9 h-9 rounded-lg border-2 border-red-500 text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                                                  title="刪除"
                                                >
                                                  <Trash2 size={16} />
                                                </button>
                                              </div>
                                        </div>

                                        {isEditingGroup ? (
                                          <div className="px-4 pb-4 pt-3 border-t-2 border-black/10 bg-white space-y-3">
                                            <div className="border-2 border-black/15 rounded-2xl p-3 bg-black/[0.03] space-y-3">
                                              <div className="text-xs font-black text-black/60 uppercase">編輯群組資訊</div>
                                              <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_auto] gap-3 items-end">
                                                <div>
                                                  <label className="block text-[11px] font-black text-black/60 mb-1 uppercase">群組名稱</label>
                                                  <input
                                                    type="text"
                                                    value={newGroupName}
                                                    onChange={(e) => setNewGroupName(e.target.value)}
                                                    className="w-full border-2 border-black rounded-xl px-3 py-2 font-bold text-sm bg-white"
                                                    placeholder="輸入群組名稱"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[11px] font-black text-black/60 mb-1 uppercase">自訂 ID</label>
                                                  <input
                                                    type="text"
                                                    value={newGroupId}
                                                    onChange={(e) => setNewGroupId(e.target.value)}
                                                    className="w-full border-2 border-black rounded-xl px-3 py-2 font-bold text-sm bg-white"
                                                    placeholder="例如 G1、BASIC"
                                                  />
                                                </div>
                                                <button
                                                  onClick={() => {
                                                    const trimmedName = newGroupName.trim();
                                                    if (!trimmedName) {
                                                      showToast('請輸入群組名稱');
                                                      return;
                                                    }
                                                    const duplicate = adminGroups.some((g, idx) => idx !== groupIdx && g.name === trimmedName);
                                                    if (duplicate) {
                                                      showToast('群組名稱重複，請改用其他名稱');
                                                      return;
                                                    }

                                                    const oldName = group.name;
                                                    const nextId = newGroupId.trim() || undefined;

                                                    setAdminGroups(prev => prev.map((g, idx) => idx === groupIdx ? { ...g, name: trimmedName, customId: nextId } : g));
                                                    setAdminUnitNames(prev => prev.map((u: any) => (u.group || '未分類') === oldName ? { ...u, group: trimmedName } : u));

                                                    if (oldName !== trimmedName) {
                                                      setGroupAddSelection(prev => {
                                                        const current = prev[oldName] || [];
                                                        const next = { ...prev, [trimmedName]: current };
                                                        delete next[oldName];
                                                        return next;
                                                      });
                                                    }

                                                    setEditingGroup({ ...group, name: trimmedName, customId: nextId });
                                                    showToast('群組名稱與 ID 已更新');
                                                  }}
                                                  className="h-[42px] px-4 rounded-xl border-2 border-black bg-black text-[#FFEF00] font-black text-sm hover:scale-[1.02] transition-transform"
                                                >
                                                  儲存變更
                                                </button>
                                              </div>
                                            </div>

                                            <div className="text-sm font-black text-black/80">群組內單元（可直接移除）</div>
                                            <div className="flex flex-wrap gap-2">
                                              {unitsInGroupList.length === 0 ? (
                                                <span className="text-xs font-bold text-black/40">此群組暫時沒有單元</span>
                                              ) : (
                                                unitsInGroupList.map(({ unit, index }) => (
                                                  <button
                                                    key={`group-unit-${groupIdx}-${index}`}
                                                    onClick={() => {
                                                      setAdminUnitNames(prev => prev.map((u: any, idx: number) => idx === index ? { ...u, group: '未分類' } : u));
                                                      showToast(`已從「${group.name}」移除單元：${unit.name || `U${index + 1}`}`);
                                                    }}
                                                    className="px-3 py-1.5 rounded-full border-2 border-black bg-black text-[#FFEF00] text-xs font-black hover:scale-105 transition-transform"
                                                    title="從此群組移除"
                                                  >
                                                    {(unit.customId || `U${index + 1}`)} · {unit.name || '未命名'} ({`$${getUnitPrice(unit).toLocaleString()}`}) ✕
                                                  </button>
                                                ))
                                              )}
                                            </div>

                                            {addableUnits.length > 0 && (
                                              <div className="border-2 border-black/20 rounded-2xl overflow-hidden">
                                                <div className="flex items-center justify-between px-4 py-2 bg-black/5 border-b-2 border-black/10">
                                                  <span className="text-xs font-black text-black/60 uppercase">勾選單元加入此群組</span>
                                                  <div className="flex gap-2">
                                                    <button
                                                      onClick={() => setGroupAddSelection(prev => ({ ...prev, [group.name]: addableUnits.map(({ index }) => index) }))}
                                                      className="text-xs font-black text-blue-600 hover:underline"
                                                    >全選</button>
                                                    <span className="text-black/30">|</span>
                                                    <button
                                                      onClick={() => setGroupAddSelection(prev => ({ ...prev, [group.name]: [] }))}
                                                      className="text-xs font-black text-black/40 hover:underline"
                                                    >清除</button>
                                                  </div>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto divide-y divide-black/5">
                                                  {addableUnits.map(({ unit, index }) => {
                                                    const selected = (groupAddSelection[group.name] || []).includes(index);
                                                    return (
                                                      <label
                                                        key={`chk-${groupIdx}-${index}`}
                                                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${selected ? 'bg-[#FFEF00]/30' : 'hover:bg-black/3'}`}
                                                      >
                                                        <input
                                                          type="checkbox"
                                                          checked={selected}
                                                          onChange={(e) => {
                                                            setGroupAddSelection(prev => {
                                                              const current = prev[group.name] || [];
                                                              return { ...prev, [group.name]: e.target.checked ? [...current, index] : current.filter(i => i !== index) };
                                                            });
                                                          }}
                                                          className="w-4 h-4 accent-black rounded shrink-0"
                                                        />
                                                        <span className="text-xs font-black text-blue-600 shrink-0">{unit.customId || `U${index + 1}`}</span>
                                                        <span className="text-sm font-bold truncate">{unit.name || '未命名'}</span>
                                                        <span className="ml-auto text-xs font-black text-black/60 shrink-0">${getUnitPrice(unit).toLocaleString()}</span>
                                                        <span className="text-xs font-bold text-black/40 shrink-0">{unit.group || '未分類'}</span>
                                                      </label>
                                                    );
                                                  })}
                                                </div>
                                                <div className="px-4 py-2 bg-black/5 border-t-2 border-black/10 flex items-center justify-between">
                                                  <span className="text-xs font-bold text-black/50">已選 {(groupAddSelection[group.name] || []).length} 個單元</span>
                                                  <button
                                                    onClick={() => {
                                                      const selected = groupAddSelection[group.name] || [];
                                                      if (selected.length === 0) { showToast('請先勾選單元'); return; }
                                                      setAdminUnitNames(prev => prev.map((u: any, idx: number) => selected.includes(idx) ? { ...u, group: group.name } : u));
                                                      setGroupAddSelection(prev => ({ ...prev, [group.name]: [] }));
                                                      showToast(`已加入 ${selected.length} 個單元至「${group.name}」`);
                                                    }}
                                                    className="px-5 py-2 rounded-2xl font-black text-sm bg-black text-[#FFEF00] border-2 border-black hover:scale-105 transition-transform"
                                                  >
                                                    加入所選單元
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="px-4 pb-4 pt-3 border-t-2 border-black/10 bg-white">
                                            <p className="text-xs font-bold text-black/40">點擊右側鉛筆即可展開群組明細與單元分配表</p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>


                          </div>
                        )}

                      </section>
                    )}

                    {/* Global Add Course Modal */}
                    <AnimatePresence>
                      {showAddCombinationModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowAddCombinationModal(false)}
                          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 20 }}
                          className="relative bg-white border-[6px] border-black p-8 rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_rgba(0,0,0,1)]"
                        >
                          <button 
                            onClick={() => setShowAddCombinationModal(false)}
                            className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full"
                          >
                            <X size={24} />
                          </button>
                                
                          <h3 className="text-3xl font-black mb-6 uppercase">
                            {newCourse.categories.includes('group') ? '新增團體課程' : '新增課程'}
                          </h3>
                          
                          <form onSubmit={handleAddCourse} className="space-y-6">
                            {/* Category selector */}
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase ml-1">課程類別</label>
                              <div className="flex gap-2 flex-wrap">
                                {(['regular', 'personal', 'group'] as const).map(cat => (
                                  <button key={cat} type="button"
                                    onClick={() => {
                                      if (cat === 'group') {
                                        setNewCourse({...newCourse, categories: ['group']});
                                      } else {
                                        const cur = newCourse.categories.filter(c => c !== 'group');
                                        const next = cur.includes(cat)
                                          ? cur.filter(c => c !== cat).length > 0 ? cur.filter(c => c !== cat) : cur
                                          : [...cur, cat];
                                        setNewCourse({...newCourse, categories: next});
                                      }
                                    }}
                                    className={`px-5 py-2 rounded-full font-black text-sm border-2 border-black transition-all ${newCourse.categories.includes(cat) ? 'bg-[#FFEF00] text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-black/5'}`}
                                  >{cat === 'regular' ? '🎓 常規課程' : cat === 'personal' ? '🧩 個人課程' : '👥 團體課程'}</button>
                                ))}
                              </div>
                            </div>

                            {/* Name field */}
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase ml-1">{newCourse.categories.includes('group') ? '課程名稱' : '課程名稱（內部）'}</label>
                              <input 
                                type="text" required placeholder="例如: AI 基礎課程"
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value, ...(newCourse.categories.includes('group') ? { title: e.target.value } : {})})}
                              />
                            </div>

                            {/* Type — regular/personal only */}
                            {!newCourse.categories.includes('group') && (
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase ml-1">學制類型</label>
                              <select 
                                className="w-full border-4 border-black p-4 rounded-xl font-bold bg-white"
                                value={newCourse.type} onChange={e => setNewCourse({...newCourse, type: e.target.value as any})}
                              >
                                <option value="Diploma">文憑 (Diploma)</option>
                                <option value="Certificate">證書 (Certificate)</option>
                                <option value="Short Course">短期課程 (Short Course)</option>
                              </select>
                            </div>
                            )}

                            {/* Unit assignment table — regular/personal only */}
                            {!newCourse.categories.includes('group') && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-black uppercase ml-1">單元設定</label>
                                <div className="flex items-center gap-4 text-[10px] font-black text-black/50 uppercase mr-1">
                                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-black inline-block"></span> 必修</span>
                                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block"></span> 選修</span>
                                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-black/10 border border-black/20 inline-block"></span> 不包含</span>
                                </div>
                              </div>
                              <div className="border-2 border-black/10 rounded-xl overflow-hidden">
                                <div className="grid grid-cols-[auto_1fr_auto_auto] bg-black/5 px-3 py-2 text-[10px] font-black uppercase text-black/40 gap-3">
                                  <span></span>
                                  <span>單元名稱</span>
                                  <span className="w-14 text-center">必修</span>
                                  <span className="w-14 text-center">選修</span>
                                </div>
                                <div className="max-h-[280px] overflow-y-auto custom-scrollbar divide-y divide-black/5">
                                  {adminUnitNames.map((unit, i) => {
                                    const isMand = newCourse.mandatory.includes(i);
                                    const isElec = (newCourse.elective || []).includes(i);
                                    return (
                                      <div key={i} className={`grid grid-cols-[auto_1fr_auto_auto] items-center px-3 py-2.5 gap-3 transition-colors ${
                                        isMand ? 'bg-black/5' : isElec ? 'bg-blue-50' : 'bg-white hover:bg-black/[0.02]'
                                      }`}>
                                        <div className={`w-7 h-5 rounded flex items-center justify-center font-black text-[9px] shrink-0 ${
                                          isMand ? 'bg-black text-[#FFEF00]' : isElec ? 'bg-blue-600 text-white' : 'bg-black/10 text-black/40'
                                        }`}>U{i+1}</div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-xs font-bold truncate">{unit.name}</span>
                                          {unit.price > 0 && <span className="text-[10px] text-black/40">${unit.price}</span>}
                                        </div>
                                        {/* 必修 checkbox */}
                                        <div className="w-14 flex justify-center">
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4 accent-black cursor-pointer"
                                            checked={isMand}
                                            onChange={e => {
                                              const newMandatory = e.target.checked
                                                ? [...newCourse.mandatory, i]
                                                : newCourse.mandatory.filter(id => id !== i);
                                              const newElective = (newCourse.elective || []).filter(id => id !== i);
                                              setNewCourse({...newCourse, mandatory: newMandatory, elective: newElective});
                                            }}
                                          />
                                        </div>
                                        {/* 選修 checkbox */}
                                        <div className="w-14 flex justify-center">
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                                            checked={isElec}
                                            onChange={e => {
                                              const cur = newCourse.elective || [];
                                              const next = e.target.checked ? [...cur, i] : cur.filter(id => id !== i);
                                              const newMandatory = newCourse.mandatory.filter(id => id !== i);
                                              setNewCourse({...newCourse, elective: next, mandatory: newMandatory});
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="flex gap-4 px-3 py-2 bg-black/5 text-[10px] font-black text-black/50 border-t border-black/10">
                                  <span>必修: {newCourse.mandatory.length} 個</span>
                                  <span>選修: {(newCourse.elective || []).length} 個</span>
                                </div>
                              </div>
                            </div>
                            )}

                            {/* Groups — regular/personal only */}
                            {!newCourse.categories.includes('group') && (
                            <div className="space-y-3">
                              <label className="text-xs font-black uppercase ml-1 flex justify-between items-center">
                                <span>選擇包含群組 (可選)</span>
                                <span className="text-black/40">{(newCourse.mandatoryGroups || []).length} 個已選擇</span>
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-2 border-2 border-black/10 rounded-xl custom-scrollbar">
                                {getAdminGroupsForCourseSelection().map((group) => (
                                  <label key={`new-course-group-${group.name}`} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                    (newCourse.mandatoryGroups || []).includes(group.name)
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-black border-black/10 hover:border-black'
                                  }`}>
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={(newCourse.mandatoryGroups || []).includes(group.name)}
                                      onChange={e => {
                                        const selected = newCourse.mandatoryGroups || [];
                                        const nextGroups = e.target.checked
                                          ? [...selected, group.name]
                                          : selected.filter(g => g !== group.name);
                                        setNewCourse({ ...newCourse, mandatoryGroups: nextGroups });
                                      }}
                                    />
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                      (newCourse.mandatoryGroups || []).includes(group.name) ? 'bg-white border-white' : 'border-black/20'
                                    }`}>
                                      {(newCourse.mandatoryGroups || []).includes(group.name) && <CheckCircle2 size={14} className="text-blue-600" />}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-black truncate">📁 {group.name}</span>
                                      <span className="text-[10px] font-black opacity-60">群組價: ${getGroupPrice(group.name, adminUnitNames).toLocaleString()}</span>
                                      {group.customId && <span className="text-[10px] font-black opacity-60">{group.customId}</span>}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                            )}

                            {/* Title/subtitle — regular/personal only */}
                            {!newCourse.categories.includes('group') && (
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase ml-1">首頁標題</label>
                                <input 
                                  type="text" required placeholder="首頁顯示標題"
                                  className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                  value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase ml-1">首頁副標題</label>
                                <input 
                                  type="text" placeholder="首頁顯示副標題"
                                  className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                  value={newCourse.subtitle} onChange={e => setNewCourse({...newCourse, subtitle: e.target.value})}
                                />
                              </div>
                            </div>
                            )}

                            {/* Dates — regular/personal only */}
                            {!newCourse.categories.includes('group') && (
                            <div className="grid md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase ml-1">開課日期</label>
                                <input 
                                  type="date"
                                  className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                  value={newCourse.startDate}
                                  onChange={e => setNewCourse({...newCourse, startDate: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase ml-1">上課時間</label>
                                <input 
                                  type="text" placeholder="例如: 逢六 14:00-17:00"
                                  className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                  value={newCourse.classTime}
                                  onChange={e => setNewCourse({...newCourse, classTime: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase ml-1">課程學費</label>
                                <input 
                                  type="text" placeholder="例如: HK$12,800"
                                  className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                  value={newCourse.tuition}
                                  onChange={e => setNewCourse({...newCourse, tuition: e.target.value})}
                                />
                              </div>
                            </div>
                            )}

                            {/* Description */}
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase ml-1">課程簡介</label>
                              <textarea 
                                required placeholder="簡短介紹此課程..."
                                className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                rows={2}
                                value={newCourse.desc} onChange={e => setNewCourse({...newCourse, desc: e.target.value})}
                              />
                            </div>

                            {/* Image + Mask */}
                            <div className="grid md:grid-cols-2 gap-6">
                              <FileUploader label="課程圖片" currentImage={newCourse.img}
                                onUpload={(url) => setNewCourse({...newCourse, img: url})}
                              />
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase ml-1">遮罩類型</label>
                                <select className="w-full border-4 border-black p-4 rounded-xl font-bold bg-white"
                                  value={newCourse.mask} onChange={e => setNewCourse({...newCourse, mask: e.target.value})}
                                >{renderMaskOptions()}</select>
                              </div>
                            </div>
                            
                            <button 
                              type="submit"
                              disabled={isSavingCourses || isSavingGroupCourses}
                              className={`w-full bg-black text-[#FFEF00] py-6 rounded-full font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.2)] ${(isSavingCourses || isSavingGroupCourses) ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {(isSavingCourses || isSavingGroupCourses) ? <Loader2 className="animate-spin inline-block mr-2" size={24} /> : null}
                              {(isSavingCourses || isSavingGroupCourses) ? '正在建立...' : '建立課程'}
                            </button>
                          </form>
                        </motion.div>
                      </div>
                      )}
                    </AnimatePresence>

                    {false && (
                      <section>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                          <div className="flex items-center gap-3">
                            <Users size={32} />
                            <h3 className="text-3xl font-black">團體課程管理</h3>
                          </div>
                          <button 
                            onClick={() => {
                              setNewCourse({ name: '', type: 'Diploma', categories: ['group'], mandatory: [], elective: [], mandatoryGroups: [], minUnits: 0, allowExtra: false, title: '', subtitle: '', desc: '', startDate: '', classTime: '', tuition: '', mask: 'mask-cloud', img: '' });
                              setShowAddCombinationModal(true);
                            }}
                            className="bg-black text-[#FFEF00] px-6 py-3 rounded-full font-black flex items-center gap-2 hover:scale-105 transition-transform"
                          >
                            <Plus size={20} /> 新增團體課程
                          </button>
                        </div>

                        <div className="space-y-4">
                            {groupCourses.map((item) => (
                              <div key={item.id} className="bg-white border-4 border-black p-6 rounded-3xl shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center gap-6">
                                <div className="w-24 h-24 shrink-0 border-2 border-black rounded-xl overflow-hidden bg-gray-100">
                                  <img src={item.img || `https://picsum.photos/seed/${item.id}/200/200`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-xl font-black">{item.title}</h4>
                                  <p className="text-sm font-bold text-black/60 line-clamp-2">{item.desc}</p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase bg-black text-[#FFEF00] px-2 py-0.5 rounded">Mask: {item.mask}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button 
                                    onClick={() => {
                                      setEditingCourse({ id: item.id, categories: ['group'], title: item.title, desc: item.desc, mask: item.mask || 'mask-cloud', img: item.img || '', name: item.title, type: '', mandatory: [], minUnits: 0, allowExtra: false, subtitle: '', startDate: '', classTime: '', tuition: '' });
                                      setShowEditCombinationModal(true);
                                    }}
                                    className="p-3 bg-blue-500 text-white rounded-xl hover:scale-110 transition-transform shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                                  >
                                    <Edit2 size={20} />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      showConfirm("刪除團體課程", `確定要刪除「${item.title}」嗎？`, async () => {
                                        try {
                                          await apiDeleteDoc('groupCourses', item.id.toString());
                                          setGroupCourses(prev => prev.filter(gc => gc.id !== item.id));
                                          showToast("已刪除團體課程");
                                        } catch (error) {
                                          handleFirestoreError(error, OperationType.DELETE, `groupCourses/${item.id}`);
                                        }
                                      });
                                    }}
                                    className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 transition-transform shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {groupCourses.length === 0 && (
                              <div className="bg-white border-4 border-dashed border-black/20 p-12 rounded-[3rem] text-center">
                                <Users size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-black text-black/30">尚無團體課程資料</p>
                              </div>
                            )}
                          </div>
                      </section>
                    )}
                    {/* Global Edit Course Modal */}
                    <AnimatePresence>
                        {showEditCombinationModal && editingCourse && (
                          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div 
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              onClick={() => setShowEditCombinationModal(false)}
                              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 20 }}
                              className="relative bg-white border-[6px] border-black p-8 rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_rgba(0,0,0,1)]"
                            >
                              <button onClick={() => setShowEditCombinationModal(false)} className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full">
                                <X size={24} />
                              </button>
                              <h3 className="text-3xl font-black mb-6 uppercase">
                                {(editingCourse.categories || [editingCourse.category]).includes('group') ? '編輯團體課程' : '編輯課程'}
                              </h3>
                              <form onSubmit={handleUpdateCourse} className="space-y-6">
                                {/* Category selector */}
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase ml-1">課程類別</label>
                                  <div className="flex gap-2 flex-wrap">
                                    {(['regular', 'personal', 'group'] as const).map(cat => (
                                      <button key={cat} type="button"
                                        onClick={() => {
                                          const cur = editingCourse.categories || [editingCourse.category || 'regular'];
                                          if (cat === 'group') {
                                            setEditingCourse({...editingCourse, categories: ['group']});
                                          } else {
                                            const nonGroup = cur.filter((c: string) => c !== 'group');
                                            const next = nonGroup.includes(cat)
                                              ? nonGroup.filter((c: string) => c !== cat).length > 0 ? nonGroup.filter((c: string) => c !== cat) : nonGroup
                                              : [...nonGroup, cat];
                                            setEditingCourse({...editingCourse, categories: next});
                                          }
                                        }}
                                        className={`px-5 py-2 rounded-full font-black text-sm border-2 border-black transition-all ${(editingCourse.categories || [editingCourse.category || 'regular']).includes(cat) ? 'bg-[#FFEF00] text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-black/5'}`}
                                      >{cat === 'regular' ? '🎓 常規課程' : cat === 'personal' ? '🧩 個人課程' : '👥 團體課程'}</button>
                                    ))}
                                  </div>
                                </div>

                                {/* Common fields */}
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <label className="text-xs font-black uppercase ml-1">{(editingCourse.categories || [editingCourse.category]).includes('group') ? '課程名稱' : '課程名稱（內部）'}</label>
                                    <input type="text" required placeholder="課程名稱"
                                      className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                      value={(editingCourse.categories || [editingCourse.category]).includes('group') ? editingCourse.title : editingCourse.name}
                                      onChange={e => (editingCourse.categories || [editingCourse.category]).includes('group')
                                        ? setEditingCourse({...editingCourse, title: e.target.value, name: e.target.value})
                                        : setEditingCourse({...editingCourse, name: e.target.value})}
                                    />
                                  </div>
                                  {!(editingCourse.categories || [editingCourse.category]).includes('group') && (
                                    <div className="space-y-2">
                                      <label className="text-xs font-black uppercase ml-1">學制類型</label>
                                      <select className="w-full border-4 border-black p-4 rounded-xl font-bold bg-white"
                                        value={editingCourse.type} onChange={e => setEditingCourse({...editingCourse, type: e.target.value as any})}
                                      >
                                        <option value="Diploma">文憑 (Diploma)</option>
                                        <option value="Certificate">證書 (Certificate)</option>
                                        <option value="Short Course">短期課程 (Short Course)</option>
                                      </select>
                                    </div>
                                  )}
                                  {!(editingCourse.categories || [editingCourse.category]).includes('group') && (
                                    <div className="space-y-2">
                                      <label className="text-xs font-black uppercase ml-1">最低單元要求</label>
                                      <input type="number"
                                        className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                        value={editingCourse.minUnits || 4}
                                        onChange={e => setEditingCourse({...editingCourse, minUnits: parseInt(e.target.value)})}
                                      />
                                    </div>
                                  )}
                                </div>
                                {/* Unit assignment table — only for regular/personal */}
                                {!(editingCourse.categories || [editingCourse.category]).includes('group') && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-black uppercase ml-1">單元設定</label>
                                    <div className="flex items-center gap-4 text-[10px] font-black text-black/50 uppercase mr-1">
                                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-black inline-block"></span> 必修</span>
                                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block"></span> 選修</span>
                                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-black/10 border border-black/20 inline-block"></span> 不包含</span>
                                    </div>
                                  </div>
                                  <div className="border-2 border-black/10 rounded-xl overflow-hidden">
                                    <div className="grid grid-cols-[auto_1fr_auto_auto] bg-black/5 px-3 py-2 text-[10px] font-black uppercase text-black/40 gap-3">
                                      <span></span>
                                      <span>單元名稱</span>
                                      <span className="w-14 text-center">必修</span>
                                      <span className="w-14 text-center">選修</span>
                                    </div>
                                    <div className="max-h-[280px] overflow-y-auto custom-scrollbar divide-y divide-black/5">
                                      {adminUnitNames.map((unit, i) => {
                                        const isMand = (editingCourse.mandatory || []).includes(i) || unit.isMandatory;
                                        const isElec = (editingCourse.elective || []).includes(i);
                                        return (
                                          <div key={i} className={`grid grid-cols-[auto_1fr_auto_auto] items-center px-3 py-2.5 gap-3 transition-colors ${
                                            isMand ? 'bg-black/5' : isElec ? 'bg-blue-50' : 'bg-white hover:bg-black/[0.02]'
                                          }`}>
                                            <div className={`w-7 h-5 rounded flex items-center justify-center font-black text-[9px] shrink-0 ${
                                              isMand ? 'bg-black text-[#FFEF00]' : isElec ? 'bg-blue-600 text-white' : 'bg-black/10 text-black/40'
                                            }`}>U{i+1}</div>
                                            <div className="flex flex-col min-w-0">
                                              <span className="text-xs font-bold truncate">{unit.name}</span>
                                              {unit.price > 0 && <span className="text-[10px] text-black/40">${unit.price}</span>}
                                            </div>
                                            {/* 必修 checkbox */}
                                            <div className="w-14 flex justify-center">
                                              <input
                                                type="checkbox"
                                                className="w-4 h-4 accent-black cursor-pointer disabled:cursor-not-allowed"
                                                checked={isMand}
                                                disabled={unit.isMandatory}
                                                onChange={e => {
                                                  const newMandatory = e.target.checked
                                                    ? [...(editingCourse.mandatory || []), i]
                                                    : (editingCourse.mandatory || []).filter((id: number) => id !== i);
                                                  const newElective = (editingCourse.elective || []).filter((id: number) => id !== i);
                                                  setEditingCourse({...editingCourse, mandatory: newMandatory, elective: newElective});
                                                }}
                                              />
                                            </div>
                                            {/* 選修 checkbox */}
                                            <div className="w-14 flex justify-center">
                                              <input
                                                type="checkbox"
                                                className="w-4 h-4 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
                                                checked={isElec}
                                                disabled={unit.isMandatory}
                                                onChange={e => {
                                                  const cur = editingCourse.elective || [];
                                                  const next = e.target.checked ? [...cur, i] : cur.filter((id: number) => id !== i);
                                                  const newMandatory = (editingCourse.mandatory || []).filter((id: number) => id !== i);
                                                  setEditingCourse({...editingCourse, elective: next, mandatory: newMandatory});
                                                }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="flex gap-4 px-3 py-2 bg-black/5 text-[10px] font-black text-black/50 border-t border-black/10">
                                      <span>必修: {(editingCourse.mandatory || []).length} 個</span>
                                      <span>選修: {(editingCourse.elective || []).length} 個</span>
                                    </div>
                                  </div>
                                </div>
                                )}
                                {/* Title/subtitle — only for regular/personal */}
                                {!(editingCourse.categories || [editingCourse.category]).includes('group') && (
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <label className="text-xs font-black uppercase ml-1">首頁顯示標題</label>
                                    <input type="text" required placeholder="首頁標題"
                                      className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                      value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-black uppercase ml-1">首頁顯示副標題</label>
                                    <input type="text" placeholder="首頁副標題"
                                      className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                      value={editingCourse.subtitle} onChange={e => setEditingCourse({...editingCourse, subtitle: e.target.value})}
                                    />
                                  </div>
                                </div>
                                )}
                                {/* Dates/time/tuition — only for regular/personal */}
                                {!(editingCourse.categories || [editingCourse.category]).includes('group') && (
                                <div className="grid md:grid-cols-3 gap-6">
                                  <div className="space-y-2">
                                    <label className="text-xs font-black uppercase ml-1">開課日期</label>
                                    <input type="date" className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                      value={editingCourse.startDate || ''}
                                      onChange={e => setEditingCourse({...editingCourse, startDate: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-black uppercase ml-1">上課時間</label>
                                    <input type="text" placeholder="例如: 逢六 14:00-17:00"
                                      className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                      value={editingCourse.classTime || ''}
                                      onChange={e => setEditingCourse({...editingCourse, classTime: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-black uppercase ml-1">課程學費</label>
                                    <input type="text" placeholder="例如: HK$12,800"
                                      className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                      value={editingCourse.tuition || ''}
                                      onChange={e => setEditingCourse({...editingCourse, tuition: e.target.value})}
                                    />
                                  </div>
                                </div>
                                )}
                                {/* Description */}
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase ml-1">課程簡介</label>
                                  <textarea required placeholder="課程簡介..."
                                    className="w-full border-4 border-black p-4 rounded-xl font-bold"
                                    rows={3}
                                    value={editingCourse.desc} onChange={e => setEditingCourse({...editingCourse, desc: e.target.value})}
                                  />
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <FileUploader label="課程圖片" currentImage={editingCourse.img}
                                      onUpload={(url) => setEditingCourse({...editingCourse, img: url})}
                                    />
                                    {editingCourse.img && (
                                      <input type="url" placeholder="圖片 URL" disabled
                                        className="w-full border-4 border-gray-300 p-4 rounded-xl font-bold mt-2 bg-gray-50"
                                        value={editingCourse.img} onChange={e => setEditingCourse({...editingCourse, img: e.target.value})}
                                      />
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-black uppercase ml-1">遮罩類型</label>
                                    <select className="w-full border-4 border-black p-4 rounded-xl font-bold bg-white"
                                      value={editingCourse.mask} onChange={e => setEditingCourse({...editingCourse, mask: e.target.value})}
                                    >{renderMaskOptions()}</select>
                                  </div>
                                </div>
                                <button type="submit" disabled={isSavingCourses || isSavingGroupCourses}
                                  className={`w-full bg-black text-[#FFEF00] py-6 rounded-full font-black uppercase text-xl hover:scale-[1.02] transition-transform shadow-[0_10px_20px_rgba(0,0,0,0.2)] ${(isSavingCourses || isSavingGroupCourses) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                  {(isSavingCourses || isSavingGroupCourses) ? <Loader2 className="animate-spin inline-block mr-2" size={24} /> : null}
                                  {(isSavingCourses || isSavingGroupCourses) ? '正在儲存...' : '儲存修改'}
                                </button>
                              </form>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>

                    {adminActiveTab === 'tutors' && (
                      <section>
                        <h3 className="text-3xl font-black mb-8 flex items-center gap-3">
                          <Users size={32} /> 導師管理
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6 mb-12">
                          {sortedTutors.map(t => (
                            <div key={t.id} className="bg-white border-4 border-black p-6 rounded-3xl flex gap-4 items-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                              <img src={t.img} className="w-16 h-16 rounded-full border-2 border-black object-cover" referrerPolicy="no-referrer" />
                              <div className="flex-1">
                                <p className="font-black text-lg">{t.name}</p>
                                <p className="text-xs font-bold text-black/60 uppercase tracking-widest">{t.role}</p>
                              </div>
                              <div className="flex flex-col gap-2 shrink-0">
                                <div className="flex items-center gap-2 bg-[#FFEF00]/20 border-2 border-black rounded-xl px-2 py-1">
                                  <label className="text-[10px] font-black uppercase text-black">排序</label>
                                  <input
                                    type="number"
                                    className="w-16 border-2 border-black p-1 rounded-lg font-black text-sm bg-white"
                                    value={tutorPriorityDrafts[t.id?.toString()] ?? getTutorPriority(t)}
                                    onChange={(e) => {
                                      const value = Number(e.target.value);
                                      setTutorPriorityDrafts(prev => ({
                                        ...prev,
                                        [t.id.toString()]: Number.isFinite(value) ? value : 0
                                      }));
                                    }}
                                  />
                                  <button
                                    onClick={() => handleUpdateTutorPriority(t.id.toString())}
                                    disabled={savingTutorPriorityId === t.id?.toString()}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border-2 border-black bg-white ${savingTutorPriorityId === t.id?.toString() ? 'opacity-60 cursor-not-allowed' : 'hover:bg-black hover:text-[#FFEF00]'}`}
                                  >
                                    {savingTutorPriorityId === t.id?.toString() ? '儲存中' : '儲存'}
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 bg-white border-2 border-black rounded-xl px-2 py-1">
                                  <label className="text-[10px] font-black uppercase text-black whitespace-nowrap">遮罩</label>
                                  <select
                                    className="border border-black p-1 rounded-lg font-bold text-xs bg-white"
                                    value={tutorMaskDrafts[t.id?.toString()] ?? (t.mask || 'mask-notebook')}
                                    onChange={(e) => handleUpdateTutorMask(t.id.toString(), e.target.value)}
                                    disabled={savingTutorMaskId === t.id?.toString()}
                                  >
                                    {renderMaskOptions()}
                                  </select>
                                  {savingTutorMaskId === t.id?.toString() && <span className="text-[10px] font-black text-black/60 whitespace-nowrap">儲存中</span>}
                                </div>
                              </div>
                              <button onClick={() => handleDeleteTutor(t.id)} className="text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors">
                                <Trash2 size={20} />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                          <h4 className="text-xl font-black mb-6 uppercase">新增導師</h4>
                          <form onSubmit={handleAddTutor} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">姓名</label>
                                <input 
                                  type="text" placeholder="導師姓名" required
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newTutor.name} onChange={e => setNewTutor({...newTutor, name: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">職位</label>
                                <input 
                                  type="text" placeholder="例如: AI 動畫總監" required
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newTutor.role} onChange={e => setNewTutor({...newTutor, role: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">Priority (排序)</label>
                                <input 
                                  type="number" placeholder="數字越小越前" required
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newTutor.priority}
                                  onChange={e => setNewTutor({...newTutor, priority: Number(e.target.value)})}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">遮罩類型</label>
                                <select
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm bg-white"
                                  value={newTutor.mask}
                                  onChange={e => setNewTutor({...newTutor, mask: e.target.value})}
                                >
                                  {renderMaskOptions()}
                                </select>
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <FileUploader 
                                  label="導師圖片"
                                  currentImage={newTutor.img}
                                  onUpload={(url) => setNewTutor({...newTutor, img: url})}
                                />
                                {newTutor.img && (
                                  <input 
                                    type="url" placeholder="圖片 URL（已自動設置）" 
                                    className="w-full border-2 border-gray-300 p-3 rounded-xl font-bold text-sm mt-2 bg-gray-50"
                                    value={newTutor.img} onChange={e => setNewTutor({...newTutor, img: e.target.value})}
                                    disabled
                                  />
                                )}
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">簡介</label>
                                <textarea 
                                  placeholder="導師背景介紹..." required
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  rows={3}
                                  value={newTutor.desc} onChange={e => setNewTutor({...newTutor, desc: e.target.value})}
                                />
                              </div>
                            </div>
                            <button 
                              type="submit" 
                              disabled={isSavingTutors}
                              className={`w-full bg-black text-[#FFEF00] py-4 rounded-full font-black uppercase text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 ${isSavingTutors ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isSavingTutors ? <Loader2 className="animate-spin" size={20} /> : null}
                              {isSavingTutors ? '正在新增...' : '新增導師'}
                            </button>
                          </form>
                        </div>
                      </section>
                    )}

                    {adminActiveTab === 'student-works' && (
                      <section>
                        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-8">
                          <h3 className="text-3xl font-black flex items-center gap-3">
                            <FaYoutube size={32} /> 學生作品管理
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={handleAutoSortStudentWorks}
                              className="px-4 py-2 rounded-full bg-[#FFEF00] border-2 border-black font-black text-xs uppercase hover:scale-105 transition-transform"
                            >
                              一鍵自動排序
                            </button>
                            <button
                              type="button"
                              onClick={resetStudentWorkForm}
                              className="px-4 py-2 rounded-full border-2 border-black font-black text-xs uppercase hover:bg-black hover:text-white transition-colors"
                            >
                              清空編輯表單
                            </button>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-3 mb-6">
                          <div className="bg-white border-4 border-black rounded-2xl p-4">
                            <p className="text-xs font-black uppercase text-black/50">作品總數</p>
                            <p className="text-3xl font-black leading-none mt-2">{studentWorks.length}</p>
                          </div>
                          <div className="bg-white border-4 border-black rounded-2xl p-4">
                            <p className="text-xs font-black uppercase text-black/50">精選作品</p>
                            <p className="text-3xl font-black leading-none mt-2">{featuredStudentWorkCount}</p>
                          </div>
                          <div className="bg-white border-4 border-black rounded-2xl p-4">
                            <p className="text-xs font-black uppercase text-black/50">篩選後結果</p>
                            <p className="text-3xl font-black leading-none mt-2">{adminStudentWorks.length}</p>
                          </div>
                        </div>

                        <div className="bg-white border-4 border-black p-4 rounded-2xl mb-8 grid xl:grid-cols-5 gap-3">
                          <input
                            type="text"
                            placeholder="搜尋標題、學員、課程、年份..."
                            className="xl:col-span-2 border-2 border-black p-3 rounded-xl font-bold text-sm"
                            value={studentWorksSearch}
                            onChange={e => setStudentWorksSearch(e.target.value)}
                          />
                          <select
                            className="border-2 border-black p-3 rounded-xl font-bold text-sm bg-white"
                            value={studentWorksFilterTag}
                            onChange={e => setStudentWorksFilterTag(e.target.value)}
                          >
                            {studentWorkTagOptions.map(tag => (
                              <option key={tag} value={tag}>{tag}</option>
                            ))}
                          </select>
                          <select
                            className="border-2 border-black p-3 rounded-xl font-bold text-sm bg-white"
                            value={studentWorksFilterYear}
                            onChange={e => setStudentWorksFilterYear(e.target.value)}
                          >
                            {studentWorkYearOptions.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              className="border-2 border-black p-3 rounded-xl font-bold text-sm bg-white"
                              value={studentWorksFilterFeatured}
                              onChange={e => setStudentWorksFilterFeatured(e.target.value as 'all' | 'featured' | 'normal')}
                            >
                              <option value="all">全部狀態</option>
                              <option value="featured">僅精選</option>
                              <option value="normal">一般作品</option>
                            </select>
                            <select
                              className="border-2 border-black p-3 rounded-xl font-bold text-sm bg-white"
                              value={studentWorksSortBy}
                              onChange={e => setStudentWorksSortBy(e.target.value as 'manual' | 'title' | 'year')}
                            >
                              <option value="manual">手動排序</option>
                              <option value="title">標題排序</option>
                              <option value="year">年份排序</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-12">
                          {adminStudentWorks.length === 0 && (
                            <p className="font-black text-black/30 col-span-2">目前篩選條件下沒有作品，請調整篩選或新增作品。</p>
                          )}
                          {adminStudentWorks.map((w: StudentWork) => (
                            <div key={w.id} className={`bg-white border-4 p-5 rounded-3xl shadow-[4px_4px_0px_rgba(0,0,0,1)] relative ${w.featured ? 'border-[#FFEF00] shadow-[4px_4px_0px_rgba(255,239,0,0.8)]' : 'border-black'}`}>
                              {w.featured && (
                                <div className="absolute -top-3 left-4 bg-[#FFEF00] text-black text-[10px] font-black px-3 py-1 rounded-full border-2 border-black uppercase tracking-wider">精選作品</div>
                              )}
                              <div className="aspect-video rounded-xl overflow-hidden border-2 border-black mb-3 bg-black">
                                <iframe
                                  className="w-full h-full"
                                  src={getYouTubeEmbedUrl(w.youtubeUrl || '')}
                                  title={w.title}
                                  frameBorder="0"
                                  allowFullScreen
                                />
                              </div>
                              <p className="font-black text-base mb-1 line-clamp-2 leading-tight">{w.title}</p>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {w.studentName && <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-full">學員 {w.studentName}</span>}
                                {w.courseTag && <span className="text-[10px] font-black bg-[#FFEF00] text-black px-2 py-0.5 rounded-full border border-black">{w.courseTag}</span>}
                                {w.year && <span className="text-[10px] font-black bg-black/10 text-black px-2 py-0.5 rounded-full">{w.year}</span>}
                                {w.sortOrder !== undefined && w.sortOrder !== '' && <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">排序 {w.sortOrder}</span>}
                              </div>
                              {w.description && <p className="text-xs text-black/60 font-bold mb-3 line-clamp-2">{w.description}</p>}
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => startEditStudentWork(w)}
                                  className="col-span-2 flex items-center justify-center gap-2 bg-[#FFEF00] border-2 border-black py-2 rounded-full font-black text-sm hover:scale-105 transition-transform"
                                >
                                  <Edit2 size={16} /> 修改
                                </button>
                                <button
                                  onClick={() => handleDeleteStudentWork((w.id || '').toString())}
                                  className="flex items-center justify-center gap-2 bg-red-500 text-white border-2 border-black px-3 py-2 rounded-full font-black text-sm hover:scale-105 transition-transform"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStudentWorkFeatured(w)}
                                  className="col-span-3 border-2 border-black rounded-full py-2 text-xs font-black uppercase hover:bg-black hover:text-white transition-colors"
                                >
                                  {w.featured ? '取消精選' : '設為精選'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                          <h4 className="text-xl font-black mb-6 flex items-center gap-3 uppercase">
                            {editingStudentWorkId ? <><Edit2 size={20}/> 修改學生作品</> : <><Plus size={20}/> 新增學生作品</>}
                          </h4>
                          <form onSubmit={handleSaveStudentWork} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-[10px] font-black uppercase ml-1">作品標題 *</label>
                                <input
                                  type="text" required placeholder="例如：2024屆學生動畫作品集"
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newStudentWork.title}
                                  onChange={e => setNewStudentWork({ ...newStudentWork, title: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-[10px] font-black uppercase ml-1">YouTube 連結 *</label>
                                <input
                                  type="url" required placeholder="https://www.youtube.com/watch?v=..."
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newStudentWork.youtubeUrl}
                                  onChange={e => setNewStudentWork({ ...newStudentWork, youtubeUrl: e.target.value })}
                                />
                                <p className="text-[11px] font-bold text-black/50">支援 watch、youtu.be、shorts、embed 連結格式。</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">學生姓名</label>
                                <input
                                  type="text" placeholder="例如：陳大文"
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newStudentWork.studentName}
                                  onChange={e => setNewStudentWork({ ...newStudentWork, studentName: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">課程 / 標籤</label>
                                <input
                                  type="text" placeholder="例如：2D動畫、AI應用"
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newStudentWork.courseTag}
                                  onChange={e => setNewStudentWork({ ...newStudentWork, courseTag: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">年份</label>
                                <input
                                  type="text" placeholder="例如：2024"
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newStudentWork.year}
                                  onChange={e => setNewStudentWork({ ...newStudentWork, year: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">排列順序（數字越小越前）</label>
                                <input
                                  type="number" placeholder="留空則自動放後面"
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newStudentWork.sortOrder}
                                  onChange={e => setNewStudentWork({ ...newStudentWork, sortOrder: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-[10px] font-black uppercase ml-1">作品簡介</label>
                                <textarea
                                  placeholder="簡短描述這件作品的內容或亮點..."
                                  rows={2}
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm resize-none"
                                  value={newStudentWork.description}
                                  onChange={e => setNewStudentWork({ ...newStudentWork, description: e.target.value })}
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                  <div
                                    onClick={() => setNewStudentWork({ ...newStudentWork, featured: !newStudentWork.featured })}
                                    className={`w-12 h-6 rounded-full border-2 border-black transition-colors flex items-center ${newStudentWork.featured ? 'bg-[#FFEF00]' : 'bg-black/10'}`}
                                  >
                                    <div className={`w-4 h-4 rounded-full bg-black mx-1 transition-transform ${newStudentWork.featured ? 'translate-x-6' : 'translate-x-0'}`} />
                                  </div>
                                  <span className="font-black text-sm">置頂精選作品</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button
                                type="submit"
                                disabled={isSavingStudentWorks}
                                className={`flex-1 bg-black text-[#FFEF00] py-4 rounded-full font-black uppercase text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 ${isSavingStudentWorks ? 'opacity-70 cursor-not-allowed' : ''}`}
                              >
                                {isSavingStudentWorks ? <Loader2 className="animate-spin" size={20} /> : null}
                                {isSavingStudentWorks ? '儲存中...' : editingStudentWorkId ? '更新作品' : '新增作品'}
                              </button>
                              {editingStudentWorkId && (
                                <button
                                  type="button"
                                  onClick={resetStudentWorkForm}
                                  className="px-6 py-4 rounded-full font-black uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-colors"
                                >
                                  取消
                                </button>
                              )}
                            </div>
                          </form>
                        </div>
                      </section>
                    )}

                    {adminActiveTab === 'testimonials' && (
                      <section>
                        <h3 className="text-3xl font-black mb-8 flex items-center gap-3">
                          <MessageSquare size={32} /> 學生見證管理
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6 mb-12">
                          {testimonials.map(t => (
                            <div key={t.id} className="bg-white border-4 border-black p-6 rounded-3xl flex gap-4 items-start shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                              <img src={t.img} className="w-12 h-12 rounded-full border-2 border-black object-cover" referrerPolicy="no-referrer" />
                              <div className="flex-1">
                                <p className="font-black">{t.name}</p>
                                <p className="text-xs font-bold text-black/60 line-clamp-2 mt-1">{t.text}</p>
                              </div>
                              <button onClick={() => handleDeleteTestimonial(t.id)} className="text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors">
                                <Trash2 size={20} />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                          <h4 className="text-xl font-black mb-6 uppercase">新增學員感想</h4>
                          <form onSubmit={handleAddTestimonial} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">學員姓名</label>
                                <input 
                                  type="text" placeholder="姓名" required
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newTestimonial.name} onChange={e => setNewTestimonial({...newTestimonial, name: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1">
                                <FileUploader 
                                  label="學員頭像"
                                  currentImage={newTestimonial.img}
                                  onUpload={(url) => setNewTestimonial({...newTestimonial, img: url})}
                                />
                                {newTestimonial.img && (
                                  <input 
                                    type="url" placeholder="圖片 URL（已自動設置）" 
                                    className="w-full border-2 border-gray-300 p-3 rounded-xl font-bold text-sm mt-2 bg-gray-50"
                                    value={newTestimonial.img} onChange={e => setNewTestimonial({...newTestimonial, img: e.target.value})}
                                    disabled
                                  />
                                )}
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">感想內容</label>
                                <textarea 
                                  placeholder="學員分享內容..." required
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  rows={3}
                                  value={newTestimonial.text} onChange={e => setNewTestimonial({...newTestimonial, text: e.target.value})}
                                />
                              </div>
                            </div>
                            <button 
                              type="submit" 
                              disabled={isSavingTestimonials}
                              className={`w-full bg-black text-[#FFEF00] py-4 rounded-full font-black uppercase text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 ${isSavingTestimonials ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isSavingTestimonials ? <Loader2 className="animate-spin" size={20} /> : null}
                              {isSavingTestimonials ? '正在新增...' : '新增感想'}
                            </button>
                          </form>
                        </div>
                      </section>
                    )}

                    {adminActiveTab === 'activities' && (
                      <section>
                        {/* 🚀 強制置頂的批次匯入區域 */}
                        <div className="bg-[#0055FF] border-[6px] border-black p-10 rounded-[3rem] shadow-[12px_12px_0px_rgba(0,0,0,1)] mb-16 relative overflow-hidden">
                          <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12">
                            <Database size={200} />
                          </div>
                          
                          <div className="relative z-10">
                            <h3 className="text-4xl font-[1000] text-white mb-4 flex items-center gap-4 italic tracking-tighter">
                              <UploadCloud size={48} className="text-[#FFEF00]" /> 
                              數據大遷移 (Phase 3)
                            </h3>
                            <p className="font-bold text-lg text-white/90 mb-8 max-w-2xl leading-relaxed">
                              已經成功抓取 <span className="bg-[#FFEF00] text-black px-2 py-1 rounded-lg">1144 筆</span> 歷史數據！<br/>
                              請點擊下方按鈕，選擇 <code className="bg-black/30 px-2 py-1 rounded">scripts/migrated_activities.json</code> 開始匯入。
                            </p>
                            
                            <div className="flex flex-col items-start gap-4">
                              <input 
                                type="file" accept=".json" id="bulk-import-json-fix" className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const text = await file.text();
                                    const data = JSON.parse(text);
                                    if (!Array.isArray(data)) throw new Error("無效 JSON");
                                    if (!confirm(`確定要匯入這 ${data.length} 筆活動資料嗎？這可能需要幾分鐘。`)) return;
                                    
                                    setIsSavingActivities(true);
                                    let count = 0;
                                    for (const item of data) {
                                      const id = item.id || `migrated-${Date.now()}-${count}`;
                                      const normalized = normalizeActivity({
                                        ...item,
                                        id,
                                        tags: Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',').map((t: any) => t.trim())
                                      });
                                      await apiSetDoc('activities', id.toString(), normalized);
                                      count++;
                                    }
                                    showToast(`🎉 成功匯入 ${count} 筆資料！`);
                                    window.location.reload(); // 強制刷新獲取最新數據
                                  } catch (err) {
                                    showToast("匯入出錯，請檢查檔案", "error");
                                  } finally {
                                    setIsSavingActivities(false);
                                  }
                                }}
                              />
                              <label 
                                htmlFor="bulk-import-json-fix"
                                className={`cursor-pointer inline-flex items-center justify-center gap-4 bg-[#FFEF00] text-black px-12 py-6 rounded-full font-[1000] text-2xl uppercase hover:scale-110 active:scale-95 transition-all shadow-[8px_8px_0px_rgba(0,0,0,1)] border-4 border-black ${isSavingActivities ? 'opacity-50 pointer-events-none' : ''}`}
                              >
                                {isSavingActivities ? <Loader2 className="animate-spin" size={32} /> : <Database size={32} />}
                                {isSavingActivities ? '正在寫入 1144 筆數據...' : '立即開始匯入資料'}
                              </label>
                              {isSavingActivities && (
                                <div className="mt-4 bg-black/20 p-4 rounded-2xl border-2 border-dashed border-white/50 w-full text-white font-black text-center">
                                  ⏳ 請耐心等候，系統正在處理大量數據，請勿重新整理頁面...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <h3 className="text-3xl font-black mb-8 flex items-center gap-3">
                          <Film size={32} /> 單筆新增活動
                        </h3>

                        <div className="grid grid-cols-1 gap-4 mb-12">
                          {activities.map(a => (
                            <div key={a.id} className="bg-white border-4 border-black p-6 rounded-3xl flex gap-6 items-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                              <img src={a.img} className="w-24 h-24 rounded-xl border-2 border-black object-cover" referrerPolicy="no-referrer" />
                              <div className="flex-1">
                                <p className="text-xs font-black text-[#0055FF] mb-1">{a.date}</p>
                                <p className="font-black text-xl line-clamp-1">{a.title}</p>
                                <p className="text-sm font-bold text-black/60 line-clamp-1 mt-1">{a.content}</p>
                              </div>
                              <button onClick={() => handleDeleteActivity(a.id)} className="text-red-600 p-3 hover:bg-red-50 rounded-full transition-colors">
                                <Trash2 size={24} />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                          <h4 className="text-xl font-black mb-6 uppercase">新增活動記錄</h4>
                          <form onSubmit={handleAddActivity} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">活動標題</label>
                                <input 
                                  type="text" placeholder="標題" required
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newActivity.title} onChange={e => setNewActivity({...newActivity, title: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">日期</label>
                                <input 
                                  type="text" placeholder="例如: 2025年10月" required
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newActivity.date} onChange={e => setNewActivity({...newActivity, date: e.target.value})}
                                />
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <FileUploader 
                                  label="活動圖片"
                                  currentImage={newActivity.img}
                                  onUpload={(url) => setNewActivity({...newActivity, img: url})}
                                />
                                {newActivity.img && (
                                  <input 
                                    type="url" placeholder="圖片 URL（已自動設置）" 
                                    className="w-full border-2 border-gray-300 p-3 rounded-xl font-bold text-sm mt-2 bg-gray-50"
                                    value={newActivity.img} onChange={e => setNewActivity({...newActivity, img: e.target.value})}
                                    disabled
                                  />
                                )}
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">標籤 (逗號分隔)</label>
                                <input 
                                  type="text" placeholder="#SAVFX, #AI" required
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  value={newActivity.tags} onChange={e => setNewActivity({...newActivity, tags: e.target.value})}
                                />
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-black uppercase ml-1">活動內容</label>
                                <textarea 
                                  placeholder="活動詳細介紹..." required
                                  className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                  rows={4}
                                  value={newActivity.content} onChange={e => setNewActivity({...newActivity, content: e.target.value})}
                                />
                              </div>
                            </div>
                            <button 
                              type="submit" 
                              disabled={isSavingActivities}
                              className={`w-full bg-black text-[#FFEF00] py-4 rounded-full font-black uppercase text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 ${isSavingActivities ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isSavingActivities ? <Loader2 className="animate-spin" size={20} /> : null}
                              {isSavingActivities ? '正在發佈...' : '發佈活動'}
                            </button>
                          </form>
                        </div>
                      </section>
                    )}

                    {adminActiveTab === 'masks' && (
                      <section className="space-y-10">
                        <h3 className="text-3xl font-black mb-8 flex items-center gap-3">
                          <Box size={32} /> 遮罩管理
                        </h3>

                        {/* Built-in masks */}
                        <div className="bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                          <h4 className="text-lg font-black uppercase mb-4">內建遮罩（唯讀）</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {BUILTIN_MASKS.map(m => (
                              <div key={m.id} className="border-2 border-black rounded-2xl p-3 flex items-center gap-3 bg-[#FFEF00]/10">
                                <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                  <svg viewBox="0 0 100 100" className="w-8 h-8">
                                    <use href={`#${m.id}`} />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-black text-sm">{m.name}</p>
                                  <p className="text-[10px] font-mono text-black/50">{m.id}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Custom masks list */}
                        <div className="bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                          <h4 className="text-lg font-black uppercase mb-6">自訂遮罩 ({customMasks.length})</h4>
                          {customMasks.length === 0 && (
                            <p className="text-black/40 font-bold text-center py-6">尚未新增任何自訂遮罩</p>
                          )}
                          <div className="space-y-4">
                            {customMasks.map(m => (
                              <div key={m.id} className="border-2 border-black rounded-2xl p-4 bg-white">
                                {editingMask?.id === m.id ? (
                                  <div className="space-y-3">
                                    <input
                                      type="text"
                                      className="w-full border-2 border-black p-3 rounded-xl font-bold text-sm"
                                      placeholder="遮罩名稱"
                                      value={editingMask.name}
                                      onChange={e => setEditingMask({...editingMask, name: e.target.value})}
                                    />
                                    <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-black rounded-xl p-3 hover:bg-[#FFEF00]/10 transition-colors text-sm font-bold">
                                      <Upload size={16} className="shrink-0" />
                                      重新上傳 SVG
                                      <input
                                        type="file"
                                        accept=".svg,image/svg+xml"
                                        className="hidden"
                                        onChange={e => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          const reader = new FileReader();
                                          reader.onload = ev => {
                                            try {
                                              const text = ev.target?.result as string;
                                              const parser = new DOMParser();
                                              const doc = parser.parseFromString(text, 'image/svg+xml');
                                              const paths = Array.from(doc.querySelectorAll('path'));
                                              if (paths.length === 0) { showToast('SVG 中找不到 <path> 元素', 'error'); return; }
                                              const combined = paths.map(p => p.getAttribute('d') || '').join(' ').trim();
                                              setEditingMask(prev => prev ? {...prev, path: combined} : prev);
                                              showToast(`已匯入 ${paths.length} 個 path`);
                                            } catch { showToast('SVG 解析失敗', 'error'); }
                                          };
                                          reader.readAsText(file);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                    <textarea
                                      className="w-full border-2 border-black p-3 rounded-xl font-mono text-xs"
                                      rows={3}
                                      placeholder="SVG Path (objectBoundingBox, 座標範圍 0~1)"
                                      value={editingMask.path}
                                      onChange={e => setEditingMask({...editingMask, path: e.target.value})}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={handleUpdateMask}
                                        disabled={isSavingMasks}
                                        className="flex items-center gap-1 px-4 py-2 bg-black text-[#FFEF00] rounded-xl font-black text-sm hover:scale-[1.02] transition-transform"
                                      >
                                        <Save size={14} /> {isSavingMasks ? '儲存中...' : '儲存'}
                                      </button>
                                      <button
                                        onClick={() => setEditingMask(null)}
                                        className="flex items-center gap-1 px-4 py-2 bg-white border-2 border-black rounded-xl font-black text-sm hover:bg-black/5"
                                      >
                                        <X size={14} /> 取消
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                      <p className="font-black">{m.name}</p>
                                      <p className="text-[10px] font-mono text-black/50 mt-1">ID: mask-custom-{m.id}</p>
                                      <p className="text-[11px] font-mono text-black/40 mt-1 break-all line-clamp-2">{m.path}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                      <button
                                        onClick={() => setEditingMask(m)}
                                        className="p-2 border-2 border-black rounded-xl hover:bg-[#FFEF00]/30 transition-colors"
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMask(m.id)}
                                        className="p-2 border-2 border-red-500 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Add new mask */}
                        <div className="bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                          <h4 className="text-xl font-black uppercase mb-6">新增自訂遮罩</h4>
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-xs font-black uppercase">遮罩名稱</label>
                              <input
                                type="text"
                                className="w-full border-2 border-black p-3 rounded-xl font-bold"
                                placeholder="例：星形"
                                value={newMask.name}
                                onChange={e => setNewMask({...newMask, name: e.target.value})}
                              />
                            </div>

                            {/* SVG upload */}
                            <div className="space-y-1">
                              <label className="text-xs font-black uppercase">上傳 SVG 檔案
                                <span className="ml-2 text-[10px] font-bold text-black/40 normal-case">自動擷取 path 資料</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-black rounded-xl p-4 hover:bg-[#FFEF00]/10 transition-colors">
                                <Upload size={20} className="shrink-0" />
                                <span className="font-bold text-sm">選擇 .svg 檔案</span>
                                <input
                                  type="file"
                                  accept=".svg,image/svg+xml"
                                  className="hidden"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = ev => {
                                      try {
                                        const text = ev.target?.result as string;
                                        const parser = new DOMParser();
                                        const doc = parser.parseFromString(text, 'image/svg+xml');
                                        const svgEl = doc.querySelector('svg');
                                        const paths = Array.from(doc.querySelectorAll('path'));
                                        if (paths.length === 0) { showToast('SVG 中找不到 <path> 元素', 'error'); return; }

                                        // Determine viewBox for normalization
                                        const vb = svgEl?.getAttribute('viewBox')?.split(/[\s,]+/).map(Number) || [];
                                        const vbW = vb[2] || Number(svgEl?.getAttribute('width')) || 100;
                                        const vbH = vb[3] || Number(svgEl?.getAttribute('height')) || 100;

                                        // Normalize path coordinates to 0-1 range if viewBox is not already 0-1
                                        const needsNorm = vbW > 2 || vbH > 2;
                                        let combinedPath = paths.map(p => p.getAttribute('d') || '').join(' ').trim();

                                        if (needsNorm) {
                                          // Simple regex-based coordinate scaling: replace all numeric pairs
                                          combinedPath = combinedPath.replace(/(-?\d+(?:\.\d+)?)/g, (match, num) => {
                                            // We can't reliably distinguish X vs Y from regex alone,
                                            // so store the raw path and let user know to verify
                                            return num;
                                          });
                                          showToast(`已匯入 ${paths.length} 個 path（viewBox ${vbW}x${vbH}，請確認座標是否需要手動換算至 0~1）`);
                                        } else {
                                          showToast(`已匯入 ${paths.length} 個 path`);
                                        }

                                        // Auto-fill name from filename if empty
                                        const fileName = file.name.replace(/\.svg$/i, '');
                                        setNewMask(prev => ({
                                          name: prev.name || fileName,
                                          path: combinedPath
                                        }));
                                      } catch {
                                        showToast('SVG 解析失敗，請手動輸入 Path', 'error');
                                      }
                                    };
                                    reader.readAsText(file);
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-black uppercase">SVG Path
                                <span className="ml-2 text-[10px] font-bold text-black/40 normal-case">
                                  使用 objectBoundingBox 座標（0~1），多個路徑以空格分隔
                                </span>
                              </label>
                              <textarea
                                className="w-full border-2 border-black p-3 rounded-xl font-mono text-xs"
                                rows={4}
                                placeholder="M0.5,0 L1,1 L0,1 Z"
                                value={newMask.path}
                                onChange={e => setNewMask({...newMask, path: e.target.value})}
                              />
                            </div>
                            {newMask.path && (
                              <div className="space-y-1">
                                <label className="text-xs font-black uppercase">預覽</label>
                                <div className="w-32 h-32 border-2 border-black rounded-xl overflow-hidden bg-[#FFEF00]/20">
                                  <svg viewBox="0 0 100 100" className="w-full h-full">
                                    <defs>
                                      <clipPath id="preview-mask" clipPathUnits="objectBoundingBox">
                                        <path d={newMask.path} />
                                      </clipPath>
                                    </defs>
                                    <rect x="0" y="0" width="100" height="100" fill="#000" style={{clipPath:'url(#preview-mask)'}} />
                                  </svg>
                                </div>
                              </div>
                            )}
                            <button
                              onClick={handleAddMask}
                              disabled={isSavingMasks}
                              className={`w-full bg-black text-[#FFEF00] py-4 rounded-full font-black uppercase text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 ${isSavingMasks ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isSavingMasks ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                              {isSavingMasks ? '新增中...' : '新增遮罩'}
                            </button>
                          </div>
                        </div>
                      </section>
                    )}

                    {adminActiveTab === 'danger-disabled' && (
                      <section>
                        <h3 className="text-3xl font-black mb-8 flex items-center gap-3 text-red-600">
                          <Trash2 size={32} /> 系統維護
                        </h3>
                        <div className="bg-red-50 border-4 border-red-600 p-8 rounded-3xl shadow-[8px_8px_0px_rgba(220,38,38,0.2)]">
                          <h4 className="text-xl font-black mb-4 text-red-600 uppercase">危險區域</h4>
                          <p className="font-bold mb-6 text-red-900/70">
                            初始化操作將會清除資料庫中現有的所有單元、課程、活動、導師及學員感想，並填入系統預設資料。此操作不可撤銷。
                          </p>
                          <button 
                            onClick={async () => {
                              showConfirm("確定初始化", "這將會覆蓋現有資料，確定嗎？", async () => {
                                try {
                                const defaultUnits = [
                                  "AI 基礎理論 (U1)", "AI 提示詞工程 (U2)", "AI 影像生成 (U3)", "AI 影片創作 (U4)", 
                                  "水彩 (U5)", "編劇理論 (U6)", "角色設計 (U7)", "動畫理論1 (U8)", "動畫理論2 (U9)", "電腦合成 AE (U10)", 
                                  "AI 繪圖基礎 (U11)", "3D 建模入門 (U12)", "燈光與渲染 (U13)", "動態圖形設計 (U14)", "剪接技巧 (U15)", 
                                  "音效製作 (U16)", "故事板創作 (U17)", "人物骨架綁定 (U18)", "流體模擬 (U19)", "粒子特效 (U20)", 
                                  "AI 語音合成 (U21)", "虛擬攝影機控制 (U22)", "色彩校正 (U23)", "專案管理 (U24)", "市場營銷 (U25)", 
                                  "作品集製作 (U26)", "VR/AR 應用 (U27)", "遊戲引擎基礎 (U28)", "Python 腳本 (U29)", "AI 提示詞進階 (U30)", 
                                  "深度學習影像 (U31)", "風格遷移 (U32)", "動作捕捉 (U33)", "面部捕捉 (U34)", "數位雕刻 (U35)", 
                                  "材質貼圖 (U36)", "環境設計 (U37)", "UI/UX 設計 (U38)", "網頁動畫 (U39)", "移動應用開發 (U40)", 
                                  "區塊鏈與藝術 (U41)", "NFT 基礎 (U42)", "法律與版權 (U43)", "創業導論 (U44)", "實習項目 (U45)", "畢業作品 (U46)"
                                ];
                                const defaultCourses = [
                                  { id: 1, name: "AI全方位應用專業證書課程", type: "Certificate", mandatory: [0, 1, 2, 3], minUnits: 4, allowExtra: false, title: "AI全方位應用", subtitle: "（7大範疇）專業證書課程", desc: "四堂課程，全面掌握 AI 視覺應用", mask: "mask-cloud", img: "ai-cert" },
                                  { id: 2, name: "商業漫畫、插畫及2D動畫文憑", type: "Diploma", mandatory: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25], minUnits: 16, allowExtra: true, title: "商業漫畫、插畫", subtitle: "及2D動畫文憑", desc: "一年制，從零開始的專業創作之路", mask: "mask-book", img: "2d-anim" },
                                  { id: 3, name: "商業3D動畫文憑", type: "Diploma", mandatory: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45], minUnits: 16, allowExtra: true, title: "商業3D動畫文憑", subtitle: "", desc: "一年制，影視級 3D 建模與動畫技術", mask: "mask-box", img: "3d-anim" },
                                  { id: 4, name: "AI YouTuber 及多媒體文憑", type: "Diploma", mandatory: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 19, 20, 21, 22, 23, 24, 25, 38, 39], minUnits: 16, allowExtra: true, title: "AI YouTuber", subtitle: "及多媒體文憑", desc: "一年制，全方位多媒體製作與運營", mask: "mask-film", img: "youtuber" },
                                ];
                                const defaultActivities = [
                                  {
                                    id: 1,
                                    date: "2025年9月10日",
                                    title: "做動畫師真係開心，每日都可以「左擁右抱」！",
                                    content: "這個話現實世界冇童話？做動畫師嘅最大福利，就是每日返工都可以「左擁右抱」一班迪士尼公主！在 Nano Banana AI 技術與動畫工藝交織出的奇幻日常。透過 AI 生成技術，我們可以與經典角色「近距離接觸」。",
                                    img: "https://picsum.photos/seed/activity1/800/1000",
                                    tags: ["#AI", "#動畫", "#插畫", "#文憑", "#課程", "#youtuber", "#SAVFX", "#diploma", "#certificate", "#animation", "#illustration", "#NaveenMa", "#馬國樑"]
                                  },
                                ];
                                const defaultTutors = [
                                  { name: "Master Wong", role: "AI 動畫總監", desc: "擁有 20 年影視特效經驗，曾參與多部國際大片製作。", img: "https://picsum.photos/seed/tutor1/400/400" },
                                  { name: "Coach Chan", role: "多媒體製作專家", desc: "資深 YouTuber，擅長利用 AI 進行內容創作與自動化工作流。", img: "https://picsum.photos/seed/tutor2/400/400" }
                                ];
                                const defaultTestimonials = [
                                  { name: "阿強", text: "AI 動畫課程讓我大開眼界，製作效率提升了十倍！", img: "https://picsum.photos/seed/s1/200/200" },
                                  { name: "Sarah", text: "單元組合非常靈活，我可以只選我感興趣的 AI 技術。", img: "https://picsum.photos/seed/s2/200/200" },
                                  { name: "Ken", text: "導師非常專業，手把手教我們如何應用 AI 到實際項目中。", img: "https://picsum.photos/seed/s3/200/200" }
                                ];
                                const defaultGroupCourses = [
                                  { title: "3D Printing 工作坊", desc: "親手體驗 3D 打印技術與建模", mask: "mask-book", img: "3d-print" },
                                  { title: "小學生動畫工作坊", desc: "啟發創意，製作屬於自己的短片", mask: "mask-dream", img: "kids-anim" },
                                  { title: "動畫輪工作坊", mask: "mask-film", desc: "探索傳統動畫與現代技術的結合", img: "zoetrope" }
                                ];

                                for (let i = 0; i < defaultUnits.length; i++) {
                                  try {
                                    await apiSetDoc('units', i.toString(), { id: i, name: defaultUnits[i] });
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.CREATE, `units/${i}`);
                                  }
                                }
                                for (const c of defaultCourses) {
                                  try {
                                    await apiSetDoc('courses', c.id.toString(), c);
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.CREATE, `courses/${c.id}`);
                                  }
                                }
                                for (const a of defaultActivities) {
                                  try {
                                    await apiSetDoc('activities', a.id.toString(), a);
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.CREATE, `activities/${a.id}`);
                                  }
                                }
                                for (let i = 0; i < defaultTutors.length; i++) {
                                  try {
                                    await apiSetDoc('tutors', i.toString(), defaultTutors[i]);
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.CREATE, `tutors/${i}`);
                                  }
                                }
                                for (let i = 0; i < defaultTestimonials.length; i++) {
                                  try {
                                    await apiSetDoc('testimonials', i.toString(), defaultTestimonials[i]);
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.CREATE, `testimonials/${i}`);
                                  }
                                }
                                for (let i = 0; i < defaultGroupCourses.length; i++) {
                                  try {
                                    await apiSetDoc('groupCourses', `default-${i}`, defaultGroupCourses[i]);
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.CREATE, 'groupCourses');
                                  }
                                }
                                try {
                                  await apiSetDoc('settings', 'global', {
                                    ...siteSettings,
                                    address: '香港九龍...',
                                    facebookUrl: 'https://facebook.com/savfx',
                                    instagramUrl: 'https://instagram.com/savfx'
                                  });
                                  
                                  // Manually update local states for all data
                                  const seededUnits = defaultUnits.map((name, i) => ({ id: i, name }));
                                  setUnitNames(seededUnits);
                                  setAdminUnitNames(seededUnits);
                                  setCourses(defaultCourses);
                                  setActivities(defaultActivities);
                                  setTutors(defaultTutors.map((t, i) => ({ id: i.toString(), ...t })));
                                  setTestimonials(defaultTestimonials.map((t, i) => ({ id: i.toString(), ...t })));
                                  setGroupCourses(defaultGroupCourses.map((gc, i) => ({ id: `default-${i}`, ...gc })));
                                } catch (error) {
                                  handleFirestoreError(error, OperationType.WRITE, 'settings/global');
                                }
                                
                                showToast("初始化完成！請重新整理頁面。");
                              } catch (error) {
                                console.error("Initialization error:", error);
                                showToast("初始化失敗", "error");
                              }
                            });
                          }}
                            className="bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase hover:scale-105 transition-transform shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
                          >
                            初始化預設資料
                          </button>
                        </div>
                      </section>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-[6px] border-black p-8 rounded-[2rem] shadow-[12px_12px_0px_rgba(0,0,0,1)] max-w-md w-full"
            >
              <h3 className="text-2xl font-black mb-4 uppercase">{confirmModal.title}</h3>
              <p className="font-bold text-black/60 mb-8">{confirmModal.message}</p>
              <div className="flex gap-4">
                <button
                  disabled={confirmModal.loading}
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                  className="flex-1 py-4 rounded-full font-black border-4 border-black hover:bg-gray-100 transition-all disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  disabled={confirmModal.loading}
                  onClick={async () => {
                    setConfirmModal(prev => ({ ...prev, loading: true }));
                    try {
                      await confirmModal.onConfirm();
                    } catch (error) {
                      console.error("Confirm error:", error);
                    } finally {
                      setConfirmModal(prev => ({ ...prev, show: false, loading: false }));
                    }
                  }}
                  className="flex-1 py-4 rounded-full font-black bg-red-500 text-white border-4 border-black hover:scale-105 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {confirmModal.loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : '確定'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className={`px-8 py-4 rounded-full font-black border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-[#FFEF00] text-black' : 'bg-red-500 text-white'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

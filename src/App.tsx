import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, CloudRain, Calendar, CheckCircle, 
  MessageSquare, Coffee, Battery, Shirt, 
  ChevronRight, Wind, Umbrella, Send, X,
  Trash2, Briefcase, User, MoreHorizontal,
  ChevronLeft, Sparkles, Settings, ArrowUp, ArrowDown, Eye, EyeOff, Plus,
  Bell, BellRing, ListTodo, Target, Plane, Dumbbell, BookOpen, Palette, ShoppingBag, 
  Utensils, Video, Youtube, Instagram, DollarSign,
  Mic, MicOff, FileText, Home, CheckSquare, MoveHorizontal, MoveVertical,
  Edit3, Save, ChevronLeftSquare, ChevronRightSquare, Clock, Play, Pause, RotateCcw, AlignLeft,
  Heart, Star, Smile, Lightbulb, CreditCard, RefreshCw, Music, Droplets, CloudDrizzle, Flame, Tent
} from 'lucide-react';

// --- Gemini API 設定 (預留) ---
const API_KEY = ""; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

// --- Data Types ---
interface TaskItem {
    id: string;
    title: string;
    completed: boolean;
    type: 'routine' | 'adhoc'; 
    date: string; 
}

interface EventItem {
    id: string;
    title: string;
    startDate: string; 
    time?: string; 
    endDate?: string;  
    type: 'work' | 'personal' | 'important';
    completed: boolean; 
    note?: string; 
}

interface WishItem {
    id: string;
    title: string;
    completed: boolean;
}

interface ExpenseItem {
    id: string;
    title: string;
    amount: number;
    date: string;
}

interface DailyRecord {
    date: string; 
    note: string; 
}

interface SpaceItem {
    id: string;
    label: string;
    iconName: string;
    color: string;
    content: string[];
}

interface Suggestion {
    time: string;
    title: string;
}

interface CountdownItem {
    id: string;
    title: string;
    targetDate: string; 
    tag: '私人' | '工作' | '提醒';
    completed: boolean;
}

interface TodoItem {
    id: string;
    title: string;
    priority: '高' | '中' | '低';
    completed: boolean;
    tag: '私人' | '工作';
}

// --- Widget System ---
type WidgetType = 'weather' | 'schedule' | 'mood' | 'suggestion' | 'shortcuts' | 'events' | 'todo' | 'calendar' | 'navigator' | 'voice_memo' | 'focus_timer' | 'wishlist' | 'finance' | 'quote' | 'water' | 'noise' | 'countdown';

interface WidgetConfig {
  id: string;
  type: WidgetType;
  colSpan: number; 
  rowSpan: number; 
  label: string;
}

// Layout Configs
const DEFAULT_MOBILE_LAYOUT: WidgetConfig[] = [
  { id: 'w_nav', type: 'navigator', colSpan: 2, rowSpan: 1, label: '空間導航' },
  { id: 'w_schedule', type: 'schedule', colSpan: 2, rowSpan: 1, label: '今日行程與規劃' },
  { id: 'w_events', type: 'events', colSpan: 2, rowSpan: 2, label: '近期行程表' },
  { id: 'w_wish', type: 'wishlist', colSpan: 2, rowSpan: 2, label: '想做的事情' }, 
  { id: 'w_cal', type: 'calendar', colSpan: 2, rowSpan: 2, label: '行事曆' },
  { id: 'w_finance', type: 'finance', colSpan: 2, rowSpan: 1, label: '簡易記帳' },
  { id: 'w_timer', type: 'focus_timer', colSpan: 2, rowSpan: 1, label: '專注番茄鐘' },
  { id: 'w_water', type: 'water', colSpan: 1, rowSpan: 1, label: '喝水小幫手' },
  { id: 'w_noise', type: 'noise', colSpan: 1, rowSpan: 1, label: '白噪音' }, 
  { id: 'w_quote', type: 'quote', colSpan: 2, rowSpan: 1, label: '每日靈感' },
  { id: 'w_weather', type: 'weather', colSpan: 1, rowSpan: 1, label: '天氣資訊' },
  { id: 'w_mood', type: 'mood', colSpan: 1, rowSpan: 1, label: '能量狀態' },
];

const DEFAULT_DESKTOP_LAYOUT: WidgetConfig[] = [
  { id: 'w_nav', type: 'navigator', colSpan: 4, rowSpan: 1, label: '空間導航' },
  { id: 'w_schedule', type: 'schedule', colSpan: 2, rowSpan: 2, label: '今日行程與規劃' },
  { id: 'w_events', type: 'events', colSpan: 1, rowSpan: 2, label: '近期行程表' },
  { id: 'w_wish', type: 'wishlist', colSpan: 1, rowSpan: 2, label: '想做的事情' },
  { id: 'w_cal', type: 'calendar', colSpan: 2, rowSpan: 2, label: '行事曆' },
  { id: 'w_finance', type: 'finance', colSpan: 1, rowSpan: 2, label: '簡易記帳' },
  { id: 'w_water', type: 'water', colSpan: 1, rowSpan: 1, label: '喝水小幫手' }, 
  { id: 'w_noise', type: 'noise', colSpan: 1, rowSpan: 1, label: '白噪音' }, 
  { id: 'w_quote', type: 'quote', colSpan: 1, rowSpan: 1, label: '每日靈感' },
  { id: 'w_timer', type: 'focus_timer', colSpan: 1, rowSpan: 1, label: '專注番茄鐘' },
  { id: 'w_weather', type: 'weather', colSpan: 1, rowSpan: 1, label: '天氣資訊' },
  { id: 'w_mood', type: 'mood', colSpan: 1, rowSpan: 1, label: '能量狀態' },
];

// --- Mock Data ---
const DEFAULT_EVENTS: EventItem[] = [
    { id: 'e1', title: '光電年會', startDate: '2025-12-06', time: '09:00', type: 'work', completed: false, note: '記得帶名片' },
    { id: 'e2', title: '寶寶豬去泰國', startDate: '2025-12-17', endDate: '2025-12-22', type: 'personal', completed: false },
    { id: 'e3', title: '寶寶豬生日', startDate: '2025-12-20', type: 'important', completed: false },
];

const DEFAULT_WISHES: WishItem[] = [
    { id: 'wi1', title: '去學陶藝', completed: false },
    { id: 'wi2', title: '吃 A Cut 牛排', completed: false },
];

const DEFAULT_ROUTINES_LIST = [
    "晨間閱讀 10 分鐘",
    "喝水 2000cc",
    "確認明日行程"
];

const DEFAULT_SPACES: SpaceItem[] = [
    { id: 's1', label: '個人狀態', iconName: 'User', color: 'bg-orange-100 text-orange-600', content: ['早睡早起'] },
    { id: 's2', label: '理財規劃', iconName: 'DollarSign', color: 'bg-green-100 text-green-600', content: ['本月預算: 30000'] },
    { id: 's3', label: '工作紀錄', iconName: 'Briefcase', color: 'bg-blue-100 text-blue-600', content: ['客戶 B 會議記錄'] },
    { id: 's4', label: 'YouTube', iconName: 'Youtube', color: 'bg-red-100 text-red-600', content: ['影片腳本構思'] },
    { id: 's5', label: 'IG 攝影', iconName: 'Instagram', color: 'bg-pink-100 text-pink-600', content: ['發文排程'] },
    { id: 's6', label: '網購清單', iconName: 'ShoppingBag', color: 'bg-purple-100 text-purple-600', content: ['除濕機'] },
    { id: 's7', label: '運動資料', iconName: 'Dumbbell', color: 'bg-slate-100 text-slate-600', content: ['跑步 5km'] },
    { id: 's8', label: '旅遊規劃', iconName: 'Plane', color: 'bg-sky-100 text-sky-600', content: ['泰國行程表'] },
];

const DEFAULT_COUNTDOWNS: CountdownItem[] = [];
const DEFAULT_TODOS: TodoItem[] = []; 
const DEFAULT_SCHEDULE: TaskItem[] = [];

// --- Helpers ---
const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const getIcon = (name: string) => {
    const icons: any = { User, DollarSign, Briefcase, Youtube, Instagram, ShoppingBag, Dumbbell, Plane, Music, Heart, Star, Smile, BookOpen, Coffee, Lightbulb, CreditCard, Droplets, CloudDrizzle, Flame, Tent };
    return icons[name] || CheckCircle;
};

const parseVoiceToTasks = (text: string): string[] => {
    const splitters = /，|。|！|\s|然後|還有|接著|另外|記得|要去|要|幫我/;
    let rawItems = text.split(splitters)
        .map(s => s.trim())
        .filter(s => s.length > 1);
    rawItems = rawItems.filter(s => !['記錄', '一下', '今天', '大概', '是這樣'].includes(s));
    if (rawItems.length === 1 && rawItems[0].length > 10) {
        return [rawItems[0]]; 
    }
    return rawItems;
};

const parseDateFromText = (text: string): string => {
    const today = new Date();
    let target = new Date(today);
    if (text.includes('明天')) target.setDate(today.getDate() + 1);
    else if (text.includes('後天')) target.setDate(today.getDate() + 2);
    else if (text.includes('下週')) target.setDate(today.getDate() + 7);
    else if (text.includes('下個月')) target.setMonth(today.getMonth() + 1);
    
    const dateMatch = text.match(/(\d{1,2})[月\/](\d{1,2})/);
    if (dateMatch) {
        target.setMonth(parseInt(dateMatch[1]) - 1);
        target.setDate(parseInt(dateMatch[2]));
        if (target < today && !text.includes('去年')) target.setFullYear(today.getFullYear() + 1);
    }
    return `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,'0')}-${String(target.getDate()).padStart(2,'0')}`;
};

const determineCategory = (text: string) => {
    if (text.match(/會議|開會|報告|客戶|面試|deadline|專案|工作|老闆/i)) return 'work';
    if (text.match(/運動|健身|跑步|瑜珈|重訓|看醫生|吃藥|喝水|休息/i)) return 'health';
    if (text.match(/約會|電影|聚餐|吃飯|買|逛街|遊戲/i)) return 'personal';
    return 'general';
};

const getDaysLeft = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const MOCK_WEATHER = { temp: 24, condition: 'Cloudy', humidity: 65, location: '台北市' };

const sendNotification = (title: string, body: string) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        try { new Notification(title, { body: body, icon: 'https://cdn-icons-png.flaticon.com/512/252/252025.png' }); } catch (e) { console.error(e); }
    }
};

// API Call
const fetchWithRetry = async (url: string, options: any) => {
    for (let i = 0; i < 3; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429 && i < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
                continue;
            }
            if (!response.ok) throw new Error(`API failed`);
            return response.json();
        } catch (error) {
            if (i === 2) throw error;
        }
    }
};

const generateScheduleSuggestions = async (theme: string): Promise<Suggestion[] | null> => {
    const systemPrompt = `你是一個精準且富有創意的行程規劃助理。根據用戶提供的「${theme}」主題，生成 3 個具體的行程建議。輸出必須是 JSON 格式。`;
    const userQuery = `請為我生成 3 個關於「${theme}」的行程建議。例如：「10:00 享用早午餐」、「14:30 閱讀新書」等。`;
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "OBJECT", properties: { "time": { "type": "STRING" }, "title": { "type": "STRING" } }, required: ["time", "title"] } } },
    };
    try {
        const result = await fetchWithRetry(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) return JSON.parse(jsonText);
        return null;
    } catch { return null; }
};

// --- COMPONENTS ---

// 1. Widget Wrapper
const WidgetWrapper: React.FC<{
    config: WidgetConfig;
    isEditing: boolean;
    isMobile: boolean;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
    onResizeWidth: () => void;
    onResizeHeight: () => void;
    onToggleVisibility: () => void;
    index: number; 
    children: React.ReactNode;
}> = ({ config, isEditing, isMobile, onDragStart, onDragOver, onDrop, onResizeWidth, onResizeHeight, onToggleVisibility, index, children }) => {
    let colClass = '';
    if (isMobile) {
        colClass = config.colSpan === 2 ? 'col-span-2' : 'col-span-1';
    } else {
        switch(config.colSpan) {
            case 1: colClass = 'md:col-span-1'; break;
            case 2: colClass = 'md:col-span-2'; break;
            case 3: colClass = 'md:col-span-3'; break;
            case 4: colClass = 'md:col-span-4'; break;
            default: colClass = 'md:col-span-1';
        }
    }
    
    let rowClass = '';
    switch(config.rowSpan) {
        case 1: rowClass = 'row-span-1'; break;
        case 2: rowClass = 'row-span-2'; break;
        case 3: rowClass = 'row-span-3'; break;
        default: rowClass = 'row-span-1';
    }

    const [isDraggingOver, setIsDraggingOver] = useState(false);

    return (
        <div 
            className={`relative transition-all duration-300 ${colClass} ${rowClass} ${isEditing ? 'cursor-move' : ''}`}
            draggable={isEditing}
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={onDragOver}
            onDragEnter={() => isEditing && setIsDraggingOver(true)}
            onDragLeave={() => isEditing && setIsDraggingOver(false)}
            onDrop={(e) => { onDrop(e, index); setIsDraggingOver(false); }}
        >
            <div className={`h-full ${isEditing ? 'scale-95 opacity-90 pointer-events-none' : 'scale-100 opacity-100'} transition-transform duration-300 ${isDraggingOver && isEditing ? 'border-4 border-dashed border-indigo-400 opacity-50 rounded-2xl' : ''}`}>
                {children}
            </div>
            {isEditing && (
                <div className="absolute inset-0 z-20 rounded-2xl border-2 border-indigo-400 bg-indigo-50/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
                    <span className="text-xs font-bold text-indigo-700 bg-white px-3 py-1 rounded-full shadow-sm">{config.label}</span>
                    <div className="flex gap-2">
                         <button onClick={onResizeWidth} className="p-2 bg-white rounded-full shadow-md hover:bg-blue-100 text-blue-600 flex items-center gap-1 px-3">
                            <MoveHorizontal size={16} />
                            <span className="text-[10px] font-bold">{config.colSpan}</span>
                        </button>
                        <button onClick={onResizeHeight} className="p-2 bg-white rounded-full shadow-md hover:bg-blue-100 text-blue-600 flex items-center gap-1 px-3">
                            <MoveVertical size={16} />
                            <span className="text-[10px] font-bold">{config.rowSpan}</span>
                        </button>
                        <button onClick={onToggleVisibility} className="p-2 bg-white rounded-full shadow-md hover:bg-red-100 text-red-500"><EyeOff size={16} /></button>
                    </div>
                    <span className="text-xs text-indigo-700 font-medium mt-2">← 拖曳來排序 →</span>
                </div>
            )}
        </div>
    );
};

// 2. Event Detail Modal
const EventDetailModal = ({ event, onClose, onSave, onDelete }: { event: EventItem, onClose: () => void, onSave: (e: EventItem) => void, onDelete: (id: string) => void }) => {
    const [editData, setEditData] = useState(event);

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">編輯行程</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">標題</label>
                        <input className="w-full text-lg font-medium border-b border-slate-200 py-1 focus:border-indigo-500 outline-none" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">日期</label>
                            <input type="date" className="w-full py-2 bg-slate-50 rounded-lg px-3 mt-1 text-sm outline-none" value={editData.startDate} onChange={e => setEditData({...editData, startDate: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">時間 (選填)</label>
                            <input type="time" className="w-full py-2 bg-slate-50 rounded-lg px-3 mt-1 text-sm outline-none" value={editData.time || ''} onChange={e => setEditData({...editData, time: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">備註</label>
                        <textarea className="w-full h-24 bg-slate-50 rounded-lg p-3 mt-1 text-sm resize-none outline-none" placeholder="新增備註..." value={editData.note || ''} onChange={e => setEditData({...editData, note: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="completed" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={editData.completed} onChange={e => setEditData({...editData, completed: e.target.checked})} />
                        <label htmlFor="completed" className="text-sm text-slate-700">標記為已完成 (從近期列表中隱藏)</label>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={() => onDelete(editData.id)} className="flex-1 py-3 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 transition-colors">刪除</button>
                    <button onClick={() => onSave(editData)} className="flex-[2] py-3 text-white font-bold bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">儲存變更</button>
                </div>
            </div>
        </div>
    );
};

// 3. Events Widget
const EventsWidget = ({ events, onAdd, onDelete, onOpenDetail }: { events: EventItem[], onAdd: (title: string, date: string) => void, onDelete: (id: string) => void, onOpenDetail: (id: string) => void }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');

    const handleAdd = () => {
        if(newTitle && newDate) {
            onAdd(newTitle, newDate);
            setIsAdding(false);
            setNewTitle('');
            setNewDate('');
        }
    };

    const activeEvents = events.filter(e => !e.completed).sort((a,b) => a.startDate.localeCompare(b.startDate));

    return (
        <div className="h-full bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-3 flex-none">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Target size={20} className="text-red-500"/> 近期行程</h3>
                <button onClick={() => setIsAdding(!isAdding)} className="p-1 rounded-full hover:bg-slate-100 text-indigo-600"><Plus size={18}/></button>
            </div>
            
            {isAdding && (
                <div className="mb-3 p-2 bg-slate-50 rounded-xl animate-in slide-in-from-top-2 flex-none">
                    <input type="text" placeholder="行程名稱" className="w-full text-sm p-1 bg-transparent border-b mb-2 outline-none" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <input type="date" className="w-full text-sm p-1 bg-transparent outline-none mb-2" value={newDate} onChange={e => setNewDate(e.target.value)} />
                    <button onClick={handleAdd} className="w-full bg-indigo-600 text-white rounded-lg py-1 text-xs">確認新增</button>
                </div>
            )}

            <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-1 min-h-0">
                {activeEvents.length === 0 ? <div className="text-center text-slate-400 text-xs mt-10">目前沒有進行中的行程</div> : activeEvents.map(item => {
                    const diffDays = getDaysLeft(item.startDate);
                    
                    return (
                        <div key={item.id} onClick={() => onOpenDetail(item.id)} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 group transition-all cursor-pointer">
                            <div className="flex flex-col min-w-0 flex-1 mr-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.type === 'work' ? 'bg-blue-400' : item.type === 'personal' ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
                                    <span className="text-sm font-bold text-slate-700 truncate">{item.title}</span>
                                </div>
                                <div className="flex gap-2 ml-3.5 items-center text-[10px] text-slate-400">
                                    <span>{item.startDate}</span>
                                    {item.time && <span className="bg-slate-100 px-1 rounded">{item.time}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {diffDays >= 0 ? (
                                    <div className="text-right">
                                        <div className={`text-lg font-bold leading-none ${diffDays <= 7 ? 'text-red-500' : 'text-indigo-600'}`}>{diffDays}</div>
                                        <div className="text-[9px] text-slate-400">天</div>
                                    </div>
                                ) : (
                                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500">已結束</span>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

// 4. Calendar Widget
const CalendarWidget = ({ events, onOpenDetail }: { events: EventItem[], onOpenDetail: (id: string) => void }) => {
    const [displayDate, setDisplayDate] = useState(new Date());
    
    const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();
    const days = [];

    const changeMonth = (offset: number) => {
        const newDate = new Date(displayDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setDisplayDate(newDate);
    };

    const goToday = () => {
        setDisplayDate(new Date());
    };

    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="h-full"></div>);

    for (let i = 1; i <= daysInMonth; i++) {
        const today = new Date();
        const isToday = i === today.getDate() && displayDate.getMonth() === today.getMonth() && displayDate.getFullYear() === today.getFullYear();
        const currentDateStr = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        const dayEvents = events.filter(e => {
            if (e.endDate) return currentDateStr >= e.startDate && currentDateStr <= e.endDate;
            return e.startDate === currentDateStr;
        });

        let bgClass = isToday ? 'bg-indigo-50 border-t-2 border-indigo-500' : 'bg-white';
        if (dayEvents.length > 0 && !isToday) bgClass = 'bg-slate-50/80';

        days.push(
            <div key={i} className={`h-full min-h-[40px] border-t border-l border-slate-100 flex flex-col items-start justify-start p-1 relative ${bgClass}`}>
                <span className={`text-[10px] w-4 h-4 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}>{i}</span>
                <div className="w-full flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                    {dayEvents.slice(0,2).map(e => (
                        <div key={e.id} onClick={() => onOpenDetail(e.id)} className={`text-[8px] truncate w-full px-1 rounded-sm cursor-pointer hover:opacity-80 ${e.completed ? 'opacity-50 line-through bg-slate-200 text-slate-500' : e.type==='work'?'bg-blue-100 text-blue-700':e.type==='personal'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>
                            {e.title}
                        </div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[8px] text-slate-400 pl-1">+{dayEvents.length - 2}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-2 flex-none">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Calendar size={20} className="text-indigo-500"/> {displayDate.getMonth()+1}月</h3>
                <div className="flex gap-2 items-center">
                    <button onClick={goToday} className="p-1 hover:bg-slate-100 rounded text-slate-500 text-xs font-bold flex items-center gap-1 border border-slate-200"><RotateCcw size={12}/>今天</button>
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft size={16}/></button>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronRight size={16}/></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-0 text-center mb-1 border-b border-slate-100 pb-1 flex-none">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="text-[10px] text-slate-400 font-bold">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0 flex-1 border-r border-b border-slate-100 overflow-y-auto">
                {days}
            </div>
        </div>
    );
};

// 5. Daily Schedule Widget (Filtered)
const DailyScheduleWidget = ({ tasks, events, onClick }: { tasks: TaskItem[], events: EventItem[], onClick: () => void }) => {
    const todayStr = getTodayStr();
    // 1. Filter out routines (Only show adhoc)
    const incompleteTasks = tasks.filter(t => t.date === todayStr && !t.completed && t.type === 'adhoc');
    // 2. Show active events
    const todayEvents = events.filter(e => e.startDate === todayStr && !e.completed);

    return (
        <div onClick={onClick} className="h-full bg-gradient-to-br from-white to-slate-50 p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col cursor-pointer hover:shadow-md transition-all group overflow-hidden">
            <div className="flex justify-between items-center mb-4 flex-none">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg"><ListTodo size={20} className="text-emerald-500"/> 今日行程與規劃</h3>
                <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" size={20} />
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar min-h-0">
                {todayEvents.length > 0 && (
                    <div className="space-y-1 mb-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">固定行程</span>
                        {todayEvents.map(e => (
                            <div key={e.id} className="flex items-center gap-2 text-sm bg-indigo-50 p-2 rounded-lg text-indigo-800 border border-indigo-100">
                                <Clock size={14} className="text-indigo-500"/>
                                <span className="font-mono text-xs font-bold">{e.time || '全天'}</span>
                                <span className="truncate">{e.title}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1 block">待辦事項 ({incompleteTasks.length})</span>
                    {incompleteTasks.slice(0, 5).map(t => (
                        <div key={t.id} className="flex items-center gap-2 text-sm text-slate-700 py-1">
                            <div className="w-4 h-4 border-2 border-slate-300 rounded-md flex-shrink-0"></div>
                            <span className="truncate">{t.title}</span>
                        </div>
                    ))}
                    {incompleteTasks.length === 0 && todayEvents.length === 0 && <div className="text-slate-400 text-sm italic mt-4 text-center">點擊開始規劃今天...</div>}
                    {incompleteTasks.length > 5 && <div className="text-xs text-slate-400 pl-6">...還有 {incompleteTasks.length - 5} 項</div>}
                </div>
            </div>
        </div>
    );
};

// 6. Navigator Widget
const NavigatorWidget = ({ spaces, onNavigate, onAddSpace }: { spaces: SpaceItem[], onNavigate: (id: string) => void, onAddSpace: () => void }) => {
    return (
        <div className="h-full bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center overflow-hidden">
             <div className="flex justify-between items-center mb-3 ml-1 flex-none"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">空間導航</h3><button onClick={onAddSpace} className="text-slate-400 hover:text-indigo-600 transition-colors"><Plus size={18} /></button></div>
             <div className="grid grid-cols-4 md:grid-cols-8 gap-3 flex-1 overflow-y-auto custom-scrollbar">
                {spaces.map((space) => {
                    const IconComp = getIcon(space.iconName);
                    return (
                        <button key={space.id} className="flex flex-col items-center gap-2 group p-2" onClick={() => onNavigate(space.id)}>
                            <div className={`p-3 rounded-2xl ${space.color} group-hover:scale-110 transition-transform shadow-sm`}><IconComp size={20} /></div>
                            <span className="text-[10px] font-medium text-slate-600 group-hover:text-slate-900 truncate w-full text-center">{space.label}</span>
                        </button>
                    );
                })}
             </div>
        </div>
    );
};

// 7. Focus Timer Widget
const FocusTimerWidget = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    
    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            sendNotification("專注時間結束", "休息一下吧！");
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => { setIsActive(false); setTimeLeft(25 * 60); };
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-full bg-slate-800 text-white p-5 rounded-3xl shadow-lg flex flex-col justify-center items-center relative overflow-hidden">
            <div className="z-10 flex flex-col items-center">
                <div className="text-4xl font-mono font-bold tracking-widest mb-3">{formatTime(timeLeft)}</div>
                <div className="flex gap-4">
                    <button onClick={toggleTimer} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                        {isActive ? <Pause size={20}/> : <Play size={20}/>}
                    </button>
                    <button onClick={resetTimer} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                        <RefreshCw size={20}/>
                    </button>
                </div>
            </div>
            {isActive && <div className="absolute inset-0 bg-emerald-500/20 animate-pulse"></div>}
        </div>
    );
};

// 8. Wishlist Widget
const WishlistWidget = ({ wishes, onAdd, onToggle, onDelete }: { wishes: WishItem[], onAdd: (t: string) => void, onToggle: (id: string) => void, onDelete: (id: string) => void }) => {
    const [newWish, setNewWish] = useState('');
    return (
        <div className="h-full bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-3 flex-none">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Star size={20} className="text-yellow-500"/> 想做的事情</h3>
                <span className="text-[10px] text-slate-400">總計 {wishes.length} 項</span>
            </div>
            <div className="flex gap-2 mb-3 flex-none">
                <input className="flex-1 bg-slate-50 border-none rounded-lg px-3 py-1.5 text-xs outline-none" placeholder="新增願望..." value={newWish} onChange={e => setNewWish(e.target.value)} onKeyPress={e => {if(e.key==='Enter' && newWish) {onAdd(newWish); setNewWish('');}}}/>
                <button onClick={() => {if(newWish) {onAdd(newWish); setNewWish('');}}} className="bg-yellow-500 text-white rounded-lg px-2"><Plus size={16}/></button>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                {wishes.map(w => (
                    <div key={w.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${w.completed ? 'bg-yellow-500 border-yellow-500' : 'border-slate-300'}`} onClick={() => onToggle(w.id)}>
                            {w.completed && <CheckCircle size={12} className="text-white"/>}
                        </div>
                        <span className={`flex-1 text-sm ${w.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{w.title}</span>
                        <button onClick={() => onDelete(w.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 9. Finance Widget
const FinanceWidget = ({ expenses, onAdd }: { expenses: ExpenseItem[], onAdd: (title: string, amount: number) => void }) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const todayTotal = expenses.filter(e => e.date === getTodayStr()).reduce((acc, curr) => acc + curr.amount, 0);

    const handleAdd = () => {
        if(title && amount) {
            onAdd(title, parseInt(amount));
            setTitle('');
            setAmount('');
        }
    };

    return (
        <div className="h-full bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-3 flex-none">
                <h3 className="font-bold text-emerald-800 flex items-center gap-2"><DollarSign size={20}/> 簡易記帳</h3>
                <span className="text-xs font-bold text-emerald-600">今日: ${todayTotal}</span>
            </div>
            <div className="flex gap-2 mb-2 flex-none">
                <input className="flex-[2] bg-white border-none rounded-lg px-2 py-1 text-xs outline-none" placeholder="項目" value={title} onChange={e => setTitle(e.target.value)} />
                <input className="flex-1 bg-white border-none rounded-lg px-2 py-1 text-xs outline-none" type="number" placeholder="$" value={amount} onChange={e => setAmount(e.target.value)} />
                <button onClick={handleAdd} className="bg-emerald-600 text-white rounded-lg px-2"><Plus size={16}/></button>
            </div>
            <div className="space-y-1 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                {expenses.filter(e => e.date === getTodayStr()).map(e => (
                    <div key={e.id} className="flex justify-between text-xs text-emerald-800 border-b border-emerald-100 py-1">
                        <span>{e.title}</span>
                        <span className="font-mono">${e.amount}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 10. Quote Widget
const QuoteWidget = () => {
    const quotes = [
        "效率是把事情做對，效能是做對的事情。",
        "今天的努力，是為了未來的自由。",
        "專注當下，就是最好的準備。",
        "不要等待機會，而要創造機會。",
        "休息是為了走更長遠的路。"
    ];
    const [quote, setQuote] = useState(quotes[0]);
    useEffect(() => {
        setQuote(quotes[new Date().getDate() % quotes.length]);
    }, []);

    return (
        <div className="h-full bg-indigo-600 text-white p-5 rounded-3xl flex flex-col justify-center items-center text-center relative overflow-hidden">
            <Lightbulb size={40} className="text-yellow-300 mb-2 opacity-80"/>
            <p className="text-sm font-medium leading-relaxed opacity-90">"{quote}"</p>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
        </div>
    );
};

// 11. Water Tracker Widget
const WaterWidget = () => {
    const [count, setCount] = useState(0);
    const goal = 2000;
    const current = count * 250;
    const percentage = Math.min(100, (current / goal) * 100);

    return (
        <div className="h-full bg-sky-50 p-5 rounded-3xl border border-sky-100 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center z-10">
                 <h3 className="font-bold text-sky-800 flex items-center gap-2"><Droplets size={20}/> 喝水</h3>
                 <span className="text-xs font-bold text-sky-600">{current}ml</span>
            </div>
            <div className="flex items-center gap-2 z-10">
                <button onClick={() => setCount(c => Math.max(0, c - 1))} className="p-1 bg-white rounded-full text-sky-300 hover:text-sky-600 shadow-sm"><Trash2 size={14}/></button>
                <div className="flex-1 h-2 bg-sky-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-400 transition-all duration-500" style={{width: `${percentage}%`}}></div>
                </div>
                <button onClick={() => setCount(c => c + 1)} className="p-1 bg-sky-500 rounded-full text-white shadow-md hover:bg-sky-600"><Plus size={16}/></button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-sky-200 opacity-20 rounded-b-3xl" style={{height: `${percentage/2}%`}}></div>
        </div>
    );
};

// 12. White Noise Widget
const NoiseWidget = () => {
    const [active, setActive] = useState<string | null>(null);
    
    const toggleSound = (type: string) => {
        if (active === type) setActive(null);
        else setActive(type);
    };

    return (
        <div className="h-full bg-slate-800 text-white p-5 rounded-3xl flex flex-col justify-between overflow-hidden">
             <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-2"><Music size={16}/> 專注白噪音</div>
             <div className="flex justify-between gap-2">
                 <button onClick={() => toggleSound('rain')} className={`flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${active==='rain' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                     <CloudDrizzle size={20} />
                     <span className="text-[10px] mt-1">雨聲</span>
                 </button>
                 <button onClick={() => toggleSound('fire')} className={`flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${active==='fire' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                     <Flame size={20} />
                     <span className="text-[10px] mt-1">營火</span>
                 </button>
                 <button onClick={() => toggleSound('cafe')} className={`flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${active==='cafe' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                     <Coffee size={20} />
                     <span className="text-[10px] mt-1">咖啡</span>
                 </button>
             </div>
        </div>
    );
};

// 13. Voice Memo Widget
const VoiceMemoWidget = () => {
    const [isListening, setIsListening] = useState(false);
    const [memo, setMemo] = useState(() => localStorage.getItem('butler_daily_memo') || '');
    useEffect(() => { localStorage.setItem('butler_daily_memo', memo); }, [memo]);
    const toggleListening = () => {
        if (isListening) { setIsListening(false); } else {
            setIsListening(true);
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'zh-TW';
                recognition.onresult = (event: any) => { setMemo(prev => prev + (prev ? '\n' : '') + event.results[0][0].transcript); setIsListening(false); };
                recognition.onerror = () => setIsListening(false);
                recognition.start();
            } else { alert("瀏覽器不支援"); setIsListening(false); }
        }
    };
    return (
        <div className="h-full bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[200px]">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Mic size={20} className="text-pink-500"/> 每日碎碎念</h3>
                <button onClick={toggleListening} className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{isListening ? <MicOff size={16} /> : <Mic size={16} />}</button>
            </div>
            <textarea className="flex-1 w-full resize-none bg-slate-50 rounded-xl p-3 text-sm text-slate-700 border-none focus:ring-2 focus:ring-indigo-100 custom-scrollbar" placeholder="按麥克風說：今天要記得..." value={memo} onChange={(e) => setMemo(e.target.value)} />
            <div className="text-[10px] text-slate-400 mt-2 text-right">僅儲存於此</div>
        </div>
    );
};

// 14. Countdown Widget
const CountdownWidget = ({ items, onComplete }: { items: CountdownItem[], onComplete: (id: string) => void }) => {
    const activeItems = items.filter(i => !i.completed);
    return (
        <div className="h-full bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[200px]">
            <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-slate-700 flex items-center gap-2"><Target size={20} className="text-red-500"/> 倒數目標</h3><span className="text-[10px] text-slate-400">點擊勾選完成</span></div>
            <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
                {activeItems.length === 0 ? <div className="text-center text-slate-400 text-xs mt-10">無進行中目標</div> : activeItems.map(item => {
                    const daysLeft = getDaysLeft(item.targetDate);
                    return (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 group">
                            <div className="flex flex-col"><span className="text-sm font-bold text-slate-700">{item.title}</span><div className="flex gap-2 items-center mt-1"><span className="text-[10px] text-slate-400">{item.targetDate}</span><span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.tag === '私人' ? 'bg-yellow-100 text-yellow-700' : item.tag === '工作' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{item.tag}</span></div></div>
                            <div className="flex items-center gap-3"><div className="flex flex-col items-end"><span className={`text-xl font-bold ${daysLeft <= 7 ? 'text-red-500' : 'text-indigo-600'}`}>{daysLeft}</span><span className="text-[10px] text-slate-400">天</span></div><button onClick={() => onComplete(item.id)} className="opacity-0 group-hover:opacity-100 p-1.5 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200 transition-all"><CheckSquare size={14} /></button></div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

// 15. Todo Widget
const TodoWidget = ({ items, onToggle }: { items: TodoItem[], onToggle: (id: string) => void }) => {
    return (
        <div className="h-full bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[200px]">
             <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-slate-700 flex items-center gap-2"><ListTodo size={20} className="text-emerald-500"/> 夢想清單</h3><span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">有時間就做✅</span></div>
            <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer" onClick={() => onToggle(item.id)}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>{item.completed && <CheckCircle size={14} className="text-white" />}</div>
                        <div className="flex-1"><div className={`text-sm font-medium ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.title}</div><div className="flex gap-2 mt-0.5"><span className="text-[10px] text-slate-400">{item.tag}</span>{item.priority === '高' && <span className="text-[10px] text-red-500 bg-red-50 px-1 rounded">High</span>}</div></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 16. Daily Detail View (Enhanced Logic)
const DailyDetailView = ({ 
    tasks, 
    events,
    onUpdateTasks, 
    onBack,
    dailyRecords,
    onSaveRecord,
    routinesList,
    onUpdateRoutines
}: { 
    tasks: TaskItem[], 
    events: EventItem[],
    onUpdateTasks: (tasks: TaskItem[]) => void, 
    onBack: () => void,
    dailyRecords: DailyRecord[],
    onSaveRecord: (date: string, note: string) => void,
    routinesList: string[],
    onUpdateRoutines: (routines: string[]) => void
}) => {
    const [currentDate, setCurrentDate] = useState(getTodayStr());
    const [note, setNote] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [newRoutine, setNewRoutine] = useState('');

    const dayTasks = tasks.filter(t => t.date === currentDate);
    const dayEvents = events.filter(e => e.startDate === currentDate);
    const routines = dayTasks.filter(t => t.type === 'routine');
    const adhocTasks = dayTasks.filter(t => t.type === 'adhoc');

    useEffect(() => {
        const record = dailyRecords.find(r => r.date === currentDate);
        setNote(record ? record.note : '');
    }, [currentDate, dailyRecords]);

    const handleToggleTask = (id: string) => {
        onUpdateTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const handleAddTask = (title: string, type: 'routine'|'adhoc' = 'adhoc') => {
        const newTask: TaskItem = { id: String(Date.now() + Math.random()), title, completed: false, type, date: currentDate };
        onUpdateTasks([...tasks, newTask]);
    };

    const handleDeleteTask = (id: string) => onUpdateTasks(tasks.filter(t => t.id !== id));

    const handleAddRoutine = () => {
        if(newRoutine.trim()) {
            onUpdateRoutines([...routinesList, newRoutine]);
            handleAddTask(newRoutine, 'routine');
            setNewRoutine('');
        }
    };

    const handleDeleteRoutineProto = (text: string) => {
        if(confirm(`確定要刪除「${text}」這個例行公事嗎？以後不會自動出現，但今天的紀錄會保留。`)) {
            onUpdateRoutines(routinesList.filter(r => r !== text));
        }
    };

    const handleVoiceInput = () => {
        if (isListening) { setIsListening(false); return; }
        setIsListening(true);
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'zh-TW';
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                const parsedTasks = parseVoiceToTasks(transcript);
                parsedTasks.forEach(t => handleAddTask(t, 'adhoc'));
                setIsListening(false);
            };
            recognition.onerror = () => setIsListening(false);
            recognition.start();
        } else {
            alert('瀏覽器不支援語音，請手動輸入');
            setIsListening(false);
        }
    };

    const changeDate = (offset: number) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + offset);
        setCurrentDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
    };

    return (
        <div className="absolute inset-0 bg-slate-50 z-[60] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex-none px-4 py-4 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm sticky top-0 z-20">
                <button onClick={onBack} className="flex items-center gap-1 text-slate-500 hover:text-slate-800"><ChevronLeft size={24} />返回</button>
                <div className="flex items-center gap-4">
                    <button onClick={() => changeDate(-1)}><ChevronLeftSquare size={24} className="text-slate-400 hover:text-indigo-600"/></button>
                    <span className="font-bold text-lg text-slate-800">{currentDate === getTodayStr() ? '今天' : currentDate}</span>
                    <button onClick={() => changeDate(1)}><ChevronRightSquare size={24} className="text-slate-400 hover:text-indigo-600"/></button>
                </div>
                <div className="w-[60px]"></div>
            </div>

            <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-3xl mx-auto w-full space-y-6">
                {currentDate === getTodayStr() && (
                    <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg flex flex-col items-center justify-center gap-4 text-center">
                        <h2 className="font-bold text-xl">今天有什麼計畫？</h2>
                        <p className="text-indigo-200 text-sm">按下麥克風，說出你想做的事，我會幫你拆解紀錄。</p>
                        <button onClick={handleVoiceInput} className={`p-4 rounded-full bg-white text-indigo-600 shadow-xl hover:scale-110 transition-transform ${isListening ? 'animate-pulse ring-4 ring-indigo-300' : ''}`}>
                            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                        </button>
                        {isListening && <p className="text-xs animate-bounce">正在聆聽...</p>}
                    </div>
                )}

                {dayEvents.length > 0 && (
                    <div className="bg-blue-50 rounded-2xl p-5 shadow-sm border border-blue-100">
                        <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><Calendar size={18}/> 固定行程</h3>
                        <div className="space-y-2">
                            {dayEvents.map(e => (
                                <div key={e.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-blue-100">
                                    <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-bold font-mono">{e.time || 'All Day'}</div>
                                    <span className={`text-slate-700 font-medium flex-1 ${e.completed ? 'line-through opacity-50' : ''}`}>{e.title}</span>
                                    {e.note && <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">{e.note}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Coffee size={18} className="text-orange-500"/> 例行公事</h3>
                        <div className="flex gap-2">
                            <input className="bg-slate-50 border-none rounded-lg px-2 py-1 text-xs w-32" placeholder="新增例行..." value={newRoutine} onChange={e => setNewRoutine(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddRoutine()}/>
                            <button onClick={handleAddRoutine} className="bg-orange-500 text-white rounded-lg px-2 text-xs"><Plus size={14}/></button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {routines.map(t => (
                            <div key={t.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${t.completed ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`} onClick={() => handleToggleTask(t.id)}>
                                    {t.completed && <CheckCircle size={14} className="text-white"/>}
                                </div>
                                <span className={`flex-1 ${t.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.title}</span>
                                <button onClick={() => handleDeleteRoutineProto(t.title)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100" title="從例行列表中刪除"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><ListTodo size={18} className="text-blue-500"/> 臨時事項</h3>
                        <button onClick={() => { const t = prompt('輸入事項'); if(t) handleAddTask(t); }} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-slate-200">+ 手動新增</button>
                    </div>
                    <div className="space-y-2">
                        {adhocTasks.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">沒有臨時事項，享受自由！</p> : adhocTasks.map(t => (
                            <div key={t.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${t.completed ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`} onClick={() => handleToggleTask(t.id)}>
                                    {t.completed && <CheckCircle size={14} className="text-white"/>}
                                </div>
                                <span className={`flex-1 ${t.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.title}</span>
                                <button onClick={() => handleDeleteTask(t.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Edit3 size={18} className="text-purple-500"/> 每日日記</h3>
                        <button onClick={() => onSaveRecord(currentDate, note)} className="text-indigo-600 hover:text-indigo-800"><Save size={18}/></button>
                    </div>
                    <textarea className="w-full h-32 bg-slate-50 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-100 border-none" placeholder="今天發生了什麼有趣的事..." value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => onSaveRecord(currentDate, note)} />
                </div>
            </div>
        </div>
    );
};

// ... (SpaceDetailView, AISuggestionCard -> Keep existing)
const SpaceDetailView = ({ space, onBack }: { space: SpaceItem, onBack: () => void }) => {
    const IconComp = getIcon(space.iconName);
    const [notes, setNotes] = useState(space.content);
    const [newNote, setNewNote] = useState('');
    const addNote = () => { if (newNote.trim()) { setNotes([...notes, newNote]); setNewNote(''); } };
    return (
        <div className="absolute inset-0 bg-slate-50 z-[50] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex-none px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm sticky top-0 z-20">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"><ChevronLeft size={24} /><span className="font-bold text-lg">返回主頁</span></button>
                <div className={`p-2 rounded-xl ${space.color}`}><IconComp size={24} /></div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
                <div className="mb-8"><h1 className="text-3xl font-bold text-slate-800 mb-2">{space.label}</h1><p className="text-slate-500">專屬空間</p></div>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 min-h-[400px]">
                    <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><FileText size={20}/> 筆記與紀錄</h2>
                    <div className="flex gap-2 mb-6"><input type="text" className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-100" placeholder="新增一條紀錄..." value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addNote()} /><button onClick={addNote} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors">新增</button></div>
                    <div className="space-y-3">{notes.map((note, idx) => (<div key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"><div className="mt-1.5 w-2 h-2 rounded-full bg-slate-300"></div><p className="text-slate-700 leading-relaxed flex-1">{note}</p><button className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400"><Trash2 size={16}/></button></div>))}</div>
                </div>
            </div>
        </div>
    );
};

const AISuggestionCard: React.FC<{ suggestions: Suggestion[], onAccept: (suggestions: Suggestion[]) => void }> = ({ suggestions, onAccept }) => {
    return (
        <div className="bg-indigo-50 p-4 rounded-xl shadow-lg border border-indigo-200">
            <div className="flex items-center gap-2 mb-3 text-indigo-700 font-bold">
                <Sparkles size={18} />
                <span>AI 建議行程</span>
            </div>
            <ul className="space-y-2 mb-4">
                {suggestions.map((s, index) => (
                    <li key={index} className="flex gap-2 items-start text-sm text-slate-700">
                        <span className="font-mono font-bold text-indigo-500 min-w-[40px]">{s.time}</span>
                        <span className="flex-1">{s.title}</span>
                    </li>
                ))}
            </ul>
            <button onClick={() => onAccept(suggestions)} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md active:scale-[.99]">
                全部加入我的行程
            </button>
        </div>
    );
};

// --- Main App ---
const App = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard'); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTyping, setIsTyping] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isMobile, setIsMobile] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // States
  const [layoutMobile, setLayoutMobile] = useState<WidgetConfig[]>(() => { try { return JSON.parse(localStorage.getItem('butler_layout_mobile_v11') || '') || DEFAULT_MOBILE_LAYOUT; } catch { return DEFAULT_MOBILE_LAYOUT; }});
  const [layoutDesktop, setLayoutDesktop] = useState<WidgetConfig[]>(() => { try { return JSON.parse(localStorage.getItem('butler_layout_desktop_v11') || '') || DEFAULT_DESKTOP_LAYOUT; } catch { return DEFAULT_DESKTOP_LAYOUT; }});
  const [hiddenWidgets, setHiddenWidgets] = useState<WidgetConfig[]>([]);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  
  // Data
  const [events, setEvents] = useState<EventItem[]>(() => { try { return JSON.parse(localStorage.getItem('butler_events_v3') || '') || DEFAULT_EVENTS; } catch { return DEFAULT_EVENTS; }});
  const [spaces, setSpaces] = useState<SpaceItem[]>(() => { try { return JSON.parse(localStorage.getItem('butler_spaces') || '') || DEFAULT_SPACES; } catch { return DEFAULT_SPACES; }});
  const [dailyTasks, setDailyTasks] = useState<TaskItem[]>(() => { try { return JSON.parse(localStorage.getItem('butler_daily_tasks') || '') || []; } catch { return []; }});
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>(() => { try { return JSON.parse(localStorage.getItem('butler_daily_records') || '') || []; } catch { return []; }});
  const [routinesList, setRoutinesList] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('butler_routines_list') || '') || DEFAULT_ROUTINES_LIST; } catch { return DEFAULT_ROUTINES_LIST; }});
  const [wishes, setWishes] = useState<WishItem[]>(() => { try { return JSON.parse(localStorage.getItem('butler_wishes') || '') || DEFAULT_WISHES; } catch { return DEFAULT_WISHES; }});
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => { try { return JSON.parse(localStorage.getItem('butler_expenses') || '') || []; } catch { return []; }});
  const [todos, setTodos] = useState<TodoItem[]>(() => { try { return JSON.parse(localStorage.getItem('butler_todos') || '') || DEFAULT_TODOS; } catch { return DEFAULT_TODOS; }});
  const [countdowns, setCountdowns] = useState<CountdownItem[]>(() => { try { return JSON.parse(localStorage.getItem('butler_countdowns') || '') || DEFAULT_COUNTDOWNS; } catch { return DEFAULT_COUNTDOWNS; }}); 

  const [chatHistory, setChatHistory] = useState<any[]>([{ role: 'system', content: '早安！我是您的智能管家。' }]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<number | null>(null);

  // Initial Logic: Smart Rollover & Reset
  useEffect(() => {
      const todayStr = getTodayStr();
      setDailyTasks(prev => {
          // 1. Reset Routines for Today (if not already created)
          const hasRoutineToday = prev.some(t => t.date === todayStr && t.type === 'routine');
          let newTasks = [...prev];
          
          if (!hasRoutineToday) {
              const newRoutines = routinesList.map(title => ({
                  id: `routine-${Date.now()}-${Math.random()}`,
                  title,
                  completed: false,
                  type: 'routine' as const,
                  date: todayStr
              }));
              newTasks = [...newTasks, ...newRoutines];
          }

          // 2. Rollover Logic: Find ALL past unfinished adhoc tasks and bring them to today
          // We check if this task is already present in today's list to avoid duplication
          const todayTaskTitles = new Set(newTasks.filter(t => t.date === todayStr).map(t => t.title.replace('[延遞] ', '')));
          
          const pastUnfinished = newTasks.filter(t => t.type === 'adhoc' && !t.completed && t.date < todayStr);
          
          pastUnfinished.forEach(t => {
              const baseTitle = t.title.replace('[延遞] ', '');
              if (!todayTaskTitles.has(baseTitle)) {
                  // Only add if not already there
                  newTasks.push({
                      ...t,
                      id: `rollover-${t.id}-${Date.now()}`,
                      date: todayStr,
                      title: `[延遞] ${baseTitle}`
                  });
              }
          });

          return newTasks;
      });
  }, [routinesList]);

  useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      const timer = setInterval(() => setCurrentTime(new Date()), 60000);
      if ('Notification' in window) setNotificationPermission(Notification.permission);
      return () => { window.removeEventListener('resize', checkMobile); clearInterval(timer); };
  }, []);

  // Save Data
  useEffect(() => { localStorage.setItem('butler_layout_mobile_v11', JSON.stringify(layoutMobile)); }, [layoutMobile]);
  useEffect(() => { localStorage.setItem('butler_layout_desktop_v11', JSON.stringify(layoutDesktop)); }, [layoutDesktop]);
  useEffect(() => { localStorage.setItem('butler_events_v3', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('butler_daily_tasks', JSON.stringify(dailyTasks)); }, [dailyTasks]);
  useEffect(() => { localStorage.setItem('butler_daily_records', JSON.stringify(dailyRecords)); }, [dailyRecords]);
  useEffect(() => { localStorage.setItem('butler_routines_list', JSON.stringify(routinesList)); }, [routinesList]);
  useEffect(() => { localStorage.setItem('butler_wishes', JSON.stringify(wishes)); }, [wishes]);
  useEffect(() => { localStorage.setItem('butler_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('butler_spaces', JSON.stringify(spaces)); }, [spaces]);
  useEffect(() => { localStorage.setItem('butler_todos', JSON.stringify(todos)); }, [todos]);
  useEffect(() => { localStorage.setItem('butler_countdowns', JSON.stringify(countdowns)); }, [countdowns]);

  // Widget Actions
  const activeLayout = isMobile ? layoutMobile : layoutDesktop;
  const setActiveLayout = isMobile ? setLayoutMobile : setLayoutDesktop;

  const handleDragStart = (e: React.DragEvent, index: number) => { dragItemRef.current = index; };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
      const dragIndex = dragItemRef.current;
      if (dragIndex === null || dragIndex === dropIndex) return;
      const newLayout = [...activeLayout];
      const item = newLayout.splice(dragIndex, 1)[0];
      newLayout.splice(dropIndex, 0, item);
      setActiveLayout(newLayout);
  };
  
  const hideWidget = (id: string) => {
      const w = activeLayout.find(x => x.id === id);
      if (w) { 
          const allWidgets = [...layoutMobile, ...layoutDesktop, ...hiddenWidgets].find(x => x.id === id);
          if (allWidgets) {
            setActiveLayout(activeLayout.filter(x => x.id !== id)); 
            if (!hiddenWidgets.some(x => x.id === id)) setHiddenWidgets(prev => [...prev, allWidgets]); 
          }
      }
  };

  const restoreWidget = (id: string) => {
      const w = hiddenWidgets.find(x => x.id === id);
      if (w) { 
          setHiddenWidgets(hiddenWidgets.filter(x => x.id !== id)); 
          const defaultWidget = (isMobile ? DEFAULT_MOBILE_LAYOUT : DEFAULT_DESKTOP_LAYOUT).find(dw => dw.id === id);
          setActiveLayout(prev => [...prev, defaultWidget || w]); 
      }
  };

  const resizeWidgetWidth = (index: number) => {
      const newLayout = [...activeLayout];
      const widget = newLayout[index];
      if (isMobile) widget.colSpan = widget.colSpan === 2 ? 1 : 2;
      else widget.colSpan = widget.colSpan >= 4 ? 1 : widget.colSpan + 1;
      setActiveLayout(newLayout);
  };

  const resizeWidgetHeight = (index: number) => {
      const newLayout = [...activeLayout];
      const widget = newLayout[index];
      widget.rowSpan = widget.rowSpan >= 3 ? 1 : widget.rowSpan + 1; 
      setActiveLayout(newLayout);
  };

  const handleAddSpace = () => {
      const name = prompt("請輸入新空間名稱：");
      if (name) {
          const newSpace: SpaceItem = {
              id: Date.now().toString(),
              label: name,
              iconName: 'FolderPlus', 
              color: 'bg-slate-100 text-slate-600',
              content: []
          };
          setSpaces([...spaces, newSpace]);
      }
  };

  const handleTestNotification = () => {
    if(notificationPermission !== 'granted') Notification.requestPermission().then(p => setNotificationPermission(p));
    else sendNotification('測試通知', '管家服務運行中');
  };

  const handleAddEvent = (title: string, date: string) => {
      setEvents(prev => [...prev, { id: String(Date.now()), title, startDate: date, type: 'personal', completed: false }]);
  };
  const handleUpdateEvent = (updatedEvent: EventItem) => {
      setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
      setEditingEvent(null);
  };
  const handleDeleteEvent = (id: string) => {
      setEvents(prev => prev.filter(e => e.id !== id));
      setEditingEvent(null);
  };
  
  const handleAddWish = (title: string) => setWishes(prev => [...prev, { id: String(Date.now()), title, completed: false }]);
  const handleToggleWish = (id: string) => setWishes(prev => prev.map(w => w.id === id ? { ...w, completed: !w.completed } : w));
  const handleDeleteWish = (id: string) => setWishes(prev => prev.filter(w => w.id !== id));

  const handleAddExpense = (title: string, amount: number) => setExpenses(prev => [...prev, { id: String(Date.now()), title, amount, date: getTodayStr() }]);

  const handleToggleTodo = (id: string) => setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const handleCompleteCountdown = (id: string) => { if(confirm('確定完成？')) setCountdowns(countdowns.map(c => c.id === id ? { ...c, completed: true } : c)); };

  const handleAcceptSuggestions = (suggestions: Suggestion[]) => {
    const newItems = suggestions.map(s => ({ id: String(Date.now() + Math.random()), title: s.title, completed: false, type: 'adhoc' as const, date: getTodayStr() }));
    setDailyTasks(prev => [...prev, ...newItems]);
    setChatHistory(prev => [...prev, { role: 'system', content: `已加入 ${suggestions.length} 筆建議到待辦。` }]);
  };

  // Chat
  const handleSendMessage = () => {
      if (!inputText.trim()) return;
      setChatHistory(prev => [...prev, { role: 'user', content: inputText }]);
      const text = inputText;
      setInputText('');
      setIsTyping(true);

      setTimeout(() => {
          let reply = '';
          if (text.includes('新增') || text.includes('行程') || text.includes('提醒我')) {
              const dateStr = parseDateFromText(text);
              const title = text.replace(/新增|行程|提醒我|幫我|記下|在/g, '').replace(dateStr, '').replace(/明天|後天|下週/g, '').trim();
              handleAddEvent(title || '新行程', dateStr);
              reply = `沒問題，已幫您將「${title || '新行程'}」安排在 ${dateStr} 的行程表中。`;
          } else if (text.includes('代辦') || text.includes('要買') || text.includes('要做')) {
              const title = text.replace(/代辦|要買|要做/g, '').trim();
              setDailyTasks(prev => [...prev, { id: String(Date.now()), title, completed: false, type: 'adhoc', date: getTodayStr() }]);
              reply = `收到，已將「${title}」加入今日的代辦清單。`;
          } else {
              reply = '我聽到了。您可以告訴我「明天要去開會」或「提醒我買牛奶」。';
          }
          setChatHistory(prev => [...prev, { role: 'system', content: reply }]);
          setIsTyping(false);
      }, 1000);
  };

  const renderWidget = (config: WidgetConfig, index: number) => {
      const commonProps = {
          key: config.id, config, index, isEditing: isEditingLayout, isMobile,
          onDragStart: handleDragStart, onDragOver: handleDragOver, onDrop: handleDrop,
          onResizeWidth: () => resizeWidgetWidth(index), onResizeHeight: () => resizeWidgetHeight(index),
          onToggleVisibility: () => hideWidget(config.id)
      };

      if (config.type === 'schedule') return <WidgetWrapper {...commonProps}><DailyScheduleWidget tasks={dailyTasks} events={events} onClick={() => setActiveTab('daily_plan')} /></WidgetWrapper>;
      if (config.type === 'events') return <WidgetWrapper {...commonProps}><EventsWidget events={events} onAdd={handleAddEvent} onDelete={handleDeleteEvent} onOpenDetail={(id) => setEditingEvent(events.find(e => e.id === id) || null)} /></WidgetWrapper>;
      if (config.type === 'calendar') return <WidgetWrapper {...commonProps}><CalendarWidget events={events} onOpenDetail={(id) => setEditingEvent(events.find(e => e.id === id) || null)} /></WidgetWrapper>;
      if (config.type === 'focus_timer') return <WidgetWrapper {...commonProps}><FocusTimerWidget /></WidgetWrapper>;
      if (config.type === 'navigator') return <WidgetWrapper {...commonProps}><NavigatorWidget spaces={spaces} onNavigate={(id) => setActiveTab(`space:${id}`)} onAddSpace={handleAddSpace} /></WidgetWrapper>;
      if (config.type === 'voice_memo') return <WidgetWrapper {...commonProps}><VoiceMemoWidget /></WidgetWrapper>;
      if (config.type === 'wishlist') return <WidgetWrapper {...commonProps}><WishlistWidget wishes={wishes} onAdd={handleAddWish} onToggle={handleToggleWish} onDelete={handleDeleteWish} /></WidgetWrapper>;
      if (config.type === 'finance') return <WidgetWrapper {...commonProps}><FinanceWidget expenses={expenses} onAdd={handleAddExpense} /></WidgetWrapper>;
      if (config.type === 'quote') return <WidgetWrapper {...commonProps}><QuoteWidget /></WidgetWrapper>;
      if (config.type === 'todo') return <WidgetWrapper {...commonProps}><TodoWidget items={todos} onToggle={handleToggleTodo} /></WidgetWrapper>;
      if (config.type === 'countdown') return <WidgetWrapper {...commonProps}><CountdownWidget items={countdowns} onComplete={handleCompleteCountdown} /></WidgetWrapper>;
      if (config.type === 'water') return <WidgetWrapper {...commonProps}><WaterWidget /></WidgetWrapper>;
      if (config.type === 'noise') return <WidgetWrapper {...commonProps}><NoiseWidget /></WidgetWrapper>;
      
      // Static widgets
      if (config.type === 'weather') return <WidgetWrapper {...commonProps}><div className="h-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-3xl shadow-lg flex justify-between items-center relative overflow-hidden"><div className="z-10"><div className="text-5xl font-bold">24°</div><div className="text-blue-100 mt-2">台北市 多雲</div></div><Sun size={100} className="absolute right-[-20px] top-[-20px] opacity-20 text-yellow-300" /></div></WidgetWrapper>;
      if (config.type === 'mood') return <WidgetWrapper {...commonProps}><div className="h-full bg-slate-800 text-white p-5 rounded-3xl flex flex-col justify-between"><div className="flex gap-2 text-slate-400 text-xs uppercase"><Battery size={16}/> 能量</div><div><div className="text-3xl font-bold text-emerald-400">85%</div><div className="text-xs text-slate-400">狀態極佳</div></div></div></WidgetWrapper>;
      if (config.type === 'suggestion') return <WidgetWrapper {...commonProps}><div className="h-full bg-orange-50 p-5 rounded-3xl border border-orange-100 flex flex-col justify-between"><div className="flex gap-2 text-orange-600 text-sm font-bold uppercase"><Coffee size={16}/> 建議</div><p className="text-sm text-slate-600 mt-2">下午適合處理「光電年會」的簡報資料。</p></div></WidgetWrapper>;
      
      return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 w-full max-w-md md:max-w-6xl mx-auto border-x border-slate-200 relative overflow-hidden flex flex-col shadow-2xl">
      <main className={`flex-1 p-6 md:p-10 overflow-y-auto scrollbar-hide ${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
        <div className="mb-6 flex justify-between items-start">
            <div><h1 className="text-3xl font-bold text-slate-800">早安，庭恩</h1><p className="text-slate-500 text-sm mt-1">{getTodayStr()}</p></div>
            <button onClick={() => setIsEditingLayout(!isEditingLayout)} className="bg-white p-2 rounded-full shadow-sm hover:bg-slate-50">{isEditingLayout ? <CheckCircle size={20} className="text-indigo-600"/> : <Settings size={20} className="text-slate-400"/>}</button>
        </div>
        {/* Force Grid Row Height to fix layout issues */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[180px]">
            {activeLayout.map((widget, i) => renderWidget(widget, i))}
            {isEditingLayout && hiddenWidgets.length > 0 && <div className="col-span-2 md:col-span-4 border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col gap-3 items-center justify-center bg-slate-50 row-span-1"><span className="text-xs text-slate-400 font-bold uppercase">已隱藏</span><div className="flex flex-wrap gap-2 justify-center">{hiddenWidgets.map(w => (<button key={w.id} onClick={() => restoreWidget(w.id)} className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm text-xs text-slate-600 hover:bg-indigo-50 transition-all"><Plus size={14} />{w.label}</button>))}</div></div>}
            {isEditingLayout && (<button onClick={() => { if(confirm('重置？')) { setLayoutMobile(DEFAULT_MOBILE_LAYOUT); setLayoutDesktop(DEFAULT_DESKTOP_LAYOUT); setHiddenWidgets([]); }}} className="col-span-2 md:col-span-4 mt-4 py-2 text-xs text-slate-400 underline">恢復預設</button>)}
        </div>
      </main>

      {/* Overlays */}
      {activeTab === 'daily_plan' && (
          <DailyDetailView 
            tasks={dailyTasks} 
            events={events}
            onUpdateTasks={setDailyTasks} 
            onBack={() => setActiveTab('dashboard')} 
            dailyRecords={dailyRecords} 
            onSaveRecord={(date, note) => {
                const existing = dailyRecords.find(r => r.date === date);
                if (existing) setDailyRecords(dailyRecords.map(r => r.date === date ? { ...r, note } : r));
                else setDailyRecords([...dailyRecords, { date, note }]);
            }}
            routinesList={routinesList}
            onUpdateRoutines={setRoutinesList}
          />
      )}
      
      {activeTab.startsWith('space:') && <SpaceDetailView space={spaces.find(s => s.id === activeTab.split(':')[1])!} onBack={() => setActiveTab('dashboard')} />}
      
      {/* Event Detail Modal */}
      {editingEvent && (
          <EventDetailModal 
            event={editingEvent} 
            onClose={() => setEditingEvent(null)} 
            onSave={handleUpdateEvent} 
            onDelete={handleDeleteEvent} 
          />
      )}

      {/* Chat Overlay */}
      {activeTab === 'chat' && (
        <div className="absolute inset-0 bg-slate-50 z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex-none px-4 py-3 bg-white border-b flex justify-between items-center shadow-sm">
                <button onClick={() => setActiveTab('dashboard')}><ChevronLeft size={24} className="text-slate-500"/></button>
                <span className="font-bold text-slate-800">智慧管家</span>
                <div className="w-6"></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.isSuggestion ? (<div className="max-w-[90%] md:max-w-[70%]"><AISuggestionCard suggestions={msg.suggestions} onAccept={handleAcceptSuggestions} /></div>) : (
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
                            {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                        </div>
                        )}
                    </div>
                ))}
                {isTyping && <div className="text-slate-400 text-xs ml-4">管家輸入中...</div>}
                <div ref={chatEndRef}></div>
            </div>
            <div className="p-3 bg-white border-t mb-20">
                <div className="flex gap-2 bg-slate-100 p-2 rounded-full">
                    <input className="flex-1 bg-transparent border-none outline-none px-2 text-sm" placeholder="輸入訊息..." value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
                    <button onClick={handleSendMessage} className="bg-indigo-600 text-white p-2 rounded-full"><Send size={16}/></button>
                </div>
            </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[70]">
        <div className="bg-white/90 backdrop-blur-md border border-white/20 shadow-2xl rounded-full px-6 py-3 flex gap-8 items-center">
           <button className={`transition-colors ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`} onClick={() => setActiveTab('dashboard')}><Home size={24} /></button>
           <button className={`p-3.5 rounded-full shadow-lg border-4 border-slate-50 ${activeTab === 'chat' ? 'bg-indigo-700 text-white -translate-y-5' : 'bg-indigo-600 text-white -translate-y-5'}`} onClick={() => setActiveTab('chat')}><MessageSquare size={24} fill="currentColor" /></button>
           <button className="text-slate-400"><MoreHorizontal size={24} /></button>
        </div>
      </div>
    </div>
  );
};

export default App;

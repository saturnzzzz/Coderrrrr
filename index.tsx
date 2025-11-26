import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { 
  BookOpen, 
  PlusCircle, 
  Database, 
  FileText, 
  Download, 
  Trash2, 
  ChevronRight, 
  Info, 
  CheckCircle,
  X,
  Sparkles,
  Loader2,
  Link as LinkIcon
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";

// --- Types ---

type Level1Code = {
  id: string;
  name: string;
  desc: string;
  example: string;
};

type Level1Category = {
  category: string;
  codes: Level1Code[];
};

type Level2Framework = {
  id: string;
  name: string;
  desc: string;
};

type CodedArticle = {
  uuid: string;
  articleUrl: string; // Changed from articleId to articleUrl
  title: string;
  content: string;
  level1Selections: string[]; // Array of code IDs
  level2Selections: string[]; // Array of framework IDs
  notes: string; // Quotes or specific analysis
  timestamp: number;
};

// --- Schema Definitions (Updated based on "Ideal Elderly Life" Manual) ---

const SCHEMA_L1: Level1Category[] = [
  {
    category: "1. 心态与身份 (Mindset & Identity)",
    codes: [
      { 
        id: "L1_1_1", 
        name: "积极心态", 
        desc: "描述积极、乐观、洒脱的心理状态。", 
        example: "“洒脱、酷”、“不焦虑”、“更积极的情绪体验”" 
      },
      { 
        id: "L1_1_2", 
        name: "自主独立", 
        desc: "强调对个人生活的掌控权，不依赖他人。", 
        example: "“独身老年生活，泰酷辣！”、“独立”、“自主规划”" 
      },
      { 
        id: "L1_1_3", 
        name: "价值感", 
        desc: "感到自己对社会、家庭或他人仍有贡献和意义。", 
        example: "“重返职场‘大杀四方’”、“发挥余热”、“被需要”" 
      },
      { 
        id: "L1_1_4", 
        name: "接纳衰老", 
        desc: "坦然接受变老的过程，并视其为自然的一部分。", 
        example: "“从容地老去”、“拥抱初老年”" 
      },
    ]
  },
  {
    category: "2. 行为与活动 (Behavior & Activity)",
    codes: [
      { 
        id: "L1_2_1", 
        name: "社会参与", 
        desc: "参与超出家庭范围的社交、公益或公共活动。", 
        example: "“当老师”、“成为网红”、“占领KTV”、“混迹健身江湖”" 
      },
      { 
        id: "L1_2_2", 
        name: "终身学习", 
        desc: "主动获取新知识、新技能。", 
        example: "“上老年大学”、“学习使用科技”" 
      },
      { 
        id: "L1_2_3", 
        name: "休闲娱乐", 
        desc: "为愉悦身心而进行的活动。", 
        example: "“旅居养老”、“听音乐”、“谈恋爱”" 
      },
      { 
        id: "L1_2_4", 
        name: "身体管理", 
        desc: "为维持健康与活力进行的活动。", 
        example: "“健身”、“锻炼”" 
      },
      { 
        id: "L1_2_5", 
        name: "经济活动", 
        desc: "工作、消费、理财等经济行为。", 
        example: "“用退休金旅居”、“退休后就业”、“消费”" 
      },
    ]
  },
  {
    category: "3. 关系与情感 (Relationships)",
    codes: [
      { 
        id: "L1_3_1", 
        name: "亲密关系", 
        desc: "包括爱情、婚姻、伴侣关系。", 
        example: "“老年爱情”、“谈恋爱更松弛”、“相亲”" 
      },
      { 
        id: "L1_3_2", 
        name: "代际关系", 
        desc: "与子女、孙辈的互动。", 
        example: "（提及子女、为父母规划等）" 
      },
      { 
        id: "L1_3_3", 
        name: "朋辈社交", 
        desc: "与朋友、同龄人的交往。", 
        example: "“一起旅居”、“老年大学同学”" 
      },
      { 
        id: "L1_3_4", 
        name: "非传统家庭", 
        desc: "非核心家庭的亲密关系模式。", 
        example: "“丁克夫妇，和狗一起”、“独身”" 
      },
    ]
  },
  {
    category: "4. 资源与环境 (Resources)",
    codes: [
      { 
        id: "L1_4_1", 
        name: "经济资本", 
        desc: "拥有足以支撑理想生活的财务资源。", 
        example: "“退休金”、“理财规划”" 
      },
      { 
        id: "L1_4_2", 
        name: "科技赋能", 
        desc: "科技产品和服务对老年生活的正面作用。", 
        example: "“科技适应老龄化”、“智能产品”" 
      },
      { 
        id: "L1_4_3", 
        name: "适老环境", 
        desc: "支持老年人生活的物理和社会环境。", 
        example: "“适老化改造”、“养老社区”" 
      },
      { 
        id: "L1_4_4", 
        name: "文化环境", 
        desc: "社会对老年的看法和舆论氛围。", 
        example: "“打破刻板印象”、“新的顶流”" 
      },
    ]
  },
  {
    category: "5. 叙事视角 (Perspective)",
    codes: [
      { 
        id: "L1_5_1", 
        name: "未来规划", 
        desc: "文章强调为老年生活做准备的视角。", 
        example: "“未老先问”、“如何规划”" 
      },
      { 
        id: "L1_5_2", 
        name: "成功典范", 
        desc: "通过呈现具体的、成功的个人案例来叙事。", 
        example: "“89岁传奇女编辑”、“惠英红饰演的角色”" 
      },
      { 
        id: "L1_5_3", 
        name: "挑战与应对", 
        desc: "提及现实困难，但重点在于如何克服。", 
        example: "“消费降级后…旅居”（重点在积极应对）" 
      },
    ]
  },
];

const SCHEMA_L2: Level2Framework[] = [
  { 
    id: "L2_1", 
    name: "框架一：活力自主的“第二人生”", 
    desc: "老年不是衰退，而是摆脱工作束缚后，开启的充满活力、由自我主导的新阶段。" 
  },
  { 
    id: "L2_2", 
    name: "框架二：情感丰盈的“圆满时节”", 
    desc: "老年是情感需求得到充分满足的时期，重点关注爱情、友谊和社会联结，追求内心的温暖与充实。" 
  },
  { 
    id: "L2_3", 
    name: "框架三：未雨绸缪的“规划项目”", 
    desc: "理想的老年生活并非自然到来，而是需要从中青年时期就开始进行系统性规划和准备的“人生项目”。" 
  },
  { 
    id: "L2_4", 
    name: "框架四：科技赋能的“现代晚年”", 
    desc: "理想的老年生活是与时俱进的，通过拥抱科技和现代消费方式，提升生活品质和便利度。" 
  },
];

// --- Helper Functions ---

const getL1Name = (id: string) => {
  for (const cat of SCHEMA_L1) {
    const found = cat.codes.find(c => c.id === id);
    if (found) return found.name;
  }
  return id;
};

const getL2Name = (id: string) => SCHEMA_L2.find(f => f.id === id)?.name || id;

// --- Components ---

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  );
};

const ExportHTML = (articles: CodedArticle[], l3Analysis: string) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>三联生活周刊“理想老年生活”编码报告</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
  h1 { color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }
  h2 { color: #34495e; margin-top: 30px; }
  .l3-box { background: #f0f4f8; border-left: 5px solid #3498db; padding: 15px; margin-bottom: 30px; white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th, td { border: 1px solid #ddd; padding: 12px; text-align: left; vertical-align: top; }
  th { background-color: #f2f2f2; font-weight: bold; }
  .tag { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; margin: 2px; }
  .tag-l2 { background: #d1fae5; color: #065f46; }
  .meta { color: #777; font-size: 0.9em; margin-bottom: 5px; }
  .content { font-size: 0.9em; color: #555; max-height: 150px; overflow-y: auto; display: block; }
  .url-link { color: #2563eb; text-decoration: none; word-break: break-all; font-size: 0.8em; }
  .url-link:hover { text-decoration: underline; }
</style>
</head>
<body>
  <h1>“理想老年生活”叙事框架编码报告</h1>
  <p>导出时间: ${new Date().toLocaleString()}</p>

  <h2>第三级编码：选择性编码（核心叙事）</h2>
  <div class="l3-box">${l3Analysis || "尚未填写核心叙事分析。"}</div>

  <h2>详细编码记录 (共 ${articles.length} 篇)</h2>
  <table>
    <thead>
      <tr>
        <th width="15%">文章信息</th>
        <th width="20%">一级编码 (开放性)</th>
        <th width="20%">二级编码 (轴心)</th>
        <th width="20%">编码笔记/摘录</th>
        <th width="25%">原文片段</th>
      </tr>
    </thead>
    <tbody>
      ${articles.map(a => `
        <tr>
          <td>
            <strong>${a.title}</strong><br>
            <a href="${a.articleUrl}" target="_blank" class="url-link">${a.articleUrl}</a><br>
            <span class="meta">${new Date(a.timestamp).toLocaleDateString()}</span>
          </td>
          <td>${a.level1Selections.map(id => `<span class="tag">${getL1Name(id)}</span>`).join('')}</td>
          <td>${a.level2Selections.map(id => `<span class="tag tag-l2">${getL2Name(id)}</span>`).join('')}</td>
          <td>${a.notes}</td>
          <td><div class="content">${a.content.substring(0, 300)}${a.content.length > 300 ? '...' : ''}</div></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `coding-export-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// --- Main Application ---

const App = () => {
  const [activeTab, setActiveTab] = useState<"input" | "history" | "synthesis">("input");
  const [articles, setArticles] = useState<CodedArticle[]>([]);
  const [l3Analysis, setL3Analysis] = useState<string>("");
  
  // Input State
  const [inputTitle, setInputTitle] = useState("");
  const [inputUrl, setInputUrl] = useState(""); // Changed from inputId
  const [inputContent, setInputContent] = useState("");
  const [selectedL1, setSelectedL1] = useState<string[]>([]);
  const [selectedL2, setSelectedL2] = useState<string[]>([]);
  const [inputNotes, setInputNotes] = useState("");
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false); // New state for L3 AI

  // UI State
  const [selectedArticle, setSelectedArticle] = useState<CodedArticle | null>(null);

  // Initialization
  useEffect(() => {
    const saved = localStorage.getItem("codingApp_data");
    const savedL3 = localStorage.getItem("codingApp_l3");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure old data with articleId maps to articleUrl if needed, or just allow it
      // For simplicity in this session, we assume new data or just accept the field change.
      setArticles(parsed);
    }
    if (savedL3) setL3Analysis(savedL3);
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem("codingApp_data", JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem("codingApp_l3", l3Analysis);
  }, [l3Analysis]);

  const handleToggleL1 = (id: string) => {
    setSelectedL1(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleToggleL2 = (id: string) => {
    setSelectedL2(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // --- AI Analysis Function (Level 1 & 2) ---
  const handleAIAnalyze = async () => {
    if (!inputContent) {
      alert("请先在文本框中输入文章内容。");
      return;
    }

    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        You are an expert qualitative researcher specializing in analyzing news articles about "Ideal Elderly Life".
        
        Task: Perform Level 1 (Open Coding) and Level 2 (Axial Coding) analysis on the provided article text based strictly on the schema below.
        
        Article Title: ${inputTitle || "Untitled"}
        Article Content: ${inputContent}

        --- SCHEMAS ---
        Level 1 Schema (Open Coding):
        ${JSON.stringify(SCHEMA_L1, null, 2)}

        Level 2 Schema (Axial Coding):
        ${JSON.stringify(SCHEMA_L2, null, 2)}
        
        --- OUTPUT FORMAT ---
        Return ONLY a JSON object with the following structure:
        {
          "level1_ids": ["id1", "id2", ...],
          "level2_ids": ["id1", "id2", ...],
          "notes": "A concise analysis summary (max 200 words) justifying the codes selected and extracting 1-2 key short quotes from the text. Answer in Chinese."
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const resultText = response.text;
      if (resultText) {
        const result = JSON.parse(resultText);
        
        // Validate and apply results
        if (Array.isArray(result.level1_ids)) {
           const validL1 = result.level1_ids.filter((id: string) => SCHEMA_L1.some(cat => cat.codes.some(c => c.id === id)));
           setSelectedL1(validL1);
        }
        if (Array.isArray(result.level2_ids)) {
           const validL2 = result.level2_ids.filter((id: string) => SCHEMA_L2.some(fw => fw.id === id));
           setSelectedL2(validL2);
        }
        if (result.notes) {
          setInputNotes(result.notes);
        }
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
      alert("AI 分析失败，请检查网络或重试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- AI Synthesis Function (Level 3) ---
  const handleAISynthesis = async () => {
    if (articles.length === 0) {
      alert("请先添加并编码至少一篇文章，再进行三级编码。");
      return;
    }

    setIsSynthesizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prepare data for the prompt: Summarize existing articles and their codes
      const articlesData = articles.map((a, idx) => `
        Article ${idx + 1}:
        Title: ${a.title}
        Level 2 Codes (Frameworks): ${a.level2Selections.map(id => getL2Name(id)).join(", ")}
        Notes: ${a.notes}
      `).join("\n---\n");

      const prompt = `
        You are an expert qualitative researcher. Your task is to perform **Level 3: Selective Coding** (Core Narrative Synthesis).

        Context: We are analyzing media reports on "Ideal Elderly Life" (e.g., from Sanlian Life Week). We have completed Level 1 and Level 2 coding for ${articles.length} articles.

        --- DATA FROM CODED ARTICLES ---
        ${articlesData}

        --- SCHEMAS REFERENCE ---
        Level 2 Framework Definitions:
        ${JSON.stringify(SCHEMA_L2, null, 2)}

        --- INSTRUCTION ---
        Based on the data above, find the overarching "Core Narrative" that connects these frameworks.
        Answer the question: "What story do these frameworks jointly tell about elderly life? What are the underlying values?"
        
        Please synthesize a cohesive narrative paragraph (approx 200-400 words) in **Chinese**.
        Structure:
        1. Summarize the dominant frameworks found in the data.
        2. Explain the logical relationship between them (e.g., Means vs. Ends, Identity vs. Environment).
        3. Conclude with the core narrative statement (e.g., "The ideal elderly life is constructed as...").
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const resultText = response.text;
      if (resultText) {
        setL3Analysis(resultText);
      }

    } catch (error) {
      console.error("AI Synthesis failed:", error);
      alert("AI 综合分析失败，请检查网络或重试。");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSubmit = () => {
    if (!inputTitle || !inputContent) {
      alert("请填写文章标题和内容");
      return;
    }
    const newArticle: CodedArticle = {
      uuid: crypto.randomUUID(),
      articleUrl: inputUrl || "",
      title: inputTitle,
      content: inputContent,
      level1Selections: selectedL1,
      level2Selections: selectedL2,
      notes: inputNotes,
      timestamp: Date.now(),
    };
    setArticles([newArticle, ...articles]);
    
    // Reset Form
    setInputTitle("");
    setInputUrl("");
    setInputContent("");
    setInputNotes("");
    setSelectedL1([]);
    setSelectedL2([]);
    setActiveTab("history");
  };

  const handleDelete = (uuid: string) => {
    if (confirm("确定要删除这条记录吗？")) {
      setArticles(articles.filter(a => a.uuid !== uuid));
      if (selectedArticle?.uuid === uuid) setSelectedArticle(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-400"/>
            叙事框架分析
          </h1>
          <p className="text-xs mt-2 text-slate-400">《三联生活周刊》<br/>理想老年生活研究</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab("input")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'input' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <PlusCircle size={20} />
            <span>输入与编码 (L1/L2)</span>
          </button>

          <button 
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <Database size={20} />
            <span>编码记录库</span>
          </button>

          <button 
            onClick={() => setActiveTab("synthesis")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'synthesis' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <FileText size={20} />
            <span>选择性编码 (L3)</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 mb-2">数据统计</div>
          <div className="flex justify-between items-center bg-slate-800 p-3 rounded text-sm">
            <span>已编码文章</span>
            <span className="font-bold text-indigo-400">{articles.length}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        
        {/* VIEW: INPUT */}
        {activeTab === "input" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">新建编码条目</h2>
                <p className="text-slate-500">输入内容后，可使用 AI 辅助编码或手动进行一级（开放性）和二级（轴心）编码。</p>
              </div>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid gap-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">文章标题</label>
                  <input 
                    type="text" 
                    value={inputTitle}
                    onChange={e => setInputTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="例如：《理想老年生活》..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">文章链接 (URL)</label>
                  <input 
                    type="url" 
                    value={inputUrl}
                    onChange={e => setInputUrl(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="block text-sm font-medium text-slate-700">文章原文内容</label>
                   <button 
                    onClick={handleAIAnalyze}
                    disabled={isAnalyzing || !inputContent.trim()}
                    className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold transition-all shadow-sm
                      ${isAnalyzing 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-md hover:from-violet-600 hover:to-fuchsia-600 active:scale-95'}
                    `}
                   >
                     {isAnalyzing ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                     {isAnalyzing ? "正在分析..." : "AI 智能编码"}
                   </button>
                </div>
                <textarea 
                  value={inputContent}
                  onChange={e => setInputContent(e.target.value)}
                  className="w-full h-48 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  placeholder="粘贴新闻报道全文，点击右上方“AI 智能编码”可自动生成结果..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Level 1 Coding */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">Step 1</div>
                  <h3 className="font-bold text-slate-800">一级编码：开放性代码</h3>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  {SCHEMA_L1.map((cat, idx) => (
                    <div key={idx} className="border-b border-slate-100 last:border-0">
                      <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                        {cat.category}
                      </div>
                      <div className="p-4 grid grid-cols-1 gap-4">
                        {cat.codes.map(code => (
                          <label key={code.id} className="flex items-start gap-3 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={selectedL1.includes(code.id)}
                              onChange={() => handleToggleL1(code.id)}
                              className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 flex-shrink-0"
                            />
                            <div>
                              <div className={`text-sm font-medium transition-colors ${selectedL1.includes(code.id) ? 'text-indigo-700 font-bold' : 'text-slate-700 group-hover:text-indigo-700'}`}>
                                {code.name}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{code.desc}</div>
                              {code.example && (
                                <div className="text-xs text-slate-400 mt-1 italic pl-2 border-l-2 border-slate-200">
                                  例: {code.example}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level 2 Coding & Notes */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">Step 2</div>
                    <h3 className="font-bold text-slate-800">二级编码：轴心框架</h3>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
                    {SCHEMA_L2.map(fw => (
                      <label key={fw.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${selectedL2.includes(fw.id) ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'}`}>
                        <input 
                          type="checkbox"
                          checked={selectedL2.includes(fw.id)}
                          onChange={() => handleToggleL2(fw.id)}
                          className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 flex-shrink-0"
                        />
                        <div>
                          <div className="text-sm font-bold text-slate-800">{fw.name}</div>
                          <div className="text-xs text-slate-500 mt-1 leading-relaxed">{fw.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800 text-sm">关键引文与编码笔记</h3>
                  <textarea 
                    value={inputNotes}
                    onChange={e => setInputNotes(e.target.value)}
                    className="w-full h-32 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="可记录你的思考，或使用 AI 自动生成分析摘要..."
                  />
                </div>

                <button 
                  onClick={handleSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex justify-center items-center gap-2"
                >
                  <CheckCircle size={20} />
                  完成并保存文章编码
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: HISTORY */}
        {activeTab === "history" && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">编码记录库</h2>
                <p className="text-slate-500">查看、分析已编码的文章详情。</p>
              </div>
              <button 
                onClick={() => ExportHTML(articles, l3Analysis)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              >
                <Download size={18} />
                导出完整 HTML 报告
              </button>
            </header>

            {articles.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400 mb-4">暂无数据</p>
                <button onClick={() => setActiveTab("input")} className="text-indigo-600 hover:underline">去添加第一篇报道</button>
              </div>
            ) : (
              <div className="grid gap-4">
                {articles.map(article => (
                  <div 
                    key={article.uuid}
                    onClick={() => setSelectedArticle(article)}
                    className="bg-white p-5 rounded-lg border border-slate-200 hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{article.title}</h3>
                        {article.articleUrl && (
                          <a 
                            href={article.articleUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded hover:bg-slate-200 flex items-center gap-1"
                          >
                            <LinkIcon size={10} /> Link
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-1">{article.content}</p>
                      <div className="flex gap-2 mt-2">
                        {article.level2Selections.map(l2 => (
                           <span key={l2} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">
                             {getL2Name(l2).split("：")[0]}
                           </span>
                        ))}
                        {article.level2Selections.length === 0 && <span className="text-xs text-slate-400 italic">未归类核心框架</span>}
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-indigo-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: SYNTHESIS (LEVEL 3) */}
        {activeTab === "synthesis" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="flex justify-between items-end">
               <div>
                  <h2 className="text-2xl font-bold text-slate-800">三级编码：选择性编码</h2>
                  <p className="text-slate-500">在所有文章结束编码之后，进行核心叙事的提炼与构建。</p>
               </div>
               <button 
                  onClick={handleAISynthesis}
                  disabled={isSynthesizing || articles.length === 0}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors font-semibold
                    ${isSynthesizing || articles.length === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
                  `}
                >
                  {isSynthesizing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {isSynthesizing ? "正在生成..." : "AI 智能生成核心叙事"}
                </button>
            </header>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Stats Card */}
              <div className="md:col-span-1 space-y-4">
                 <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Database size={18} />
                      数据概览
                    </h3>
                    <div className="space-y-4">
                      {SCHEMA_L2.map(fw => {
                        const count = articles.filter(a => a.level2Selections.includes(fw.id)).length;
                        return (
                          <div key={fw.id}>
                            <div className="flex justify-between text-xs text-indigo-200 mb-1">
                              <span>{fw.name.split("：")[1]}</span>
                              <span>{count}</span>
                            </div>
                            <div className="w-full bg-indigo-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-400 h-full" style={{ width: `${articles.length ? (count / articles.length) * 100 : 0}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                 </div>
                 
                 <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-600">
                   <div className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Info size={16}/> 指导问题</div>
                   <ul className="list-disc list-inside space-y-1">
                     <li>这些框架共同讲述了一个关于老年生活的什么故事？</li>
                     <li>核心类别之间的关系是什么？</li>
                     <li>这种叙事背后隐含了什么社会价值观？</li>
                   </ul>
                 </div>
              </div>

              {/* Editor */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
                  <label className="block font-bold text-slate-700 mb-2">核心叙事 (Core Narrative)</label>
                  <textarea 
                    value={l3Analysis}
                    onChange={e => setL3Analysis(e.target.value)}
                    className="flex-1 w-full min-h-[300px] border border-slate-300 rounded-lg p-4 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-none"
                    placeholder="在此撰写最终的分析报告，或点击右上角使用 AI 自动生成..."
                  />
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-slate-400">内容将自动保存</span>
                    <button onClick={() => ExportHTML(articles, l3Analysis)} className="text-indigo-600 text-sm font-medium hover:underline">导出包含此分析的完整报告</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedArticle} onClose={() => setSelectedArticle(null)}>
        {selectedArticle && (
          <div className="space-y-6">
            <div className="border-b pb-4 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{selectedArticle.title}</h3>
                <div className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                   {new Date(selectedArticle.timestamp).toLocaleString()}
                   {selectedArticle.articleUrl && (
                     <>
                       <span>•</span>
                       <a href={selectedArticle.articleUrl} target="_blank" className="text-indigo-600 hover:underline flex items-center gap-1">
                         <LinkIcon size={12}/> 查看原文链接
                       </a>
                     </>
                   )}
                </div>
              </div>
              <button onClick={() => handleDelete(selectedArticle.uuid)} className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50">
                <Trash2 size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-slate-700 mb-2">原文内容</h4>
                <div className="bg-slate-50 p-4 rounded-lg text-slate-600 text-sm leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                  {selectedArticle.content}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-700 mb-2">二级编码：核心框架</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.level2Selections.length > 0 ? selectedArticle.level2Selections.map(id => (
                      <div key={id} className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-3 py-1 rounded-md text-sm font-medium">
                        {getL2Name(id)}
                      </div>
                    )) : <span className="text-slate-400">无</span>}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 mb-2">一级编码：开放性代码</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.level1Selections.length > 0 ? selectedArticle.level1Selections.map(id => (
                      <span key={id} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200">
                        {getL1Name(id)}
                      </span>
                    )) : <span className="text-slate-400">无</span>}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 mb-2">编码笔记</h4>
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-slate-700 text-sm italic">
                    {selectedArticle.notes || "无笔记"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
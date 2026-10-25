import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Settings,
  Send,
  Sparkles,
  Database,
  Key,
  Copy,
  Check,
  ChevronDown,
  Menu,
  X,
  Bot,
  User,
  Zap,
  Globe,
  RefreshCw,
  Cpu,
  Layers,
  Terminal,
  ExternalLink
} from 'lucide-react';

const FREE_MODELS = [
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'NVIDIA Nemotron 3 Ultra', badge: '1M Context', desc: 'Top reasoning & complex code architecture' },
  { id: 'openrouter/free', name: 'OpenRouter Auto-Free', badge: 'Auto Route', desc: 'Dynamically routes to fastest available free model' },
  { id: 'poolside/laguna-s-2.1:free', name: 'Poolside Laguna S 2.1', badge: '262k Context', desc: 'Agentic coding specialist for robust file generation' },
  { id: 'cohere/north-mini-code:free', name: 'Cohere North Mini Code', badge: '256k Context', desc: 'Fast, high-throughput code synthesis' },
  { id: 'google/gemma-4-31b-it:free', name: 'Google Gemma 4 31B', badge: '262k Context', desc: 'Versatile general-purpose assistant' }
];

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('supabase_anon_key') || '');
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[0].id);

  const [dbStatus, setDbStatus] = useState({ online: false, checking: false, message: 'Not configured' });
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('claude_chat_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'default-1',
        title: 'Project Architecture & Setup',
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: 'm-1',
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: `Hello! Welcome to your **Claude-Style AI Studio**.

I am connected to your cloud ecosystem and ready to build. Here is what you can do right now:

1. **Select a Free Model:** Use the top-left dropdown (\`nvidia/nemotron-3-ultra\`, \`poolside/laguna\`, etc.).
2. **Connect Supabase & OpenRouter:** Click the **Settings** icon (bottom left) to enter your API credentials.
3. **Generate Code & Chat:** Start typing your prompts below—complete with code block highlighting and direct copy support!`
          }
        ]
      }
    ];
  });

  const [activeChatId, setActiveChatId] = useState(() => chats[0]?.id || 'default-1');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  useEffect(() => {
    localStorage.setItem('claude_chat_history', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, loading]);

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) {
      setDbStatus({ online: false, checking: false, message: 'Keys missing in Settings' });
      return;
    }

    const testSupabase = async () => {
      setDbStatus({ online: false, checking: true, message: 'Testing Supabase REST API...' });
      try {
        const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        if (res.ok || res.status === 200 || res.status === 404) {
          setDbStatus({ online: true, checking: false, message: 'Supabase DB Connected' });
        } else {
          setDbStatus({ online: false, checking: false, message: `Connection HTTP ${res.status}` });
        }
      } catch (err) {
        setDbStatus({ online: false, checking: false, message: 'Failed to reach Supabase host' });
      }
    };

    testSupabase();
  }, [supabaseUrl, supabaseKey]);

  const saveCredentials = () => {
    localStorage.setItem('openrouter_api_key', openRouterKey);
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_anon_key', supabaseKey);
    setShowSettings(false);
  };

  const createNewChat = () => {
    const newChat = {
      id: `chat-${Date.now()}`,
      title: 'New Session',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: 'How can I assist you with your code or cloud infrastructure today?'
        }
      ]
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  const deleteChat = (e, id) => {
    e.stopPropagation();
    if (chats.length === 1) return;
    const filtered = chats.filter((c) => c.id !== id);
    setChats(filtered);
    if (activeChatId === id) {
      setActiveChatId(filtered[0].id);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const userMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: userText
    };

    const updatedChats = chats.map((chat) => {
      if (chat.id === activeChatId) {
        const isNew = chat.title === 'New Session' || chat.messages.length <= 1;
        const newTitle = isNew ? (userText.length > 28 ? userText.slice(0, 28) + '...' : userText) : chat.title;
        return {
          ...chat,
          title: newTitle,
          messages: [...chat.messages, userMessage]
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setLoading(true);

    try {
      const activeMessages = updatedChats.find((c) => c.id === activeChatId)?.messages || [];
      const apiPayloadMessages = [
        {
          role: 'system',
          content: 'You are an elite Claude-style AI assistant and principal software engineer. Provide clear explanations and wrap all code snippets inside markdown blocks with specified language syntax (e.g., ```javascript).'
        },
        ...activeMessages.map((m) => ({
          role: m.role,
          content: m.content
        }))
      ];

      const response = await fetch('[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Claude AI Studio Web'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiPayloadMessages
        })
      });

      const data = await response.json();
      let botContent = '';

      if (data.choices?.[0]?.message?.content) {
        botContent = data.choices[0].message.content;
      } else if (data.error) {
        botContent = `⚠️ **API Error:** ${data.error.message || 'Failed to authenticate with OpenRouter. Check your API key in Settings.'}`;
      } else {
        botContent = '⚠️ **Notice:** Received an empty response from model host. Please verify your connection or model queue.';
      }

      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: botContent
      };

      setChats((prevChats) =>
        prevChats.map((c) => (c.id === activeChatId ? { ...c, messages: [...c.messages, botMessage] } : c))
      );
    } catch (err) {
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: '❌ **Network Error:** Unable to complete API fetch to OpenRouter. Verify network connectivity or CORS settings.'
      };
      setChats((prevChats) =>
        prevChats.map((c) => (c.id === activeChatId ? { ...c, messages: [...c.messages, errorMessage] } : c))
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderMessageContent = (content, msgId) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: content.substring(lastIndex, match.index) });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        value: match[2].trim()
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', value: content.substring(lastIndex) });
    }

    return (
      <div className="space-y-3">
        {parts.map((part, idx) => {
          if (part.type === 'code') {
            const blockId = `${msgId}-code-${idx}`;
            return (
              <div key={idx} className="my-3 rounded-xl overflow-hidden border border-amber-900/30 bg-stone-950 font-mono text-xs shadow-lg">
                <div className="flex items-center justify-between px-4 py-2 bg-stone-900 border-b border-amber-900/20 text-stone-400">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-amber-500/80" />
                    <span className="font-semibold text-amber-200/80 uppercase">{part.language}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(part.value, blockId)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition text-[11px]"
                  >
                    {copiedIndex === blockId ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-amber-100/90 leading-relaxed font-mono">
                  <code>{part.value}</code>
                </pre>
              </div>
            );
          }

          return (
            <p key={idx} className="whitespace-pre-wrap leading-relaxed text-stone-200">
              {part.value}
            </p>
          );
        })}
      </div>
    );
  };

  const currentModelObj = FREE_MODELS.find((m) => m.id === selectedModel) || FREE_MODELS[0];

  return (
    <div className="flex h-screen w-screen bg-[#181614] text-stone-100 font-sans overflow-hidden antialiased selection:bg-amber-800/40 selection:text-amber-200">
      <aside
        className={`fixed md:relative z-30 h-full w-72 bg-[#12100e] border-r border-amber-950/30 flex flex-col justify-between transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-72'
        }`}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-stone-950 font-bold shadow-md shadow-amber-950/50">
                <Sparkles size={18} />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-wide text-stone-200">Claude AI Studio</h1>
                <span className="text-[10px] text-amber-500/80 uppercase tracking-wider font-mono">Enterprise Pro</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-stone-400 hover:text-stone-200 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-700/20 hover:bg-amber-700/30 text-amber-200 border border-amber-600/30 font-medium text-sm transition shadow-sm group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200 text-amber-400" />
            <span>Start New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 py-2 custom-scrollbar">
          <div className="px-3 py-1 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Recent Conversations
          </div>
          {chats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition ${
                  isActive
                    ? 'bg-[#211e1a] text-amber-100 font-medium border border-amber-900/30 shadow-inner'
                    : 'text-stone-400 hover:bg-[#1a1714] hover:text-stone-200'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MessageSquare size={14} className={isActive ? 'text-amber-500' : 'text-stone-500'} />
                  <span className="truncate max-w-[160px]">{chat.title}</span>
                </div>
                {chats.length > 1 && (
                  <button
                    onClick={(e) => deleteChat(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400 p-1 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-amber-950/30 space-y-2 bg-[#0e0c0b]">
          <div className="p-2.5 rounded-xl bg-[#171412] border border-stone-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Database size={15} className={dbStatus.online ? 'text-emerald-400' : 'text-stone-500'} />
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-stone-300">Supabase Database</span>
                <span className="text-[10px] text-stone-500 truncate max-w-[130px]">{dbStatus.message}</span>
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus.online
                  ? 'bg-emerald-500 animate-pulse'
                  : dbStatus.checking
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-stone-600'
              }`}
            />
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#1a1714] text-stone-400 hover:text-stone-200 transition text-xs border border-transparent hover:border-amber-900/20"
          >
            <div className="flex items-center gap-2">
              <Settings size={15} className="text-amber-500/80" />
              <span>API & Cloud Keys</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
              {openRouterKey ? 'Keys Set' : 'Setup'}
            </span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#181614]">
        <header className="h-14 border-b border-amber-950/20 px-4 md:px-6 flex items-center justify-between bg-[#151311]/90 backdrop-blur z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-stone-400 hover:text-stone-200 p-1 md:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-[#221f1b] hover:bg-[#2a2622] border border-amber-900/30 text-stone-200 text-xs font-medium transition shadow-sm"
              >
                <Cpu size={14} className="text-amber-500" />
                <span>{currentModelObj.name}</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] bg-amber-950 text-amber-400 border border-amber-800/40 rounded font-mono">
                  {currentModelObj.badge}
                </span>
                <ChevronDown size={14} className="text-stone-400" />
              </button>

              {modelDropdownOpen && (
                <div className="absolute top-11 left-0 w-80 bg-[#1e1b18] border border-amber-900/40 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                    Free Tier Models (OpenRouter)
                  </div>
                  {FREE_MODELS.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`p-2 rounded-lg cursor-pointer transition flex flex-col gap-0.5 ${
                        selectedModel === model.id
                          ? 'bg-amber-900/30 border border-amber-700/40 text-amber-100'
                          : 'hover:bg-[#26221e] text-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span>{model.name}</span>
                        <span className="text-[9px] font-mono px-1 rounded bg-stone-800 text-amber-400">
                          {model.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400">{model.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-stone-400 bg-stone-900/60 px-2.5 py-1 rounded-full border border-stone-800">
              <Zap size={12} className="text-amber-400" />
              <span>Full-Stack Mode</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-6 max-w-4xl mx-auto w-full custom-scrollbar">
          {activeChat?.messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-amber-900/30 border border-amber-700/40 text-amber-400 flex items-center justify-center shrink-0 shadow">
                    <Sparkles size={16} />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] font-medium text-stone-400">
                      {isUser ? 'You' : 'Claude Studio'}
                    </span>
                    <span className="text-[10px] text-stone-600 font-mono">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-sm shadow-md ${
                      isUser
                        ? 'bg-amber-700 text-amber-50 rounded-tr-none font-sans'
                        : 'bg-[#1e1b18] text-stone-200 border border-amber-900/20 rounded-tl-none font-sans'
                    }`}
                  >
                    {renderMessageContent(msg.content, msg.id)}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center shrink-0 shadow">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-4 items-center animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-amber-900/30 border border-amber-700/40 text-amber-400 flex items-center justify-center shrink-0">
                <RefreshCw size={16} className="animate-spin text-amber-500" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#1e1b18] border border-amber-900/20 text-xs text-amber-300 font-mono flex items-center gap-2">
                <span>Claude is thinking and generating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 md:px-12 bg-gradient-to-t from-[#181614] via-[#181614] to-transparent">
          <form
            onSubmit={handleSend}
            className="max-w-4xl mx-auto bg-[#211d19] border border-amber-900/30 focus-within:border-amber-600/60 rounded-2xl p-2 shadow-2xl transition-all"
          >
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Claude anything, write code, or execute queries... (Press Enter to send)"
              className="w-full bg-transparent text-stone-100 placeholder-stone-500 text-sm p-3 focus:outline-none resize-none font-sans"
            />

            <div className="flex items-center justify-between px-2 pt-1 border-t border-amber-950/30 text-xs">
              <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                <Globe size={13} className="text-amber-600" />
                <span>Connected to Cloud Engine</span>
              </div>

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="py-2 px-4 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-amber-950 font-semibold rounded-xl transition flex items-center gap-1.5 shadow"
              >
                <span>Send</span>
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      </main>

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1b18] border border-amber-900/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-[#151311] border-b border-amber-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="text-amber-500" size={18} />
                <h2 className="text-sm font-semibold text-stone-200">API & Database Configuration</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-stone-300 flex items-center justify-between">
                  <span>OpenRouter API Key</span>
                  <a
                    href="[https://openrouter.ai/keys](https://openrouter.ai/keys)"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-500 hover:underline text-[10px] flex items-center gap-1"
                  >
                    Get Free Key <ExternalLink size={10} />
                  </a>
                </label>
                <input
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#12100e] border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-stone-300">Supabase Project URL</label>
                <input
                  type="text"
                  placeholder="[https://your-project.supabase.co](https://your-project.supabase.co)"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#12100e] border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-stone-300">Supabase Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJh..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#12100e] border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-[#151311] border-t border-amber-900/30 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-stone-400 hover:text-stone-200 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveCredentials}
                className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-amber-950 font-semibold rounded-xl text-xs transition shadow"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

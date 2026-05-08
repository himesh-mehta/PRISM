import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Sparkles, MessageCircle, Zap, Heart, Loader2, Plus, Check, Library, Mic, FileUp, FolderPlus, ImageIcon, Minus, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exercises } from "@/data/exercises";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ExerciseModelViewer from "@/components/ExerciseModelViewer";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/api";


declare global {
  interface Window {
    playExercise?: (name: string) => void;
  }
}

interface RecommendedExercise {
  id: string;
  name: string;
  reps: string;
  sets: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  recommendations?: RecommendedExercise[];
}

const quickPrompts = [
  { icon: Heart, label: "Shoulder pain relief" },
  { icon: Zap, label: "Best stretches for back" },
  { icon: MessageCircle, label: "Improve my posture" },
  { icon: Sparkles, label: "Diet tips for recovery" },
];

const AIChatbot = () => {
  const languages = [
    { label: "English", code: "en-US" },
    { label: "हिंदी", code: "hi-IN" },
    { label: "मराठी", code: "mr-IN" },
    { label: "ગુજરાતી", code: "gu-IN" }
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const { user } = useAuth(); // Load active login triggers
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hello! I'm Prism AI, your physiotherapy assistant. Ask me about exercises, posture, nutrition, or any body part you need help with. 🏥" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<string | undefined>("stretch");
  const [currentModel, setCurrentModel] = useState<string>("/meshcharacters/idle.glb");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For managing edits within the current active recommendation card
  const [editingRecs, setEditingRecs] = useState<Record<number, RecommendedExercise[]>>({});
  const [selectedRecs, setSelectedRecs] = useState<Record<number, string[]>>({});
  const [activeRecIndex, setActiveRecIndex] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const updateEditRecCount = (index: number, id: string, field: 'reps' | 'sets', delta: number) => {
    setEditingRecs(prev => {
      const current = prev[index] || [];
      const updated = current.map(r => {
        if (r.id === id || r.name === id) {
          const val = parseInt(r[field]) || 0;
          const newVal = Math.max(1, val + delta);
          return { ...r, [field]: String(newVal) };
        }
        return r;
      });
      return { ...prev, [index]: updated };
    });
  };

  const deleteRec = (index: number, id: string) => {
    setEditingRecs(prev => {
      const current = prev[index] || [];
      const updated = current.filter(r => r.id !== id && r.name !== id);
      return { ...prev, [index]: updated };
    });
  };

  const addExerciseToRec = (index: number, ex: any) => {
    setEditingRecs(prev => {
      const current = prev[index] || [];
      const exists = current.some(r => r.name === ex.name);
      if (exists) {
        toast.error(`${ex.name} is already listed!`);
        return prev;
      }
      const newRec = { id: ex.id, name: ex.name, reps: "10", sets: "3" };
      toast.success(`Added ${ex.name}`);
      return { ...prev, [index]: [...current, newRec] };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
      toast.success(`Attached ${e.target.files.length} file(s)`);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage.code;
    recognition.continuous = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNewChat = () => {
    setMessages([
      { role: "assistant", text: "Hello! I'm Prism AI, your physiotherapy assistant. Ask me about exercises, posture, nutrition, or any body part you need help with. 🏥" }
    ]);
    toast.success("New chat started!");
  };

  const send = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    if (msg.toLowerCase().includes("jump pushup")) {
      setCurrentModel("/meshcharacters/jumppushup.glb");
    } else if (msg.toLowerCase().includes("pushup")) {
      setCurrentModel("/meshcharacters/pushup.glb");
    } else if (msg.toLowerCase().includes("plank")) {
      setCurrentModel("/meshcharacters/plank.glb");
    } else if (msg.toLowerCase().includes("neck")) {
      setCurrentModel("/meshcharacters/neck.glb");
    } else if (msg.toLowerCase().includes("stretch")) {
      setCurrentModel("/meshcharacters/stretch.glb");
    } else {
      setCurrentModel("/meshcharacters/idle.glb");
    }

    let finalMsg = msg;
    if (attachments.length > 0) {
      finalMsg += `\n\n*(Attachment: ${attachments.map(f => f.name).join(", ")})*`;
    }
    const userMsg: Message = { role: "user", text: finalMsg };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl("/api/chats"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "user",
          text: finalMsg,
          language: selectedLanguage.label,
          history: messages // Pass active chat history to backend
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      let botReply = data.aiReply || "I'm sorry, I couldn't generate a response.";

      let recs: RecommendedExercise[] = [];
      const match = botReply.match(/<recommendations>([\s\S]*?)<\/recommendations>/);
      if (match && match[1]) {
        try {
          recs = JSON.parse(match[1].trim());
          botReply = botReply.replace(/<recommendations>[\s\S]*?<\/recommendations>/, "").trim();
        } catch (e) {
          console.error("Failed to parse recommendations JSON:", e);
        }
      }

      const messageIndex = messages.length; 
      if (recs.length > 0) {
        setEditingRecs(prev => ({ ...prev, [messageIndex]: recs }));
        setSelectedRecs(prev => ({ ...prev, [messageIndex]: recs.map(r => r.id || r.name) }));
        setActiveRecIndex(messageIndex);
      }

      setMessages(prev => [...prev, { role: "assistant", text: botReply, recommendations: recs.length > 0 ? recs : undefined }]);

      // 💾 Save to Neon DB (fire-and-forget, don't block UI)
      if (user?.user_id) {
        fetch(apiUrl("/api/chat-save"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.user_id,
            userMessage: finalMsg,
            assistantReply: botReply
          })
        }).catch(err => console.error("Chat save failed:", err));
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error(error.message || "Failed to get response");
      setMessages(prev => [...prev, { role: "assistant", text: `⚠️ Error: ${error.message || "Could not connect to AI services."}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToTracker = (index: number) => {
    const recs = editingRecs[index];
    const selected = selectedRecs[index] || [];
    
    if (!recs || selected.length === 0) {
      toast.error("No exercises selected to add!");
      return;
    }

    const assigned = recs.filter(r => selected.includes(r.id || r.name)).map(r => ({
      ...r,
      id: r.id || `ai_${Math.random().toString(36).substr(2, 9)}`,
      muscles: "Reassigned by AI",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop"
    }));

    const existing = JSON.parse(localStorage.getItem('assigned_exercises') || '[]');
    const merged = [...existing, ...assigned];
    localStorage.setItem('assigned_exercises', JSON.stringify(merged));
    toast.success(`${assigned.length} exercise(s) added to tracker!`);
  };

  const updateEditRec = (index: number, id: string, field: 'reps' | 'sets', value: string) => {
    setEditingRecs(prev => {
      const currentRecs = prev[index] || [];
      const updated = currentRecs.map(r => (r.id === id || r.name === id) ? { ...r, [field]: value } : r);
      return { ...prev, [index]: updated };
    });
  };

  const formatMessageText = (text: string) => {
    return (
      <ReactMarkdown
        components={{
          h1: ({ ...props }) => <h1 className="font-display font-bold text-lg mt-3 mb-1 text-foreground" {...props} />,
          h2: ({ ...props }) => <h2 className="font-display font-bold text-base mt-2 mb-1 text-foreground" {...props} />,
          h3: ({ ...props }) => <h3 className="font-display font-bold text-sm mt-1.5 mb-1 text-foreground" {...props} />,
          p: ({ ...props }) => <p className="text-sm leading-relaxed mb-2 last:mb-0" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc ml-4 mb-2 space-y-1 text-sm text-foreground/90" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal ml-4 mb-2 space-y-1 text-sm text-foreground/90" {...props} />,
          li: ({ ...props }) => <li className="text-sm mt-0.5" {...props} />,
          strong: ({ ...props }) => <strong className="font-bold text-primary dark:text-primary-foreground" {...props} />
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-7rem)] mt-4 overflow-hidden">
      {/* Background glowing effects for Glassmorphism depth scale index anchors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl animate-pulse animation-delay-4000" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full relative z-10">
      {/* Left Panel: Chat Interface */}
      <div className="lg:col-span-2 flex flex-col h-full space-y-4 min-h-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">AI Assistant</h1>
          <p className="text-muted-foreground mt-1">Your personal physiotherapy assistant powered by AI</p>
        </motion.div>

        <div className="flex-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-border/40 shadow-elevated flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {messages.map((msg, i) => (
              <div key={i} className="flex flex-col gap-2">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-accent-gradient flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-accent-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                    msg.role === "user" ? "bg-primary text-foreground font-medium rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"
                  }`}>
                    {formatMessageText(msg.text)}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
                

              </div>
            ))}

            {/* Quick Prompts inside chat interface tray */}
            {messages.length === 1 && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center gap-3 p-6 mt-4 border border-dashed border-border/60 rounded-xl bg-secondary/5">
                <p className="text-xs text-muted-foreground font-medium">Get started with a quick prompt:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {quickPrompts.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => send(p.label)}
                      disabled={isLoading}
                      className="flex items-center gap-2 p-3 rounded-xl bg-card hover:bg-secondary text-left border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-xs font-semibold text-foreground group"
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <p.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      {p.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-accent-gradient flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-accent-foreground" />
                </div>
                <div className="bg-secondary text-foreground px-4 py-3 rounded-2xl rounded-bl-md text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-card/50">
            <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2 max-w-[85%] mx-auto items-center">
              <div className="flex items-center bg-slate-200 dark:bg-secondary rounded-full px-4 py-1 flex-1 shadow-sm border border-border/80 gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44 rounded-xl">
                    <DropdownMenuItem onClick={handleNewChat} className="flex items-center gap-2 text-xs border-b border-border/50 pb-1.5 mb-1">
                      <Plus className="w-3.5 h-3.5 text-primary" /> New Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs">
                      <FileUp className="w-3.5 h-3.5 text-primary" /> Add Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs">
                      <ImageIcon className="w-3.5 h-3.5 text-primary" /> Add Image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs">
                      <FolderPlus className="w-3.5 h-3.5 text-primary" /> Add Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  placeholder="Ask about exercises, posture, nutrition..." 
                  className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus:outline-none outline-none focus-visible:ring-offset-0 h-8 p-0 text-sm" 
                  disabled={isLoading}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold">{selectedLanguage.label}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    {languages.map(lang => (
                      <DropdownMenuItem key={lang.code} onClick={() => setSelectedLanguage(lang)} className="flex items-center gap-2 text-xs">
                        {lang.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <button 
                  type="button" 
                  onClick={startVoiceInput} 
                  className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all ${isListening ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <Button type="submit" className="bg-accent-gradient text-accent-foreground rounded-full w-9 h-9 p-0 flex items-center justify-center shrink-0" disabled={isLoading || (!input.trim() && attachments.length === 0)}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Panel: 3D Trainer */}
      <div className="flex flex-col h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-border/40 shadow-elevated overflow-hidden relative">
        <div className="p-3 border-b border-border bg-background/60 backdrop-blur-md flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" /> 3D Exercise Trainer
          </h3>
        </div>
        <div className="flex-1 relative w-full h-full bg-slate-100 dark:bg-slate-900/10">
          <ExerciseModelViewer models={[currentModel]} />
        </div>
      </div>
    </div>
    </div>
  );
};

export default AIChatbot;

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Trash2, Reply } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../api/apiClient";
import ReactMarkdown from "react-markdown";
import voyageLogo from "../../assets/Voyage Logo.png";

const AIChatPopup = ({ currentUser }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Create a user-specific storage key
    const STORAGE_KEY = `voyage_ai_chat_${currentUser?._id || "guest"}`;

    const [messages, setMessages] = useState(() => {
        // Try to load from local storage first
        const savedMessages = localStorage.getItem(STORAGE_KEY);
        if (savedMessages) {
            try {
                return JSON.parse(savedMessages);
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
        // Default initial message
        return [
            {
                role: "assistant",
                content: `Hello ${currentUser?.name ? currentUser.name.split(" ")[0] : "there"}! 👋 I'm your Voyage Pro AI assistant. How can I help you plan your dream trip today?`
            }
        ];
    });

    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); // { index, role, content }
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    // Persist messages to local storage whenever they change
    useEffect(() => {
        if (messages?.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages, STORAGE_KEY]);

    // Reset or Switch User: If currentUser changes, we might want to reload state
    useEffect(() => {
        const savedMessages = localStorage.getItem(STORAGE_KEY);
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        } else {
            // If no history for this user, start fresh
            setMessages([
                {
                    role: "assistant",
                    content: `Hello ${currentUser?.name ? currentUser.name.split(" ")[0] : "there"}! 👋 I'm your Voyage Pro AI assistant. How can I help you plan your dream trip today?`
                }
            ]);
        }
    }, [currentUser?._id, STORAGE_KEY, currentUser?.name]);

    // Show button only after scrolling past the hero section (~600px)
    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 600);
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Initial check

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // No body scroll lock — popup is compact and doesn't block the page

    const handleClearChat = () => {
        setMessages([
            {
                role: "assistant",
                content: `Hello ${currentUser?.name ? currentUser.name.split(" ")[0] : "there"}! 👋 I'm your Voyage AI assistant. How can I help you plan your dream trip today?`
            }
        ]);
        setReplyingTo(null);
    };

    const handleReply = (index) => {
        const msg = messages[index];
        setReplyingTo({ index, role: msg.role, content: msg.content });
        inputRef.current?.focus();
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isLoading) return;

        const userMessage = {
            role: "user",
            content: inputText,
            ...(replyingTo && { replyTo: { role: replyingTo.role, content: replyingTo.content } })
        };
        setMessages((prev) => [...prev, userMessage]);
        setInputText("");
        const currentReply = replyingTo;
        setReplyingTo(null);
        setIsLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));

            const response = await apiClient.post("/ai-chat/chat", {
                message: userMessage.content,
                history: history,
                replyTo: currentReply ? { role: currentReply.role, content: currentReply.content } : undefined,
                userData: {
                    name: currentUser?.name || "Guest",
                    email: currentUser?.email,
                    savedPackages: currentUser?.savedPackages,
                    likedPackages: currentUser?.likedPackages
                }
            });

            const reply = response.data.reply;
            setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const truncate = (text, maxLen = 60) => {
        if (!text) return "";
        return text.length > maxLen ? text.substring(0, maxLen) + "…" : text;
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.1, scaleX: 0.3, y: 60 }}
                        animate={{ opacity: 1, scale: 1, scaleX: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.1, scaleX: 0.3, y: 60 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
                        style={{ transformOrigin: "bottom right" }}
                        className="fixed z-[60] bottom-24 right-6 w-[350px] h-[480px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-black/40 border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden font-sans"
                    >
                        {/* Header */}
                        <div className="bg-brand dark:bg-brand-hover px-4 py-3 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/30 shadow-lg">
                                        <img src={voyageLogo} alt="Voyage" className="w-full h-full object-cover" />
                                    </div>
                                    {/* Online indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-brand dark:border-brand-hover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight tracking-wide">Voyage Pro AI</h3>
                                    <p className="text-[11px] text-white/75 font-medium mt-0.5">
                                        {currentUser?.name ? `Hey ${currentUser.name.split(" ")[0]}, ask me anything!` : "Your travel companion"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={handleClearChat}
                                    className="p-2 hover:bg-white/15 rounded-lg transition-colors"
                                    title="Clear Chat"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={toggleChat}
                                    className="p-2 hover:bg-white/15 rounded-lg transition-colors"
                                    aria-label="Close chat"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-slate-50 dark:bg-slate-950" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.03 }}
                                    className={`group flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {/* Bot avatar */}
                                    {msg.role === "assistant" && (
                                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-brand/20 dark:ring-brand-hover/40 shadow-sm mb-1">
                                            <img src={voyageLogo} alt="AI" className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    {/* Reply button (left side for user messages) */}
                                    {msg.role === "user" && (
                                        <button
                                            onClick={() => handleReply(index)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 flex-shrink-0 mb-1"
                                            title="Reply to this message"
                                        >
                                            <Reply size={14} />
                                        </button>
                                    )}

                                    <div className="max-w-[80%] flex flex-col">
                                        {/* Quoted reply block */}
                                        {msg.replyTo && (
                                            <div className={`mb-1 px-3 py-1.5 rounded-lg border-l-2 border-brand text-[11px] leading-snug ${msg.role === "user"
                                                ? "bg-brand-hover/40 text-white"
                                                : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400"
                                                }`}>
                                                <span className="font-semibold text-[10px] block mb-0.5">
                                                    {msg.replyTo.role === "user" ? (currentUser?.name?.split(" ")[0] || "You") : "Voyage AI"}
                                                </span>
                                                {truncate(msg.replyTo.content, 80)}
                                            </div>
                                        )}
                                        <div
                                            className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${msg.role === "user"
                                                ? "bg-brand dark:bg-brand-hover text-white rounded-2xl rounded-br-md shadow-sm prose prose-sm prose-invert max-w-none"
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md shadow-sm prose prose-sm prose-slate dark:prose-invert max-w-none"
                                                }`}
                                        >
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Reply button (right side for bot messages) */}
                                    {msg.role === "assistant" && (
                                        <button
                                            onClick={() => handleReply(index)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 flex-shrink-0 mb-1"
                                            title="Reply to this message"
                                        >
                                            <Reply size={14} />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex items-end gap-2 justify-start">
                                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-brand/20 dark:ring-brand/40 shadow-sm mb-1">
                                        <img src={voyageLogo} alt="AI" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm flex items-center gap-2">
                                        <span className="w-2 h-2 bg-brand-light rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-brand-hover rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Preview Bar */}
                        <AnimatePresence>
                            {replyingTo && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                        <div className="flex-1 min-w-0 border-l-2 border-brand pl-2.5">
                                            <p className="text-[10px] font-semibold text-brand dark:text-brand-light">
                                                {replyingTo.role === "user" ? (currentUser?.name?.split(" ")[0] || "You") : "Voyage AI"}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                {truncate(replyingTo.content, 50)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={cancelReply}
                                            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-colors"
                                            aria-label="Cancel reply"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Area */}
                        <div className="px-3 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                            <form onSubmit={handleSendMessage} className="relative flex items-center">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Ask me about your next trip..."
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand-light dark:focus:ring-brand-light/30 dark:focus:border-brand text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || isLoading}
                                    className="absolute right-1.5 w-9 h-9 bg-brand dark:bg-brand-hover text-white rounded-lg flex items-center justify-center hover:bg-brand-hover dark:hover:bg-brand disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-sm"
                                    aria-label="Send message"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                            <p className="text-center mt-2 text-[10px] text-slate-400 dark:text-slate-400">
                                Powered by Voyage Pro AI · May produce inaccurate results
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            {(!isOpen && isVisible) && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    onClick={toggleChat}
                    className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl shadow-brand/25 dark:shadow-black/40 z-50 hover:shadow-brand/35 transition-shadow group overflow-hidden ring-2 ring-white/80 dark:ring-slate-700"
                    aria-label="Open AI Chat"
                >
                    <img
                        src={voyageLogo}
                        alt="Voyage AI Chat"
                        className="w-full h-full object-cover rounded-full"
                    />
                </motion.button>
            )}
        </>
    );
};

export default AIChatPopup;


'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, Mic, MicOff } from 'lucide-react';

// 🌐 Dynamic Production API Endpoint Configuration
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  'https://dineflow-backend-tt3y.onrender.com';

export default function SimulatedChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '🤖 Hi! I am DineFlow Voice & Chat AI. Speak or type to test Loyalty or Place Orders directly (e.g. "Order 1 Paneer Tikka for table 2")!' }
  ]);
  const [inputName, setInputName] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [inputMsg, setInputMsg] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🎙️ Speech Recognition (Voice Input)
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported in this browser. Try Chrome!');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Optimized for English / Indian accent

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMsg(transcript);
    };

    recognition.start();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg && (!inputName || !inputPhone)) return;

    const textToSend = inputMsg;
    const userText = textToSend || `Check-in: ${inputName} (${inputPhone})`;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/simulated-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inputName || 'Voice Guest',
          phone: inputPhone || '9999999999',
          message: textToSend,
          tableNumber: '01'
        }),
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply || 'Order processed successfully!' }]);
    } catch (err) {
      console.error('Simulated Bot Error:', err);
      setMessages((prev) => [...prev, { sender: 'bot', text: '❌ Error processing AI request. Please check backend API server.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#E67E33] hover:bg-[#d47029] text-white p-4 rounded-full shadow-2xl transition-transform transform hover:scale-110 flex items-center gap-2 border border-white/20"
        >
          <Bot className="w-6 h-6" />
          <span className="text-xs font-bold hidden md:inline">Test AI Voice Order</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 md:w-96 bg-[#1A1A1C] border border-[#2E2E32] rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
          {/* Header */}
          <div className="bg-[#0F0F10] p-4 border-b border-[#2E2E32] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#E67E33]/10 text-[#E67E33] rounded-xl border border-[#E67E33]/20">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Voice & Chat Order AI</h3>
                <p className="text-[10px] text-emerald-400 font-semibold">● Online • Live KDS Sync</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[#9E9EAC] hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0F0F10]">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line font-medium ${
                  m.sender === 'user'
                    ? 'bg-[#E67E33] text-white rounded-br-none'
                    : 'bg-[#1A1A1C] border border-[#2E2E32] text-[#E0E0E6] rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-[10px] text-[#9E9EAC] font-mono animate-pulse">Processing Order & AI Response...</div>}
            <div ref={chatEndRef} />
          </div>

          {/* Controls Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#1A1A1C] border-t border-[#2E2E32] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Name"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="bg-[#0F0F10] border border-[#2E2E32] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Phone"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                className="bg-[#0F0F10] border border-[#2E2E32] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type or speak order (e.g. 2 Coke)..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 bg-[#0F0F10] border border-[#2E2E32] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E67E33]"
              />
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2 rounded-xl transition ${isListening ? 'bg-rose-600 text-white animate-bounce' : 'bg-[#2E2E32] text-[#9E9EAC] hover:text-white'}`}
                title="Click to speak"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="submit"
                disabled={loading || (!inputMsg.trim() && !inputName.trim())}
                className="bg-[#E67E33] hover:bg-[#d47029] text-white p-2 rounded-xl transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
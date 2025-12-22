'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Bot, X, Maximize2, Minimize2, Loader, AlertCircle, Image, ChevronDown, BookmarkPlus, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { SaveChatModal } from './SaveChatModal';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIAssistantProps {
  plantId?: string;
  plantData?: any;
  embedded?: boolean;
}

// Photo analysis modes
type PhotoMode = 'recent' | 'comprehensive' | 'none';

// Context modes for different query types
type ContextMode = 'discussion' | 'visual' | 'progress' | 'report' | 'freestyle';

interface QuickActionTemplate {
  id: ContextMode;
  label: string;
  icon: string;
  description: string;
  query: string;
  photoMode: PhotoMode;
  photoCount: number;
}

const QUICK_ACTIONS: QuickActionTemplate[] = [
  {
    id: 'discussion',
    label: 'Substrate',
    icon: '📊',
    description: 'EC/pH trends, feeding analysis',
    query: 'Analyze my recent care data - EC/pH trends, substrate health, and any recommendations for adjustments.',
    photoMode: 'none',
    photoCount: 0,
  },
  {
    id: 'visual',
    label: 'Visual',
    icon: '👁️',
    description: 'Quick health check',
    query: 'Quick visual health check - any issues or concerns you see in the recent photos?',
    photoMode: 'recent',
    photoCount: 3,
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: '📈',
    description: 'Growth over time',
    query: 'How has this plant progressed over time? Compare the photos chronologically and assess growth trajectory.',
    photoMode: 'comprehensive',
    photoCount: 10,
  },
  {
    id: 'report',
    label: 'Full Report',
    icon: '📋',
    description: 'Comprehensive analysis',
    query: 'Generate a comprehensive status report: visual assessment, care data analysis, environmental conditions, and prioritized recommendations.',
    photoMode: 'comprehensive',
    photoCount: 20,
  },
];

// Strip XML-style tags from AI responses (Claude sometimes outputs structured tags)
function stripXmlTags(text: string): string {
  // Remove opening and closing XML-style tags like <analyze_photos>, <photo_analysis photo_number="1">, etc.
  return text
    .replace(/<\/?[a-z_]+(?:\s+[a-z_]+="[^"]*")*\s*>/gi, '')
    .replace(/\n{3,}/g, '\n\n') // Clean up excessive newlines left behind
    .trim();
}

export default function AIAssistant({ plantId, plantData, embedded = false }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [isMaximized, setIsMaximized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [photoMode, setPhotoMode] = useState<PhotoMode>('recent');
  const [contextMode, setContextMode] = useState<ContextMode | null>(null);
  const [freestyleMode, setFreestyleMode] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [savingTurnIndex, setSavingTurnIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Track previous plantId to detect plant switches
  const prevPlantIdRef = useRef(plantId);

  const photoCount = plantData?.photos?.length || 0;
  const photosToSend = photoMode === 'comprehensive' ? Math.min(photoCount, 20) : Math.min(photoCount, 3);

  // Use refs to track current modes so transport always has latest values
  const photoModeRef = useRef(photoMode);
  photoModeRef.current = photoMode;
  const contextModeRef = useRef(contextMode);
  contextModeRef.current = contextMode;

  // Create transport that reads from refs to always get current modes
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({
      plantContext: plantData,
      photoMode: photoModeRef.current,
      contextMode: contextModeRef.current
    })
  }), [plantData]);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
    messages: plantData ? [{
      id: 'context',
      role: 'assistant' as const,
      parts: [{ type: 'text' as const, text: `I'm ready to help with ${plantData.hybridName || plantData.species || 'this plant'}. I have access to ${photoCount} photo${photoCount !== 1 ? 's' : ''} and will analyze the ${photoMode === 'comprehensive' ? 'full photo history' : '3 most recent photos'}. What would you like to know?` }]
    }] : []
  });

  // Reset chat when plantId changes (prevents cross-plant context bleed)
  useEffect(() => {
    if (prevPlantIdRef.current !== plantId && plantId) {
      prevPlantIdRef.current = plantId;
      // Clear messages and reset to initial context for new plant
      setMessages([{
        id: 'context',
        role: 'assistant' as const,
        parts: [{ type: 'text' as const, text: `I'm ready to help with ${plantData?.hybridName || plantData?.species || 'this plant'}. I have access to ${photoCount} photo${photoCount !== 1 ? 's' : ''} and will analyze the ${photoMode === 'comprehensive' ? 'full photo history' : '3 most recent photos'}. What would you like to know?` }]
      }]);
    }
  }, [plantId, plantData, photoCount, photoMode, setMessages]);

  const isLoading = status === 'streaming' || status === 'submitted';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserHasScrolled(false);
    setShowScrollButton(false);
  }, []);

  // Handle scroll events to detect user scrolling
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (!isAtBottom && isLoading) {
      setUserHasScrolled(true);
      setShowScrollButton(true);
    } else if (isAtBottom) {
      setUserHasScrolled(false);
      setShowScrollButton(false);
    }
  }, [isLoading]);

  // Auto-scroll only when user hasn't manually scrolled up
  useEffect(() => {
    if (!userHasScrolled && messages.length > 0) {
      // Only auto-scroll for new messages, not during streaming
      if (status === 'ready') {
        scrollToBottom();
      }
    }
  }, [messages.length, status, userHasScrolled, scrollToBottom]);

  // Show scroll button when there's new content and user is scrolled up
  useEffect(() => {
    if (userHasScrolled && isLoading) {
      setShowScrollButton(true);
    }
  }, [userHasScrolled, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');
    setUserHasScrolled(false); // Reset scroll state for new message
    await sendMessage({ text: message });
  };

  // Handle quick action button clicks
  const handleQuickAction = async (action: QuickActionTemplate) => {
    if (isLoading) return;

    // Set the appropriate modes
    setContextMode(action.id);
    setPhotoMode(action.photoMode);

    // Update refs immediately for the transport
    contextModeRef.current = action.id;
    photoModeRef.current = action.photoMode;

    setUserHasScrolled(false);
    await sendMessage({ text: action.query });
  };

  // Copy a message to clipboard
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get the turn (user Q + AI A) for a specific assistant message
  const getTurnMessages = (assistantIndex: number): ChatMessage[] => {
    const result: ChatMessage[] = [];
    const nonContextMessages = messages.filter(m => m.id !== 'context');

    // Find the assistant message at this index
    let assistantCount = 0;
    for (let i = 0; i < nonContextMessages.length; i++) {
      const m = nonContextMessages[i];
      if (m.role === 'assistant') {
        if (assistantCount === assistantIndex) {
          // Found the target assistant message, now get the preceding user message
          if (i > 0 && nonContextMessages[i - 1].role === 'user') {
            const userMsg = nonContextMessages[i - 1];
            result.push({
              role: 'user',
              content: userMsg.parts?.filter((p): p is { type: 'text'; text: string } => p.type === 'text').map(p => p.text).join('') || '',
              timestamp: new Date().toISOString(),
            });
          }
          // Add the assistant message
          result.push({
            role: 'assistant',
            content: m.parts?.filter((p): p is { type: 'text'; text: string } => p.type === 'text').map(p => p.text).join('') || '',
            timestamp: new Date().toISOString(),
          });
          break;
        }
        assistantCount++;
      }
    }
    return result;
  };

  // Open save modal for a specific turn
  const handleSaveTurn = (assistantIndex: number) => {
    setSavingTurnIndex(assistantIndex);
    setShowSaveModal(true);
  };

  // Check if there's a saveable conversation (more than just the context message)
  const hasSaveableConversation = messages.length > 1 && messages.some(m => m.role === 'user');

  // Convert messages to ChatMessage format for the save modal
  const getChatMessages = (): ChatMessage[] => {
    return messages
      .filter(m => m.id !== 'context')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.parts
          ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
          .map(part => part.text)
          .join('') || '',
        timestamp: new Date().toISOString(),
      }));
  };

  // Save with quality score
  const handleSave = async (data: {
    messages: ChatMessage[];
    qualityScore: number;
    displayContent?: string;
    originalContent: string;
  }) => {
    if (!plantId) return;

    const response = await fetch('/api/chat-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plantId,
        messages: data.messages,
        qualityScore: data.qualityScore,
        originalContent: data.originalContent,
        displayContent: data.displayContent,
        conversationDate: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save');
    }
  };

  // Save as negative example
  const handleSaveNegative = async (data: {
    messages: ChatMessage[];
    originalContent: string;
    failureType?: string;
    failureNotes?: string;
  }) => {
    const response = await fetch('/api/negative-examples', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plantId: plantId || null,
        messages: data.messages,
        originalContent: data.originalContent,
        failureType: data.failureType,
        failureNotes: data.failureNotes,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save negative example');
    }
  };

  if (!embedded && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-[var(--moss)] text-white p-4 rounded-full shadow-lg hover:bg-[var(--forest)] transition-colors z-50"
        aria-label="Open AI Assistant"
      >
        <Bot size={24} />
      </button>
    );
  }

  const containerClass = embedded
    ? "bg-white border border-black/[0.08] rounded-xl h-full flex flex-col"
    : isMaximized
    ? "fixed inset-4 bg-white rounded-xl shadow-2xl z-50 flex flex-col"
    : "fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-xl shadow-2xl z-50 flex flex-col";

  return (
    <>
      <div className={containerClass}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.08]">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[var(--moss)]" />
            <h3 className="font-medium text-[var(--bark)]">Cladari AI</h3>
            {plantData && (
              <span className="text-xs text-[var(--clay)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-full">
                {plantData.plantId || plantData.hybridName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Save to Journal button - opens modal */}
            {plantId && hasSaveableConversation && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors bg-[var(--bg-primary)] text-[var(--bark)] hover:bg-[var(--parchment)]"
                title="Save to journal"
              >
                <BookmarkPlus size={12} />
                Save
              </button>
            )}
            {!embedded && (
              <>
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 text-[var(--clay)] hover:text-[var(--bark)] hover:bg-[var(--bg-primary)] rounded"
                >
                  {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-[var(--clay)] hover:text-[var(--bark)] hover:bg-[var(--bg-primary)] rounded"
                >
                  <X size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        >
          {messages.length === 0 && (
            <div className="text-center text-[var(--clay)] mt-4">
              <Bot size={32} className="mx-auto mb-2 text-[var(--moss)] opacity-50" />
              <p className="text-sm font-medium text-[var(--bark)]">
                {plantData?.hybridName || plantData?.species || 'Cladari AI'}
              </p>
              {plantData && photoCount > 0 && (
                <p className="text-[10px] mt-1 text-[var(--clay)]">
                  {photoCount} photos • {plantData.careLogs?.length || 0} care logs
                </p>
              )}

              {/* Quick Action Templates */}
              {plantData && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--clay)] mb-2">Quick Analysis</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action)}
                        disabled={isLoading || (action.photoCount > 0 && photoCount === 0)}
                        className="flex flex-col items-center p-3 rounded-lg border border-black/[0.08] bg-white hover:bg-[var(--parchment)] hover:border-[var(--moss)]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="text-lg">{action.icon}</span>
                        <span className="text-xs font-medium text-[var(--bark)] mt-1">{action.label}</span>
                        <span className="text-[10px] text-[var(--clay)]">{action.description}</span>
                        {action.photoCount > 0 && (
                          <span className="text-[9px] text-[var(--moss)] mt-0.5">
                            {action.photoCount} photos
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Freestyle Toggle */}
                  <button
                    onClick={() => setFreestyleMode(!freestyleMode)}
                    className={`w-full mt-3 flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs transition-colors ${
                      freestyleMode
                        ? 'bg-[var(--moss)] text-white'
                        : 'bg-black/5 text-[var(--clay)] hover:bg-black/10 hover:text-[var(--bark)]'
                    }`}
                  >
                    <span>🔬</span>
                    <span>{freestyleMode ? 'Freestyle Mode Active' : 'Freestyle Mode'}</span>
                  </button>
                  {freestyleMode && (
                    <p className="text-[10px] text-[var(--clay)] italic">
                      Multi-turn conversation enabled. Type anything below.
                    </p>
                  )}
                </div>
              )}

              {/* Non-plant context fallback */}
              {!plantData && (
                <p className="text-xs mt-2">
                  Select a plant to access AI analysis
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle size={16} />
              <span>Connection error. Make sure ANTHROPIC_API_KEY is configured.</span>
            </div>
          )}

          {messages.map((message, messageIndex) => {
            // Extract text content from message parts and strip XML tags
            const rawContent = message.parts
              ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
              .map(part => part.text)
              .join('') || '';
            const textContent = message.role === 'assistant' ? stripXmlTags(rawContent) : rawContent;

            // Track assistant message index (for per-turn save)
            const nonContextMessages = messages.filter(m => m.id !== 'context');
            const assistantIndex = message.role === 'assistant' && message.id !== 'context'
              ? nonContextMessages.filter(m => m.role === 'assistant').findIndex(m => m.id === message.id)
              : -1;

            const isContextMessage = message.id === 'context';

            return (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.role === 'assistant' ? 'group' : ''}`}>
                  <div
                    className={`rounded-xl px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-[var(--moss)] text-white'
                        : 'bg-[var(--bg-primary)] text-[var(--bark)]'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{textContent}</p>
                    ) : (
                      <div className="text-sm prose prose-sm max-w-none prose-headings:text-[var(--bark)] prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-strong:text-[var(--bark)]">
                        <ReactMarkdown
                          components={{
                            // Custom components for better styling
                            h1: ({ children }) => <h3 className="text-base font-bold mt-3 mb-1">{children}</h3>,
                            h2: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
                            h3: ({ children }) => <h5 className="text-sm font-medium mt-2 mb-1">{children}</h5>,
                            p: ({ children }) => <p className="my-1.5">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside my-1.5 space-y-0.5">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside my-1.5 space-y-0.5">{children}</ol>,
                            li: ({ children }) => <li className="text-sm">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children }) => (
                              <code className="bg-black/5 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                            ),
                            pre: ({ children }) => (
                              <pre className="bg-black/5 p-2 rounded my-2 overflow-x-auto text-xs">{children}</pre>
                            ),
                          }}
                        >
                          {textContent}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Per-turn action buttons for assistant messages (not context) */}
                  {message.role === 'assistant' && !isContextMessage && plantId && (
                    <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopyMessage(message.id, textContent)}
                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-black/5 text-[var(--clay)] hover:bg-black/10 hover:text-[var(--bark)] transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedMessageId === message.id ? (
                          <>
                            <Check size={10} className="text-green-600" />
                            <span className="text-green-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={10} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleSaveTurn(assistantIndex)}
                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-black/5 text-[var(--clay)] hover:bg-black/10 hover:text-[var(--bark)] transition-colors"
                        title="Save this turn to journal"
                      >
                        <BookmarkPlus size={10} />
                        <span>Save</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[var(--bg-primary)] rounded-xl px-3 py-2">
                <Loader className="w-4 h-4 animate-spin text-[var(--clay)]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 bg-[var(--moss)] text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 text-xs hover:bg-[var(--forest)] transition-colors"
            >
              <ChevronDown size={14} />
              New content
            </button>
          )}
        </div>

        {/* Input - show when freestyle mode or conversation in progress */}
        {(freestyleMode || messages.length > 1) && (
        <form onSubmit={handleSubmit} className="p-3 border-t border-black/[0.08]">
          {/* Photo mode selector - only in freestyle mode */}
          {freestyleMode && photoCount > 0 && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-black/[0.04]">
              <span className="text-[10px] text-[var(--clay)]">Photos:</span>
              <div className="flex gap-1">
                {(['none', 'recent', 'comprehensive'] as PhotoMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPhotoMode(mode)}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                      photoMode === mode
                        ? 'bg-[var(--moss)] text-white'
                        : 'bg-black/5 text-[var(--clay)] hover:bg-black/10'
                    }`}
                  >
                    {mode === 'none' ? '0' : mode === 'recent' ? '3' : '20'}
                  </button>
                ))}
              </div>
              {photoMode !== 'none' && (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-auto">
                  ~{photoMode === 'comprehensive' ? '30' : '10'}K tokens
                </span>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={plantData ? `Ask about ${plantData.hybridName || 'this plant'}...` : "Ask me anything..."}
              className="flex-1 px-3 py-2 text-sm border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--moss)] focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-3 py-2 bg-[var(--moss)] text-white rounded-lg hover:bg-[var(--forest)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
        )}
      </div>

      {/* Save Modal */}
      <SaveChatModal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          setSavingTurnIndex(null);
        }}
        messages={savingTurnIndex !== null ? getTurnMessages(savingTurnIndex) : getChatMessages()}
        plantId={plantId || ''}
        onSave={handleSave}
        onSaveNegative={handleSaveNegative}
      />
    </>
  );
}

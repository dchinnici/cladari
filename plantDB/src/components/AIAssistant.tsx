'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Bot, X, Maximize2, Minimize2, Loader, AlertCircle, Image, ChevronDown, BookmarkPlus } from 'lucide-react';
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
type PhotoMode = 'recent' | 'comprehensive';

export default function AIAssistant({ plantId, plantData, embedded = false }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [isMaximized, setIsMaximized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [photoMode, setPhotoMode] = useState<PhotoMode>('recent');
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Track previous plantId to detect plant switches
  const prevPlantIdRef = useRef(plantId);

  const photoCount = plantData?.photos?.length || 0;
  const photosToSend = photoMode === 'comprehensive' ? Math.min(photoCount, 20) : Math.min(photoCount, 3);

  // Use a ref to track current photoMode so transport always has latest value
  const photoModeRef = useRef(photoMode);
  photoModeRef.current = photoMode;

  // Create transport that reads from ref to always get current photoMode
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({
      plantContext: plantData,
      photoMode: photoModeRef.current
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
            <div className="text-center text-[var(--clay)] mt-8">
              <Bot size={40} className="mx-auto mb-3 text-[var(--moss)] opacity-50" />
              <p className="text-sm font-medium text-[var(--bark)]">Cladari AI Assistant</p>
              {plantData ? (
                <>
                  <p className="text-xs mt-1">
                    Ask me anything about {plantData.hybridName || plantData.species}
                  </p>
                  {photoCount > 0 && (
                    <p className="text-xs mt-1 text-[var(--moss)]">
                      <Image size={12} className="inline mr-1" />
                      {photoCount} photo{photoCount !== 1 ? 's' : ''} available for analysis
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs mt-1">
                  Ask about plants, care, breeding, or diagnose issues
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {plantData && photoCount > 0 ? (
                  <>
                    <button
                      onClick={() => setInputValue('Analyze the photos and assess plant health')}
                      className="text-xs px-3 py-1.5 bg-[var(--bg-primary)] text-[var(--bark)] rounded-full hover:bg-[var(--parchment)]"
                    >
                      Analyze photos
                    </button>
                    <button
                      onClick={() => setInputValue('What trends do you see in the care data?')}
                      className="text-xs px-3 py-1.5 bg-[var(--bg-primary)] text-[var(--bark)] rounded-full hover:bg-[var(--parchment)]"
                    >
                      Care trends
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setInputValue('Which plants need water soon?')}
                      className="text-xs px-3 py-1.5 bg-[var(--bg-primary)] text-[var(--bark)] rounded-full hover:bg-[var(--parchment)]"
                    >
                      Plants needing water
                    </button>
                    <button
                      onClick={() => setInputValue('Show me elite genetics plants')}
                      className="text-xs px-3 py-1.5 bg-[var(--bg-primary)] text-[var(--bark)] rounded-full hover:bg-[var(--parchment)]"
                    >
                      Elite genetics
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle size={16} />
              <span>Connection error. Make sure ANTHROPIC_API_KEY is configured.</span>
            </div>
          )}

          {messages.map((message) => {
            // Extract text content from message parts
            const textContent = message.parts
              ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
              .map(part => part.text)
              .join('') || '';

            return (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
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

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-black/[0.08]">
          {/* Photo mode toggle - only show if plant has photos */}
          {photoCount > 0 && (
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-black/[0.04]">
              <div className="flex items-center gap-1.5 text-xs text-[var(--clay)]">
                <Image size={12} />
                <span>{photosToSend} of {photoCount} photos</span>
              </div>
              {photoCount > 3 && (
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={photoMode === 'comprehensive'}
                    onChange={(e) => setPhotoMode(e.target.checked ? 'comprehensive' : 'recent')}
                    className="w-3.5 h-3.5 rounded border-black/20 text-[var(--moss)] focus:ring-[var(--moss)]"
                  />
                  <span className="text-[var(--clay)]">
                    Deep analysis
                  </span>
                  {photoMode === 'comprehensive' && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      ~{Math.round(photosToSend * 1.5)}K tokens
                    </span>
                  )}
                </label>
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
      </div>

      {/* Save Modal */}
      <SaveChatModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        messages={getChatMessages()}
        plantId={plantId || ''}
        onSave={handleSave}
        onSaveNegative={handleSaveNegative}
      />
    </>
  );
}

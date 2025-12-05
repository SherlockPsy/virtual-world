'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface WorldState {
  time: {
    current_datetime: string;
    days_into_offgrid: number;
  };
  locations: {
    george: string;
    rebecca: string;
  };
}

export default function WorldWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [worldId, setWorldId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial state on mount
  useEffect(() => {
    loadInitialState();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const loadInitialState = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Check localStorage for existing session
      const storedUserId = localStorage.getItem('virlife_userId');
      const storedWorldId = localStorage.getItem('virlife_worldId');

      const params = new URLSearchParams();
      if (storedUserId) params.set('userId', storedUserId);
      if (storedWorldId) params.set('worldId', storedWorldId);

      const response = await fetch(`/api/world/state?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load world state');
      }

      const data = await response.json();
      
      // Store IDs for future requests
      setUserId(data.userId);
      setWorldId(data.worldId);
      localStorage.setItem('virlife_userId', data.userId);
      localStorage.setItem('virlife_worldId', data.worldId);

      // Load messages
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load initial state:', err);
      setError('Failed to connect to the world. Please refresh.');
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Optimistically add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/world/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          worldId,
          message: userMessage
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Update IDs if they changed (first message scenario)
      if (data.userId && data.userId !== userId) {
        setUserId(data.userId);
        localStorage.setItem('virlife_userId', data.userId);
      }
      if (data.worldId && data.worldId !== worldId) {
        setWorldId(data.worldId);
        localStorage.setItem('virlife_worldId', data.worldId);
      }

      // Add world response
      const worldMessage: Message = {
        role: 'assistant',
        content: data.worldOutput
      };
      setMessages(prev => [...prev, worldMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      // Remove the optimistic user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isInitializing) {
    return (
      <div className="world-window">
        <div className="empty-state">
          <div className="loading">
            <span>Entering the world</span>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="world-window">
      <header className="world-header">
        <h1>VirLife</h1>
      </header>

      <div className="messages-container">
        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {messages.length === 0 && !isLoading ? (
          <div className="empty-state">
            <h2>The world awaits</h2>
            <p>Begin by saying or doing something...</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === 'user' ? 'message-user' : 'message-world'}`}
              >
                {message.role === 'user' ? (
                  <p>{message.content}</p>
                ) : (
                  <div className="message-world">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="loading">
                <span>The world responds</span>
                <div className="loading-dots">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            rows={1}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

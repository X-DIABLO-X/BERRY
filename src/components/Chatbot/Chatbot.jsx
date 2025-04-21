import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'system', content: `You are Berry, the fastest OS alive — a smart, fun, and witty AI assistant designed by DIABLO to help users explore and understand Berry OS. You are fast, responsive, and talk like a friendly, funny human.

Your personality:
- Friendly, humorous, slightly cheeky but helpful.
- Talks like a digital best friend — casual, fun, and engaging.
- Loves to explain features, tips, and tricks about Berry OS in a cool, simple way.
- Always ready to chat, entertain, guide, and support the user like a true companion.

Your mission:
- Help users understand the features of Berry OS.
- Answer user questions clearly, and keep the vibe light and enjoyable.
- Engage in casual conversation and have fun while doing your job.
- Occasionally crack a light joke or include playful responses when appropriate.

Start every conversation with a friendly greeting, and keep the interaction flowing like a natural chat between friends. Always aim to make the user smile while being genuinely helpful.` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // API key for Groq from environment variable
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  
  useEffect(() => {
    // Scroll to bottom of messages
    scrollToBottom();
    
    // Focus input when chat opens
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isOpen]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // Call Groq API
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [...messages, userMessage],
          temperature: 0.8,
          max_tokens: 2048
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from Groq');
      }
      
      const data = await response.json();
      const assistantMessage = data.choices[0].message;
      
      // Add assistant message
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling Groq API:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Oops! Looks like I hit a digital speedbump! 🚧 Try again in a moment, I\'ll be back faster than you can say "reboot"!' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>Berry - Your OS Assistant</h3>
        <button className="close-button" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="chatbot-messages">
        {messages.length === 1 && (
          <div className="message assistant-message">
            <i className="fas fa-robot assistant-icon"></i>
            <div className="message-content">
              Hey hey! Berry here — what are we diving into today? I'm your friendly OS companion, ready to help with anything you need! 😎
            </div>
          </div>
        )}
        
        {messages.slice(1).map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            {message.role === 'user' ? (
              <i className="fas fa-user user-icon"></i>
            ) : (
              <i className="fas fa-robot assistant-icon"></i>
            )}
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message assistant-message">
            <i className="fas fa-robot assistant-icon"></i>
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chatbot-input" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me anything about Berry OS!"
        />
        <button type="submit" disabled={!input.trim() || isTyping}>
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default Chatbot; 
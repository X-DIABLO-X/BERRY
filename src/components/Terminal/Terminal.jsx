import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Terminal.css';
import { executeCommand, handleTerminalKeyDown } from './terminalCommands';
import { FiX, FiTerminal, FiPlus } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import { VscChromeMinimize, VscChromeClose, VscChromeMaximize, VscChromeRestore } from 'react-icons/vsc';
import { IoMdAdd } from 'react-icons/io';

/**
 * Modern Terminal Component for BerryOS
 * Professional terminal interface styled after Kali Linux
 */
const Terminal = ({ 
  onClose = () => {},
  onMinimize = () => {},
  onMaximize = () => {},
  initialUser = 'root', 
  initialHostname = 'berry',
  initialDir = '~',
  initialTabs = [
    {
      id: 'terminal1',
      title: 'Terminal',
      icon: <FiTerminal />,
      host: 'berry',
      directory: '~'
    }
  ],
  initialActiveTab = 'terminal1',
  isMaximized = false,
  inWindow = false
}) => {
  // Terminal tabs state
  const [tabs, setTabs] = useState(initialTabs);
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [maximized, setMaximized] = useState(isMaximized);
  
  // Update maximized state when prop changes
  useEffect(() => {
    setMaximized(isMaximized);
  }, [isMaximized]);
  
  // Terminal configuration
  const terminalConfig = {
    // Appearance
    styles: {
      backgroundColor: '#0d0d0d',
      textColor: '#f8f8f2',
      promptUserColor: '#50fa7b',
      promptHostColor: '#50fa7b', 
      promptPathColor: '#8be9fd',
      promptSymbolColor: '#ff79c6',
      errorColor: '#ff5555',
      warningColor: '#ffb86c',
      successColor: '#50fa7b',
      infoColor: '#bd93f9',
      selectionColor: '#44475a',
      cursorColor: '#f8f8f2',
    },
    // Behavior
    maxHistoryItems: 100,
    maxOutputLines: 1000,
    scrollbackBuffer: 500,
    defaultUser: initialUser,
    defaultHostname: initialHostname,
    defaultDir: initialDir,
    font: "'JetBrains Mono', 'DejaVu Sans Mono', 'Ubuntu Mono', monospace",
    fontSize: '14px',
    tabSize: 2,
    cursorBlink: true,
  };

  // Initialize terminal states with state for each tab
  const initialTerminalStates = {};
  initialTabs.forEach(tab => {
    initialTerminalStates[tab.id] = {
      currentDir: terminalConfig.defaultDir,
      history: [
        { id: `welcome-${tab.id}-0`, type: 'info', content: `
<pre style="color: #50fa7b; margin: 0; line-height: 1.2; font-family: monospace;">
 ____                       ___  ____ 
| __ )  ___ _ __ _ __ _   _/ _ \\/ ___|
|  _ \\ / _ \\ '__| '__| | | | | | \\___ \\
| |_) |  __/ |  | |  | |_| | |_| |___) |
|____/ \\___|_|  |_|   \\__, |\\___/|____/ 
                      |___/            
</pre>` },
        { id: `welcome-${tab.id}-1`, type: 'info', content: `<span style="color: #bd93f9;">Welcome to BerryOS Terminal v1.0.0</span>` },
        { id: `welcome-${tab.id}-2`, type: 'info', content: `<span style="color: #8be9fd;">Running on Kali Linux kernel 5.15.0</span>` },
        { id: `welcome-${tab.id}-3`, type: 'info', content: `<span style="color: #50fa7b;">Type 'help' to see available commands.</span>` },
        { id: `welcome-${tab.id}-4`, type: 'empty', content: '' },
      ],
      input: '',
      commandHistory: [],
      historyIndex: -1,
      user: terminalConfig.defaultUser,
      hostname: terminalConfig.defaultHostname,
      isExecuting: false,
      lastCommand: null,
      lastExitCode: 0,
      cursorPosition: 0,
    };
  });

  // Terminal state for each tab
  const [terminalStates, setTerminalStates] = useState(initialTerminalStates);
  const [cursorBlinking, setCursorBlinking] = useState(true);

  // Refs for DOM access
  const terminalRefs = useRef({});
  const hiddenInputRef = useRef(null);
  const outputRef = useRef(null);
  
  // Get active tab
  const getActiveTab = () => {
    return tabs.find(tab => tab.id === activeTab) || tabs[0];
  };

  // Get terminal state for active tab
  const getActiveTerminalState = () => {
    const currentTab = getActiveTab();
    return terminalStates[currentTab.id] || terminalStates[tabs[0].id];
  };

  // Update terminal state for active tab
  const updateActiveTerminalState = (updater) => {
    const currentTab = getActiveTab();
    setTerminalStates(prev => ({
      ...prev,
      [currentTab.id]: updater(prev[currentTab.id]),
    }));
  };

  // Auto-scroll when history changes
  useEffect(() => {
    const currentTab = getActiveTab();
    if (terminalRefs.current[currentTab.id]) {
      terminalRefs.current[currentTab.id].scrollTop = terminalRefs.current[currentTab.id].scrollHeight;
    }
  }, [terminalStates, activeTab]);

  // Focus hidden input when terminal is active or tab changes
  useEffect(() => {
    if (hiddenInputRef.current) {
      setTimeout(() => {
        hiddenInputRef.current.focus();
      }, 10);
    }
  }, [activeTab]);

  // Handle tab switching
  const switchTab = (tabId) => {
    setActiveTab(tabId);
    setTimeout(() => {
      hiddenInputRef.current?.focus();
    }, 0);
  };

  // Add a new terminal tab
  const addTab = () => {
    const newTabId = uuidv4();
    const newTab = {
      id: newTabId,
      title: `Terminal ${tabs.length + 1}`,
      icon: <FiTerminal />,
      host: terminalConfig.defaultHostname,
      directory: terminalConfig.defaultDir
    };
    
    setTabs([...tabs, newTab]);
    setActiveTab(newTabId);
    
    setTerminalStates(prev => ({
      ...prev,
      [newTabId]: {
        currentDir: terminalConfig.defaultDir,
        history: [
          { id: `welcome-${newTabId}-0`, type: 'info', content: `
<pre style="color: #50fa7b; margin: 0; line-height: 1.2; font-family: monospace;">
 ____                       ___  ____ 
| __ )  ___ _ __ _ __ _   _/ _ \\/ ___|
|  _ \\ / _ \\ '__| '__| | | | | | \\___ \\
| |_) |  __/ |  | |  | |_| | |_| |___) |
|____/ \\___|_|  |_|   \\__, |\\___/|____/ 
                      |___/            
</pre>` },
          { id: `welcome-${newTabId}-1`, type: 'info', content: `<span style="color: #bd93f9;">Welcome to BerryOS Terminal v1.0.0</span>` },
          { id: `welcome-${newTabId}-2`, type: 'info', content: `<span style="color: #8be9fd;">Running on Kali Linux kernel 5.15.0</span>` },
          { id: `welcome-${newTabId}-3`, type: 'info', content: `<span style="color: #50fa7b;">Type 'help' to see available commands.</span>` },
          { id: `welcome-${newTabId}-4`, type: 'empty', content: '' },
        ],
        input: '',
        commandHistory: [],
        historyIndex: -1,
        user: terminalConfig.defaultUser,
        hostname: terminalConfig.defaultHostname,
        isExecuting: false,
        lastCommand: null,
        lastExitCode: 0,
        cursorPosition: 0,
      }
    }));
    
    setTimeout(() => {
      hiddenInputRef.current?.focus();
    }, 10);
  };

  // Close a terminal tab
  const closeTab = (tabId, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    // If it's the last tab, close the entire terminal
    if (tabs.length === 1) {
      onClose();
      return;
    }
    
    const isCurrentTab = tabId === activeTab;
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    
    // Remove the tab
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    
    // If we're closing the active tab, activate another one
    if (isCurrentTab && newTabs.length > 0) {
      const newActiveIndex = tabIndex === 0 ? 0 : tabIndex - 1;
      setActiveTab(newTabs[newActiveIndex].id);
    }
    
    setTabs(newTabs);
    
    // Clean up the terminal state
    setTerminalStates(prev => {
      const newState = { ...prev };
      delete newState[tabId];
      return newState;
    });
  };

  // Handle input changes
  const handleInputChange = (e) => {
    updateActiveTerminalState(prevState => ({
      ...prevState,
      input: e.target.value,
      cursorPosition: e.target.selectionStart,
    }));
    setCursorBlinking(true);
  };

  // Handle terminal click
  const handleTerminalClick = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  };

  // Handle key down events
  const handleKeyDown = (e) => {
    const activeState = getActiveTerminalState();
    const currentInput = activeState.input;
    const historyIndex = activeState.historyIndex;
    const commandHistory = activeState.commandHistory;
    
    // Handle Enter key
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Get the command from input
      const command = currentInput.trim();
      
      if (command) {
        // Create formatted command entry with prompt
        const promptText = `${activeState.user}@${activeState.hostname}:${activeState.currentDir}$ `;
        
        // Add command to history
        updateActiveTerminalState(prevState => {
          const newHistory = [...prevState.history];
          // Add command with prompt to history
          newHistory.push({
            id: uuidv4(),
            type: 'command',
            content: `${promptText}${command}`
          });
          
          return {
            ...prevState,
            history: newHistory,
            input: '',
            commandHistory: [command, ...prevState.commandHistory].slice(0, 50),
            historyIndex: -1,
            isExecuting: true,
            lastCommand: command,
          };
        });
        
        // Execute command
        executeCommandWrapper(command);
      } else {
        // Just add a new empty line with prompt for empty commands
        const promptText = `${activeState.user}@${activeState.hostname}:${activeState.currentDir}$ `;
        updateActiveTerminalState(prevState => {
          const newHistory = [...prevState.history];
          newHistory.push({
            id: uuidv4(),
            type: 'command',
            content: promptText
          });
          
          return {
            ...prevState,
            history: newHistory,
            input: '',
          };
        });
      }
      
      return;
    }
    
    // Up arrow - command history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        updateActiveTerminalState(prevState => ({
          ...prevState,
          input: commandHistory[newIndex] || '',
          historyIndex: newIndex,
          cursorPosition: commandHistory[newIndex]?.length || 0,
        }));
      }
      
      return;
    }
    
    // Down arrow - command history navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        updateActiveTerminalState(prevState => ({
          ...prevState,
          input: newIndex >= 0 ? commandHistory[newIndex] : '',
          historyIndex: newIndex,
          cursorPosition: newIndex >= 0 ? commandHistory[newIndex]?.length || 0 : 0,
        }));
      }
      
      return;
    }
    
    // Handle tab completion
    if (e.key === 'Tab') {
      e.preventDefault();
      // Tab completion logic would go here
      return;
    }
    
    // Other keydown handling
    const result = handleTerminalKeyDown(e, activeState);
    if (result?.preventDefault) {
      e.preventDefault();
    }
    
    if (result?.stateUpdate) {
      updateActiveTerminalState(prevState => ({
        ...prevState,
        ...result.stateUpdate,
      }));
    }
    
    setCursorBlinking(true);
  };

  // Execute command wrapper
  const executeCommandWrapper = (command) => {
    try {
      // Add a loading indicator for long-running commands
      updateActiveTerminalState(prevState => ({
        ...prevState,
        isExecuting: true
      }));
      
      // Call the command execution function
      const { output, newDir, exitCode, clear } = executeCommand(command, getActiveTerminalState(), terminalConfig);
      
      // Update terminal state with command output and results
      setTimeout(() => {
        updateActiveTerminalState(prevState => {
          // For clear command, reset the history
          if (clear) {
            return {
              ...prevState,
              history: [],
              isExecuting: false,
              lastExitCode: 0
            };
          }
          
          const newHistory = [...prevState.history];
          
          // Add command results to history
          if (output && output.length > 0) {
            output.forEach(line => {
              newHistory.push({
                id: uuidv4(),
                type: line.type || 'output',
                content: line.content || '',
              });
            });
          }
          
          return {
            ...prevState,
            history: newHistory,
            currentDir: newDir || prevState.currentDir,
            isExecuting: false,
            lastExitCode: exitCode || 0,
          };
        });
      }, 100); // Small delay to simulate command execution
    } catch (error) {
      console.error("Error executing command:", error);
      
      // Add error message to terminal
      updateActiveTerminalState(prevState => {
        const newHistory = [...prevState.history];
        newHistory.push({
          id: uuidv4(),
          type: 'error',
          content: `Error: ${error.message || 'Unknown error occurred'}`
        });
        
        return {
          ...prevState,
          history: newHistory,
          isExecuting: false,
          lastExitCode: 1,
        };
      });
    }
  };

  // Render terminal content
  const renderTerminalContent = () => {
    const activeTerminalState = getActiveTerminalState();
    if (!activeTerminalState) return null;
    
    // Get current terminal state
    const history = activeTerminalState.history;
    const input = activeTerminalState.input;
    const user = activeTerminalState.user;
    const hostname = activeTerminalState.hostname;
    const directory = activeTerminalState.currentDir;
    
    return (
      <>
        {/* History items */}
        {history.map(item => {
          switch (item.type) {
            case 'command':
              return <div key={item.id} className="terminal-line terminal-command" dangerouslySetInnerHTML={{__html: item.content}}></div>;
            case 'error':
              return <div key={item.id} className="terminal-line terminal-error" dangerouslySetInnerHTML={{__html: item.content}}></div>;
            case 'success':
              return <div key={item.id} className="terminal-line terminal-success" dangerouslySetInnerHTML={{__html: item.content}}></div>;
            case 'info':
              return <div key={item.id} className="terminal-line terminal-info" dangerouslySetInnerHTML={{__html: item.content}}></div>;
            case 'warning':
              return <div key={item.id} className="terminal-line terminal-warning" dangerouslySetInnerHTML={{__html: item.content}}></div>;
            case 'output':
              return <div key={item.id} className="terminal-line" dangerouslySetInnerHTML={{__html: item.content}}></div>;
            case 'empty':
              return <div key={item.id} className="terminal-empty"></div>;
            default:
              return <div key={item.id} className="terminal-line" dangerouslySetInnerHTML={{__html: item.content}}></div>;
          }
        })}
        
        {/* Current prompt line with cursor */}
        <div className="terminal-line terminal-current-line">
          <span className="terminal-prompt">
            <span className="terminal-user" style={{ color: terminalConfig.styles.promptUserColor }}>{user}</span>
            <span>@</span>
            <span className="terminal-host" style={{ color: terminalConfig.styles.promptHostColor }}>{hostname}</span>
            <span>:</span>
            <span className="terminal-path" style={{ color: terminalConfig.styles.promptPathColor }}>{directory}</span>
            <span className="terminal-prompt-symbol" style={{ color: terminalConfig.styles.promptSymbolColor }}>$ </span>
          </span>
          <span className="terminal-input-text">{input}</span>
          {document.activeElement === hiddenInputRef.current && (
            <span className={`terminal-cursor ${cursorBlinking ? 'terminal-cursor-blink' : ''}`}></span>
          )}
        </div>
      </>
    );
  };

  // Toggle maximize state
  const toggleMaximize = () => {
    setMaximized(!maximized);
    onMaximize();
  };

  // Focus input when clicking anywhere in the terminal
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (e.target.closest('.terminal-container') &&
          !e.target.closest('.terminal-tab') && 
          !e.target.closest('.terminal-tab-close') && 
          !e.target.closest('.terminal-tab-add')) {
        hiddenInputRef.current?.focus();
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return (
    <div className={`terminal-container ${maximized ? 'terminal-maximized' : ''} ${inWindow ? 'in-window' : ''}`}>
      <div className="terminal-header">
        <div className="terminal-tabs-area">
          <div className="terminal-tabs-container">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`terminal-tab ${activeTab === tab.id ? 'terminal-tab-active' : ''}`}
                onClick={() => switchTab(tab.id)}
              >
                <div className="terminal-tab-icon">
                  {tab.icon || <FiTerminal />}
                </div>
                <div className="terminal-tab-title">{tab.title}</div>
                {tabs.length > 1 && (
                  <button
                    className="terminal-tab-close"
                    onClick={(e) => closeTab(tab.id, e)}
                    title="Close tab"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button 
            className="terminal-tab-add" 
            onClick={addTab}
            title="New Terminal Tab"
            aria-label="Add new terminal tab"
          >
            <span style={{fontSize:"25px", marginTop:"-5px"}}>+</span>
          </button>
        </div>
        
        {/* Terminal title - shows user@hostname:directory (hidden in CSS) */}
        <div className="terminal-title">
          {getActiveTerminalState()?.user}@{getActiveTerminalState()?.hostname}:~{getActiveTerminalState()?.currentDir.startsWith('~') ? getActiveTerminalState()?.currentDir.slice(1) : getActiveTerminalState()?.currentDir}
        </div>
        
        <div className="terminal-controls">
          <div className="terminal-control" onClick={onMinimize} title="Minimize">
            <VscChromeMinimize size={10} />
          </div>
          <div className="terminal-control" onClick={toggleMaximize} title="Maximize">
            {maximized ? <VscChromeRestore size={10} /> : <VscChromeMaximize size={10} />}
          </div>
          <div className="terminal-control" onClick={onClose} title="Close">
            <VscChromeClose size={10} />
          </div>
        </div>
      </div>
      
      <div 
        className="terminal-output" 
        ref={el => {
          terminalRefs.current[getActiveTab().id] = el;
          outputRef.current = el;
        }} 
        onClick={handleTerminalClick}
      >
        {renderTerminalContent()}
      </div>
      
      {/* Hidden input to capture keyboard input */}
      <input
        type="text"
        className="terminal-hidden-input"
        value={getActiveTerminalState()?.input || ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        ref={hiddenInputRef}
        autoFocus
      />
    </div>
  );
};

export default Terminal; 
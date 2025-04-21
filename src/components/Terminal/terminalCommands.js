/**
 * BerryOS Terminal Commands Module
 * Contains all the logic for handling terminal commands and interactions in the terminal emulator
 */

// Generate styled prompt text based on terminal state
export const getPromptText = (terminalState, config) => {
  const styles = config.styles;
  return `<span style="color: ${styles.promptUserColor}">${terminalState.user}</span>` +
         `<span style="color: ${styles.textColor}">@</span>` +
         `<span style="color: ${styles.promptHostColor}">${terminalState.hostname}</span>` +
         `<span style="color: ${styles.textColor}">:</span>` +
         `<span style="color: ${styles.promptPathColor}">${terminalState.currentDir}</span>` +
         `<span style="color: ${styles.promptSymbolColor}">$ </span>`;
};

// Reset terminal state if corrupted
export const resetTerminal = (setTerminalState, config) => {
  setTerminalState({
    currentDir: config.defaultDir,
    input: '',
    commandHistory: [],
    historyIndex: -1,
    user: config.defaultUser,
    hostname: config.defaultHostname,
    history: [
      { id: 'reset-1', type: 'info', content: 'Terminal has been reset.' },
      { id: 'reset-2', type: 'info', content: 'Type "help" to see available commands.' },
      { id: 'reset-3', type: 'empty', content: '' },
      // Add a new prompt
      { 
        id: `prompt-${Date.now()}`, 
        type: 'prompt', 
        content: '',
        user: config.defaultUser,
        hostname: config.defaultHostname,
        directory: config.defaultDir
      }
    ],
    isExecuting: false,
    lastCommand: null,
    lastExitCode: 0,
    modules: { fs: true, system: true }
  });
};

// Safely add entries to terminal history
export const addToTerminalHistory = (content, type, terminalState, setTerminalState, config) => {
  try {
    const timestamp = Date.now();
    const id = `term-${timestamp}-${Math.floor(Math.random() * 1000)}`;
    
    setTerminalState(prev => {
      try {
        // Create new history with added line(s)
        let newHistory = [...(prev.history || [])];

        // Find the last prompt to ensure we insert content before it
        const lastPromptIndex = newHistory.findLastIndex(item => item.type === 'prompt');
        
        // If no prompt found or array is empty, just append
        if (lastPromptIndex === -1) {
          // If content is an array, add each line
          if (Array.isArray(content)) {
            content.forEach((line, index) => {
              newHistory.push({
                id: `${id}-${index}`,
                type: type,
                content: line || ''
              });
            });
          } else {
            // Add single line
            newHistory.push({
              id,
              type,
              content: content || ''
            });
          }
        } else {
          // Insert before the last prompt
          const beforePrompt = newHistory.slice(0, lastPromptIndex);
          const lastPrompt = newHistory[lastPromptIndex];
          const afterPrompt = newHistory.slice(lastPromptIndex + 1);
          
          // Prepare the content to insert
          const contentArray = Array.isArray(content) 
            ? content.map((line, index) => ({
                id: `${id}-${index}`,
                type: type,
                content: line || ''
              }))
            : [{
                id,
                type,
                content: content || ''
              }];
          
          // Combine everything
          newHistory = [
            ...beforePrompt,
            ...contentArray,
            lastPrompt,
            ...afterPrompt
          ];
        }
        
        // Limit history size to prevent memory issues
        if (newHistory.length > (config.maxOutputLines || 1000)) {
          newHistory = newHistory.slice(newHistory.length - (config.scrollbackBuffer || 500));
        }
        
        return { ...prev, history: newHistory };
      } catch (innerError) {
        console.error("Error updating terminal history:", innerError);
        return prev; // Return unchanged state on error
      }
    });
  } catch (error) {
    console.error("Error adding to terminal history:", error);
  }
};

// Execute terminal commands
export const executeCommand = (command, terminalState, config) => {
  try {
    if (!command.trim()) {
      return { output: [], newDir: null, exitCode: 0 };
    }
    
    // Parse command and arguments
    const parts = command.trim().split(/\s+/);
    const mainCommand = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    let output = [];
    let newDir = null;
    let exitCode = 0;
    
    // Process the command
    switch (mainCommand) {
      case 'clear':
        // Return an empty output to indicate clearing
        return { output: [], newDir: null, exitCode: 0, clear: true };
      
      case 'help':
        output = output.concat(getHelpOutput(args));
        break;
      
      case 'echo':
        output.push({ type: 'output', content: args.join(' ') });
        break;
      
      case 'ls':
        output = output.concat(getSimulatedLsOutput());
        break;
      
      case 'cd':
        if (args.length === 0 || args[0] === "~") {
          output.push({ type: 'info', content: 'Changed directory to: ~' });
          newDir = '~';
        } else if (args[0] === "..") {
          const currentParts = terminalState.currentDir.split('/');
          if (currentParts.length > 1 && terminalState.currentDir !== '~') {
            currentParts.pop();
            newDir = currentParts.join('/') || '~';
            output.push({ type: 'info', content: `Changed directory to: ${newDir}` });
          } else {
            output.push({ type: 'info', content: 'Already at root directory' });
          }
        } else {
          // Simulate changing to a subdirectory
          newDir = terminalState.currentDir === '~' ? 
            `~/${args[0]}` : `${terminalState.currentDir}/${args[0]}`;
          output.push({ type: 'info', content: `Changed directory to: ${newDir}` });
        }
        break;
      
      case 'pwd':
        // Simulate full path
        const path = terminalState.currentDir === '~' ? 
          '/home/' + terminalState.user : 
          terminalState.currentDir.replace('~', '/home/' + terminalState.user);
        output.push({ type: 'output', content: path });
        break;
      
      case 'whoami':
        output.push({ type: 'output', content: terminalState.user });
        break;
      
      case 'date':
        output.push({ type: 'output', content: new Date().toLocaleString() });
        break;
      
      case 'uname':
        const showAll = args.includes('-a') || args.includes('--all');
        
        if (showAll) {
          output = output.concat([
            { type: 'output', content: 'BerryOS 1.0.0 (2023) berry-kernel-4.2.1-amd64 #257 SMP PREEMPT' },
            { type: 'output', content: `Hostname: ${terminalState.hostname}` },
            { type: 'output', content: 'Architecture: x86_64' },
            { type: 'output', content: 'Compiler: berry-gcc 9.3.0' },
            { type: 'output', content: 'Kernel: Berry-Kernel 4.2.1' },
            { type: 'output', content: 'Built: ' + new Date().toLocaleDateString() }
          ]);
        } else {
          output.push({ type: 'output', content: 'BerryOS' });
        }
        break;
      
      case 'mkdir':
        if (args.length === 0) {
          output.push({ type: 'error', content: 'mkdir: missing operand' });
          exitCode = 1;
        } else {
          output.push({ type: 'success', content: `Created directory: ${args[0]}` });
        }
        break;
      
      case 'touch':
        if (args.length === 0) {
          output.push({ type: 'error', content: 'touch: missing file operand' });
          exitCode = 1;
        } else {
          output.push({ type: 'success', content: `Created file: ${args[0]}` });
        }
        break;
      
      case 'cat':
        if (args.length === 0) {
          output.push({ type: 'error', content: 'cat: missing file operand' });
          exitCode = 1;
        } else {
          // Simulate file contents based on filename
          const filename = args[0];
          if (filename === 'notes.txt') {
            output = output.concat([
              { type: 'output', content: 'Welcome to BerryOS!' },
              { type: 'output', content: '' },
              { type: 'output', content: 'This is a demo of the terminal interface.' },
              { type: 'output', content: 'Try out different commands to see how they work.' }
            ]);
          } else if (filename === 'config.json') {
            output = output.concat([
              { type: 'output', content: '{' },
              { type: 'output', content: '  "version": "1.0.0",' },
              { type: 'output', content: '  "theme": "dark",' },
              { type: 'output', content: '  "language": "en-US",' },
              { type: 'output', content: '  "features": {' },
              { type: 'output', content: '    "terminal": true,' },
              { type: 'output', content: '    "fileManager": true' },
              { type: 'output', content: '  }' },
              { type: 'output', content: '}' }
            ]);
          } else {
            output.push({ type: 'error', content: `cat: ${filename}: No such file or directory` });
            exitCode = 1;
          }
        }
        break;
      
      case 'exit':
      case 'logout':
        output.push({ type: 'info', content: 'Logging out...' });
        break;
      
      case 'cowsay':
        if (args.length === 0) {
          output.push({ type: 'error', content: 'cowsay: missing message' });
          exitCode = 1;
        } else {
          const message = args.join(' ');
          output = output.concat(generateCowsay(message));
        }
        break;
        
      case 'neofetch':
        output = output.concat(generateNeofetch(terminalState));
        break;
        
      case 'berry':
        if (args.length === 0) {
          output.push({ type: 'error', content: 'berry: missing option or command' });
          output.push({ type: 'info', content: 'Try \'berry --help\' for more information.' });
          exitCode = 1;
        } else {
          const subCommand = args[0].toLowerCase();
          
          if (subCommand === '--version' || subCommand === '-v' || subCommand === 'version') {
            output = output.concat([
              { type: 'output', content: '<span class="berry-command">BerryOS</span> v1.0.0 (2023)' },
              { type: 'output', content: 'Kernel: Berry-Kernel 4.2.1' },
              { type: 'output', content: 'Build: #257 SMP PREEMPT' },
              { type: 'output', content: 'License: Open Source' },
              { type: 'output', content: 'Project: <a href="https://github.com/berryos/berry" target="_blank">https://github.com/berryos/berry</a>' }
            ]);
          } else {
            output.push({ type: 'error', content: `berry: unknown option or command: ${subCommand}` });
            output.push({ type: 'info', content: 'Try \'berry --help\' for more information.' });
            exitCode = 1;
          }
        }
        break;
        
      default:
        output.push({ type: 'error', content: `Command not found: ${mainCommand}. Type 'help' to see available commands.` });
        exitCode = 1;
    }
    
    return { output, newDir, exitCode };
  } catch (error) {
    console.error("Error executing command:", error);
    return { 
      output: [{ type: 'error', content: `Error executing command: ${error.message}` }],
      newDir: null,
      exitCode: 1
    };
  }
};

// Helper function to generate help output
const getHelpOutput = (args) => {
  const output = [];
  
  // If a specific command is requested
  if (args.length > 0) {
    const command = args[0].toLowerCase();
    const helpText = getCommandHelpText(command);
    
    if (helpText) {
      output.push({ type: 'info', content: helpText });
    } else {
      output.push({ type: 'error', content: `No help available for '${command}'` });
    }
  } 
  // General help
  else {
    output.push({ type: 'info', content: 'Available commands:' });
    output.push({ type: 'output', content: '<b>File Operations:</b>' });
    output.push({ type: 'output', content: 'ls [directory] - List files and directories' });
    output.push({ type: 'output', content: 'cd [directory] - Change current directory' });
    output.push({ type: 'output', content: 'pwd - Print working directory' });
    output.push({ type: 'output', content: 'cat [file] - Display file contents' });
    output.push({ type: 'output', content: 'mkdir [directory] - Create a new directory' });
    output.push({ type: 'output', content: 'touch [file] - Create a new file' });
    output.push({ type: 'output', content: '' });
    output.push({ type: 'output', content: '<b>System Commands:</b>' });
    output.push({ type: 'output', content: 'clear - Clear the terminal screen' });
    output.push({ type: 'output', content: 'whoami - Display current user' });
    output.push({ type: 'output', content: 'date - Display current date and time' });
    output.push({ type: 'output', content: 'uname [-a] - Display system information' });
    output.push({ type: 'output', content: 'echo [text] - Display text in terminal' });
    output.push({ type: 'output', content: 'exit/logout - Exit terminal session' });
    output.push({ type: 'output', content: '' });
    output.push({ type: 'output', content: '<b>Fun Commands:</b>' });
    output.push({ type: 'output', content: 'cowsay [text] - Display a cow saying something' });
    output.push({ type: 'output', content: 'neofetch - Display system information with ASCII art' });
    output.push({ type: 'output', content: '' });
    output.push({ type: 'output', content: '<b>BerryOS Commands:</b>' });
    output.push({ type: 'output', content: 'berry --version - Display BerryOS version information' });
    output.push({ type: 'info', content: 'Type "help [command]" for more information on a specific command.' });
  }
  
  return output;
};

// Simulated LS output
const getSimulatedLsOutput = () => {
  return [
    { type: 'output', content: '<span class="terminal-folder">Documents/</span>    <span class="terminal-folder">Pictures/</span>    <span class="terminal-folder">Music/</span>' },
    { type: 'output', content: '<span class="terminal-folder">Downloads/</span>    <span class="terminal-folder">Desktop/</span>    <span class="terminal-file">notes.txt</span>' },
    { type: 'output', content: '<span class="terminal-executable">berry-app</span>    <span class="terminal-file">config.json</span>    <span class="terminal-symlink">logs -> /var/logs</span>' }
  ];
};

// Generate cowsay output
const generateCowsay = (message) => {
  const output = [];
  const border = '-'.repeat(message.length + 2);
  
  output.push({ type: 'output', content: ' ' + border });
  output.push({ type: 'output', content: '< ' + message + ' >' });
  output.push({ type: 'output', content: ' ' + border });
  output.push({ type: 'output', content: '        \\   ^__^' });
  output.push({ type: 'output', content: '         \\  (oo)\\_______' });
  output.push({ type: 'output', content: '            (__)\\       )\\/\\' });
  output.push({ type: 'output', content: '                ||----w |' });
  output.push({ type: 'output', content: '                ||     ||' });
  
  return output;
};

// Generate neofetch output 
const generateNeofetch = (terminalState) => {
  const output = [];
  
  // ASCII Art for BerryOS
  output.push({ type: 'output', content: '     \\  ^__^            ' + terminalState.user + '@' + terminalState.hostname });
  output.push({ type: 'output', content: '      \\ (oo)\\_______    ------------------------' });
  output.push({ type: 'output', content: '        (__)\\       )\\/\\' });
  output.push({ type: 'output', content: '            ||----w |    <span class="terminal-info">OS:</span> BerryOS 1.0.0' });
  output.push({ type: 'output', content: '            ||     ||    <span class="terminal-info">Kernel:</span> Berry-Kernel 4.2.1' });
  output.push({ type: 'output', content: '                         <span class="terminal-info">Uptime:</span> ' + Math.floor(Math.random() * 60) + ' mins' });
  output.push({ type: 'output', content: '                         <span class="terminal-info">Shell:</span> berry-bash' });
  output.push({ type: 'output', content: '                         <span class="terminal-info">DE:</span> Berry Desktop' });
  output.push({ type: 'output', content: '                         <span class="terminal-info">CPU:</span> BerryCore @ 3.5GHz' });
  output.push({ type: 'output', content: '                         <span class="terminal-info">Memory:</span> ' + Math.floor(Math.random() * 2000 + 1000) + 'MB / 4096MB' });
  
  return output;
};

// Handle keyboard events in terminal
export const handleTerminalKeyDown = (e, terminalState, setTerminalState, config, fileSystem, onLogout) => {
  // Process commands on Enter
  if (e.key === 'Enter') {
    e.preventDefault();
    const command = terminalState.input.trim();
    executeCommand(command, terminalState, config);
  }
  
  // Navigate command history with up/down arrows
  else if (e.key === 'ArrowUp') {
    e.preventDefault();
    
    if (terminalState.commandHistory.length === 0) return;
    
    const newIndex = terminalState.historyIndex < 0 
      ? terminalState.commandHistory.length - 1 
      : Math.max(0, terminalState.historyIndex - 1);
    
    setTerminalState({
      ...terminalState,
      input: terminalState.commandHistory[newIndex],
      historyIndex: newIndex
    });
  }
  
  else if (e.key === 'ArrowDown') {
    e.preventDefault();
    
    if (terminalState.historyIndex < 0) return;
    
    const newIndex = terminalState.historyIndex >= terminalState.commandHistory.length - 1 
      ? -1 
      : terminalState.historyIndex + 1;
    
    setTerminalState({
      ...terminalState,
      input: newIndex === -1 ? '' : terminalState.commandHistory[newIndex],
      historyIndex: newIndex
    });
  }
  
  // Tab completion
  else if (e.key === 'Tab') {
    e.preventDefault();
    handleTabCompletion(terminalState, setTerminalState, config);
  }
  
  // Ctrl+C to cancel
  else if (e.key === 'c' && e.ctrlKey) {
    e.preventDefault();
    addToTerminalHistory(getPromptText(terminalState, config) + '^C', 'command', terminalState, setTerminalState, config);
    setTerminalState({
      ...terminalState,
      input: '',
      historyIndex: -1,
      isExecuting: false
    });
  }
  
  // Ctrl+L to clear screen
  else if (e.key === 'l' && e.ctrlKey) {
    e.preventDefault();
    setTerminalState({
      ...terminalState,
      history: []
    });
  }
};

// Handle tab completion for terminal input
export const handleTabCompletion = (terminalState, setTerminalState, config) => {
  const input = terminalState.input.trim();
  const commonCommands = [
    'help', 'clear', 'ls', 'cd', 'pwd', 'cat', 'whoami', 
    'date', 'uname', 'mkdir', 'touch', 'exit', 'logout', 'echo',
    'berry', 'system', 'berry-version', 'berry-update', 'system-status'
  ];
  
  if (input) {
    const matches = commonCommands.filter(cmd => cmd.startsWith(input));
    
    if (matches.length === 1) {
      // Exact single match
      setTerminalState({
        ...terminalState,
        input: matches[0] + ' '
      });
    } 
    else if (matches.length > 1) {
      // Display possible completions
      const commandStr = matches.join('  ');
      addToTerminalHistory(getPromptText(terminalState, config) + input, 'command', terminalState, setTerminalState, config);
      addToTerminalHistory(commandStr, 'output', terminalState, setTerminalState, config);
    }
  }
};

// Output help information
const outputHelp = (args, terminalState, setTerminalState, config) => {
  // If a specific command is requested
  if (args.length > 0) {
    const command = args[0].toLowerCase();
    
    const helpText = getCommandHelpText(command);
    
    if (helpText) {
      addToTerminalHistory(helpText, 'info', terminalState, setTerminalState, config);
    } else {
      addToTerminalHistory(`No help available for '${command}'`, 'error', terminalState, setTerminalState, config);
    }
  } 
  // General help
  else {
    addToTerminalHistory('Available commands:', 'info', terminalState, setTerminalState, config);
    addToTerminalHistory([
      '<b>File Operations:</b>',
      'ls [directory] - List files and directories',
      'cd [directory] - Change current directory',
      'pwd - Print working directory',
      'cat [file] - Display file contents',
      'mkdir [directory] - Create a new directory',
      'touch [file] - Create a new file',
      '',
      '<b>System Commands:</b>',
      'clear - Clear the terminal screen',
      'whoami - Display current user',
      'date - Display current date and time',
      'uname [-a] - Display system information',
      'echo [text] - Display text in terminal',
      'exit/logout - Exit terminal session',
      '',
      '<b>BerryOS Commands:</b>',
      'berry --version - Display BerryOS version information',
      'berry update - Check for BerryOS updates',
      'system status - Display system resource usage',
      'system info - Show detailed system information',
    ], 'output', terminalState, setTerminalState, config);
    
    addToTerminalHistory('Type "help [command]" for more information on a specific command.', 'info', terminalState, setTerminalState, config);
  }
  
  setTerminalState(prev => ({
    ...prev,
    isExecuting: false,
    lastExitCode: 0
  }));
};

// Get detailed help for a specific command
const getCommandHelpText = (command) => {
  const helpTexts = {
    help: 'help [command]\n\nDisplay help information for available commands.\nIf [command] is specified, show detailed help for that command.',
    
    clear: 'clear\n\nClear the terminal screen. This will remove all previous command history and output from view.',
    
    ls: 'ls [directory]\n\nList directory contents.\nIf no directory is specified, list the contents of the current directory.',
    
    cd: 'cd [directory]\n\nChange the current working directory.\n\'cd\' or \'cd ~\' will navigate to the home directory.\n\'cd ..\' will navigate to the parent directory.',
    
    pwd: 'pwd\n\nPrint the current working directory path.',
    
    cat: 'cat [file]\n\nDisplay the contents of the specified file.',
    
    whoami: 'whoami\n\nDisplay the current user name.',
    
    date: 'date\n\nDisplay the current date and time.',
    
    uname: 'uname [-a]\n\nDisplay system information.\nWith -a flag: display all available system information.\nWithout flags: display operating system name.',
    
    mkdir: 'mkdir [directory]\n\nCreate a new directory with the specified name in the current location.',
    
    touch: 'touch [file]\n\nCreate a new empty file with the specified name in the current location.',
    
    echo: 'echo [text]\n\nDisplay the provided text in the terminal.',
    
    exit: 'exit\n\nExit the current terminal session.',
    
    logout: 'logout\n\nLogout from the current terminal session (same as exit).',

    berry: 'berry [options] [command]\n\nBerryOS system management utility.\n\nOptions:\n  --version     Display BerryOS version information\n  --help        Display help for berry command\n\nCommands:\n  update        Check for and install system updates\n  config        Configure system settings',

    system: 'system [command]\n\nSystem utilities for BerryOS.\n\nCommands:\n  status        Display system resource usage\n  info          Show detailed system information\n  restart       Restart the system (requires confirmation)',
  };
  
  return helpTexts[command];
};

// BerryOS specific command handler
const handleBerryCommand = (args, terminalState, setTerminalState, config) => {
  if (args.length === 0) {
    addToTerminalHistory('berry: missing option or command', 'error', terminalState, setTerminalState, config);
    addToTerminalHistory('Try \'berry --help\' for more information.', 'info', terminalState, setTerminalState, config);
  } else {
    const subCommand = args[0].toLowerCase();
    
    if (subCommand === '--version' || subCommand === '-v' || subCommand === 'version') {
      addToTerminalHistory([
        '<span class="berry-command">BerryOS</span> v1.0.0 (2023)',
        'Kernel: Berry-Kernel 4.2.1',
        'Build: #257 SMP PREEMPT',
        'License: Open Source',
        'Project: <a href="https://github.com/berryos/berry" target="_blank">https://github.com/berryos/berry</a>'
      ], 'output', terminalState, setTerminalState, config);
    }
    else if (subCommand === 'update') {
      addToTerminalHistory('Checking for updates...', 'info', terminalState, setTerminalState, config);
      
      // Simulate update check
      setTimeout(() => {
        addToTerminalHistory([
          'Latest version: BerryOS v1.0.0',
          'Current version: BerryOS v1.0.0',
          'Status: Your system is up to date!',
          'For more information visit: <a href="https://berryos.example.com/updates" target="_blank">BerryOS Updates</a>'
        ], 'success', terminalState, setTerminalState, config);
      }, 1500);
    }
    else if (subCommand === '--help' || subCommand === '-h' || subCommand === 'help') {
      addToTerminalHistory(getCommandHelpText('berry'), 'info', terminalState, setTerminalState, config);
    }
    else if (subCommand === 'config') {
      addToTerminalHistory('BerryOS Configuration Utility', 'info', terminalState, setTerminalState, config);
      addToTerminalHistory([
        'HOSTNAME="berry-os"',
        'TIMEZONE="UTC"',
        'LOCALE="en_US.UTF-8"',
        'DESKTOP_ENV="berry-desktop"',
        'UPDATES="automatic"'
      ], 'output', terminalState, setTerminalState, config);
    }
    else {
      addToTerminalHistory(`berry: unknown option or command: ${subCommand}`, 'error', terminalState, setTerminalState, config);
      addToTerminalHistory('Try \'berry --help\' for more information.', 'info', terminalState, setTerminalState, config);
    }
  }

  setTerminalState(prev => ({
    ...prev,
    isExecuting: false,
    lastExitCode: 0
  }));
};

// System command handler
const handleSystemCommand = (args, terminalState, setTerminalState, config) => {
  if (args.length === 0) {
    addToTerminalHistory('system: missing command', 'error', terminalState, setTerminalState, config);
    addToTerminalHistory('Try \'help system\' for more information.', 'info', terminalState, setTerminalState, config);
  } else {
    const subCommand = args[0].toLowerCase();
    
    if (subCommand === 'status') {
      const date = new Date();
      
      // Calculate some fake system metrics
      const uptime = `${Math.floor(Math.random() * 15 + 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
      const cpuUsage = Math.floor(Math.random() * 30 + 5);
      const memoryUsage = Math.floor(Math.random() * 40 + 20);
      const diskUsage = Math.floor(Math.random() * 50 + 30);
      
      addToTerminalHistory([
        `System Status as of ${date.toLocaleTimeString()}`,
        '-------------------------------------',
        `Uptime: ${uptime}`,
        `CPU Usage: ${cpuUsage}%`,
        `Memory Usage: ${memoryUsage}%`,
        `Disk Usage: ${diskUsage}%`,
        `Active Processes: ${Math.floor(Math.random() * 150 + 50)}`,
        `System Load: ${(Math.random() * 1.5).toFixed(2)}`
      ], 'output', terminalState, setTerminalState, config);
    }
    else if (subCommand === 'info') {
      addToTerminalHistory([
        'System Information',
        '-------------------------------------',
        'OS: BerryOS 1.0.0',
        'Kernel: Berry-Kernel 4.2.1',
        'Architecture: browser-vm',
        'Desktop Environment: BerryDE',
        'Hostname: ' + terminalState.hostname,
        'User: ' + terminalState.user,
        'Shell: berry-shell',
        'Terminal: berry-terminal',
        'Package Manager: berry-pkg',
        'Build Date: ' + new Date().toLocaleDateString()
      ], 'output', terminalState, setTerminalState, config);
    }
    else if (subCommand === 'restart') {
      addToTerminalHistory('This will restart the system. Are you sure? (y/N)', 'warning', terminalState, setTerminalState, config);
      
      // In a real implementation, we would handle the Y/N response here
      // This is just a simulation
      setTerminalState(prev => ({
        ...prev,
        promptForRestart: true
      }));
    }
    else {
      addToTerminalHistory(`system: unknown command: ${subCommand}`, 'error', terminalState, setTerminalState, config);
      addToTerminalHistory('Available commands: status, info, restart', 'info', terminalState, setTerminalState, config);
    }
  }

  setTerminalState(prev => ({
    ...prev,
    isExecuting: false,
    lastExitCode: 0
  }));
};

// Implement echo command
const outputEcho = (args, terminalState, setTerminalState, config) => {
  const text = args.join(' ');
  addToTerminalHistory(text, 'output', terminalState, setTerminalState, config);
  
  setTerminalState(prev => ({
    ...prev,
    isExecuting: false,
    lastExitCode: 0
  }));
};

// Implement pwd command
const outputPwd = (terminalState, setTerminalState, config) => {
  // Simulate full path
  const path = terminalState.currentDir === '~' ? 
    '/home/' + terminalState.user : 
    terminalState.currentDir.replace('~', '/home/' + terminalState.user);
    
  addToTerminalHistory(path, 'output', terminalState, setTerminalState, config);
  
  setTerminalState(prev => ({
    ...prev,
    isExecuting: false,
    lastExitCode: 0
  }));
};

// Implement uname command
const outputUname = (args, terminalState, setTerminalState, config) => {
  const showAll = args.includes('-a') || args.includes('--all');
  
  if (showAll) {
    addToTerminalHistory([
      'BerryOS 1.0.0 (2023) berry-kernel-4.2.1-amd64 #257 SMP PREEMPT',
      `Hostname: ${terminalState.hostname}`,
      'Architecture: x86_64',
      'Compiler: berry-gcc 9.3.0',
      'Kernel: Berry-Kernel 4.2.1',
      'Built: ' + new Date().toLocaleDateString()
    ], 'output', terminalState, setTerminalState, config);
  } else {
    addToTerminalHistory('BerryOS', 'output', terminalState, setTerminalState, config);
  }
  
  setTerminalState(prev => ({
    ...prev,
    isExecuting: false,
    lastExitCode: 0
  }));
};

// The following functions are placeholders that would be implemented with real file system integration
// In this demo, we're using simulations in the main executeCommand switch statement instead

// Implement ls command - placeholder
const outputLs = (args, terminalState, setTerminalState, config, fileSystem) => {
  // The implementation would use the fileSystem object
  // In this demo, we're using simulated output in the main command handler
  setTerminalState(prev => ({
    ...prev,
    isExecuting: false,
    lastExitCode: 0
  }));
};

// Implement cd command - placeholder
const changeDirectory = (args, terminalState, setTerminalState, config, fileSystem) => {
  // The implementation would use the fileSystem object
  // In this demo, we're using simulated behavior in the main command handler
  setTerminalState(prev => ({
    ...prev,
    isExecuting: false,
    lastExitCode: 0
  }));
};

// Implement cat command - placeholder
const outputCat = (args, terminalState, setTerminalState, config, fileSystem) => {
  // The implementation would use the fileSystem object
  // In this demo, we're using simulated output in the main command handler
  setTerminalState(prev => ({
    ...prev,
    isExecuting: false,
    lastExitCode: 0
  }));
};

// Implement mkdir command - placeholder
const outputMkdir = (args, terminalState, setTerminalState, config, fileSystem) => {
  // The implementation would use the fileSystem object
  // In this demo, we're using simulated behavior in the main command handler
  setTerminalState(prev => ({
    ...prev,
    isExecuting: false,
    lastExitCode: 0
  }));
};

// Implement touch command - placeholder
const outputTouch = (args, terminalState, setTerminalState, config, fileSystem) => {
  // The implementation would use the fileSystem object
  // In this demo, we're using simulated behavior in the main command handler
  setTerminalState(prev => ({
    ...prev,
    isExecuting: false,
    lastExitCode: 0
  }));
}; 
// Terminal utilities

export const getPromptText = (user, hostname, currentDir) => {
  return `${user}@${hostname}:${currentDir}$`;
};

// Parse and execute terminal commands
export const executeCommand = (command, terminalState, fileSystem) => {
  const args = command.trim().split(/\s+/);
  const cmd = args[0].toLowerCase();
  
  switch (cmd) {
    case 'clear':
      return {
        ...terminalState,
        history: [],
      };
      
    case 'help':
      return {
        ...terminalState,
        history: [
          ...terminalState.history,
          { type: 'command', content: command },
          { 
            type: 'output', 
            content: 'Available commands:\n' +
              'clear - Clear the terminal\n' +
              'help - Display this help message\n' +
              'echo [text] - Display text\n' +
              'ls - List directory contents\n' +
              'cd [directory] - Change directory\n' +
              'pwd - Print working directory\n' +
              'mkdir [name] - Create a directory\n' +
              'touch [name] - Create a file\n' +
              'cat [file] - Display file contents'
          }
        ]
      };
      
    case 'echo':
      return {
        ...terminalState,
        history: [
          ...terminalState.history,
          { type: 'command', content: command },
          { type: 'output', content: args.slice(1).join(' ') }
        ]
      };
      
    case 'pwd':
      return {
        ...terminalState,
        history: [
          ...terminalState.history,
          { type: 'command', content: command },
          { type: 'output', content: terminalState.currentDir }
        ]
      };
      
    case 'ls':
      return handleLsCommand(command, args, terminalState, fileSystem);
      
    case 'cd':
      return handleCdCommand(command, args, terminalState, fileSystem);
      
    case 'mkdir':
      return handleMkdirCommand(command, args, terminalState, fileSystem);
      
    case 'touch':
      return handleTouchCommand(command, args, terminalState, fileSystem);
      
    case 'cat':
      return handleCatCommand(command, args, terminalState, fileSystem);
      
    default:
      return {
        ...terminalState,
        history: [
          ...terminalState.history,
          { type: 'command', content: command },
          { type: 'error', content: `${cmd}: command not found` }
        ]
      };
  }
};

// Handle the ls command
const handleLsCommand = (command, args, terminalState, fileSystem) => {
  // Find the current directory in the file system
  const path = terminalState.currentDir === '~' ? '/' : terminalState.currentDir;
  let currentItem = fileSystem;
  
  if (path !== '/') {
    const pathParts = path.split('/').filter(part => part);
    for (const part of pathParts) {
      if (currentItem.type !== 'folder' || !currentItem.children) {
        return {
          ...terminalState,
          history: [
            ...terminalState.history,
            { type: 'command', content: command },
            { type: 'error', content: `ls: cannot access '${path}': Not a directory` }
          ]
        };
      }
      
      const childItem = currentItem.children.find(child => child.name === part);
      if (!childItem) {
        return {
          ...terminalState,
          history: [
            ...terminalState.history,
            { type: 'command', content: command },
            { type: 'error', content: `ls: cannot access '${path}': No such file or directory` }
          ]
        };
      }
      
      currentItem = childItem;
    }
  }
  
  if (currentItem.type !== 'folder' || !currentItem.children) {
    return {
      ...terminalState,
      history: [
        ...terminalState.history,
        { type: 'command', content: command },
        { type: 'error', content: `ls: cannot access '${path}': Not a directory` }
      ]
    };
  }
  
  const items = currentItem.children.map(item => ({
    name: item.name,
    type: item.type
  }));
  
  return {
    ...terminalState,
    history: [
      ...terminalState.history,
      { type: 'command', content: command },
      { type: 'list', content: items }
    ]
  };
};

// Handle the cd command
const handleCdCommand = (command, args, terminalState, fileSystem) => {
  if (args.length < 2) {
    return {
      ...terminalState,
      currentDir: '~',
      history: [
        ...terminalState.history,
        { type: 'command', content: command }
      ]
    };
  }
  
  const targetPath = args[1];
  let newPath;
  
  if (targetPath === '~' || targetPath === '/') {
    newPath = targetPath === '~' ? '~' : '/';
  } else if (targetPath === '..') {
    // Go up one directory
    if (terminalState.currentDir === '~' || terminalState.currentDir === '/') {
      newPath = terminalState.currentDir;
    } else {
      const pathParts = terminalState.currentDir.split('/').filter(part => part);
      pathParts.pop();
      newPath = pathParts.length === 0 ? '/' : '/' + pathParts.join('/');
    }
  } else if (targetPath.startsWith('/')) {
    // Absolute path
    newPath = targetPath;
  } else {
    // Relative path
    const basePath = terminalState.currentDir === '~' ? '/' : terminalState.currentDir;
    newPath = basePath === '/' ? '/' + targetPath : basePath + '/' + targetPath;
  }
  
  // Verify the path exists in the file system
  if (newPath !== '~' && newPath !== '/') {
    let currentItem = fileSystem;
    const pathParts = newPath.split('/').filter(part => part);
    
    for (const part of pathParts) {
      if (currentItem.type !== 'folder' || !currentItem.children) {
        return {
          ...terminalState,
          history: [
            ...terminalState.history,
            { type: 'command', content: command },
            { type: 'error', content: `cd: ${targetPath}: Not a directory` }
          ]
        };
      }
      
      const childItem = currentItem.children.find(child => child.name === part);
      if (!childItem) {
        return {
          ...terminalState,
          history: [
            ...terminalState.history,
            { type: 'command', content: command },
            { type: 'error', content: `cd: ${targetPath}: No such file or directory` }
          ]
        };
      }
      
      currentItem = childItem;
    }
    
    if (currentItem.type !== 'folder') {
      return {
        ...terminalState,
        history: [
          ...terminalState.history,
          { type: 'command', content: command },
          { type: 'error', content: `cd: ${targetPath}: Not a directory` }
        ]
      };
    }
  }
  
  return {
    ...terminalState,
    currentDir: newPath,
    history: [
      ...terminalState.history,
      { type: 'command', content: command }
    ]
  };
};

// Handle the mkdir command
const handleMkdirCommand = (command, args, terminalState, fileSystem) => {
  if (args.length < 2) {
    return {
      ...terminalState,
      history: [
        ...terminalState.history,
        { type: 'command', content: command },
        { type: 'error', content: 'mkdir: missing operand' }
      ]
    };
  }
  
  const folderName = args[1];
  
  // This is just a simulation - in a real app, you would update the file system
  return {
    ...terminalState,
    history: [
      ...terminalState.history,
      { type: 'command', content: command },
      { type: 'info', content: `Directory '${folderName}' created (simulated)` }
    ]
  };
};

// Handle the touch command
const handleTouchCommand = (command, args, terminalState, fileSystem) => {
  if (args.length < 2) {
    return {
      ...terminalState,
      history: [
        ...terminalState.history,
        { type: 'command', content: command },
        { type: 'error', content: 'touch: missing file operand' }
      ]
    };
  }
  
  const fileName = args[1];
  
  // This is just a simulation - in a real app, you would update the file system
  return {
    ...terminalState,
    history: [
      ...terminalState.history,
      { type: 'command', content: command },
      { type: 'info', content: `File '${fileName}' created (simulated)` }
    ]
  };
};

// Handle the cat command
const handleCatCommand = (command, args, terminalState, fileSystem) => {
  if (args.length < 2) {
    return {
      ...terminalState,
      history: [
        ...terminalState.history,
        { type: 'command', content: command },
        { type: 'error', content: 'cat: missing file operand' }
      ]
    };
  }
  
  const fileName = args[1];
  
  // This is just a simulation - in a real app, you would find and read the file
  return {
    ...terminalState,
    history: [
      ...terminalState.history,
      { type: 'command', content: command },
      { type: 'info', content: `File '${fileName}' contents would be displayed here (simulated)` }
    ]
  };
};

// Get suggestions for tab completion
export const getTabCompletions = (input, terminalState, fileSystem) => {
  const args = input.trim().split(/\s+/);
  
  // If we're on the first argument, suggest commands
  if (args.length === 1) {
    const commands = ['clear', 'help', 'echo', 'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat'];
    return commands.filter(cmd => cmd.startsWith(args[0]));
  }
  
  // For cd, ls, cat commands suggest files and folders
  if ((args[0] === 'cd' || args[0] === 'ls' || args[0] === 'cat') && args.length === 2) {
    // Implement file/folder suggestions based on current directory
    // This is a placeholder - you'd need to actually check the file system
    return ['Documents/', 'Downloads/', 'Desktop/', 'example.txt'].filter(
      item => item.startsWith(args[1])
    );
  }
  
  return [];
};

// Parse terminal command history for up/down navigation
export const navigateHistory = (direction, terminalState) => {
  const { commandHistory, historyIndex } = terminalState;
  
  if (commandHistory.length === 0) {
    return terminalState;
  }
  
  let newIndex;
  if (direction === 'up') {
    newIndex = historyIndex === null ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
  } else {
    if (historyIndex === null) return terminalState;
    newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
    if (newIndex === commandHistory.length - 1) newIndex = null;
  }
  
  return {
    ...terminalState,
    input: newIndex === null ? '' : commandHistory[newIndex],
    historyIndex: newIndex
  };
}; 
import { createContext, useState, useContext, useEffect } from 'react';
import { useAlert } from './AlertContext';

// Create context
const FileSystemContext = createContext();

// Storage keys
const STORAGE_KEY = 'berryos_filesystem';

// Initial file system structure
const initialFileSystem = {
  'Desktop': {
    type: 'folder',
    children: {
      'Home': { 
        type: 'folder', 
        children: {
          'Downloads': { type: 'folder', children: {} },
          'Music': { type: 'folder', children: {} },
          'Photos': { type: 'folder', children: {} },
          'Videos': { type: 'folder', children: {} },
          'User': { type: 'folder', children: {} },
          'README.txt': { 
            type: 'file', 
            content: 'Welcome to Berry OS!\n\nThis is your Home folder where you can store all your personal files and data.' 
          }
        }
      },
      'System': {
        type: 'folder',
        children: {
          'Apps': { type: 'folder', children: {} },
          'Config': { type: 'folder', children: {} }
        }
      }
    }
  }
};

// Create provider component
export function FileSystemProvider({ children }) {
  const [fileSystem, setFileSystem] = useState(initialFileSystem);
  const [currentPath, setCurrentPath] = useState(['Desktop']);
  const [navigationHistory, setNavigationHistory] = useState({
    history: [['Desktop']],
    current: 0
  });
  const [currentFile, setCurrentFile] = useState(null);
  const [clipboardItem, setClipboardItem] = useState(null);
  
  const { showAlert } = useAlert();

  // Load file system from localStorage on mount
  useEffect(() => {
    const storedFileSystem = localStorage.getItem(STORAGE_KEY);
    if (storedFileSystem) {
      try {
        const parsedFileSystem = JSON.parse(storedFileSystem);
        setFileSystem(parsedFileSystem);
      } catch (error) {
        console.error('Error loading file system from localStorage:', error);
      }
    }
  }, []);

  // Save file system to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fileSystem));
  }, [fileSystem]);

  // Navigate to a specific path
  const navigateTo = (path) => {
    // Validate path
    if (!isValidPath(path)) {
      showAlert(`Path not found: /${path.join('/')}`, 'error');
      return false;
    }
    
    // Update current path
    setCurrentPath([...path]);
    
    // Update navigation history
    updateNavigationHistory([...path]);
    
    return true;
  };

  // Navigate up one level
  const navigateUp = () => {
    if (currentPath.length <= 1) return false;
    
    const newPath = [...currentPath];
    newPath.pop();
    
    setCurrentPath(newPath);
    updateNavigationHistory(newPath);
    
    return true;
  };

  // Navigate back in history
  const navigateBack = () => {
    if (navigationHistory.current <= 0) return false;
    
    const newCurrent = navigationHistory.current - 1;
    const newPath = [...navigationHistory.history[newCurrent]];
    
    setCurrentPath(newPath);
    setNavigationHistory(prev => ({
      ...prev,
      current: newCurrent
    }));
    
    return true;
  };

  // Navigate forward in history
  const navigateForward = () => {
    if (navigationHistory.current >= navigationHistory.history.length - 1) return false;
    
    const newCurrent = navigationHistory.current + 1;
    const newPath = [...navigationHistory.history[newCurrent]];
    
    setCurrentPath(newPath);
    setNavigationHistory(prev => ({
      ...prev,
      current: newCurrent
    }));
    
    return true;
  };

  // Update navigation history
  const updateNavigationHistory = (path) => {
    setNavigationHistory(prev => {
      // Remove all entries after current position
      const newHistory = prev.history.slice(0, prev.current + 1);
      
      // Add new path if it's different from the current one
      const lastPath = newHistory[newHistory.length - 1];
      if (!lastPath || !arraysEqual(lastPath, path)) {
        newHistory.push([...path]);
      }
      
      return {
        history: newHistory,
        current: newHistory.length - 1
      };
    });
  };

  // Get current folder's contents
  const getCurrentFolder = () => {
    let current = fileSystem;
    
    for (const segment of currentPath) {
      if (current[segment] && current[segment].type === 'folder') {
        current = current[segment].children;
      } else {
        return null;
      }
    }
    
    return current;
  };

  // Check if path is valid
  const isValidPath = (path) => {
    let current = fileSystem;
    
    for (const segment of path) {
      if (current[segment] && current[segment].type === 'folder') {
        current = current[segment].children;
      } else {
        return false;
      }
    }
    
    return true;
  };

  // Create a new file
  const createFile = (name, content = '') => {
    // Validate name
    if (!name || name.trim() === '') {
      showAlert('File name cannot be empty', 'error');
      return false;
    }
    
    // Get current folder
    const currentFolder = getCurrentFolder();
    if (!currentFolder) {
      showAlert('Invalid current path', 'error');
      return false;
    }
    
    // Check if file/folder already exists
    if (currentFolder[name]) {
      showAlert(`A file or folder named "${name}" already exists.`, 'error');
      return false;
    }
    
    // Create the file
    setFileSystem(prev => {
      const newFileSystem = {...prev};
      let target = newFileSystem;
      
      // Navigate to current path
      for (let i = 0; i < currentPath.length; i++) {
        const segment = currentPath[i];
        if (target[segment] && target[segment].type === 'folder') {
          if (i === currentPath.length - 1) {
            target = target[segment].children;
          } else {
            target = target[segment].children;
          }
        }
      }
      
      // Add new file
      target[name] = {
        type: 'file',
        content
      };
      
      return newFileSystem;
    });
    
    showAlert(`File "${name}" created successfully.`, 'success');
    return true;
  };

  // Create a new folder
  const createFolder = (name) => {
    // Validate name
    if (!name || name.trim() === '') {
      showAlert('Folder name cannot be empty', 'error');
      return false;
    }
    
    // Get current folder
    const currentFolder = getCurrentFolder();
    if (!currentFolder) {
      showAlert('Invalid current path', 'error');
      return false;
    }
    
    // Check if file/folder already exists
    if (currentFolder[name]) {
      showAlert(`A file or folder named "${name}" already exists.`, 'error');
      return false;
    }
    
    // Create the folder
    setFileSystem(prev => {
      const newFileSystem = {...prev};
      let target = newFileSystem;
      
      // Navigate to current path
      for (let i = 0; i < currentPath.length; i++) {
        const segment = currentPath[i];
        if (target[segment] && target[segment].type === 'folder') {
          if (i === currentPath.length - 1) {
            target = target[segment].children;
          } else {
            target = target[segment].children;
          }
        }
      }
      
      // Add new folder
      target[name] = {
        type: 'folder',
        children: {}
      };
      
      return newFileSystem;
    });
    
    showAlert(`Folder "${name}" created successfully.`, 'success');
    return true;
  };

  // Delete a file or folder
  const deleteItem = (name) => {
    // Get current folder
    const currentFolder = getCurrentFolder();
    if (!currentFolder || !currentFolder[name]) {
      showAlert('Item not found', 'error');
      return false;
    }
    
    // Delete the item
    setFileSystem(prev => {
      const newFileSystem = {...prev};
      let target = newFileSystem;
      
      // Navigate to current path
      for (let i = 0; i < currentPath.length; i++) {
        const segment = currentPath[i];
        if (target[segment] && target[segment].type === 'folder') {
          if (i === currentPath.length - 1) {
            target = target[segment].children;
          } else {
            target = target[segment].children;
          }
        }
      }
      
      // Delete the item
      delete target[name];
      
      return newFileSystem;
    });
    
    showAlert(`"${name}" deleted successfully.`, 'success');
    return true;
  };

  // Rename a file or folder
  const renameItem = (oldName, newName) => {
    // Validate names
    if (!newName || newName.trim() === '') {
      showAlert('New name cannot be empty', 'error');
      return false;
    }
    
    // Get current folder
    const currentFolder = getCurrentFolder();
    if (!currentFolder || !currentFolder[oldName]) {
      showAlert('Item not found', 'error');
      return false;
    }
    
    // Check if target name already exists
    if (currentFolder[newName]) {
      showAlert(`A file or folder named "${newName}" already exists.`, 'error');
      return false;
    }
    
    // Rename the item
    setFileSystem(prev => {
      const newFileSystem = {...prev};
      let target = newFileSystem;
      
      // Navigate to current path
      for (let i = 0; i < currentPath.length; i++) {
        const segment = currentPath[i];
        if (target[segment] && target[segment].type === 'folder') {
          if (i === currentPath.length - 1) {
            target = target[segment].children;
          } else {
            target = target[segment].children;
          }
        }
      }
      
      // Rename the item
      target[newName] = {...target[oldName]};
      delete target[oldName];
      
      return newFileSystem;
    });
    
    showAlert(`"${oldName}" renamed to "${newName}" successfully.`, 'success');
    return true;
  };

  // Copy an item to clipboard
  const copyToClipboard = (name) => {
    // Get current folder
    const currentFolder = getCurrentFolder();
    if (!currentFolder || !currentFolder[name]) {
      showAlert('Item not found', 'error');
      return false;
    }
    
    // Set clipboard item
    setClipboardItem({
      name,
      item: {...currentFolder[name]},
      operation: 'copy',
      sourcePath: [...currentPath]
    });
    
    showAlert(`"${name}" copied to clipboard.`, 'success');
    return true;
  };

  // Paste from clipboard
  const pasteFromClipboard = () => {
    if (!clipboardItem) {
      showAlert('Nothing to paste', 'error');
      return false;
    }
    
    // Get current folder
    const currentFolder = getCurrentFolder();
    if (!currentFolder) {
      showAlert('Invalid current path', 'error');
      return false;
    }
    
    const { name, item, operation, sourcePath } = clipboardItem;
    
    // Check if path is the same (for move operation)
    const sameFolder = arraysEqual(sourcePath, currentPath);
    
    // Generate new name if item already exists
    let newName = name;
    if (currentFolder[name]) {
      if (operation === 'copy' || sameFolder) {
        newName = generateUniqueName(name, currentFolder);
      } else {
        // For move operation, if target already exists, show error
        showAlert(`A file or folder named "${name}" already exists in the destination folder.`, 'error');
        return false;
      }
    }
    
    // Apply paste operation
    setFileSystem(prev => {
      const newFileSystem = {...prev};
      
      // For move operation, delete from source first
      if (operation === 'move' && !sameFolder) {
        let source = newFileSystem;
        for (let i = 0; i < sourcePath.length; i++) {
          const segment = sourcePath[i];
          if (source[segment] && source[segment].type === 'folder') {
            if (i === sourcePath.length - 1) {
              source = source[segment].children;
            } else {
              source = source[segment].children;
            }
          }
        }
        delete source[name];
      }
      
      // Add to target
      let target = newFileSystem;
      for (let i = 0; i < currentPath.length; i++) {
        const segment = currentPath[i];
        if (target[segment] && target[segment].type === 'folder') {
          if (i === currentPath.length - 1) {
            target = target[segment].children;
          } else {
            target = target[segment].children;
          }
        }
      }
      target[newName] = deepCopy(item);
      
      return newFileSystem;
    });
    
    const operationText = operation === 'copy' ? 'copied' : 'moved';
    showAlert(`"${name}" ${operationText} to /${currentPath.join('/')}${newName !== name ? ' as "' + newName + '"' : ''}.`, 'success');
    
    // Clear clipboard for move operation
    if (operation === 'move') {
      setClipboardItem(null);
    }
    
    return true;
  };

  // Open a file
  const openFile = (fileName) => {
    // Get current folder
    const currentFolder = getCurrentFolder();
    if (!currentFolder || !currentFolder[fileName] || currentFolder[fileName].type !== 'file') {
      showAlert('File not found', 'error');
      return false;
    }
    
    // Set current file
    setCurrentFile({
      name: fileName,
      path: [...currentPath],
      content: currentFolder[fileName].content
    });
    
    return true;
  };

  // Save file content
  const saveFile = (fileName, content) => {
    // Get current folder
    const currentFolder = getCurrentFolder();
    if (!currentFolder || !currentFolder[fileName] || currentFolder[fileName].type !== 'file') {
      showAlert('File not found', 'error');
      return false;
    }
    
    // Save content
    setFileSystem(prev => {
      const newFileSystem = {...prev};
      let target = newFileSystem;
      
      // Navigate to current path
      for (let i = 0; i < currentPath.length; i++) {
        const segment = currentPath[i];
        if (target[segment] && target[segment].type === 'folder') {
          if (i === currentPath.length - 1) {
            target = target[segment].children;
          } else {
            target = target[segment].children;
          }
        }
      }
      
      // Update file content
      if (target[fileName] && target[fileName].type === 'file') {
        target[fileName].content = content;
      }
      
      return newFileSystem;
    });
    
    showAlert(`File "${fileName}" saved successfully.`, 'success');
    return true;
  };

  // Get file content
  const getFileContent = (path, fileName) => {
    let current = fileSystem;
    const pathToUse = path || currentPath;
    
    for (const segment of pathToUse) {
      if (current[segment] && current[segment].type === 'folder') {
        current = current[segment].children;
      } else {
        return '';
      }
    }
    
    if (current[fileName] && current[fileName].type === 'file') {
      return current[fileName].content;
    }
    
    return '';
  };

  // Helper function to check if two arrays are equal
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  // Helper function to generate a unique name for copy operations
  const generateUniqueName = (name, folder) => {
    let baseName = name;
    let extension = '';
    
    // Handle file extensions
    const lastDotIndex = name.lastIndexOf('.');
    if (lastDotIndex > 0) {
      baseName = name.substring(0, lastDotIndex);
      extension = name.substring(lastDotIndex);
    }
    
    let counter = 1;
    let newName = `${baseName} (Copy)${extension}`;
    
    while (folder[newName]) {
      newName = `${baseName} (Copy ${counter})${extension}`;
      counter++;
    }
    
    return newName;
  };

  // Helper function to deep copy objects
  const deepCopy = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };

  return (
    <FileSystemContext.Provider
      value={{
        fileSystem,
        currentPath,
        navigationHistory,
        currentFile,
        clipboardItem,
        navigateTo,
        navigateUp,
        navigateBack,
        navigateForward,
        createFile,
        createFolder,
        deleteItem,
        renameItem,
        copyToClipboard,
        pasteFromClipboard,
        openFile,
        saveFile,
        getFileContent,
        setCurrentFile
      }}
    >
      {children}
    </FileSystemContext.Provider>
  );
}

// Custom hook to use FileSystem context
export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
}

export default FileSystemContext; 
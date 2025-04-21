import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import Taskbar from '../Taskbar/Taskbar';
import './Desktop.css';
import Terminal from '../Terminal/Terminal';
import Settings from '../Settings/Settings';

/**
 * Desktop component that serves as the main UI after login
 * @param {Object} props - Component props
 * @param {string} props.username - Current logged in username
 * @param {Function} props.onLogout - Function to call when logging out
 * @param {Function} props.onLock - Function to lock the screen
 * @param {string} props.wallpaper - Current wallpaper path
 * @param {Function} props.onWallpaperChange - Function to update wallpaper
 */
function Desktop({ username, onLogout, onLock, wallpaper, onWallpaperChange, setOpenWebsite }) {
  // State for desktop elements
  const [windows, setWindows] = useState([]);
  const [activeWindow, setActiveWindow] = useState(null);
  
  // Add state for tracking fullscreen windows
  const [fullscreenWindow, setFullscreenWindow] = useState(null);
  
  // Enhanced file system with parent-child relationships
  const [fileSystem, setFileSystem] = useState({
    root: {
      id: 'root',
      name: 'Root',
      type: 'folder',
      children: [
        { id: 'documents', name: 'Documents', icon: 'folder', type: 'folder', parent: 'root', children: [] },
        { id: 'pictures', name: 'Pictures', icon: 'image', type: 'folder', parent: 'root', children: [] },
        { id: 'downloads', name: 'Downloads', icon: 'download', type: 'folder', parent: 'root', children: [] },
        { 
          id: 'readme', 
          name: 'README.txt', 
          icon: 'file-alt', 
          type: 'file', 
          parent: 'root',
          content: 'Welcome to BerryOS!\n\nThis is a desktop operating system UI built with React.\n\nFeatures:\n- Window management\n- File system\n- Desktop icons\n- Applications'
        },
        { 
          id: 'notes', 
          name: 'Notes.txt', 
          icon: 'file-alt', 
          type: 'file', 
          parent: 'root',
          content: 'Your notes here...' 
        }
      ]
    }
  });

  // Flatten file system for desktop icons display
  const [icons, setIcons] = useState([]);
  
  // Update icons when fileSystem changes
  useEffect(() => {
    // Desktop apps (always shown)
    const appIcons = [
      { id: 'file-explorer', name: 'Files', icon: 'folder', type: 'app' },
      { id: 'settings', name: 'Settings', icon: 'cog', type: 'app' },
      { id: 'browser', name: 'Browser', icon: 'globe', type: 'app' },
      { id: 'terminal', name: 'Terminal', icon: 'terminal', type: 'app' },
      // Notepad app removed from desktop
    ];
    
    // Desktop files and folders (items at root level)
    const desktopItems = fileSystem.root.children.map(item => ({
      ...item,
      children: undefined // Don't need children in the icons view
    }));
    
    // Combine apps and desktop items
    setIcons([...appIcons, ...desktopItems]);
  }, [fileSystem]);

  // Initialize context menu state with all required properties
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetId: 'root', // Default to root (desktop) when right-clicking empty space
    targetItem: null, // Store the actual item for additional context
    isInFolderView: false
  });
  
  // Refs for drag functionality
  const draggedWindow = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  // State to track which item is being renamed
  const [renamingItem, setRenamingItem] = useState(null);
  const renameInputRef = useRef(null);
  
  // Add navigation history and current location state
  const [fileHistory, setFileHistory] = useState({});
  const [notification, setNotification] = useState(null);
  
  // Add clipboard state to store copied/cut files
  const [clipboard, setClipboard] = useState(null);
  
  // Focus on rename input when it appears
  useEffect(() => {
    if (renamingItem && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingItem]);
  
  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // Show a notification message
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };
  
  // Function to open a new window with proper positioning
  const openWindow = (appId) => {
    const app = icons.find(icon => icon.id === appId);
    if (!app) return;
    
    // Check if window already exists
    const existingWindow = windows.find(win => win.id === appId);
    if (existingWindow) {
      if (existingWindow.minimized) {
        restoreWindow(appId);
      } else {
        setActiveWindow(appId);
      }
      return;
    }
    
    // If this is the browser app, check if the proxy server is running
    if (appId === 'browser') {
      checkProxyServer();
    }
    
    // Position the window with an offset based on existing windows
    const offset = windows.length * 25;
    
    // Create new window with proper size based on type
    let windowSize = { width: 800, height: 500 };
    if (app.type === 'file') {
      windowSize = { width: 600, height: 400 };
    } else if (app.id === 'terminal') {
      windowSize = { width: 700, height: 400 };
    }
    
    // Create new window
    const newWindow = {
      id: appId,
      title: app.name,
      icon: app.icon,
      minimized: false,
      position: { 
        x: Math.max(50, Math.min(window.innerWidth - windowSize.width - 50, 100 + offset)),
        y: Math.max(50, Math.min(window.innerHeight - windowSize.height - 50, 100 + offset))
      },
      size: windowSize,
      content: app.type === 'app' ? appId : (app.type === 'file' ? 'notepad' : 'folder'),
      fileContent: app.content,
      zIndex: windows.length + 10
    };
    
    setWindows([...windows, newWindow]);
    setActiveWindow(appId);
  };
  
  // Function to check if the proxy server is running
  const checkProxyServer = () => {
    fetch('http://localhost:5000/status')
      .then(response => {
        if (response.ok) {
          // Server is running
          console.log("Proxy server is running");
        }
      })
      .catch(error => {
        console.error("Proxy server not running:", error);
        showNotification("Browser proxy server is not running. Some features will be limited.", "error");
      });
  };
  
  // Function to close a window
  const closeWindow = (id, e) => {
    if (e) e.stopPropagation();
    setWindows(windows.filter(win => win.id !== id));
    if (activeWindow === id) {
      // Set next active window if available
      const remainingWindows = windows.filter(win => win.id !== id && !win.minimized);
      setActiveWindow(remainingWindows.length > 0 ? remainingWindows[remainingWindows.length - 1].id : null);
    }
  };
  
  // Function to minimize a window
  const minimizeWindow = (id, e) => {
    if (e) e.stopPropagation();
    setWindows(windows.map(win => {
      if (win.id === id) {
        return { ...win, minimized: true };
      }
      return win;
    }));
    
    // Set next active window if available
    if (activeWindow === id) {
      const otherWindows = windows.filter(win => win.id !== id && !win.minimized);
      setActiveWindow(otherWindows.length > 0 ? otherWindows[otherWindows.length - 1].id : null);
    }
  };
  
  // Function to restore a minimized window
  const restoreWindow = (id) => {
    setWindows(windows.map(win => {
      if (win.id === id) {
        return { ...win, minimized: false };
      }
      return win;
    }));
    setActiveWindow(id);
  };
  
  // Improved window drag functionality
  const handleWindowDragStart = (e, id) => {
    if (e.target.closest('.window-controls')) return;
    
    // Prevent dragging in fullscreen mode
    if (fullscreenWindow === id) return;
    
    const windowEl = document.getElementById(`window-${id}`);
    if (!windowEl) return;
    
    // Set active window
    if (activeWindow !== id) {
      setActiveWindow(id);
    }
    
    // Store the initial position of mouse relative to window
    draggedWindow.current = id;
    dragStartPos.current = { 
      x: e.clientX - windowEl.offsetLeft, 
      y: e.clientY - windowEl.offsetTop 
    };
    
    // Add event listeners for drag
    document.addEventListener('mousemove', handleWindowDrag);
    document.addEventListener('mouseup', handleWindowDragEnd);
  };
  
  // Improved window drag handler
  const handleWindowDrag = (e) => {
    if (!draggedWindow.current) return;
    
    // Calculate new position directly from mouse position
    const newX = Math.max(0, e.clientX - dragStartPos.current.x);
    const newY = Math.max(0, e.clientY - dragStartPos.current.y);
    
    // Update window position immediately in the DOM for smoother dragging
    const windowEl = document.getElementById(`window-${draggedWindow.current}`);
    if (windowEl) {
      windowEl.style.left = `${newX}px`;
      windowEl.style.top = `${newY}px`;
    }
    
    // Rate limit state updates to avoid too many re-renders
    // We'll update React state on drag end
  };
  
  // Update state when drag ends
  const handleWindowDragEnd = (e) => {
    if (!draggedWindow.current) return;
    
    // Get current position from DOM and update state
    const windowEl = document.getElementById(`window-${draggedWindow.current}`);
    if (windowEl) {
      const newX = parseInt(windowEl.style.left, 10) || 0;
      const newY = parseInt(windowEl.style.top, 10) || 0;
      
      setWindows(windows.map(win => {
        if (win.id === draggedWindow.current) {
          return {
            ...win,
            position: { x: newX, y: newY }
          };
        }
        return win;
      }));
    }
    
    // Clean up
    draggedWindow.current = null;
    document.removeEventListener('mousemove', handleWindowDrag);
    document.removeEventListener('mouseup', handleWindowDragEnd);
  };
  
  // Improved recursive function to find an item in the file system
  const findItem = (id, folder = fileSystem.root) => {
    // Special case for root
    if (id === 'root') return { item: folder, parent: null };
    
    // Check if the ID is valid
    if (!id) {
      console.error("Invalid ID provided to findItem:", id);
      return null;
    }
    
    // Normalize ID to string
    const itemId = String(id);
    
    // Check direct children first
    for (const child of folder.children || []) {
      if (String(child.id) === itemId) {
        return { item: child, parent: folder };
      }
    }
    
    // Recursively search in subfolder children
    for (const child of folder.children || []) {
      if (child.type === 'folder' && Array.isArray(child.children)) {
        const result = findItem(itemId, child);
        if (result) return result;
      }
    }
    
    return null;
  };
  
  // Function to handle right-click context menu
  const handleContextMenu = (e, targetId = 'root') => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    console.log("Right click on:", targetId); // Debug
    
    // Get the item that was right-clicked
    const result = findItem(targetId, fileSystem.root);
    console.log("Found item:", result); // Debug
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetId,
      targetItem: result?.item,
      isInFolderView: false
    });
  };
  
  // Function to handle right-click in a folder window
  const handleFolderContextMenu = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to desktop
    
    console.log("Right click in folder:", folderId); // Debug
    const result = findItem(folderId, fileSystem.root);
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetId: folderId,
      targetItem: result?.item,
      isInFolderView: true
    });
  };
  
  // Function to close context menu when clicking elsewhere
  const handleClick = () => {
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };
  
  // Function to create a new folder in the current context
  const createNewFolder = () => {
    const timestamp = Date.now();
    const newFolderId = `folder-${timestamp}`;
    let parentId = contextMenu.targetId;
    
    // If we're in a folder view and right-clicked in empty space, use the folder's ID
    if (contextMenu.isInFolderView) {
      parentId = contextMenu.targetId;
    }
    
    const newFolder = {
      id: newFolderId,
      name: `New Folder`,
      icon: 'folder',
      type: 'folder',
      parent: parentId,
      children: []
    };
    
    // Update fileSystem by adding new folder to target parent
    setFileSystem(prev => {
      const updatedSystem = { ...prev };
      
      // If target is root, add to root children
      if (parentId === 'root') {
        updatedSystem.root.children = [...updatedSystem.root.children, newFolder];
      } else {
        // Find the target folder and add the new folder to its children
        const result = findItem(parentId, updatedSystem.root);
        if (result && result.item.type === 'folder') {
          result.item.children = [...(result.item.children || []), newFolder];
        }
      }
      
      return updatedSystem;
    });
    
    // Set the new folder to be renamed immediately
    setRenamingItem(newFolderId);
    
    setContextMenu({ ...contextMenu, visible: false });
  };
  
  // Function to create a new file in the current context
  const createNewFile = () => {
    const timestamp = Date.now();
    const newFileId = `file-${timestamp}`;
    let parentId = contextMenu.targetId;
    
    // If we're in a folder view and right-clicked in empty space, use the folder's ID
    if (contextMenu.isInFolderView) {
      parentId = contextMenu.targetId;
    }
    
    const newFile = {
      id: newFileId,
      name: `New File.txt`,
      icon: 'file-alt',
      type: 'file',
      parent: parentId,
      content: ''
    };
    
    // Update fileSystem by adding new file to target parent
    setFileSystem(prev => {
      const updatedSystem = { ...prev };
      
      // If target is root, add to root children
      if (parentId === 'root') {
        updatedSystem.root.children = [...updatedSystem.root.children, newFile];
      } else {
        // Find the target folder and add the new file to its children
        const result = findItem(parentId, updatedSystem.root);
        if (result && result.item.type === 'folder') {
          result.item.children = [...(result.item.children || []), newFile];
        }
      }
      
      return updatedSystem;
    });
    
    // Set the new file to be renamed immediately
    setRenamingItem(newFileId);
    
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Fix the saveFile function to handle file IDs correctly
  const saveFile = (fileId, newContent) => {
    console.log("Saving file with ID:", fileId);
    
    // Handle null/undefined content
    if (newContent === undefined || newContent === null) {
      newContent = '';
    }
    
    // Find the file and update its content
    setFileSystem(prev => {
      const updatedSystem = { ...prev };
      
      // Extract the actual file ID from a file-view- format
      let actualFileId = fileId;
      if (typeof fileId === 'string' && fileId.startsWith('file-view-')) {
        actualFileId = fileId.replace('file-view-', '');
      }
      
      console.log("Looking for file with ID:", actualFileId);
      const result = findItem(actualFileId, updatedSystem.root);
      
      if (result && result.item) {
        console.log("File found, updating content");
        result.item.content = newContent;
        showNotification('File saved successfully!');
      } else {
        console.error("File not found:", actualFileId);
        showNotification('Error: File not found', 'error');
      }
      
      return updatedSystem;
    });
  };
  
  // Function to delete a file or folder
  const deleteItem = () => {
    const itemToDelete = contextMenu.targetId;
    
    // Find the item and its parent
    const result = findItem(itemToDelete, fileSystem.root);
    if (!result) {
      setContextMenu({ ...contextMenu, visible: false });
      return;
    }
    
    // Update fileSystem by removing the item from its parent's children
    setFileSystem(prev => {
      const updatedSystem = { ...prev };
      
      // If parent is root
      if (result.parent.id === 'root') {
        updatedSystem.root.children = updatedSystem.root.children.filter(
          item => item.id !== itemToDelete
        );
      } else {
        // Find parent and update its children
        const parentResult = findItem(result.parent.id, updatedSystem.root);
        if (parentResult) {
          parentResult.item.children = parentResult.item.children.filter(
            item => item.id !== itemToDelete
          );
        }
      }
      
      return updatedSystem;
    });
    
    // If there's an open window for this item, close it
    const windowId = `file-view-${itemToDelete}`;
    const folderWindowId = `folder-view-${itemToDelete}`;
    
    setWindows(prev => prev.filter(win => win.id !== windowId && win.id !== folderWindowId));
    
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Update copy function to actually store the item in clipboard
  const copyItem = () => {
    const itemToCopy = contextMenu.targetItem;
    if (itemToCopy) {
      setClipboard({
        item: itemToCopy,
        action: 'copy'
      });
      showNotification(`Copied: ${itemToCopy.name}`, 'info');
    }
    setContextMenu({ ...contextMenu, visible: false });
  };
  
  // Update cut function to store the item in clipboard
  const cutItem = () => {
    const itemToCut = contextMenu.targetItem;
    if (itemToCut) {
      setClipboard({
        item: itemToCut,
        action: 'cut'
      });
      showNotification(`Cut: ${itemToCut.name}`, 'info');
    }
    setContextMenu({ ...contextMenu, visible: false });
  };
  
  // Add paste function
  const pasteItem = () => {
    if (!clipboard) return;
    
    const targetFolderId = contextMenu.targetId === 'root' ? 'root' : 
                           contextMenu.targetItem?.type === 'folder' ? contextMenu.targetId : 'root';
    
    // Create a new ID for the pasted item
    const timestamp = Date.now();
    const newId = `${clipboard.item.type}-${timestamp}`;
    
    // Create a copy of the item
    const newItem = {
      ...clipboard.item,
      id: newId,
      parent: targetFolderId,
      name: clipboard.action === 'copy' ? `Copy of ${clipboard.item.name}` : clipboard.item.name
    };
    
    // Update file system
    setFileSystem(prev => {
      const updatedSystem = { ...prev };
      
      // Add item to target folder
      if (targetFolderId === 'root') {
        updatedSystem.root.children = [...updatedSystem.root.children, newItem];
      } else {
        const targetFolder = findItem(targetFolderId, updatedSystem.root);
        if (targetFolder && targetFolder.item.type === 'folder') {
          targetFolder.item.children = [...(targetFolder.item.children || []), newItem];
        }
      }
      
      // If this was a cut operation, remove the original item
      if (clipboard.action === 'cut') {
        // Find and remove original item
        const originalItemParent = findItem(clipboard.item.parent, updatedSystem.root);
        if (originalItemParent) {
          if (originalItemParent.item.id === 'root') {
            updatedSystem.root.children = updatedSystem.root.children.filter(
              child => child.id !== clipboard.item.id
            );
          } else {
            originalItemParent.item.children = originalItemParent.item.children.filter(
              child => child.id !== clipboard.item.id
            );
          }
        }
        
        // Clear clipboard after cut paste
        setClipboard(null);
      }
      
      return updatedSystem;
    });
    
    showNotification(`Pasted: ${newItem.name}`, 'success');
    setContextMenu({ ...contextMenu, visible: false });
  };
  
  // Effect to close context menu when clicking outside
  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [contextMenu.visible]);
  
  // Clean up dragging event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleWindowDrag);
      document.removeEventListener('mouseup', handleWindowDragEnd);
    };
  }, []);
  
  // Get folder contents for display
  const getFolderContents = (folderId) => {
    if (folderId === 'root') {
      return fileSystem.root.children || [];
    }
    
    const result = findItem(folderId, fileSystem.root);
    if (result && result.item.type === 'folder') {
      return result.item.children || [];
    }
    
    return [];
  };
  
  // Initialize file explorer window with navigation state
  const initializeFileExplorerWindow = (windowId, initialLocation = 'root') => {
    // Always start fresh with the specified location
    setFileHistory(prev => ({
      ...prev,
      [windowId]: {
        history: [initialLocation],
        currentIndex: 0
      }
    }));
  };
  
  // Get current folder ID for a file explorer window
  const getCurrentFolder = (windowId) => {
    if (!fileHistory[windowId]) return 'root';
    const { history, currentIndex } = fileHistory[windowId];
    return history[currentIndex];
  };
  
  // Navigate to a folder within the same file explorer window
  const navigateToFolder = (windowId, folderId) => {
    // Make sure the window has file history initialized
    if (!fileHistory[windowId]) {
      initializeFileExplorerWindow(windowId, folderId);
      return;
    }
    
    // Update navigation history
    setFileHistory(prev => {
      const { history, currentIndex } = prev[windowId];
      
      // If navigating from a point in history, truncate forward history
      const newHistory = history.slice(0, currentIndex + 1);
      newHistory.push(folderId);
      
      return {
        ...prev,
        [windowId]: {
          history: newHistory,
          currentIndex: newHistory.length - 1
        }
      };
    });
    
    // Set window as active
    setActiveWindow(windowId);
  };
  
  // Navigate back in file history
  const navigateBack = (windowId) => {
    setFileHistory(prev => {
      if (!prev[windowId]) return prev;
      
      const { history, currentIndex } = prev[windowId];
      if (currentIndex <= 0) return prev;
      
      return {
        ...prev,
        [windowId]: {
          ...prev[windowId],
          currentIndex: currentIndex - 1
        }
      };
    });
  };
  
  // Navigate forward in file history
  const navigateForward = (windowId) => {
    setFileHistory(prev => {
      if (!prev[windowId]) return prev;
      
      const { history, currentIndex } = prev[windowId];
      if (currentIndex >= history.length - 1) return prev;
      
      return {
        ...prev,
        [windowId]: {
          ...prev[windowId],
          currentIndex: currentIndex + 1
        }
      };
    });
  };
  
  // Navigate up to parent folder
  const navigateUp = (windowId) => {
    const currentFolderId = getCurrentFolder(windowId);
    
    // Get parent folder
    if (currentFolderId === 'root') return; // Already at root
    
    const result = findItem(currentFolderId, fileSystem.root);
    if (result && result.parent) {
      navigateToFolder(windowId, result.parent.id);
    }
  };
  
  // Get path name for current location
  const getPathName = (folderId) => {
    if (folderId === 'root') return '/Home';
    
    const result = findItem(folderId, fileSystem.root);
    if (!result) return '/Unknown';
    
    return '/' + result.item.name;
  };
  
  // Update handle icon double-click
  const handleIconDoubleClick = (icon) => {
    if (icon.type === 'app') {
      openWindow(icon.id);
    } else if (icon.type === 'folder') {
      // Create a unique window ID for each folder
      const folderId = `folder-view-${icon.id}`;
      
      // Position with offset
      const offset = windows.length * 25;
      
      const folderWindow = {
        id: folderId,
        title: icon.name,
        icon: 'folder',
        minimized: false,
        position: { 
          x: Math.max(50, Math.min(window.innerWidth - 700 - 50, 120 + offset)),
          y: Math.max(50, Math.min(window.innerHeight - 450 - 50, 120 + offset))
        },
        size: { width: 700, height: 450 },
        content: 'file-explorer',
        folderId: icon.id,
        zIndex: windows.length + 10
      };
      
      // Check if window already exists
      const existingWindow = windows.find(win => win.id === folderId);
      if (existingWindow) {
        if (existingWindow.minimized) {
          restoreWindow(folderId);
        } else {
          setActiveWindow(folderId);
        }
      } else {
        // Create a new window for this folder
        setWindows([...windows, folderWindow]);
        setActiveWindow(folderId);
        
        // Initialize navigation history for this specific folder
        initializeFileExplorerWindow(folderId, icon.id);
      }
    } else if (icon.type === 'file') {
      // Open file in notepad
      const fileId = `file-view-${icon.id}`;
      
      // Check if window already exists
      const existingWindow = windows.find(win => win.id === fileId);
      if (existingWindow) {
        if (existingWindow.minimized) {
          restoreWindow(fileId);
        } else {
          setActiveWindow(fileId);
        }
        return;
      }
      
      // Find the file in the file system
      const fileResult = findItem(icon.id, fileSystem.root);
      if (!fileResult || !fileResult.item) {
        showNotification(`Error: File "${icon.name}" not found`, 'error');
        return;
      }
      
      // Create a window for the file
      const offset = windows.length * 25;
      
      const fileWindow = {
        id: fileId,
        title: icon.name || 'Untitled',
        icon: 'edit',
        minimized: false,
        position: { 
          x: Math.max(50, Math.min(window.innerWidth - 600 - 50, 150 + offset)),
          y: Math.max(50, Math.min(window.innerHeight - 400 - 50, 150 + offset))
        },
        size: { width: 600, height: 400 },
        content: 'notepad',
        fileId: icon.id,
        zIndex: windows.length + 10
      };
      
      // Add the window and make it active
      setWindows(prev => [...prev, fileWindow]);
      setActiveWindow(fileId);
    }
  };
  
  // Function to rename a file or folder
  const renameItem = () => {
    const itemToRename = contextMenu.targetId;
    setRenamingItem(itemToRename);
    setContextMenu({ ...contextMenu, visible: false });
  };
  
  // Handle saving the renamed item
  const handleRenameSave = (itemId, newName) => {
    if (!newName.trim()) {
      // Don't allow empty names
      return;
    }
    
    setFileSystem(prev => {
      const updatedSystem = { ...prev };
      const result = findItem(itemId, updatedSystem.root);
      
      if (result) {
        result.item.name = newName;
      }
      
      return updatedSystem;
    });
    
    setRenamingItem(null);
  };
  
  // Handle rename cancel (escape key or blur)
  const handleRenameCancel = () => {
    setRenamingItem(null);
  };
  
  // Update the nested folder navigation handler in file explorer window
  // This function will be called when double-clicking a folder inside a file explorer window
  const navigateToNestedFolder = (windowId, folderId) => {
    // Navigate to this folder within the current file explorer window
    navigateToFolder(windowId, folderId);
  };

  // Format file size in human-readable form
  const formatFileSize = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get permissions string for file/folder
  const getPermissions = (file) => {
    // Simplified permissions for this simulation
    return file.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
  };

  // Get formatted timestamp
  const getTimestamp = () => {
    const date = new Date();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Terminal implementation has been moved to the imported Terminal component
  
  /**
   * Render the Terminal component with proper error handling
   */
  const renderTerminal = (window) => {
    try {
      return (
        <Terminal
          onClose={() => closeWindow(window.id)}
          onMinimize={() => minimizeWindow(window.id)}
          onMaximize={() => toggleFullscreen(window.id)}
          initialUser={username}
          initialHostname="berry"
          initialDir="~"
          isMaximized={window.isFullscreen}
          inWindow={true}
        />
      );
    } catch (error) {
      console.error("Error rendering terminal:", error);
      return (
        <div className="terminal-error-container" style={{ 
          backgroundColor: "#282a36",
          color: "#f8f8f2",
          padding: '12px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div className="terminal-error-icon" style={{
            color: "#ff5555",
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="terminal-error-title" style={{
            color: "#ff5555",
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Terminal Error
          </div>
          <div className="terminal-error-message" style={{
            marginBottom: '16px'
          }}>
            {error?.message || 'Unknown error occurred while rendering the terminal'}
          </div>
          <button 
            onClick={() => closeWindow(window.id)}
            style={{
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close Window
          </button>
        </div>
      );
    }
  };

  // Add browserState definition near other state variables
  const [browserState, setBrowserState] = useState({
    url: 'https://www.google.com',
    inputUrl: 'https://www.google.com',
    history: ['https://www.google.com'],
    currentIndex: 0,
    isLoading: true,
    error: null,
    proxyMode: true  // Enable proxy mode by default
  });
  
  // Update proxy URL construction function
  const getProxyUrl = (url) => {
    return `http://localhost:5000/proxy?url=${encodeURIComponent(url)}`;
  };

  // Add function to handle direct search queries
  const getSearchUrl = (query) => {
    return `http://localhost:5000/search?q=${encodeURIComponent(query)}`;
  };

  // Update window size based on content type
  const adjustWindowSize = (windowId, contentType) => {
    // Make the window larger for video content (especially YouTube)
    if (contentType === 'youtube') {
      setWindows(windows.map(win => {
        if (win.id === windowId) {
          return {
            ...win,
            size: { width: Math.min(1200, window.innerWidth - 100), height: Math.min(700, window.innerHeight - 100) }
          };
        }
        return win;
      }));
    }
  };

  // Add function to check if a URL is a YouTube URL
  const isYouTubeUrl = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Handle messages from the iframe when navigation occurs
  const handleProxyNavigation = useCallback((message) => {
    if (message.data && message.data.type === 'navigation' && message.data.url) {
      // Update browser state with the new URL
      setBrowserState(prev => {
        // Only add to history if it's a new URL
        if (prev.url !== message.data.url) {
          const newHistory = prev.history.slice(0, prev.currentIndex + 1);
          newHistory.push(message.data.url);
          
          // Check if the new URL is a YouTube URL
          if (isYouTubeUrl(message.data.url)) {
            adjustWindowSize('browser', 'youtube');
          }
          
          return {
            ...prev,
            url: message.data.url,
            inputUrl: message.data.url,
            history: newHistory,
            currentIndex: newHistory.length - 1,
            isLoading: false,
            error: null
          };
        }
        return prev;
      });
    }
  }, []);

  // Listen for messages from the iframe
  useEffect(() => {
    window.addEventListener('message', handleProxyNavigation);
    return () => {
      window.removeEventListener('message', handleProxyNavigation);
    };
  }, [handleProxyNavigation]);

  // Fix the handleIframeLoad function to update URL in address bar
  const handleIframeLoad = () => {
    try {
      // Get the iframe element
      const iframe = document.querySelector('.browser-content iframe');
      if (iframe) {
        // Try to get the current URL from the iframe if possible
        const iframeUrl = iframe.contentWindow.location.href;
        if (iframeUrl && iframeUrl !== 'about:blank') {
          // Update the browser state with the actual URL
          setBrowserState(prev => ({
            ...prev,
            inputUrl: iframeUrl,
            isLoading: false,
            error: null
          }));
        } else {
          // Just update loading state if we can't get the URL
          setBrowserState(prev => ({
            ...prev,
            isLoading: false,
            error: null
          }));
        }
      } else {
        // Just update loading state if iframe isn't found
        setBrowserState(prev => ({
          ...prev,
          isLoading: false,
          error: null
        }));
      }
    } catch (error) {
      // Handle any security errors that might occur when trying to access iframe content
      console.log("Could not access iframe URL due to security restrictions");
      setBrowserState(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));
    }
  };

  // Improve browser navigation functions
  const browserGoBack = () => {
    if (browserState.currentIndex > 0) {
      const newIndex = browserState.currentIndex - 1;
      const previousUrl = browserState.history[newIndex];
      
      setBrowserState(prev => ({
        ...prev,
        url: previousUrl,
        inputUrl: previousUrl,
        currentIndex: newIndex,
        isLoading: true,
        error: null
      }));
      
      // This logs the navigation for debugging
      console.log(`Navigating back to: ${previousUrl}, index: ${newIndex}`);
    }
  };

  const browserGoForward = () => {
    if (browserState.currentIndex < browserState.history.length - 1) {
      const newIndex = browserState.currentIndex + 1;
      const nextUrl = browserState.history[newIndex];
      
      setBrowserState(prev => ({
        ...prev,
        url: nextUrl,
        inputUrl: nextUrl,
        currentIndex: newIndex,
        isLoading: true,
        error: null
      }));
      
      // This logs the navigation for debugging
      console.log(`Navigating forward to: ${nextUrl}, index: ${newIndex}`);
    }
  };

  const browserRefresh = () => {
    setBrowserState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));
    // This will trigger a re-render which will reload the iframe
  };

  const handleIframeError = () => {
    setBrowserState(prev => ({
      ...prev,
      isLoading: false,
      error: 'Failed to load the page. This could be due to one of the following reasons:\n\n' +
             '1. The proxy server is not running. Please start the backend server.\n' +
             '2. The website is blocking iframe embedding.\n' +
             '3. The URL might be incorrect.\n\n' +
             'Try enabling proxy mode or opening the page in an external browser.'
    }));
  };

  const toggleProxyMode = () => {
    setBrowserState(prev => ({
      ...prev,
      proxyMode: !prev.proxyMode,
      isLoading: true,
      error: null
    }));
  };

  const handleBrowserNavigation = (e) => {
    e.preventDefault();
    
    let url = browserState.inputUrl.trim();
    
    // Check for direct YouTube navigation patterns
    if (url.toLowerCase().startsWith('youtube ') || url.toLowerCase().startsWith('yt ')) {
      // Extract the search term after "youtube " or "yt "
      const searchTerm = url.substring(url.indexOf(' ') + 1);
      
      // Create a YouTube search URL
      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
      
      // Adjust window size for YouTube
      adjustWindowSize('browser', 'youtube');
    }
    // Check if this is a search query or a URL
    else if (!/^https?:\/\//i.test(url)) {
      // If it contains spaces or doesn't have a dot, treat as a search query
      if (url.includes(' ') || !url.includes('.')) {
        // Use direct search endpoint
        const searchUrl = getSearchUrl(url);
        
        setBrowserState(prev => ({
          ...prev,
          url: searchUrl, // Use the proxy search URL instead of direct Google URL
          inputUrl: url,
          isLoading: true,
          error: null
        }));
        
        // Add to history
        const newHistory = browserState.history.slice(0, browserState.currentIndex + 1);
        newHistory.push(searchUrl);
        
        setBrowserState(prev => ({
          ...prev,
          history: newHistory,
          currentIndex: newHistory.length - 1
        }));
        
        return;
      } else {
        // Looks like a URL without protocol, add https://
        url = 'https://' + url;
      }
    }
    
    // Check if this is a YouTube URL
    if (isYouTubeUrl(url)) {
      adjustWindowSize('browser', 'youtube');
    }
    
    // Only add to history if it's a new URL
    if (url !== browserState.url) {
      // Remove any forward history when navigating to a new URL
      const newHistory = browserState.history.slice(0, browserState.currentIndex + 1);
      newHistory.push(url);
      
      setBrowserState(prev => ({
        ...prev,
        url: url,
        inputUrl: url,
        history: newHistory,
        currentIndex: newHistory.length - 1,
        isLoading: true,
        error: null
      }));
    }
  };

  const openInExternalBrowser = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getWebsitePreviewUrl = (type) => {
    if (type === 'github') return 'https://github.com';
    if (type === 'slack') return 'https://slack.com';
    if (type === 'vscode') return 'https://vscode.dev';
    if (type === 'figma') return 'https://figma.com';
    if (type === 'terminal') return 'https://codeanywhere.com';
    return 'https://example.com';
  };

  // Function to toggle full-screen mode for a window
  const toggleFullscreen = (id, e) => {
    if (e) e.stopPropagation();
    
    setWindows(windows.map(win => {
      if (win.id === id) {
        // Toggle fullscreen state
        const isFullscreen = fullscreenWindow === id;
        
        // Store the window's previous position and size if going to fullscreen
        const updatedWindow = { ...win };
        
        if (!isFullscreen) {
          // Save current position/size before going fullscreen
          updatedWindow.prevPosition = { ...win.position };
          updatedWindow.prevSize = { ...win.size };
          
          // Make window fullscreen
          updatedWindow.position = { x: 0, y: 0 };
          updatedWindow.size = { 
            width: window.innerWidth, 
            height: window.innerHeight - 40 // Subtract taskbar height
          };
          
          // Update fullscreen tracking state
          setFullscreenWindow(id);
          
          // Show a notification about how to exit fullscreen
          showNotification('Press ESC or click the fullscreen button to exit fullscreen mode', 'info');
        } else {
          // Restore previous position/size
          if (updatedWindow.prevPosition) {
            updatedWindow.position = updatedWindow.prevPosition;
            delete updatedWindow.prevPosition;
          }
          
          if (updatedWindow.prevSize) {
            updatedWindow.size = updatedWindow.prevSize;
            delete updatedWindow.prevSize;
          }
          
          // Clear fullscreen tracking state
          setFullscreenWindow(null);
        }
        
        return updatedWindow;
      }
      return win;
    }));
  };

  const renderWindow = (window) => {
    try {
      if (window.content === 'file-explorer') {
        // Navigate to a folder in the file system
        const folderId = getCurrentFolder(window.id) || 'root';
        const folderContents = getFolderContents(folderId);
        
        return (
          <div className="file-explorer">
            <div className="file-explorer-toolbar">
              <div className="file-explorer-nav">
                <button 
                  onClick={() => navigateBack(window.id)} 
                  disabled={!fileHistory[window.id] || fileHistory[window.id].currentIndex === 0}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <button 
                  onClick={() => navigateForward(window.id)} 
                  disabled={!fileHistory[window.id] || fileHistory[window.id].currentIndex === fileHistory[window.id].history.length - 1}
                >
                  <i className="fas fa-arrow-right"></i>
                </button>
                <button onClick={() => navigateUp(window.id)}>
                  <i className="fas fa-arrow-up"></i>
                </button>
              </div>
              
              <div className="file-explorer-path">
                {getPathName(folderId)}
              </div>
              
              <div className="file-explorer-actions">
                <button onClick={() => createNewFile()}>
                  <i className="fas fa-file-alt"></i> New File
                </button>
                <button onClick={() => createNewFolder()}>
                  <i className="fas fa-folder-plus"></i> New Folder
                </button>
              </div>
            </div>
            
            <div 
              className="file-explorer-contents" 
              onContextMenu={(e) => handleFolderContextMenu(e, folderId)}
            >
              {folderContents.length === 0 ? (
                <div className="empty-folder">
                  <i className="fas fa-folder-open"></i>
                  <p>This folder is empty</p>
                </div>
              ) : (
                folderContents.map(item => (
                  <div 
                    key={item.id}
                    className="file-item"
                    onDoubleClick={() => {
                      if (item.type === 'folder') {
                        navigateToNestedFolder(window.id, item.id);
                      } else {
                        handleIconDoubleClick(item);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, item.id);
                    }}
                  >
                    <i className={`fas fa-${item.icon || (item.type === 'folder' ? 'folder' : 'file-alt')}`}></i>
                    
                    {renamingItem === item.id ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        className="rename-input"
                        defaultValue={item.name}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameSave(item.id, e.target.value);
                          } else if (e.key === 'Escape') {
                            handleRenameCancel();
                          }
                        }}
                        onBlur={(e) => handleRenameSave(item.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span>{item.name}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      } else if (window.content === 'settings') {
        return (
          <Settings 
            username={username}
            wallpaper={wallpaper}
            onWallpaperChange={onWallpaperChange}
            onUsernameChange={(newUsername) => {
              // Handle username change
              showNotification(`Username updated to ${newUsername}`, 'success');
              // Add any additional logic needed for username change
            }}
            onPasswordChange={(newPassword) => {
              // Handle password change
              showNotification('Password updated successfully', 'success');
              // Add any additional logic needed for password change
            }}
          />
        );
      } else if (window.content === 'browser') {
        return (
          <div className="browser-container">
            <div className="browser-toolbar">
              <button 
                onClick={() => browserGoBack()} 
                disabled={browserState.currentIndex <= 0}
                className="browser-button"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <button 
                onClick={() => browserGoForward()} 
                disabled={browserState.currentIndex >= browserState.history.length - 1}
                className="browser-button"
              >
                <i className="fas fa-arrow-right"></i>
              </button>
              <button 
                onClick={() => browserRefresh()} 
                className="browser-button"
              >
                <i className="fas fa-redo"></i>
              </button>
              
              <form onSubmit={handleBrowserNavigation} className="browser-address-bar">
                <input 
                  type="text" 
                  value={browserState.inputUrl}
                  onChange={(e) => setBrowserState({...browserState, inputUrl: e.target.value})}
                  placeholder="Enter URL or search"
                />
                <button type="submit"><i className="fas fa-arrow-right"></i></button>
              </form>
              
              <button 
                onClick={toggleProxyMode}
                className={`browser-button ${browserState.proxyMode ? 'active' : ''}`}
                title={browserState.proxyMode ? "Disable proxy" : "Enable proxy"}
              >
                <i className="fas fa-shield-alt"></i>
              </button>
              
              <button 
                onClick={() => openInExternalBrowser(browserState.url)}
                className="browser-button"
                title="Open in external browser"
              >
                <i className="fas fa-external-link-alt"></i>
              </button>
            </div>
            
            <div className="browser-content">
              {browserState.isLoading && (
                <div className="browser-loading">
                  <div className="loading-spinner"></div>
                  <span>Loading...</span>
                </div>
              )}
              
              {browserState.error ? (
                <div className="browser-error">
                  <i className="fas fa-exclamation-triangle"></i>
                  <h3>Couldn't load the page</h3>
                  <p>{browserState.error}</p>
                  <div className="browser-error-actions">
                    <button onClick={() => browserRefresh()}>Try Again</button>
                    <button onClick={() => openInExternalBrowser(browserState.url)}>
                      Open in External Browser
                    </button>
                  </div>
                </div>
              ) : browserState.url ? (
                <iframe 
                  src={browserState.proxyMode ? getProxyUrl(browserState.url) : browserState.url}
                  title="Browser Content"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                  referrerPolicy="no-referrer"
                ></iframe>
              ) : (
                <div className="browser-home">
                  <div className="browser-home-content">
                    <div className="browser-logo">
                      <i className="fas fa-globe"></i>
                      <h1>BerryOS Browser</h1>
                    </div>
                    <div className="browser-search-box">
                      <form onSubmit={handleBrowserNavigation}>
                        <input 
                          type="text" 
                          value={browserState.inputUrl}
                          onChange={(e) => setBrowserState({...browserState, inputUrl: e.target.value})}
                          placeholder="Search or enter URL"
                          autoFocus
                        />
                        <button type="submit">
                          <i className="fas fa-search"></i>
                        </button>
                      </form>
                    </div>
                    <div className="browser-quick-links">
                      <div className="quick-link" onClick={() => handleQuickLink('google.com')}>
                        <i className="fab fa-google"></i>
                        <span>Google</span>
                      </div>
                      <div className="quick-link" onClick={() => handleQuickLink('youtube.com')}>
                        <i className="fab fa-youtube"></i>
                        <span>YouTube</span>
                      </div>
                      <div className="quick-link" onClick={() => handleQuickLink('github.com')}>
                        <i className="fab fa-github"></i>
                        <span>GitHub</span>
                      </div>
                      <div className="quick-link" onClick={() => handleQuickLink('wikipedia.org')}>
                        <i className="fab fa-wikipedia-w"></i>
                        <span>Wikipedia</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      } else if (window.content === 'terminal') {
        // Terminal window content
        return renderTerminal(window);
      } else if (window.content === 'notepad') {
        // Basic stateful component for the notepad
        const NotepadEditor = () => {
          // Get file info
          let fileId = null;
          let fileName = "Untitled";
          let initialContent = "";
          
          // Get file ID
          if (window.fileId) {
            fileId = window.fileId;
            // If it starts with file-view-, remove that prefix
            if (typeof fileId === 'string' && fileId.startsWith('file-view-')) {
              fileId = fileId.replace('file-view-', '');
            }
          }
          
          // Try to get content from existing data
          try {
            // First check window.fileContent
            if (window.fileContent !== undefined) {
              initialContent = String(window.fileContent || '');
            } 
            // Otherwise try to find the file in the file system
            else if (fileId) {
              const result = findItem(fileId, fileSystem.root);
              
              if (result && result.item) {
                // Get file name and content
                fileName = result.item.name || "Untitled";
                initialContent = String(result.item.content || '');
              } else {
                console.error(`File not found in system: ${fileId}`);
              }
            }
          } catch (error) {
            console.error("Error loading file content:", error);
            initialContent = '';
          }
          
          // State for the editor
          const [content, setContent] = useState(initialContent);
          
          // Handle saving the file
          const handleSave = () => {
            try {
              if (fileId) {
                // Find the file and update its content
                setFileSystem(prev => {
                  const updatedSystem = {...prev};
                  const result = findItem(fileId, updatedSystem.root);
                  
                  if (result && result.item) {
                    result.item.content = content;
                    showNotification(`Saved ${result.item.name}`, 'success');
                    return updatedSystem;
                  } else {
                    showNotification('Error: File not found', 'error');
                    return prev;
                  }
                });
              } else {
                // Create a new file 
                const newFileId = `file-${Date.now()}`;
                const newFileName = 'Untitled.txt';
                
                const newFile = {
                  id: newFileId,
                  name: newFileName,
                  type: 'file',
                  icon: 'file-alt',
                  content: content,
                  parent: 'root'
                };
                
                // Add the file to the file system
                setFileSystem(prev => {
                  const updatedSystem = {...prev};
                  updatedSystem.root.children = [...(updatedSystem.root.children || []), newFile];
                  return updatedSystem;
                });
                
                // Update window to point to the new file
                setWindows(prevWindows => prevWindows.map(w => {
                  if (w.id === window.id) {
                    return {
                      ...w,
                      fileId: newFileId,
                      title: newFileName,
                    };
                  }
                  return w;
                }));
                
                // Update local fileId
                fileId = newFileId;
                
                showNotification('New file created and saved', 'success');
              }
            } catch (error) {
              console.error("Error saving file:", error);
              showNotification(`Error: ${error.message || 'Failed to save file'}`, 'error');
            }
          };
          
          return (
            <div className="notepad-container">
              <div className="notepad-toolbar">
                <button 
                  onClick={handleSave}
                  className="notepad-save-btn"
                >
                  <i className="fas fa-save"></i> Save
                </button>
              </div>
              <textarea
                className="notepad-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type here..."
                spellCheck="false"
                autoFocus
              />
            </div>
          );
        };
        
        // Return the notepad component
        try {
          return <NotepadEditor />;
        } catch (error) {
          console.error("Failed to render notepad:", error);
          return (
            <div className="window-content">
              <div className="default-window-content error-content">
                <i className="fas fa-exclamation-triangle"></i>
                <p>Error loading the text editor</p>
                <p className="error-details">{error.message}</p>
                <button onClick={() => closeWindow(window.id)}>Close Window</button>
              </div>
            </div>
          );
        }
      }
      
      // Default content (fallback)
      return (
        <div className="window-content">
          <div className="default-window-content">
            <i className="fas fa-exclamation-circle"></i>
            <p>Content cannot be displayed.</p>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering window:', error);
      return (
        <div className="window-content">
          <div className="default-window-content error-content">
            <i className="fas fa-exclamation-triangle"></i>
            <p>An error occurred while displaying this window.</p>
            <button onClick={() => closeWindow(window.id)}>Close Window</button>
          </div>
        </div>
      );
    }
  };

  // Keyboard shortcut for fullscreen toggle (F11) and exit (ESC)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11' && activeWindow) {
        e.preventDefault(); // Prevent browser's default fullscreen
        toggleFullscreen(activeWindow);
      } else if (e.key === 'Escape' && fullscreenWindow) {
        e.preventDefault(); // Prevent other default actions
        // Exit fullscreen on Escape key
        toggleFullscreen(fullscreenWindow);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeWindow, fullscreenWindow]);

  // Fix the quick links to properly navigate
  const handleQuickLink = (url) => {
    // Prepare full URL with https:// if needed
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Update browser state with the URL
    setBrowserState(prev => {
      // Create new history entry
      const newHistory = prev.history.slice(0, prev.currentIndex + 1);
      newHistory.push(fullUrl);
      
      return {
        ...prev,
        url: fullUrl,
        inputUrl: url, // Keep the display version simple
        history: newHistory,
        currentIndex: newHistory.length - 1,
        isLoading: true
      };
    });
  };

  // Add keydown event listener for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+L to lock screen
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        onLock();
      }
      
      // Handle existing keyboard shortcuts
      if (e.key === 'Escape') {
        // Close context menu if open
        setContextMenu(prev => ({ ...prev, visible: false }));
        
        // Cancel rename if active
        if (renamingItem) {
          handleRenameCancel();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onLock, renamingItem]);

  // Add notification on component mount
  useEffect(() => {
    // Show keyboard shortcut notification after a short delay
    const timer = setTimeout(() => {
      showNotification('Press Ctrl+L to lock the screen', 'info');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Add power menu state
  const [powerMenuVisible, setPowerMenuVisible] = useState(false);
  const powerMenuRef = useRef(null);

  // Close power menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (powerMenuRef.current && !powerMenuRef.current.contains(event.target)) {
        setPowerMenuVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle power menu
  const togglePowerMenu = () => {
    setPowerMenuVisible(prev => !prev);
  };

  return (
    <div 
      className="desktop" 
      style={{ backgroundImage: `url(${wallpaper})` }}
      onContextMenu={(e) => handleContextMenu(e, 'root')}
      onClick={handleClick}
    >
      {/* Desktop icons */}
      <div className="desktop-icons">
        {icons.map((icon) => (
          <div
            key={icon.id}
            className={`desktop-icon ${renamingItem === icon.id ? 'renaming' : ''}`}
            onDoubleClick={() => handleIconDoubleClick(icon)}
            onContextMenu={(e) => handleContextMenu(e, icon.id)}
          >
            <i className={`fas fa-${icon.icon} icon-image`}></i>
            {renamingItem === icon.id ? (
              <input
                ref={renameInputRef}
                type="text"
                defaultValue={icon.name}
                className="rename-input"
                onBlur={() => handleRenameCancel()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSave(icon.id, e.target.value);
                  } else if (e.key === 'Escape') {
                    handleRenameCancel();
                  }
                }}
              />
            ) : (
              <div className="icon-label">{icon.name}</div>
            )}
          </div>
        ))}
      </div>
      
      {/* Windows */}
      {windows.map((window) => (
        <div
          key={window.id}
          className={`window ${activeWindow === window.id ? 'active' : ''} ${window.minimized ? 'minimized' : ''} ${fullscreenWindow === window.id ? 'fullscreen' : ''}`}
          style={{
            left: window.position.x,
            top: window.position.y,
            width: fullscreenWindow === window.id ? '100%' : window.size.width,
            height: fullscreenWindow === window.id ? '100%' : window.size.height,
            zIndex: activeWindow === window.id ? 100 : window.zIndex
          }}
          onMouseDown={() => setActiveWindow(window.id)}
        >
          <div 
            className="window-titlebar"
            onMouseDown={(e) => handleWindowDragStart(e, window.id)}
          >
            <div className="window-titlebar-left">
              <i className={`fas fa-${window.icon}`}></i>
              <span>{window.title}</span>
            </div>
            <div className="window-controls">
              <button className="window-control minimize" onClick={(e) => minimizeWindow(window.id, e)}>
                <i className="fas fa-minus"></i>
              </button>
              <button className="window-control maximize" onClick={(e) => toggleFullscreen(window.id, e)}>
                <i className={`fas fa-${fullscreenWindow === window.id ? 'compress' : 'expand'}`}></i>
              </button>
              <button className="window-control close" onClick={(e) => closeWindow(window.id, e)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div className="window-content">
            {renderWindow(window)}
          </div>
        </div>
      ))}
      
      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.targetItem?.type === 'file' || (contextMenu.targetItem?.type === 'folder' && contextMenu.targetItem?.id !== 'root') ? (
            <>
              <div className="context-menu-item" onClick={renameItem}>
                <i className="fas fa-edit"></i> Rename
              </div>
              <div className="context-menu-item" onClick={copyItem}>
                <i className="fas fa-copy"></i> Copy
              </div>
              <div className="context-menu-item" onClick={cutItem}>
                <i className="fas fa-cut"></i> Cut
              </div>
              <div className="context-menu-item" onClick={deleteItem}>
                <i className="fas fa-trash"></i> Delete
              </div>
              <div className="context-menu-divider"></div>
            </>
          ) : null}
          
          {contextMenu.targetId === 'root' || contextMenu.isInFolderView ? (
            <>
              <div className="context-menu-item" onClick={createNewFolder}>
                <i className="fas fa-folder-plus"></i> New Folder
              </div>
              <div className="context-menu-item" onClick={createNewFile}>
                <i className="fas fa-file"></i> New File
              </div>
              {clipboard && (
                <div className="context-menu-item" onClick={pasteItem}>
                  <i className="fas fa-paste"></i> Paste
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
      
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <div className="notification-content">
            <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            <span>{notification.message}</span>
          </div>
        </div>
      )}
      
      {/* Power Menu */}
      {powerMenuVisible && (
        <div className="power-menu" ref={powerMenuRef}>
          <div className="power-menu-item" onClick={onLock}>
            <i className="fas fa-lock"></i>
            <span>Lock Screen</span>
            <span className="shortcut">Ctrl+L</span>
          </div>
          <div className="power-menu-item" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Log Out</span>
          </div>
        </div>
      )}
      
      {/* Taskbar */}
      <Taskbar
        openWindows={windows}
        activeWindow={activeWindow}
        onWindowClick={(id) => {
          const window = windows.find(w => w.id === id);
          if (window && window.minimized) {
            restoreWindow(id);
          } else {
            setActiveWindow(id);
          }
        }}
        username={username}
        onLogout={onLogout}
        onLock={onLock}
        onTogglePowerMenu={togglePowerMenu}
        powerMenuVisible={powerMenuVisible}
      />
    </div>
  );
}

export default Desktop; 
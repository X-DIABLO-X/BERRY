import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import Taskbar from '../Taskbar/Taskbar';
import './Desktop.css';
import Terminal from '../Terminal/Terminal';
import Settings from '../Settings/Settings';
import Chatbot from '../Chatbot/Chatbot';

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
  
  // Add state for chatbot
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  
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

  // Function to convert the file system to the user-requested format for storage
  const convertToStorageFormat = (fileSystem) => {
    // Create a function to recursively convert items
    const convertItem = (item) => {
      // Fix any missing or non-string IDs
      const id = item.id || `${item.type}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      
      if (item.type === 'folder') {
        // For folders, create an array of child items
        const children = Array.isArray(item.children) ? item.children.map(convertItem) : [];
        return {
          type: 'folder',
          name: item.name,
          id: id,
          data: children,
          createdAt: item.createdAt || new Date().toISOString(),
          modifiedAt: item.modifiedAt || new Date().toISOString()
        };
      } else {
        // For files, store the content directly
        return {
          type: 'file',
          name: item.name,
          id: id,
          data: item.content || '',
          createdAt: item.createdAt || new Date().toISOString(),
          modifiedAt: item.modifiedAt || new Date().toISOString()
        };
      }
    };
    
    // Start with the root folder
    return {
      root: {
        type: 'folder',
        name: 'Root',
        id: 'root',
        data: Array.isArray(fileSystem.root.children) ? fileSystem.root.children.map(convertItem) : []
      }
    };
  };
  
  // Function to convert from storage format back to the application format
  const convertFromStorageFormat = (storageFormat) => {
    // Set to track used IDs to ensure uniqueness
    const usedIds = new Set();
    
    // Create a function to recursively convert items
    const convertItem = (item, parentId) => {
      // Ensure ID is unique by adding a random suffix if needed
      let id = String(item.id || '');
      if (!id || usedIds.has(id)) {
        id = `${item.type}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      }
      usedIds.add(id);
      
      if (item.type === 'folder') {
        // For folders, recursively convert children
        const children = Array.isArray(item.data) 
          ? item.data.map(child => convertItem(child, id)) 
          : [];
        
        return {
          id: id,
          name: item.name,
          type: 'folder',
          icon: 'folder',
          parent: parentId,
          children: children,
          createdAt: item.createdAt || new Date().toISOString(),
          modifiedAt: item.modifiedAt || new Date().toISOString()
        };
      } else {
        // For files, extract content
        return {
          id: id,
          name: item.name,
          type: 'file',
          icon: 'file-alt',
          parent: parentId,
          content: item.data || '',
          createdAt: item.createdAt || new Date().toISOString(),
          modifiedAt: item.modifiedAt || new Date().toISOString()
        };
      }
    };
    
    // Handle root separately
    const root = storageFormat.root;
    return {
      root: {
        id: 'root',
        name: 'Root',
        type: 'folder',
        children: Array.isArray(root.data) 
          ? root.data.map(item => convertItem(item, 'root')) 
          : []
      }
    };
  };

  // Improved function to forcefully save file system to localStorage
  const forceSaveFileSystem = () => {
    if (!fileSystem || !fileSystem.root) {
      console.error('Cannot save file system: invalid file system object');
      return false;
    }
    
    try {
      // Convert to storage format
      const storageFormat = convertToStorageFormat(fileSystem);
      
      // Double check that the data we're about to save is valid
      if (!storageFormat || !storageFormat.root || !storageFormat.root.data) {
        console.error('Invalid storage format generated');
        return false;
      }
      
      // Save to localStorage with a clearly defined key
      const storageKey = `berry-file-system-${username}`;
      const dataToSave = JSON.stringify(storageFormat);
      localStorage.setItem(storageKey, dataToSave);
      
      // Log the size of the data for debugging
      console.log(`File system saved (${Math.round(dataToSave.length / 1024)} KB)`);
      
      // Verify the save was successful by reading it back
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) {
        console.error('Verification failed: could not read back saved data');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error forcefully saving file system:', error);
      return false;
    }
  };

  // Save file system to localStorage with the new format
  const saveFileSystemToStorage = () => {
    return forceSaveFileSystem();
  };

  // Enhanced function to load file system from localStorage
  const loadFileSystemFromStorage = () => {
    try {
      const storageKey = `berry-file-system-${username}`;
      const savedData = localStorage.getItem(storageKey);
      
      if (!savedData) {
        console.log('No saved file system found');
        return null;
      }
      
      console.log(`Loading saved file system (${Math.round(savedData.length / 1024)} KB)`);
      
      const storageFormat = JSON.parse(savedData);
      
      // Validate the data before converting
      if (!storageFormat || !storageFormat.root) {
        console.error('Invalid file system data in localStorage');
        return null;
      }
      
      // Check if this is the new format
      if (typeof storageFormat.root.data !== 'undefined') {
        // This is the new format
        const appFormat = convertFromStorageFormat(storageFormat);
        return appFormat;
      } else {
        // This is the old format, convert it
        console.log('Converting legacy format to new format');
        const convertedFormat = convertToStorageFormat(storageFormat);
        const appFormat = convertFromStorageFormat(convertedFormat);
        
        // Save back in the new format
        localStorage.setItem(storageKey, JSON.stringify(convertedFormat));
        
        return appFormat;
      }
    } catch (error) {
      console.error('Error loading file system from localStorage:', error);
      // Create a backup of corrupt data for debugging
      const savedData = localStorage.getItem(`berry-file-system-${username}`);
      if (savedData) {
        localStorage.setItem(`berry-file-system-backup-${Date.now()}`, savedData);
      }
      return null;
    }
  };

  // Update effect to more reliably load file system on mount
  useEffect(() => {
    const loadedFileSystem = loadFileSystemFromStorage();
    if (loadedFileSystem) {
      console.log('Successfully loaded file system from localStorage');
      setFileSystem(loadedFileSystem);
    } else {
      console.log('Using default file system');
    }
  }, [username]);

  // Strengthen the save mechanism by saving more frequently
  useEffect(() => {
    if (fileSystem && fileSystem.root) {
      // Debounce the save to avoid excessive writes
      const timeoutId = setTimeout(() => {
        saveFileSystemToStorage();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [fileSystem, username]);

  // Enhanced window events to ensure data is saved
  useEffect(() => {
    // Force save on page unload/refresh
    const handleBeforeUnload = (e) => {
      console.log('Page unloading - saving file system data');
      forceSaveFileSystem();
    };

    // Handle visibility change (user switching tabs/minimizing)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('Page hidden - saving file system data');
        forceSaveFileSystem();
      }
    };
    
    // Handle lock or logout events
    const handleLockOrLogout = () => {
      console.log('Lock/logout event - saving file system data');
      forceSaveFileSystem();
    };
    
    // Register all the event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('berryos-lock', handleLockOrLogout);
    window.addEventListener('berryos-logout', handleLockOrLogout);
    
    // Also save immediately when this effect runs
    setTimeout(() => {
      forceSaveFileSystem();
    }, 1000);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('berryos-lock', handleLockOrLogout);
      window.removeEventListener('berryos-logout', handleLockOrLogout);
    };
  }, [fileSystem, username]);

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
    isInFolderView: false,
    isProcessing: false // Flag to track if we're processing a context menu event
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
    
    // Create new window with isLoading state
    const newWindow = {
      id: appId,
      title: app.name,
      icon: app.icon,
      minimized: false,
      isRestoring: true, // Start with loading state
      position: { 
        x: Math.max(50, Math.min(window.innerWidth - windowSize.width - 50, 100 + offset)),
        y: Math.max(50, Math.min(window.innerHeight - windowSize.height - 50, 100 + offset))
      },
      size: windowSize,
      content: app.type === 'app' ? appId : (app.type === 'file' ? 'notepad' : 'folder'),
      fileContent: app.content,
      zIndex: windows.length + 10
    };
    
    // Add the window immediately
    setWindows([...windows, newWindow]);
    setActiveWindow(appId);
    
    // Give time for the window contents to render before removing loading state
    setTimeout(() => {
      setWindows(prevWindows => 
        prevWindows.map(win => {
          if (win.id === appId) {
            return { ...win, isRestoring: false };
          }
          return win;
        })
      );
    }, 500);
  };
  
  // Function to check if the proxy server is running
  const checkProxyServer = () => {
    fetch('https://berry-3gan.onrender.com/status')
      .then(response => {
        if (response.ok) {
          // Server is running
          console.log("Proxy server is running");
        }
      })
      .catch(error => {
        console.error("Proxy server not running:", error);
        showNotification("Deployed browser proxy server is currently unavailable. Some features will be limited.", "error");
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
    
    // Get taskbar position for animation direction
    const taskbarButton = document.querySelector(`.taskbar-button[title="${windows.find(w => w.id === id)?.title}"]`);
    const windowEl = document.querySelector(`.window[data-id="${id}"]`);
    
    if (windowEl && taskbarButton) {
      // Temporarily change transition to customize animation
      windowEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease, visibility 0s linear 0.3s';
      
      // Get taskbar position
      const taskbarRect = taskbarButton.getBoundingClientRect();
      const windowRect = windowEl.getBoundingClientRect();
      
      // Calculate direction towards taskbar
      const translateX = taskbarRect.left - windowRect.left + (taskbarRect.width / 2 - windowRect.width / 2);
      const translateY = taskbarRect.top - windowRect.top + (taskbarRect.height / 2 - windowRect.height / 2);
      
      // Apply custom transform
      windowEl.style.transform = `scale(0.1) translate(${translateX}px, ${translateY}px)`;
      windowEl.style.opacity = '0';
    }
    
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
    // Generate a unique key to force re-render
    const renderKey = Date.now();
    
    // First mark the window as restoring in state
    setWindows(windows.map(win => {
      if (win.id === id) {
        return { 
          ...win, 
          minimized: false, 
          isRestoring: true,
          renderKey // Add a unique key to force re-render
        };
      }
      return win;
    }));
    
    // Set as active window immediately
    setActiveWindow(id);
    
    // Find the window element in the DOM
    const windowEl = document.querySelector(`.window[data-id="${id}"]`);
    if (windowEl) {
      // Add restoring class for animation
      windowEl.classList.add('restoring');
      
      // Ensure content has time to fully render before completing animation
      setTimeout(() => {
        // Complete restoration by removing loading state
        setWindows(prevWindows => prevWindows.map(win => {
          if (win.id === id) {
            return { ...win, isRestoring: false };
          }
          return win;
        }));
        
        // Remove animation class after animation completes
        if (windowEl) {
          windowEl.classList.remove('restoring');
        }
      }, 400); // Extended animation duration
    }
  };
  
  // Improved window drag functionality
  const handleWindowDragStart = (e, id) => {
    if (e.target.closest('.window-controls')) return;
    
    // Prevent dragging in fullscreen mode
    if (fullscreenWindow === id) return;
    
    const windowEl = e.currentTarget.closest('.window');
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
    
    // Find the window being dragged
    const windowEl = document.querySelector(`.window[data-id="${draggedWindow.current}"]`);
    if (!windowEl) return;
    
    // Calculate new position directly from mouse position
    const newX = Math.max(0, e.clientX - dragStartPos.current.x);
    const newY = Math.max(0, e.clientY - dragStartPos.current.y);
    
    // Update window position immediately in the DOM for smoother dragging
    windowEl.style.left = `${newX}px`;
    windowEl.style.top = `${newY}px`;
  };
  
  // Update state when drag ends
  const handleWindowDragEnd = (e) => {
    if (!draggedWindow.current) return;
    
    // Get current position from DOM and update state
    const windowEl = document.querySelector(`.window[data-id="${draggedWindow.current}"]`);
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
    
    // Normalize ID to string for reliable comparison
    const itemId = String(id);
    
    // Add logging to debug item finding
    console.log(`Looking for item with ID: ${itemId}`);
    
    // Check if this item is a folder-view or file-view ID
    let actualId = itemId;
    if (itemId.startsWith('file-view-')) {
      actualId = itemId.replace('file-view-', '');
    } else if (itemId.startsWith('folder-view-')) {
      actualId = itemId.replace('folder-view-', '');
    }
    
    // Special case for standard folders at root level
    if (['documents', 'pictures', 'downloads'].includes(actualId)) {
      const specialFolder = folder.children.find(child => child.id === actualId);
      if (specialFolder) {
        console.log(`Found special folder: ${specialFolder.name}`);
        return { item: specialFolder, parent: folder };
      }
    }
    
    // Check direct children first - more efficient
    for (const child of folder.children || []) {
      if (String(child.id) === actualId) {
        console.log(`Found item directly: ${child.name}`);
        return { item: child, parent: folder };
      }
    }
    
    // Now search special folders if not found in root direct children
    if (folder === fileSystem.root) {
      // Search in documents folder
      const documents = folder.children.find(child => child.id === 'documents');
      if (documents && documents.children) {
        for (const child of documents.children) {
          if (String(child.id) === actualId) {
            console.log(`Found item in Documents: ${child.name}`);
            return { item: child, parent: documents };
          }
        }
      }
      
      // Search in pictures folder
      const pictures = folder.children.find(child => child.id === 'pictures');
      if (pictures && pictures.children) {
        for (const child of pictures.children) {
          if (String(child.id) === actualId) {
            console.log(`Found item in Pictures: ${child.name}`);
            return { item: child, parent: pictures };
          }
        }
      }
      
      // Search in downloads folder
      const downloads = folder.children.find(child => child.id === 'downloads');
      if (downloads && downloads.children) {
        for (const child of downloads.children) {
          if (String(child.id) === actualId) {
            console.log(`Found item in Downloads: ${child.name}`);
            return { item: child, parent: downloads };
          }
        }
      }
    }
    
    // Use a breadth-first search approach for better performance
    const queue = [...(folder.children || [])];
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      // If this is a folder, add its children to the queue
      if (current.type === 'folder' && Array.isArray(current.children)) {
        // Check this folder's direct children first
        for (const child of current.children) {
          if (String(child.id) === actualId) {
            console.log(`Found item in folder ${current.name}: ${child.name}`);
            return { item: child, parent: current };
          }
          
          // Add folder children to the queue for next iteration
          if (child.type === 'folder') {
            queue.push(child);
          }
        }
      }
    }
    
    console.log(`Item with ID ${actualId} not found`);
    return null;
  };
  
  // Function to handle right-click context menu
  const handleContextMenu = (e, targetId = 'root') => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Check if we're already processing a context menu event
    if (contextMenu.isProcessing) return;
    
    console.log("Right click on:", targetId); // Debug
    
    // Set a processing flag to prevent duplicate events
    setContextMenu(prev => ({...prev, visible: false, isProcessing: true}));
    
    // Get the item that was right-clicked
    const result = findItem(targetId, fileSystem.root);
    console.log("Found item:", result); // Debug
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetId,
      targetItem: result?.item,
      isInFolderView: false,
      isProcessing: false
    });
  };
  
  // Function to handle right-click in a folder window
  const handleFolderContextMenu = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to desktop
    
    // Check if we're already processing a context menu event
    if (contextMenu.isProcessing) return;
    
    console.log("Right click in folder:", folderId); // Debug
    
    // Set a processing flag to prevent duplicate events
    setContextMenu(prev => ({...prev, visible: false, isProcessing: true}));
    
    // Short delay to prevent multiple context menus
    setTimeout(() => {
      const result = findItem(folderId, fileSystem.root);
      
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        targetId: folderId,
        targetItem: result?.item,
        isInFolderView: true,
        isProcessing: false
      });
    }, 50);
  };
  
  // Function to close context menu when clicking elsewhere
  const handleClick = () => {
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };
  
  // Function to create a new folder in the current context
  const createNewFolder = () => {
    // Prevent multiple calls in rapid succession
    if (renamingItem) return;
    
    // Create a truly unique ID with both timestamp and random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const newFolderId = `folder-${timestamp}-${randomStr}`;
    let parentId = contextMenu.targetId;
    
    // If we're in a folder view and right-clicked in empty space, use the folder's ID
    if (contextMenu.isInFolderView) {
      parentId = contextMenu.targetId;
    }
    
    console.log(`Creating new folder with ID ${newFolderId} in parent ${parentId}`);
    
    // Check if we're trying to create on desktop vs in a folder
    const isDesktop = parentId === 'root';
    const targetLocation = isDesktop ? 'desktop' : 'file manager';
    
    // Create the new folder object
    const newFolder = {
      id: newFolderId,
      name: `New Folder`,
      icon: 'folder',
      type: 'folder',
      parent: parentId,
      children: [],
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
    
    // Close context menu immediately to prevent double-clicks
    setContextMenu(prev => ({ ...prev, visible: false }));
    
    // Update fileSystem by adding new folder to target parent
    setFileSystem(prev => {
      const updatedSystem = JSON.parse(JSON.stringify(prev));
      
      // If target is root, add to root children
      if (parentId === 'root') {
        updatedSystem.root.children = [...updatedSystem.root.children, newFolder];
      } 
      // Handle special folders (documents, pictures, downloads)
      else if (['documents', 'pictures', 'downloads'].includes(parentId)) {
        const specialFolder = updatedSystem.root.children.find(child => child.id === parentId);
        if (specialFolder) {
          specialFolder.children = [...(specialFolder.children || []), newFolder];
        }
      }
      else {
        // Find the target folder and add the new folder to its children
        const result = findItem(parentId, updatedSystem.root);
        if (result && result.item.type === 'folder') {
          result.item.children = [...(result.item.children || []), newFolder];
        }
      }
      
      return updatedSystem;
    });
    
    // Force save the changes
    setTimeout(() => {
      forceSaveFileSystem();
    }, 0);
    
    // Set the new folder to be renamed immediately
    setRenamingItem(newFolderId);
    
    // Show notification about where the folder was created
    showNotification(`Folder created on ${targetLocation}`, 'success');
  };
  
  // Function to create a new file in the current context
  const createNewFile = () => {
    // Prevent multiple calls in rapid succession
    if (renamingItem) return;
    
    // Create a truly unique ID with both timestamp and random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const newFileId = `file-${timestamp}-${randomStr}`;
    let parentId = contextMenu.targetId;
    
    // If we're in a folder view and right-clicked in empty space, use the folder's ID
    if (contextMenu.isInFolderView) {
      parentId = contextMenu.targetId;
    }
    
    console.log(`Creating new file with ID ${newFileId} in parent ${parentId}`);
    
    // Check if we're trying to create on desktop vs in a folder
    const isDesktop = parentId === 'root';
    const targetLocation = isDesktop ? 'desktop' : 'file manager';
    
    // Create the new file object
    const newFile = {
      id: newFileId,
      name: `New File.txt`,
      icon: 'file-alt',
      type: 'file',
      parent: parentId,
      content: '',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
    
    // Close context menu immediately to prevent double-clicks
    setContextMenu(prev => ({ ...prev, visible: false }));
    
    // Update fileSystem by adding new file to target parent
    setFileSystem(prev => {
      const updatedSystem = JSON.parse(JSON.stringify(prev));
      
      // If target is root, add to root children
      if (parentId === 'root') {
        updatedSystem.root.children = [...updatedSystem.root.children, newFile];
      }
      // Handle special folders (documents, pictures, downloads)
      else if (['documents', 'pictures', 'downloads'].includes(parentId)) {
        const specialFolder = updatedSystem.root.children.find(child => child.id === parentId);
        if (specialFolder) {
          specialFolder.children = [...(specialFolder.children || []), newFile];
        }
      }
      else {
        // Find the target folder and add the new file to its children
        const result = findItem(parentId, updatedSystem.root);
        if (result && result.item.type === 'folder') {
          result.item.children = [...(result.item.children || []), newFile];
        }
      }
      
      return updatedSystem;
    });
    
    // Force save the changes
    setTimeout(() => {
      forceSaveFileSystem();
    }, 0);
    
    // Set the new file to be renamed immediately
    setRenamingItem(newFileId);
    
    // Show notification about where the file was created
    showNotification(`File created on ${targetLocation}`, 'success');
  };

  // Fix the saveFile function to handle file IDs correctly
  const saveFile = (fileId, newContent) => {
    console.log("Saving file with ID:", fileId);
    
    // Handle null/undefined content
    if (newContent === undefined || newContent === null) {
      newContent = '';
    }
    
    // Extract the actual file ID from a file-view- format
    let actualFileId = fileId;
    if (typeof fileId === 'string' && fileId.startsWith('file-view-')) {
      actualFileId = fileId.replace('file-view-', '');
    }
    
    // Find the file and update its content
    setFileSystem(prev => {
      // Deep clone to prevent issues with shared references
      const updatedSystem = JSON.parse(JSON.stringify(prev));
      
      console.log("Looking for file with ID:", actualFileId);
      const result = findItem(actualFileId, updatedSystem.root);
      
      if (result && result.item) {
        console.log("File found, updating content");
        result.item.content = newContent;
        result.item.modifiedAt = new Date().toISOString(); // Update modified timestamp
        
        // Save immediately to localStorage to ensure persistence
        try {
          // Use our improved forced save method for better reliability
          setTimeout(() => {
            forceSaveFileSystem();
          }, 0);
          console.log('Scheduled forceful save after file update');
        } catch (error) {
          console.error('Error scheduling file system save:', error);
        }
        
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
      const updatedSystem = JSON.parse(JSON.stringify(prev));
      
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
    
    // Schedule a force save
    setTimeout(() => {
      forceSaveFileSystem();
    }, 0);
    
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
    const randomStr = Math.random().toString(36).substring(2, 8);
    const newId = `${clipboard.item.type}-${timestamp}-${randomStr}`;
    
    // Create a copy of the item
    const newItem = {
      ...clipboard.item,
      id: newId,
      parent: targetFolderId,
      name: clipboard.action === 'copy' ? `Copy of ${clipboard.item.name}` : clipboard.item.name
    };
    
    // Update file system
    setFileSystem(prev => {
      const updatedSystem = JSON.parse(JSON.stringify(prev));
      
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
    
    // Schedule a force save
    setTimeout(() => {
      forceSaveFileSystem();
    }, 0);
    
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
    
    // Handle special folders directly
    if (['documents', 'pictures', 'downloads'].includes(folderId)) {
      // Find the folder from root children
      const folder = fileSystem.root.children.find(item => item.id === folderId);
      if (folder) {
        return folder.children || [];
      }
      return [];
    }
    
    const result = findItem(folderId, fileSystem.root);
    if (result && result.item.type === 'folder') {
      return result.item.children || [];
    }
    
    return [];
  };
  
  // Initialize file explorer window with navigation state
  const initializeFileExplorerWindow = (windowId, initialLocation = 'root') => {
    console.log(`Initializing explorer window ${windowId} at location ${initialLocation}`);
    
    // Check if this window exists and initialize its file history
    if (windowId && !fileHistory[windowId]) {
      setFileHistory(prev => ({
        ...prev,
        [windowId]: {
          history: [initialLocation],
          currentIndex: 0
        }
      }));
      
      // Ensure the window contents are properly loaded
      setTimeout(() => {
        // Find the window element
        const windowEl = document.querySelector(`.window[data-id="${windowId}"]`);
        if (windowEl) {
          // Force a redraw if needed
          windowEl.style.display = 'none';
          // This forces a reflow/repaint
          void windowEl.offsetHeight;
          windowEl.style.display = 'flex';
        }
      }, 100);
    }
  };
  
  // Get current folder ID for a file explorer window
  const getCurrentFolder = (windowId) => {
    if (!fileHistory[windowId]) return 'root';
    const { history, currentIndex } = fileHistory[windowId];
    return history[currentIndex];
  };
  
  // Navigate to a folder within the same file explorer window
  const navigateToFolder = (windowId, folderId) => {
    console.log(`Navigation request: window=${windowId}, folder=${folderId}`);
    
    // Make sure the window has file history initialized
    if (!fileHistory[windowId]) {
      console.log(`Initializing file history for window ${windowId} with folder ${folderId}`);
      initializeFileExplorerWindow(windowId, folderId);
      return;
    }
    
    // Validate that the folder exists
    const folderResult = findItem(folderId, fileSystem.root);
    if (!folderResult || folderResult.item.type !== 'folder') {
      console.error(`Cannot navigate to ${folderId}: folder not found or not a folder`);
      showNotification('Error: Folder not found', 'error');
      return;
    }
    
    console.log(`Navigating to valid folder: ${folderResult.item.name}`);
    
    // Update navigation history
    setFileHistory(prev => {
      const { history, currentIndex } = prev[windowId];
      
      // If navigating from a point in history, truncate forward history
      const newHistory = history.slice(0, currentIndex + 1);
      newHistory.push(folderId);
      
      console.log(`Updated navigation history:`, {
        windowId,
        oldHistory: history,
        newHistory,
        oldIndex: currentIndex,
        newIndex: newHistory.length - 1
      });
      
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
    
    // Handle special folders - they all go back to root
    if (['documents', 'pictures', 'downloads'].includes(currentFolderId)) {
      navigateToFolder(windowId, 'root');
      return;
    }
    
    const result = findItem(currentFolderId, fileSystem.root);
    if (result && result.parent) {
      navigateToFolder(windowId, result.parent.id);
    }
  };
  
  // Get path name for current location
  const getPathName = (folderId) => {
    if (folderId === 'root') return '/Home';
    
    // Handle special folders
    if (folderId === 'documents') return '/Documents';
    if (folderId === 'pictures') return '/Pictures';
    if (folderId === 'downloads') return '/Downloads';
    
    const result = findItem(folderId, fileSystem.root);
    if (!result) return '/Unknown';
    
    return '/' + result.item.name;
  };
  
  // Handle double-clicking on an icon
  const handleIconDoubleClick = (icon) => {
    if (!icon) return;
    
    console.log("Double-clicked on icon:", icon);
    
    // Ensure the icon has an id
    if (!icon.id) {
      console.error("Icon is missing an ID:", icon);
      return;
    }
    
    // If it's an app
    if (icon.type === 'app') {
      openWindow(icon.id);
      return;
    }
    
    // Handle the special folders (documents, pictures, downloads)
    if (['documents', 'pictures', 'downloads'].includes(icon.id)) {
      const folderId = icon.id;
      
      // Open folder in file explorer
      const folderWindow = {
        id: `folder-view-${folderId}`,
        title: icon.name,
        icon: icon.icon || 'folder',
        content: 'folder',
        folderId: folderId,
        size: { width: 800, height: 500 }
      };
      
      // Check if window already exists
      const existingWindow = windows.find(w => w.id === folderWindow.id);
      if (existingWindow) {
        if (existingWindow.minimized) {
          restoreWindow(folderWindow.id);
        } else {
          setActiveWindow(folderWindow.id);
        }
        return;
      }
      
      // Position new window with offset
      const offset = windows.length * 25;
      folderWindow.position = { 
        x: Math.max(50, Math.min(window.innerWidth - folderWindow.size.width - 50, 100 + offset)),
        y: Math.max(50, Math.min(window.innerHeight - folderWindow.size.height - 50, 100 + offset))
      };
      
      // Set zIndex for new window
      folderWindow.zIndex = windows.length + 10;
      folderWindow.minimized = false;
      
      // Add to windows and set active
      setWindows([...windows, folderWindow]);
      setActiveWindow(folderWindow.id);
      
      // Initialize file explorer with this folder's ID
      initializeFileExplorerWindow(folderWindow.id, folderId);
      return;
    }
    
    // If it's a file or folder
    if (icon.type === 'file') {
      // Open file in notepad
      const fileWindow = {
        id: `file-view-${icon.id}`,
        title: icon.name,
        icon: icon.icon || 'file-alt',
        content: 'notepad',
        fileId: icon.id,
        fileContent: icon.content,
        size: { width: 600, height: 400 }
      };
      
      // Check if window already exists
      const existingWindow = windows.find(w => w.id === fileWindow.id);
      if (existingWindow) {
        if (existingWindow.minimized) {
          restoreWindow(fileWindow.id);
        } else {
          setActiveWindow(fileWindow.id);
        }
        return;
      }
      
      // Position new window with offset
      const offset = windows.length * 25;
      fileWindow.position = { 
        x: Math.max(50, Math.min(window.innerWidth - fileWindow.size.width - 50, 100 + offset)),
        y: Math.max(50, Math.min(window.innerHeight - fileWindow.size.height - 50, 100 + offset))
      };
      
      // Set zIndex for new window
      fileWindow.zIndex = windows.length + 10;
      fileWindow.minimized = false;
      
      // Add to windows and set active
      setWindows([...windows, fileWindow]);
      setActiveWindow(fileWindow.id);
      
    } else if (icon.type === 'folder') {
      // Open folder in file explorer
      const folderWindow = {
        id: `folder-view-${icon.id}`,
        title: icon.name,
        icon: icon.icon || 'folder',
        content: 'folder',
        folderId: icon.id,
        size: { width: 800, height: 500 }
      };
      
      // Check if window already exists
      const existingWindow = windows.find(w => w.id === folderWindow.id);
      if (existingWindow) {
        if (existingWindow.minimized) {
          restoreWindow(folderWindow.id);
        } else {
          setActiveWindow(folderWindow.id);
        }
        return;
      }
      
      // Position new window with offset
      const offset = windows.length * 25;
      folderWindow.position = { 
        x: Math.max(50, Math.min(window.innerWidth - folderWindow.size.width - 50, 100 + offset)),
        y: Math.max(50, Math.min(window.innerHeight - folderWindow.size.height - 50, 100 + offset))
      };
      
      // Set zIndex for new window
      folderWindow.zIndex = windows.length + 10;
      folderWindow.minimized = false;
      
      // Add to windows and set active
      setWindows(prev => [...prev, folderWindow]);
      setActiveWindow(folderWindow.id);
      
      // Initialize file explorer with this folder's ID
      setTimeout(() => {
        console.log(`Initializing explorer for new folder window: ${folderWindow.id} with folder ${icon.id}`);
        initializeFileExplorerWindow(folderWindow.id, icon.id);
      }, 50);
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
      const updatedSystem = JSON.parse(JSON.stringify(prev));
      const result = findItem(itemId, updatedSystem.root);
      
      if (result) {
        result.item.name = newName;
        result.item.modifiedAt = new Date().toISOString();
      }
      
      return updatedSystem;
    });
    
    // Force save the changes
    setTimeout(() => {
      forceSaveFileSystem();
    }, 0);
    
    setRenamingItem(null);
  };
  
  // Handle rename cancel (escape key or blur)
  const handleRenameCancel = () => {
    setRenamingItem(null);
  };
  
  // Update the nested folder navigation handler in file explorer window
  // This function will be called when double-clicking a folder inside a file explorer window
  const navigateToNestedFolder = (windowId, folderId) => {
    console.log(`Navigating to nested folder: ${folderId} in window ${windowId}`);
    
    // Check if the folder exists in the file system
    const folderResult = findItem(folderId, fileSystem.root);
    
    if (folderResult && folderResult.item.type === 'folder') {
      console.log(`Found folder to navigate to:`, folderResult.item);
      
      // Make sure the file history exists for this window
      if (!fileHistory[windowId]) {
        // Get parent folder - needed for special directories
        let initialLocation = 'root';
        if (folderResult.parent) {
          initialLocation = folderResult.parent.id;
        }
        
        // Initialize with parent folder first
        initializeFileExplorerWindow(windowId, initialLocation);
        
        // Then navigate to the target folder
        setTimeout(() => {
          navigateToFolder(windowId, folderId);
        }, 0);
        return;
      }
      
      // Navigate to this folder within the current file explorer window
      navigateToFolder(windowId, folderId);
    } else {
      console.error(`Folder with ID ${folderId} not found`);
      showNotification('Error: Folder not found', 'error');
    }
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

  // Enhance browser state to track Google searches
  const [browserState, setBrowserState] = useState({
    url: 'https://www.google.com',
    inputUrl: 'https://www.google.com',
    history: ['https://www.google.com'],
    currentIndex: 0,
    isLoading: true,
    isGoogleSearch: false,
    error: null,
    proxyMode: true  // Enable proxy mode by default
  });
  
  // Update proxy URL construction function
  const getProxyUrl = (url) => {
    return `https://berry-3gan.onrender.com/proxy?url=${encodeURIComponent(url)}`;
  };

  // Add function to handle direct search queries
  const getSearchUrl = (query) => {
    return `https://berry-3gan.onrender.com/search?q=${encodeURIComponent(query)}`;
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
            isGoogleSearch: false,
            error: null
          }));
        } else {
          // Just update loading state if we can't get the URL
          setBrowserState(prev => ({
            ...prev,
            isLoading: false,
            isGoogleSearch: false,
            error: null
          }));
        }
      } else {
        // Just update loading state if iframe isn't found
        setBrowserState(prev => ({
          ...prev,
          isLoading: false,
          isGoogleSearch: false,
          error: null
        }));
      }
    } catch (error) {
      // Handle any security errors that might occur when trying to access iframe content
      console.log("Could not access iframe URL due to security restrictions");
      setBrowserState(prev => ({
        ...prev,
        isLoading: false,
        isGoogleSearch: false,
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
             '1. The deployed proxy server might be temporarily unavailable.\n' +
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
    let isGoogleSearch = false;
    
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
        isGoogleSearch = true;
        
        setBrowserState(prev => ({
          ...prev,
          url: searchUrl, // Use the proxy search URL instead of direct Google URL
          inputUrl: url,
          isLoading: true,
          isGoogleSearch: true,
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
    
    // Check if URL is a Google search
    if (url.includes('google.com/search') || url.includes('&q=') || url.includes('?q=')) {
      isGoogleSearch = true;
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
        isGoogleSearch: isGoogleSearch,
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
                    key={`folder-view-${window.id}-item-${item.id}-${item.type}`}
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
      } else if (window.content === 'folder') {
        // Special handling for folder windows
        // Use the current folder from navigation history instead of the window's initial folder
        const folderId = getCurrentFolder(window.id) || window.folderId || 'root';
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
                    key={`folder-view-${window.id}-item-${item.id}-${item.type}`}
                    className="file-item"
                    onDoubleClick={() => {
                      console.log(`Double-clicked on item:`, item);
                      if (item.type === 'folder') {
                        console.log(`Attempting to navigate to subfolder ${item.id} from parent ${folderId}`);
                        // Force initialize if not yet initialized
                        if (!fileHistory[window.id]) {
                          initializeFileExplorerWindow(window.id, folderId);
                        }
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
                  {browserState.isGoogleSearch ? (
                    <div className="search-loading-message">
                      <span className="search-loading-title">Fetching results from Python server</span>
                      <span className="search-loading-subtitle">This might take a moment...</span>
                    </div>
                  ) : (
                    <span>Loading...</span>
                  )}
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
          
          // Update content when file content changes
          useEffect(() => {
            if (fileId) {
              const result = findItem(fileId, fileSystem.root);
              if (result && result.item) {
                setContent(String(result.item.content || ''));
              }
            } else if (window.fileContent !== undefined) {
              setContent(String(window.fileContent || ''));
            }
          }, [fileId, window.fileContent, fileSystem]);
          
          // Handle saving the file
          const handleSave = () => {
            try {
              if (fileId) {
                // Save file content using the main saveFile function
                saveFile(fileId, content);
                
                // No need to update local state as it's already in sync
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
                  parent: 'root',
                  createdAt: new Date().toISOString(),
                  modifiedAt: new Date().toISOString()
                };
                
                // Add the file to the file system
                setFileSystem(prev => {
                  const updatedSystem = JSON.parse(JSON.stringify(prev));
                  updatedSystem.root.children = [...(updatedSystem.root.children || []), newFile];
                  
                  // Save immediately to localStorage to ensure persistence
                  try {
                    // Use our improved forced save method for better reliability
                    setTimeout(() => {
                      forceSaveFileSystem();
                    }, 0);
                    console.log('Scheduled forceful save after file update');
                  } catch (error) {
                    console.error('Error scheduling file system save:', error);
                  }
                  
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

  // Toggle chatbot visibility
  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  return (
    <div 
      className="desktop" 
      style={{ 
        backgroundImage: typeof wallpaper === 'string' ? `url(${wallpaper})` : `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      onContextMenu={(e) => handleContextMenu(e, 'root')}
      onClick={handleClick}
    >
      {/* Desktop icons */}
      <div className="desktop-icons">
        {icons.map((icon) => (
          <div
            key={`desktop-icon-${icon.id}-${icon.type}`}
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
          key={`window-${window.id}${window.renderKey ? `-${window.renderKey}` : ''}`}
          data-id={window.id}
          className={`window ${activeWindow === window.id ? 'active' : ''} ${window.minimized ? 'minimized' : ''} ${fullscreenWindow === window.id ? 'fullscreen' : ''} ${window.isRestoring ? 'restoring' : ''}`}
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
            {window.isRestoring ? (
              <div className="window-loading">
                <div className="loading-spinner"></div>
                <div>Loading window content...</div>
              </div>
            ) : (
              renderWindow(window)
            )}
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
        </div>
      )}
      
      {/* Chatbot */}
      <Chatbot isOpen={isChatbotOpen} onClose={toggleChatbot} />
      
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
        onToggleChatbot={toggleChatbot}
      />
    </div>
  );
}

export default Desktop; 

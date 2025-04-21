// Window management utilities

/**
 * Calculate the position for a new window to avoid stacking directly on top of other windows
 * @param {Array} windows - Array of current windows
 * @param {Object} screenSize - The screen dimensions {width, height}
 * @returns {Object} - The calculated position {x, y}
 */
export const calculateWindowPosition = (windows, screenSize) => {
  // Default position for the first window
  const defaultPosition = { x: 50, y: 50 };
  
  if (!windows || windows.length === 0) {
    return defaultPosition;
  }
  
  // Find the newest window (latest zIndex)
  const latestWindow = windows.reduce((latest, window) => {
    return (!latest || window.zIndex > latest.zIndex) ? window : latest;
  }, null);
  
  if (!latestWindow) {
    return defaultPosition;
  }
  
  // Calculate a new position that's offset from the latest window
  const offsetX = 30;
  const offsetY = 30;
  
  let newX = latestWindow.position.x + offsetX;
  let newY = latestWindow.position.y + offsetY;
  
  // Make sure the new position is within the screen boundaries
  const maxX = screenSize.width - 400; // Assuming min window width of 400
  const maxY = screenSize.height - 300; // Assuming min window height of 300
  
  // If we're getting too close to the edge, reset to the top left
  if (newX > maxX || newY > maxY) {
    newX = 50;
    newY = 50;
  }
  
  return { x: newX, y: newY };
};

/**
 * Calculate the next z-index for a window being focused
 * @param {Array} windows - Array of current windows
 * @returns {number} - The next z-index value
 */
export const getNextZIndex = (windows) => {
  if (!windows || windows.length === 0) {
    return 1;
  }
  
  // Find the highest z-index
  const highestZIndex = windows.reduce((highest, window) => {
    return Math.max(highest, window.zIndex || 0);
  }, 0);
  
  return highestZIndex + 1;
};

/**
 * Create a new window object
 * @param {string} id - Unique identifier for the window
 * @param {string} title - Window title
 * @param {string} type - Window type (e.g., 'fileExplorer', 'browser', 'terminal')
 * @param {Object} position - Window position {x, y}
 * @param {Object} size - Window size {width, height}
 * @param {Object} data - Additional data for the window
 * @returns {Object} - The new window object
 */
export const createWindow = (id, title, type, position, size, data = {}) => {
  return {
    id,
    title,
    type,
    position,
    size,
    isMinimized: false,
    isMaximized: false,
    zIndex: 1, // Will be updated when the window is added
    data,
    createdAt: new Date().toISOString(),
  };
};

/**
 * Update window properties
 * @param {Array} windows - Array of current windows
 * @param {string} windowId - ID of the window to update
 * @param {Object} updates - Properties to update
 * @returns {Array} - Updated array of windows
 */
export const updateWindow = (windows, windowId, updates) => {
  if (!windows || windows.length === 0) {
    return windows;
  }
  
  return windows.map(window => {
    if (window.id === windowId) {
      return { ...window, ...updates };
    }
    return window;
  });
};

/**
 * Focus a window by bringing it to the front
 * @param {Array} windows - Array of current windows
 * @param {string} windowId - ID of the window to focus
 * @returns {Array} - Updated array of windows with updated z-indices
 */
export const focusWindow = (windows, windowId) => {
  if (!windows || windows.length === 0) {
    return windows;
  }
  
  const nextZIndex = getNextZIndex(windows);
  
  return windows.map(window => {
    if (window.id === windowId) {
      return { ...window, zIndex: nextZIndex };
    }
    return window;
  });
};

/**
 * Close a window by removing it from the array
 * @param {Array} windows - Array of current windows
 * @param {string} windowId - ID of the window to close
 * @returns {Array} - Updated array of windows with the specified window removed
 */
export const closeWindow = (windows, windowId) => {
  if (!windows || windows.length === 0) {
    return windows;
  }
  
  return windows.filter(window => window.id !== windowId);
};

/**
 * Minimize or restore a window
 * @param {Array} windows - Array of current windows
 * @param {string} windowId - ID of the window to toggle
 * @returns {Array} - Updated array of windows
 */
export const toggleMinimize = (windows, windowId) => {
  if (!windows || windows.length === 0) {
    return windows;
  }
  
  return windows.map(window => {
    if (window.id === windowId) {
      return { 
        ...window, 
        isMinimized: !window.isMinimized,
        // If window was maximized and is now being minimized, keep track of that
        wasMaximized: window.isMaximized && !window.isMinimized ? true : window.wasMaximized,
        // A minimized window cannot be maximized
        isMaximized: !window.isMinimized && window.isMaximized
      };
    }
    return window;
  });
};

/**
 * Maximize or restore a window
 * @param {Array} windows - Array of current windows
 * @param {string} windowId - ID of the window to toggle
 * @param {Object} previousSize - The window's size before maximizing (for restore)
 * @param {Object} previousPosition - The window's position before maximizing (for restore)
 * @returns {Array} - Updated array of windows
 */
export const toggleMaximize = (windows, windowId, previousSize, previousPosition) => {
  if (!windows || windows.length === 0) {
    return windows;
  }
  
  return windows.map(window => {
    if (window.id === windowId) {
      const isCurrentlyMaximized = window.isMaximized;
      
      return { 
        ...window, 
        isMaximized: !isCurrentlyMaximized,
        // Store previous size/position when maximizing, restore when un-maximizing
        previousSize: !isCurrentlyMaximized ? window.size : window.previousSize,
        previousPosition: !isCurrentlyMaximized ? window.position : window.previousPosition,
        size: !isCurrentlyMaximized ? { width: '100%', height: '100%' } : (window.previousSize || previousSize),
        position: !isCurrentlyMaximized ? { x: 0, y: 0 } : (window.previousPosition || previousPosition)
      };
    }
    return window;
  });
};

/**
 * Find a window by ID
 * @param {Array} windows - Array of current windows
 * @param {string} windowId - ID of the window to find
 * @returns {Object|null} - The found window or null
 */
export const findWindowById = (windows, windowId) => {
  if (!windows || windows.length === 0) {
    return null;
  }
  
  return windows.find(window => window.id === windowId) || null;
};

/**
 * Find windows by type
 * @param {Array} windows - Array of current windows
 * @param {string} type - Type of windows to find
 * @returns {Array} - Array of windows of the specified type
 */
export const findWindowsByType = (windows, type) => {
  if (!windows || windows.length === 0) {
    return [];
  }
  
  return windows.filter(window => window.type === type);
}; 
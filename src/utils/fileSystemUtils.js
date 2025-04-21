// File system utilities

/**
 * Find an item in the file system by path
 * @param {Object} fileSystem - The file system object
 * @param {string} path - The path to search for
 * @returns {Object|null} - The found item or null
 */
export const findItemByPath = (fileSystem, path) => {
  // Handle root path
  if (path === '/' || path === '') {
    return fileSystem;
  }
  
  // Split path into parts and remove any empty strings
  const pathParts = path.split('/').filter(part => part);
  let currentItem = fileSystem;
  
  // Traverse the path
  for (const part of pathParts) {
    if (currentItem.type !== 'folder' || !currentItem.children) {
      return null;
    }
    
    const childItem = currentItem.children.find(child => child.name === part);
    if (!childItem) {
      return null;
    }
    
    currentItem = childItem;
  }
  
  return currentItem;
};

/**
 * Create a new folder in the file system
 * @param {Object} fileSystem - The file system object
 * @param {string} parentPath - The path to the parent folder
 * @param {string} folderName - The name of the new folder
 * @returns {Object} - The updated file system
 */
export const createFolder = (fileSystem, parentPath, folderName) => {
  // Deep clone the file system to avoid direct mutations
  const newFileSystem = JSON.parse(JSON.stringify(fileSystem));
  
  // Find the parent folder
  const parentItem = findItemByPath(newFileSystem, parentPath);
  if (!parentItem || parentItem.type !== 'folder') {
    throw new Error(`Parent folder not found: ${parentPath}`);
  }
  
  // Check if a folder with the same name already exists
  if (parentItem.children.some(child => child.name === folderName)) {
    throw new Error(`A file or folder with the name "${folderName}" already exists`);
  }
  
  // Create the new folder
  const newFolder = {
    id: Date.now().toString(),
    name: folderName,
    type: 'folder',
    children: [],
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  };
  
  // Add the new folder to the parent's children
  parentItem.children.push(newFolder);
  
  return newFileSystem;
};

/**
 * Create a new file in the file system
 * @param {Object} fileSystem - The file system object
 * @param {string} parentPath - The path to the parent folder
 * @param {string} fileName - The name of the new file
 * @param {string} content - The content of the new file
 * @returns {Object} - The updated file system
 */
export const createFile = (fileSystem, parentPath, fileName, content = '') => {
  // Deep clone the file system to avoid direct mutations
  const newFileSystem = JSON.parse(JSON.stringify(fileSystem));
  
  // Find the parent folder
  const parentItem = findItemByPath(newFileSystem, parentPath);
  if (!parentItem || parentItem.type !== 'folder') {
    throw new Error(`Parent folder not found: ${parentPath}`);
  }
  
  // Check if a file with the same name already exists
  if (parentItem.children.some(child => child.name === fileName)) {
    throw new Error(`A file or folder with the name "${fileName}" already exists`);
  }
  
  // Create the new file
  const newFile = {
    id: Date.now().toString(),
    name: fileName,
    type: 'file',
    content: content,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  };
  
  // Add the new file to the parent's children
  parentItem.children.push(newFile);
  
  return newFileSystem;
};

/**
 * Delete an item from the file system
 * @param {Object} fileSystem - The file system object
 * @param {string} path - The path to the item to delete
 * @returns {Object} - The updated file system
 */
export const deleteItem = (fileSystem, path) => {
  // Deep clone the file system to avoid direct mutations
  const newFileSystem = JSON.parse(JSON.stringify(fileSystem));
  
  // Handle root path (can't delete root)
  if (path === '/' || path === '') {
    throw new Error("Cannot delete the root folder");
  }
  
  // Get the parent path and item name
  const pathParts = path.split('/').filter(part => part);
  const itemName = pathParts.pop();
  const parentPath = '/' + pathParts.join('/');
  
  // Find the parent folder
  const parentItem = findItemByPath(newFileSystem, parentPath);
  if (!parentItem || parentItem.type !== 'folder') {
    throw new Error(`Parent folder not found: ${parentPath}`);
  }
  
  // Find the index of the item to delete
  const itemIndex = parentItem.children.findIndex(child => child.name === itemName);
  if (itemIndex === -1) {
    throw new Error(`Item not found: ${path}`);
  }
  
  // Remove the item from the parent's children
  parentItem.children.splice(itemIndex, 1);
  
  return newFileSystem;
};

/**
 * Update a file's content
 * @param {Object} fileSystem - The file system object
 * @param {string} path - The path to the file
 * @param {string} content - The new content
 * @returns {Object} - The updated file system
 */
export const updateFileContent = (fileSystem, path, content) => {
  // Deep clone the file system to avoid direct mutations
  const newFileSystem = JSON.parse(JSON.stringify(fileSystem));
  
  // Find the file
  const file = findItemByPath(newFileSystem, path);
  if (!file) {
    throw new Error(`File not found: ${path}`);
  }
  
  if (file.type !== 'file') {
    throw new Error(`Not a file: ${path}`);
  }
  
  // Update the file's content and modified date
  file.content = content;
  file.modifiedAt = new Date().toISOString();
  
  return newFileSystem;
};

/**
 * Rename an item in the file system
 * @param {Object} fileSystem - The file system object
 * @param {string} path - The path to the item
 * @param {string} newName - The new name for the item
 * @returns {Object} - The updated file system
 */
export const renameItem = (fileSystem, path, newName) => {
  // Deep clone the file system to avoid direct mutations
  const newFileSystem = JSON.parse(JSON.stringify(fileSystem));
  
  // Handle root path (can't rename root)
  if (path === '/' || path === '') {
    throw new Error("Cannot rename the root folder");
  }
  
  // Get the parent path and item name
  const pathParts = path.split('/').filter(part => part);
  const itemName = pathParts.pop();
  const parentPath = '/' + pathParts.join('/');
  
  // Find the parent folder
  const parentItem = findItemByPath(newFileSystem, parentPath);
  if (!parentItem || parentItem.type !== 'folder') {
    throw new Error(`Parent folder not found: ${parentPath}`);
  }
  
  // Check if an item with the new name already exists
  if (parentItem.children.some(child => child.name === newName)) {
    throw new Error(`A file or folder with the name "${newName}" already exists`);
  }
  
  // Find the item to rename
  const item = parentItem.children.find(child => child.name === itemName);
  if (!item) {
    throw new Error(`Item not found: ${path}`);
  }
  
  // Rename the item and update modified date
  item.name = newName;
  item.modifiedAt = new Date().toISOString();
  
  return newFileSystem;
};

/**
 * Move an item in the file system
 * @param {Object} fileSystem - The file system object
 * @param {string} sourcePath - The path to the source item
 * @param {string} destinationPath - The path to the destination folder
 * @returns {Object} - The updated file system
 */
export const moveItem = (fileSystem, sourcePath, destinationPath) => {
  // Deep clone the file system to avoid direct mutations
  const newFileSystem = JSON.parse(JSON.stringify(fileSystem));
  
  // Handle root path (can't move root)
  if (sourcePath === '/' || sourcePath === '') {
    throw new Error("Cannot move the root folder");
  }
  
  // Get the source parent path and item name
  const sourcePathParts = sourcePath.split('/').filter(part => part);
  const itemName = sourcePathParts.pop();
  const sourceParentPath = '/' + sourcePathParts.join('/');
  
  // Find the source parent folder
  const sourceParent = findItemByPath(newFileSystem, sourceParentPath);
  if (!sourceParent || sourceParent.type !== 'folder') {
    throw new Error(`Source parent folder not found: ${sourceParentPath}`);
  }
  
  // Find the source item
  const sourceItemIndex = sourceParent.children.findIndex(child => child.name === itemName);
  if (sourceItemIndex === -1) {
    throw new Error(`Source item not found: ${sourcePath}`);
  }
  
  // Find the destination folder
  const destFolder = findItemByPath(newFileSystem, destinationPath);
  if (!destFolder) {
    throw new Error(`Destination folder not found: ${destinationPath}`);
  }
  
  if (destFolder.type !== 'folder') {
    throw new Error(`Destination is not a folder: ${destinationPath}`);
  }
  
  // Check if an item with the same name already exists in the destination
  if (destFolder.children.some(child => child.name === itemName)) {
    throw new Error(`An item with the name "${itemName}" already exists in the destination`);
  }
  
  // Remove the item from the source folder
  const [movedItem] = sourceParent.children.splice(sourceItemIndex, 1);
  
  // Update the modified date
  movedItem.modifiedAt = new Date().toISOString();
  
  // Add the item to the destination folder
  destFolder.children.push(movedItem);
  
  return newFileSystem;
};

/**
 * Copy an item in the file system
 * @param {Object} fileSystem - The file system object
 * @param {string} sourcePath - The path to the source item
 * @param {string} destinationPath - The path to the destination folder
 * @returns {Object} - The updated file system
 */
export const copyItem = (fileSystem, sourcePath, destinationPath) => {
  // Deep clone the file system to avoid direct mutations
  const newFileSystem = JSON.parse(JSON.stringify(fileSystem));
  
  // Find the source item
  const sourceItem = findItemByPath(newFileSystem, sourcePath);
  if (!sourceItem) {
    throw new Error(`Source item not found: ${sourcePath}`);
  }
  
  // Find the destination folder
  const destFolder = findItemByPath(newFileSystem, destinationPath);
  if (!destFolder) {
    throw new Error(`Destination folder not found: ${destinationPath}`);
  }
  
  if (destFolder.type !== 'folder') {
    throw new Error(`Destination is not a folder: ${destinationPath}`);
  }
  
  // Create a deep copy of the source item
  const itemCopy = JSON.parse(JSON.stringify(sourceItem));
  
  // Generate a new ID and update dates
  itemCopy.id = Date.now().toString();
  itemCopy.createdAt = new Date().toISOString();
  itemCopy.modifiedAt = new Date().toISOString();
  
  // Check if an item with the same name already exists in the destination
  if (destFolder.children.some(child => child.name === itemCopy.name)) {
    // Add " (copy)" to the name
    itemCopy.name = `${itemCopy.name} (copy)`;
  }
  
  // Add the copy to the destination folder
  destFolder.children.push(itemCopy);
  
  return newFileSystem;
}; 
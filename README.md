# BerryOS - Desktop Operating System Experience

BerryOS is a web-based desktop operating system UI built with React and enhanced with a Python backend for full browser functionality. It provides a complete desktop experience with applications like file management, terminal, and a web browser.

## Features

- **Desktop Interface**: Familiar desktop UI with app icons, windows, and taskbar
- **File Explorer**: Navigate files and folders, create, copy, cut, paste, and delete files
- **Terminal**: Linux-style terminal with basic commands
- **Real Web Browser**: Python-backed proxy for browsing any website
- **Multiple Applications**: Settings, notepad, and other utility apps
- **Realistic Experience**: Draggable windows, context menus, and more

## Setup Instructions

### Frontend (React)

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```
   
3. Access the application at http://localhost:5173 (or the port shown in your terminal)

### Backend (Python Proxy Server)

The browser component uses a Python backend proxy to enable full browsing capabilities.

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Start the Python server:
   ```
   python app/main.py
   ```
   
   For Windows users, you can simply double-click the `start_backend.bat` file in the backend directory.

4. The proxy server will start at http://localhost:5000

⚠️ **IMPORTANT**: The browser component requires the proxy server to be running for most functionality, including Google searches and website browsing. If the proxy server is not running, you will see errors when trying to use the browser.

## Browser Modes

The web browser supports three viewing modes:

1. **Proxy Mode**: Uses the Python backend to proxy websites, enabling you to view almost any website
2. **Iframe Mode**: Direct iframe embedding (limited by website security policies)
3. **Preview Mode**: Shows website screenshots for quick previews

To use the full browser capabilities, ensure the Python backend is running.

## Usage

- **Desktop**: Double-click icons to open applications
- **Windows**: Drag windows by their title bars, resize, minimize, or close them
- **File System**: Navigate files/folders, right-click for context menu options
- **Browser**: Enter URLs or search terms in the address bar, use the mode toggle buttons for different viewing options
- **Terminal**: Type commands like `help`, `ls`, `cd`, `echo`, `date`, or `clear`

## Architecture

- **Frontend**: React application with component-based architecture
- **Backend**: Flask-based Python proxy server for web browsing
- **Styling**: CSS with inline styles for responsive layout
- **State Management**: React's useState and useEffect hooks

## Security Considerations

The Python proxy backend is for development and educational purposes only. It has limitations:
- It bypasses website security restrictions
- It doesn't handle cookies and sessions properly
- It shouldn't be used for sensitive browsing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

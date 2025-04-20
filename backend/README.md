# BerryOS Browser Backend

This is a Python-based proxy server that acts as the backend for the BerryOS browser application. It enables the browser to bypass CORS restrictions and render websites properly within the application.

## Setup

1. Make sure you have Python 3.8+ installed

2. Install required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the server:
   ```
   python app/main.py
   ```

   The server will start on http://localhost:5000

## API Endpoints

- `GET /` - Status page with usage instructions
- `GET /status` - Simple status check endpoint
- `GET /proxy?url=https://example.com` - Main proxy endpoint for loading websites
- `GET /proxy-resource?url=https://example.com/image.jpg` - Endpoint for proxying resources like images, CSS, JS

## How it Works

1. The proxy server receives requests from the frontend browser component
2. It fetches the requested website's HTML and resources
3. It processes the HTML to rewrite all URLs to go through the proxy
4. It returns the processed content back to the frontend

## Security Considerations

This proxy is for development purposes and has several security implications:
- It can be used to bypass security restrictions
- It doesn't handle cookies and authentication properly
- It doesn't encrypt traffic between the proxy and destination sites

For a production application, consider additional security measures and possibly a more robust proxy solution. 
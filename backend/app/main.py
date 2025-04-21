from flask import Flask, request, jsonify, Response, stream_with_context, redirect
import requests
from bs4 import BeautifulSoup
from flask_cors import CORS
import re
import logging
import urllib.parse
import json
from urllib.parse import urlparse, parse_qs, quote_plus, urlencode, urljoin
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Headers to mimic a real browser
BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

# Video content types that should be streamed
VIDEO_CONTENT_TYPES = [
    'video/mp4', 
    'video/webm', 
    'video/ogg', 
    'application/x-mpegURL',
    'video/x-matroska',
    'video/quicktime',
    'application/dash+xml'
]

# YouTube domains for special handling
YOUTUBE_DOMAINS = [
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'm.youtube.com',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com'
]

@app.route('/')
def index():
    return jsonify({"status": "Server is running", "usage": "Use /proxy?url=https://example.com to proxy websites"})

@app.route('/youtube')
def youtube_handler():
    """Special handler for YouTube videos"""
    video_id = request.args.get('v')
    if not video_id:
        return jsonify({"error": "No YouTube video ID provided"}), 400
    
    # Get additional YouTube embed parameters
    autoplay = request.args.get('autoplay', '1')  # Default to autoplay
    start = request.args.get('t') or request.args.get('start')  # Support both t and start
    list_id = request.args.get('list')  # Playlist support
    
    # Build the embed URL with parameters
    embed_params = [f"autoplay={autoplay}"]
    if start:
        # Convert time format if needed (e.g. 1h30m15s to seconds)
        if isinstance(start, str) and not start.isdigit():
            seconds = 0
            # Handle hour format like 1h30m15s
            hour_match = re.search(r'(\d+)h', start)
            if hour_match:
                seconds += int(hour_match.group(1)) * 3600
            
            # Handle minute format like 30m
            min_match = re.search(r'(\d+)m', start)
            if min_match:
                seconds += int(min_match.group(1)) * 60
                
            # Handle second format like 15s
            sec_match = re.search(r'(\d+)s', start)
            if sec_match:
                seconds += int(sec_match.group(1))
                
            start = str(seconds) if seconds > 0 else start
        
        embed_params.append(f"start={start}")
    
    if list_id:
        embed_params.append(f"list={list_id}")
    
    # Add additional parameters for better embedding
    embed_params.extend([
        "rel=0",  # Don't show related videos from other channels
        "showinfo=0",  # Hide video title and uploader info
        "modestbranding=1",  # Reduced branding
        "fs=1",  # Enable fullscreen button
        "iv_load_policy=3"  # Hide annotations
    ])
    
    # Construct the embed URL
    embed_url = f"https://www.youtube.com/embed/{video_id}?{('&').join(embed_params)}"
    logger.info(f"Proxying YouTube video: {video_id} via embed URL: {embed_url}")
    
    # Create a responsive HTML page with the YouTube iframe embed
    html = f"""<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>YouTube - {video_id}</title>
        <style>
            body, html {{ margin: 0; padding: 0; height: 100%; overflow: hidden; background: #000; }}
            .video-container {{ width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }}
            .player-wrapper {{ width: 100%; height: 100%; max-width: 100%; max-height: 100%; position: relative; }}
            iframe {{ position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }}
            
            /* Add loading indicator */
            .loading {{ 
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                color: white; font-family: Arial, sans-serif; text-align: center;
            }}
            .spinner {{
                width: 50px; height: 50px; border: 5px solid rgba(255,255,255,0.3);
                border-radius: 50%; border-top-color: white;
                animation: spin 1s linear infinite; margin: 0 auto 20px;
            }}
            @keyframes spin {{ 100% {{ transform: rotate(360deg); }} }}
        </style>
    </head>
    <body>
        <div class="video-container">
            <div class="player-wrapper">
                <div class="loading">
                    <div class="spinner"></div>
                    <div>Loading video...</div>
                </div>
                <iframe 
                    src="{embed_url}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen
                    title="YouTube video player"
                    onload="document.querySelector('.loading').style.display='none';"
                ></iframe>
            </div>
        </div>
        <script>
            // Listen for messages from parent to handle fullscreen toggle
            window.addEventListener('message', function(e) {{
                if (e.data && e.data.action === 'toggleFullscreen') {{
                    const elem = document.querySelector('.video-container');
                    if (!document.fullscreenElement) {{
                        elem.requestFullscreen().catch(err => {{
                            console.log(`Error attempting to enable fullscreen: ${{err.message}}`);
                        }});
                    }} else {{
                        if (document.exitFullscreen) {{
                            document.exitFullscreen();
                        }}
                    }}
                }}
            }});
        </script>
    </body>
    </html>"""
    
    return html, 200, {'Content-Type': 'text/html'}

@app.route('/search', methods=['GET', 'POST'])
def search():
    """
    Handle search requests, primarily for Google searches.
    Supports both GET and POST methods and constructs an appropriate search URL.
    """
    try:
        logger.info(f"Search request received. Method: {request.method}")
        
        if request.method == 'POST':
            logger.info(f"POST form data: {request.form}")
        
        # Get search query from various possible sources
        q = ""
        if request.method == 'POST' and 'q' in request.form:
            q = request.form.get('q', '')
        elif request.method == 'GET' and 'q' in request.args:
            q = request.args.get('q', '')
        
        logger.info(f"Search query: '{q}'")
        
        # Check for YouTube search
        if q.lower().startswith('youtube ') or 'youtube.com' in request.form.get('url', ''):
            # Clean the query for YouTube search
            yt_query = q.lower().replace('youtube ', '', 1).strip()
            logger.info(f"YouTube search detected. Query: '{yt_query}'")
            
            # Construct YouTube search URL
            yt_search_url = f"https://www.youtube.com/results?search_query={quote_plus(yt_query)}"
            logger.info(f"Redirecting to YouTube search: {yt_search_url}")
            
            # Redirect to our proxy with the YouTube search URL
            return redirect(f"/proxy?url={quote_plus(yt_search_url)}")
        
        # Construct Google search URL with parameters
        search_params = {
            'q': q,
            'hl': 'en',  # Language
            'safe': 'active',  # Safe search
            'pws': '0',  # Turn off personalized search
            'nfpr': '1',  # Turn off auto-correction of spelling
            'darkmode': '1',  # Enable dark mode
        }
        
        # Add any additional parameters from form or URL
        if request.method == 'POST':
            for key, value in request.form.items():
                if key not in ['q', 'url'] and value:
                    search_params[key] = value
        else:  # GET
            for key, value in request.args.items():
                if key != 'q' and value:
                    search_params[key] = value
        
        # Construct the final search URL
        search_url = f"https://www.google.com/search?{urlencode(search_params)}"
        logger.info(f"Constructed search URL: {search_url}")
        
        # Redirect to our proxy with the Google search URL
        return redirect(f"/proxy?url={quote_plus(search_url)}")
        
    except Exception as e:
        logger.error(f"Error in search function: {str(e)}")
        traceback_str = traceback.format_exc()
        logger.error(f"Traceback: {traceback_str}")
        
        # Default to Google homepage on error
        return redirect("/proxy?url=https://www.google.com")

@app.route('/proxy', methods=['GET', 'POST'])
def proxy_website():
    """
    Main proxy endpoint that fetches and transforms HTML content
    """
    # Check for Google search in query parameters
    if request.method == 'GET' and 'q' in request.args:
        # This might be a Google search form submission
        if not request.args.get('url'):
            # Redirect to dedicated search handler
            return redirect(url_for('search', **request.args))
    
    # Check for nested proxy URLs and fix them
    if request.method == 'GET':
        url = request.args.get('url', '')
        # Detect if this is a nested proxy URL
        if url.startswith('http://localhost:5000/proxy') or url.startswith('/proxy'):
            # Extract the original URL from the nested proxy
            nested_url_match = re.search(r'[/=](https?[^&]+)', url)
            if nested_url_match:
                # Get the actual URL and properly decode it
                actual_url = nested_url_match.group(1)
                # It might be URL encoded multiple times
                try:
                    while '%' in actual_url:
                        decoded = urllib.parse.unquote(actual_url)
                        if decoded == actual_url:
                            break
                        actual_url = decoded
                except Exception as e:
                    logger.error(f"Error decoding URL: {e}")
                
                logger.info(f"Fixed nested proxy URL. Redirecting to: {actual_url}")
                return redirect(f"/proxy?url={urllib.parse.quote(actual_url)}")
            else:
                return jsonify({"error": "Invalid nested proxy URL"}), 400
                
        # Check for direct Google search URLs
        if url and 'google.com/search' in url:
            logger.info(f"Detected Google search URL: {url}")
    
    # Handle form submission from search engines
    if request.method == 'POST':
        url = request.form.get('url')
        
        # Handle Google search form submission
        if url and ('google.com/search' in url or '/search' in url):
            # Get the search query
            q = request.form.get('q')
            if q:
                # Construct Google search URL with the query
                search_url = f"https://www.google.com/search?q={urllib.parse.quote(q)}"
                for key, value in request.form.items():
                    if key not in ['url', 'q'] and value:
                        search_url += f"&{urllib.parse.quote(value)}"
                
                logger.info(f"Redirecting Google search to: {search_url}")
                return redirect(f"/proxy?url={urllib.parse.quote(search_url)}")
        
        # Handle YouTube search form submission
        if url and ('youtube.com/results' in url or '/results' in url):
            search_query = request.form.get('search_query')
            if search_query:
                # Construct proper YouTube search URL
                search_url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(search_query)}"
                logger.info(f"Redirecting YouTube search to: {search_url}")
                return redirect(f"/proxy?url={urllib.parse.quote(search_url)}")
        
        # For other form submissions, append the form data to the URL
        if url:
            form_data = request.form.copy()
            # Remove the URL parameter as we don't want to add it to the query string
            if 'url' in form_data:
                del form_data['url']
                
            # Build query string from remaining form data
            query_params = urllib.parse.urlencode(form_data)
            if '?' in url:
                url = f"{url}&{query_params}"
            else:
                url = f"{url}?{query_params}"
                
            return redirect(f"/proxy?url={urllib.parse.quote(url)}")
            
    # Normal GET request handling
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    
    # Special handling for YouTube watch URLs
    youtube_video_match = re.match(r'https?://(www\.)?(youtube\.com|youtu\.be)(/watch\?v=|/)([a-zA-Z0-9_-]{11})', url)
    if youtube_video_match:
        video_id = youtube_video_match.group(4)
        return redirect(f"/youtube?v={video_id}")
    
    return proxy_website_handler(url)

def proxy_website_handler(url):
    """
    Proxy handler that fetches content from external websites and processes it to work within our proxy.
    Focuses on modifying Google search forms to ensure they work properly through the proxy.
    """
    try:
        logger.info(f"Proxying website: {url}")
        
        # Use a session to maintain cookies and common headers
        session = requests.Session()
        
        # Special handling for Google
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.google.com/',
        }
        
        # Handle POST request (form submission)
        if request.method == 'POST':
            logger.info(f"Handling POST request to {url}")
            logger.info(f"POST data: {request.form}")
            
            # Forward the POST request with form data
            response = session.post(url, data=request.form, headers=headers, allow_redirects=True)
            logger.info(f"POST response status: {response.status_code}")
            logger.info(f"POST response URL: {response.url}")
        else:
            # Handle GET request
            logger.info(f"Handling GET request to {url}")
            response = session.get(url, headers=headers, allow_redirects=True)
            logger.info(f"GET response status: {response.status_code}")
            logger.info(f"GET response URL: {response.url}")

        # Process only HTML content
        content_type = response.headers.get('Content-Type', '')
        if 'text/html' not in content_type:
            logger.info(f"Non-HTML content detected: {content_type}")
            return response.content, response.status_code, {'Content-Type': content_type}
        
        # Parse HTML
        logger.info("Parsing HTML content")
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Process links to route through our proxy
        logger.info("Processing links")
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            if href.startswith('http'):
                a_tag['href'] = f"/proxy?url={quote_plus(href)}"
                a_tag['target'] = '_self'  # Open in same tab
                logger.debug(f"Modified link: {href} -> /proxy?url={quote_plus(href)}")
        
        # Process forms
        logger.info("Processing forms")
        for form in soup.find_all('form'):
            # Get the form action URL
            action = form.get('action', '')
            logger.info(f"Found form with action: {action}")
            
            # Skip forms without action
            if not action:
                logger.info("Form has no action, skipping")
                continue
                
            # Convert relative URLs to absolute
            if not action.startswith('http'):
                if action.startswith('/'):
                    base_url = '/'.join(url.split('/')[:3])  # http(s)://domain.com
                    action = f"{base_url}{action}"
                else:
                    action = urljoin(url, action)
                logger.info(f"Converted relative action to absolute: {action}")
            
            # Check if it's a Google search form
            is_google_search = False
            if 'google.com/search' in action or '/webhp' in action:
                logger.info("Detected Google search form")
                is_google_search = True
                
                # Set the form to submit to our search endpoint
                form['action'] = '/search'
                form['method'] = 'POST'
                logger.info("Modified Google form to use our search endpoint")
                
                # Add a hidden input for the original URL
                url_input = soup.new_tag('input')
                url_input['type'] = 'hidden'
                url_input['name'] = 'url'
                url_input['value'] = url
                form.append(url_input)
                logger.info(f"Added hidden input with original URL: {url}")
                
                # Ensure there's a search input field
                search_input = form.find('input', {'name': 'q'})
                if not search_input:
                    logger.info("No search input found, creating one")
                    search_input = soup.new_tag('input')
                    search_input['type'] = 'text'
                    search_input['name'] = 'q'
                    form.append(search_input)
            else:
                # For non-Google forms, route through our proxy
                form['action'] = f"/proxy?url={quote_plus(action)}"
                logger.info(f"Modified form action to use proxy: {action}")
            
            # Add javascript to make Google search work better
            if is_google_search:
                script = soup.new_tag('script')
                script.string = """
                document.addEventListener('DOMContentLoaded', function() {
                    const form = document.querySelector('form[action="/search"]');
                    if (form) {
                        form.addEventListener('submit', function(e) {
                            const query = form.querySelector('input[name="q"]').value;
                            if (!query || query.trim() === '') {
                                e.preventDefault();
                                console.log('Empty search prevented');
                                return false;
                            }
                            console.log('Search form submitted with query: ' + query);
                        });
                    }
                });
                """
                soup.head.append(script)
                logger.info("Added JavaScript to enhance Google search form")
                
        # Return modified HTML content
        modified_html = str(soup)
        logger.info("Returning modified HTML content")
        return modified_html
        
    except Exception as e:
        logger.error(f"Error in proxy_website_handler: {str(e)}")
        traceback_str = traceback.format_exc()
        logger.error(f"Traceback: {traceback_str}")
        return f"<html><body><h1>Error accessing {url}</h1><p>{str(e)}</p></body></html>", 500

def stream_video(url, headers):
    """
    Stream video content from the source URL
    """
    try:
        logger.info(f"Streaming video from: {url}")
        
        # Create custom headers for video
        video_headers = BROWSER_HEADERS.copy()
        
        # Check for YouTube domains to add specific headers
        parsed_url = urllib.parse.urlparse(url)
        domain = parsed_url.netloc
        if any(domain.endswith(yt_domain) for yt_domain in YOUTUBE_DOMAINS):
            video_headers['Referer'] = 'https://www.youtube.com/'
            video_headers['Origin'] = 'https://www.youtube.com'
        
        # Add range header if present in request
        range_header = request.headers.get('Range')
        if range_header:
            video_headers['Range'] = range_header
        
        # Make a streaming request to the source
        req = requests.get(
            url, 
            headers=video_headers, 
            stream=True, 
            timeout=30
        )
        
        # Extract necessary headers from the response
        response_headers = {}
        for key, value in req.headers.items():
            if key.lower() in ['content-type', 'content-length', 'accept-ranges', 'content-range',
                              'cache-control', 'expires', 'etag', 'last-modified']:
                response_headers[key] = value
        
        # Create a streaming response using Flask's stream_with_context
        return Response(
            stream_with_context(req.iter_content(chunk_size=1024)),
            headers=response_headers,
            status=req.status_code
        )
    except Exception as e:
        logger.error(f"Error streaming video {url}: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to stream video: {str(e)}"}), 500

@app.route('/proxy-resource')
def proxy_resource():
    """
    Endpoint to proxy resources like images, CSS, JavaScript, etc.
    """
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    
    try:
        logger.info(f"Proxying resource: {url}")
        
        # Check if this is a YouTube resource
        parsed_url = urllib.parse.urlparse(url)
        domain = parsed_url.netloc
        is_youtube = any(domain.endswith(yt_domain) for yt_domain in YOUTUBE_DOMAINS)
        
        # Check for Range header to support video seeking
        headers = BROWSER_HEADERS.copy()
        if is_youtube:
            headers['Referer'] = 'https://www.youtube.com/'
            headers['Origin'] = 'https://www.youtube.com'
            
        range_header = request.headers.get('Range')
        if range_header:
            headers['Range'] = range_header
        
        # Make request
        response = requests.get(url, headers=headers, stream=True, timeout=15)
        
        # Extract content type 
        content_type = response.headers.get('Content-Type', 'application/octet-stream')
        
        # Handle video content by streaming
        if any(video_type in content_type for video_type in VIDEO_CONTENT_TYPES):
            response_headers = {}
            for key, value in response.headers.items():
                if key.lower() in ['content-type', 'content-length', 'accept-ranges', 'content-range',
                                  'cache-control', 'expires', 'etag', 'last-modified']:
                    response_headers[key] = value
            
            return Response(
                stream_with_context(response.iter_content(chunk_size=1024)),
                headers=response_headers,
                status=response.status_code
            )
        
        # Handle normal resources
        return response.content, 200, {'Content-Type': content_type}
        
    except Exception as e:
        logger.error(f"Error proxying resource {url}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/status')
def status():
    """
    Simple status endpoint to check if the server is running
    """
    return jsonify({"status": "online"})

@app.route('/results')
def youtube_results():
    """
    Special handler for YouTube search results - 
    catches requests when YouTube forms submit directly to /results
    """
    search_query = request.args.get('search_query')
    if search_query:
        youtube_search_url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(search_query)}"
        logger.info(f"Redirecting YouTube result to: {youtube_search_url}")
        return redirect(f"/proxy?url={urllib.parse.quote(youtube_search_url)}")
    else:
        return jsonify({"error": "Missing search query parameter"}), 400

@app.route('/watch')
def youtube_watch():
    """
    Special handler for YouTube watch URLs - 
    handles direct access to /watch?v=VIDEO_ID pattern
    """
    video_id = request.args.get('v')
    if video_id:
        logger.info(f"Redirecting YouTube watch to video ID: {video_id}")
        return redirect(f"/youtube?v={video_id}")
    else:
        return jsonify({"error": "Missing video ID parameter"}), 400

@app.route('/<path:youtube_path>')
def youtube_catchall(youtube_path):
    """
    Catch-all handler for various YouTube paths that might be directly accessed
    """
    logger.info(f"Catching YouTube path: {youtube_path}")
    
    # Check if it's likely a YouTube path
    if youtube_path in ['channel', 'user', 'c', 'playlist', 'feed', 'gaming', 'watch']:
        # Reconstruct the full YouTube URL with query parameters
        query_string = request.query_string.decode('utf-8')
        youtube_url = f"https://www.youtube.com/{youtube_path}"
        if query_string:
            youtube_url += f"?{query_string}"
            
        return redirect(f"/proxy?url={urllib.parse.quote(youtube_url)}")
    
    # Handle other paths or return 404
    return jsonify({"error": f"Path not found: {youtube_path}"}), 404

def add_navigation_script(html, base_url):
    """
    Add script to handle navigation and history for the proxy
    """
    script = """
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Intercept link clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href && link.href.startsWith('/proxy')) {
                e.preventDefault();
                window.location.href = link.href;
            }
        });
        
        // Intercept form submissions
        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form.action && form.action.startsWith('/proxy')) {
                // Let the proxy handle the form submission
                return;
            }
            
            // For other forms, we need to handle them manually
            e.preventDefault();
            
            // Create a new form that submits to our proxy
            const proxyForm = document.createElement('form');
            proxyForm.method = form.method || 'GET';
            proxyForm.action = '/proxy';
            
            // Add the URL as a parameter
            const urlInput = document.createElement('input');
            urlInput.type = 'hidden';
            urlInput.name = 'url';
            urlInput.value = form.action || window.location.href;
            proxyForm.appendChild(urlInput);
            
            // Add all form inputs as parameters
            for (const input of form.querySelectorAll('input, select, textarea')) {
                if (input.name && input.value && input.type !== 'submit') {
                    const clonedInput = document.createElement('input');
                    clonedInput.type = 'hidden';
                    clonedInput.name = input.name;
                    clonedInput.value = input.value;
                    proxyForm.appendChild(clonedInput);
                }
            }
            
            // Submit the form
            document.body.appendChild(proxyForm);
            proxyForm.submit();
        });
    });
    </script>
    """
    
    # Insert the script before </body>
    if '</body>' in html:
        html = html.replace('</body>', script + '</body>')
    else:
        html += script
        
    return html

def get_base_url(url):
    """
    Extract the base URL (protocol + domain) from a URL
    """
    parts = url.split('/')
    if len(parts) >= 3:
        return f"{parts[0]}//{parts[2]}"
    return url

def process_links(soup, base_url):
    """
    Process all links in the HTML to ensure they work through our proxy
    """
    # Process anchor tags
    for a_tag in soup.find_all('a', href=True):
        try:
            href = a_tag['href']
            if href.startswith('#'):
                # Skip anchors
                continue
                
            if href.startswith('javascript:'):
                # Skip JavaScript links
                continue
                
            # Make relative URLs absolute
            if not href.startswith(('http://', 'https://')):
                if href.startswith('/'):
                    # Absolute path relative to domain
                    parsed_base = urllib.parse.urlparse(base_url)
                    href = f"{parsed_base.scheme}://{parsed_base.netloc}{href}"
                else:
                    # Relative path
                    href = urllib.parse.urljoin(base_url, href)
                    
            # Update href to use our proxy
            a_tag['href'] = f"/proxy?url={urllib.parse.quote(href)}"
            
            # Store original URL as data attribute
            a_tag['data-original-url'] = href
        except Exception as e:
            logger.error(f"Error processing link: {e}")
            
    # Process forms
    for form in soup.find_all('form', action=True):
        try:
            action = form['action']
            
            # Skip empty actions (submits to same page)
            if not action:
                continue
                
            # Make relative URLs absolute
            if not action.startswith(('http://', 'https://')):
                if action.startswith('/'):
                    # Absolute path relative to domain
                    parsed_base = urllib.parse.urlparse(base_url)
                    action = f"{parsed_base.scheme}://{parsed_base.netloc}{action}"
                else:
                    # Relative path
                    action = urllib.parse.urljoin(base_url, action)
                    
            # Update action to use our proxy
            form['action'] = f"/proxy?url={quote_plus(action)}"
            
            # Store original URL as data attribute
            form['data-original-action'] = action
        except Exception as e:
            logger.error(f"Error processing form: {e}")
            
    return str(soup)

def process_resources(soup, base_url, is_youtube=False):
    """
    Process resources like images, scripts, and stylesheets
    """
    # Process images
    for img in soup.find_all('img', src=True):
        src = img['src']
        if not src.startswith('data:') and not src.startswith('http'):
            if src.startswith('/'):
                src = f"{base_url}{src}"
            else:
                src = f"{base_url}/{src}"
        if not src.startswith('data:'):
            img['src'] = f"/proxy-resource?url={urllib.parse.quote(src)}"
    
    # Process video sources
    for video in soup.find_all('video'):
        # Process src attribute if present
        if video.has_attr('src'):
            src = video['src']
            if not src.startswith('data:') and not src.startswith('http'):
                if src.startswith('/'):
                    src = f"{base_url}{src}"
                else:
                    src = f"{base_url}/{src}"
            video['src'] = f"/proxy-resource?url={urllib.parse.quote(src)}"
        
        # Process source elements within video
        for source in video.find_all('source', src=True):
            src = source['src']
            if not src.startswith('data:') and not src.startswith('http'):
                if src.startswith('/'):
                    src = f"{base_url}{src}"
                else:
                    src = f"{base_url}/{src}"
            source['src'] = f"/proxy-resource?url={urllib.parse.quote(src)}"
    
    # Process scripts - for YouTube we need to leave certain scripts intact
    for script in soup.find_all('script', src=True):
        src = script['src']
        if not src.startswith('http'):
            if src.startswith('/'):
                src = f"{base_url}{src}"
            else:
                src = f"{base_url}/{src}"
        
        # YouTube special handling
        if is_youtube and ('www.youtube.com' in src or 'youtube.com' in src or 's.ytimg.com' in src):
            # Leave YouTube API scripts unchanged to allow player to work
            continue
        
        script['src'] = f"/proxy-resource?url={urllib.parse.quote(src)}"
    
    # Process iframe sources
    for iframe in soup.find_all('iframe', src=True):
        src = iframe['src']
        if not src.startswith('http'):
            if src.startswith('/'):
                src = f"{base_url}{src}"
            else:
                src = f"{base_url}/{src}"
        
        # YouTube special handling for embedded videos
        if is_youtube and ('www.youtube.com/embed/' in src or 'youtube.com/embed/' in src):
            # Extract video ID from embed URL
            match = re.search(r'youtube\.com/embed/([a-zA-Z0-9_-]{11})', src)
            if match:
                video_id = match.group(1)
                iframe['src'] = f"/youtube?v={video_id}"
            continue
        
        iframe['src'] = f"/proxy?url={urllib.parse.quote(src)}"
    
    # Process stylesheets
    for link in soup.find_all('link', rel="stylesheet", href=True):
        href = link['href']
        if not href.startswith('http'):
            if href.startswith('/'):
                href = f"{base_url}{href}"
            else:
                href = f"{base_url}/{href}"
        link['href'] = f"/proxy-resource?url={urllib.parse.quote(href)}"
    
    # Process style background images
    for style in soup.find_all('style'):
        if style.string:
            # Use regex to find url() patterns in CSS
            urls = re.findall(r'url\([\'"]?([^\'")]+)[\'"]?\)', style.string)
            for url in urls:
                if not url.startswith('data:'):
                    if not url.startswith('http'):
                        if url.startswith('/'):
                            full_url = f"{base_url}{url}"
                        else:
                            full_url = f"{base_url}/{url}"
                    else:
                        full_url = url
                    
                    # Replace the URL in the style
                    style.string = style.string.replace(
                        f'url({url})', 
                        f'url(/proxy-resource?url={urllib.parse.quote(full_url)})'
                    )

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 
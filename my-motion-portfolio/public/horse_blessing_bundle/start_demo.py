import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run():
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Serving at http://localhost:{PORT}")
            # Automatically open the browser
            webbrowser.open(f"http://localhost:{PORT}/index.html")
            print("Press Ctrl+C to stop the server.")
            httpd.serve_forever()
    except OSError:
        # If port is taken, try 8001
        new_port = PORT + 1
        with socketserver.TCPServer(("", new_port), Handler) as httpd:
            print(f"Port {PORT} was busy, serving at http://localhost:{new_port}")
            webbrowser.open(f"http://localhost:{new_port}/index.html")
            httpd.serve_forever()

if __name__ == "__main__":
    run()

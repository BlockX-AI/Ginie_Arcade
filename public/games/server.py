#!/usr/bin/env python3
"""
HTTPS Server for Godot Web Games
Generates self-signed certificate and serves game over HTTPS
"""

import http.server
import ssl
import os
import subprocess
import sys

PORT = 8443
CERT_FILE = "server.pem"
KEY_FILE = "server.key"

def generate_self_signed_cert():
    """Generate self-signed SSL certificate"""
    if os.path.exists(CERT_FILE) and os.path.exists(KEY_FILE):
        print("✓ SSL certificate already exists")
        return True
    
    print("🔐 Generating self-signed SSL certificate...")
    try:
        # Generate private key and certificate
        cmd = [
            "openssl", "req", "-x509", "-newkey", "rsa:4096",
            "-keyout", KEY_FILE, "-out", CERT_FILE,
            "-days", "365", "-nodes",
            "-subj", "/CN=localhost/O=NeonSkyRunner/C=US"
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        print("✓ SSL certificate generated successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to generate certificate: {e}")
        return False

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with CORS and proper MIME types for Godot"""
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        # Cross-Origin headers for SharedArrayBuffer (needed by some Godot features)
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()
    
    def guess_type(self, path):
        """Return proper MIME types for Godot files"""
        if path.endswith('.wasm'):
            return 'application/wasm'
        if path.endswith('.pck'):
            return 'application/octet-stream'
        if path.endswith('.js'):
            return 'application/javascript'
        return super().guess_type(path)

def main():
    # Generate SSL certificate
    if not generate_self_signed_cert():
        print("Falling back to HTTP server...")
        PORT_HTTP = 8000
        handler = CORSRequestHandler
        with http.server.HTTPServer(('', PORT_HTTP), handler) as httpd:
            print(f"\n🎮 Game server running at: http://localhost:{PORT_HTTP}")
            print("⚠️  Note: Some Godot features may not work without HTTPS")
            httpd.serve_forever()
        return
    
    # Create HTTPS server
    handler = CORSRequestHandler
    httpd = http.server.HTTPServer(('', PORT), handler)
    
    # Wrap socket with SSL
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(CERT_FILE, KEY_FILE)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print(f"\n🎮 Neon Sky Runner HTTPS Server")
    print(f"=" * 40)
    print(f"✓ Server running at: https://localhost:{PORT}")
    print(f"\n⚠️  Your browser will show a security warning")
    print(f"   Click 'Advanced' → 'Proceed to localhost'")
    print(f"\n🕹️  Controls: Click/Tap/Space to fly!")
    print(f"   Press Ctrl+C to stop the server")
    print(f"=" * 40)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

if __name__ == "__main__":
    main()

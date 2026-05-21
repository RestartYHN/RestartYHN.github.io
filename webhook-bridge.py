from http.server import HTTPServer, BaseHTTPRequestHandler
import json, urllib.request

NAPCAT = "http://localhost:3000"
TOKEN = "_3skFHiXhSpXn5Of"
PORT = 18888

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length)) if length else {}
        
        if self.path == '/send':
            data = json.dumps(body).encode()
            req = urllib.request.Request(
                f"{NAPCAT}/send_private_msg",
                data=data,
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {TOKEN}"}
            )
            resp = urllib.request.urlopen(req, timeout=10)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(resp.read())
        else:
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"ok":true}')

    def log_message(self, format, *args): pass

HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()

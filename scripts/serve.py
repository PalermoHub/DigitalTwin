import os
import re
import sys
import shutil
from http.server import SimpleHTTPRequestHandler, test

class RangeRequestHandler(SimpleHTTPRequestHandler):
    """
    SimpleHTTPRequestHandler subclass that supports HTTP Range Requests
    and adds CORS headers. This is required for loading PMTiles locally.
    """
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Range')
        self.send_header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges')
        ext = self.path.split('?')[0].rsplit('.', 1)[-1].lower()
        if ext in ('html', 'js', 'css'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        
        # Check for Range header
        range_header = self.headers.get('Range')
        if not range_header:
            return super().send_head()
            
        match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if not match:
            return super().send_head()
            
        start, end = match.groups()
        try:
            start = int(start)
            end = int(end) if end else None
        except ValueError:
            return super().send_head()
            
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None
            
        try:
            fs = os.fstat(f.fileno())
            file_size = fs[6]
        except Exception:
            f.close()
            return super().send_head()
            
        if end is None or end >= file_size:
            end = file_size - 1
            
        if start >= file_size:
            f.close()
            self.send_error(416, "Requested range not satisfiable")
            return None
            
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        
        # Seek and send only the requested range
        f.seek(start)
        return f

    def copyfile(self, source, outputfile):
        # If we sent a 206 Partial Content, we only want to copy the bytes we specified
        if self.headers.get('Range') and hasattr(source, 'tell'):
            range_header = self.headers.get('Range')
            match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            if match:
                start, end = match.groups()
                start = int(start)
                # Read the actual size sent in Content-Length header or calculate it
                try:
                    # In python 3.x, SimpleHTTPRequestHandler sets response headers before sending,
                    # but we can also calculate the chunk size:
                    path = self.translate_path(self.path)
                    file_size = os.path.getsize(path)
                    end = int(end) if end else file_size - 1
                    byte_count = end - start + 1
                    
                    remaining = byte_count
                    while remaining > 0:
                        chunk_size = min(remaining, 64 * 1024)
                        data = source.read(chunk_size)
                        if not data:
                            break
                        outputfile.write(data)
                        remaining -= len(data)
                    return
                except Exception:
                    pass
        # Fallback to default copyfile
        super().copyfile(source, outputfile)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    # serve sempre la radice del progetto, da qualunque cartella venga lanciato
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    print(f"Serving http://127.0.0.1:{port} (HTTP Range + CORS)")
    test(HandlerClass=RangeRequestHandler, port=port, bind='127.0.0.1')

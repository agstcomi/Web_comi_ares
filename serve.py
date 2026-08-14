import http.server
import os
import sys

class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Obtener la ruta sin parámetros de búsqueda ni fragmentos (#)
        path_without_query = self.path.split('?')[0].split('#')[0]
        translated_path = self.translate_path(path_without_query)
        
        # Si la ruta es un directorio y existe index.html dentro
        if os.path.isdir(translated_path):
            index_file = os.path.join(translated_path, 'index.html')
            if os.path.exists(index_file):
                query_and_hash = ''
                if '?' in self.path:
                    query_and_hash = '?' + self.path.split('?', 1)[1]
                elif '#' in self.path:
                    query_and_hash = '#' + self.path.split('#', 1)[1]
                rel_path = path_without_query.rstrip('/') + '/index.html'
                self.path = rel_path + query_and_hash
                return super().do_GET()

        # Si la ruta no existe físicamente y no tiene extensión de archivo
        if not os.path.exists(translated_path) and not os.path.isdir(translated_path):
            # Rewrite for clean news detail URLs
            if path_without_query.startswith('/noticies/') and len(path_without_query.split('/')) >= 3:
                self.path = '/noticies.html'
                return super().do_GET()
            elif path_without_query.startswith('/es/noticies/') and len(path_without_query.split('/')) >= 4:
                self.path = '/es/noticies.html'
                return super().do_GET()

            _, ext = os.path.splitext(translated_path)
            if not ext:
                html_path = translated_path + '.html'
                if os.path.exists(html_path):
                    # Reconstruir la ruta añadiendo .html de forma interna
                    query_and_hash = ''
                    if '?' in self.path:
                        query_and_hash = '?' + self.path.split('?', 1)[1]
                    elif '#' in self.path:
                        query_and_hash = '#' + self.path.split('#', 1)[1]
                    self.path = path_without_query + '.html' + query_and_hash
                    
        return super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        path_without_query = self.path.split('?')[0].split('#')[0]
        if path_without_query == '/api/create-checkout-session':
            try:
                import json
                import urllib.request
                import urllib.parse
                
                content_length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(content_length).decode('utf-8'))
                
                name = body.get('name', '')
                surname = body.get('surname', '')
                email = body.get('email', '')
                size = body.get('size', 'M')
                quantity = int(body.get('quantity', 1))
                notes = body.get('notes', '')
                price_cents = 3500

                stripe_key = os.environ.get("STRIPE_SECRET_KEY", "")
                
                stripe_data = urllib.parse.urlencode({
                    "payment_method_types[]": "card",
                    "line_items[0][price_data][currency]": "eur",
                    "line_items[0][price_data][product_data][name]": f"Camiseta Festes Ares 2026 — Talla {size}",
                    "line_items[0][price_data][product_data][description]": f"{quantity} x Camiseta talla {size} — Comissió de Festes d'Ares del Maestrat",
                    "line_items[0][price_data][unit_amount]": str(price_cents),
                    "line_items[0][quantity]": str(quantity),
                    "mode": "payment",
                    "customer_email": email,
                    "success_url": f"http://localhost:8000/camisetes/confirmacio.html?session_id={{CHECKOUT_SESSION_ID}}&name={urllib.parse.quote(name)}&surname={urllib.parse.quote(surname)}&email={urllib.parse.quote(email)}&size={urllib.parse.quote(size)}&qty={quantity}",
                    "cancel_url": f"http://localhost:8000/camisetes/?cancelled=1",
                    "metadata[name]": name,
                    "metadata[surname]": surname,
                    "metadata[email]": email,
                    "metadata[size]": size,
                    "metadata[quantity]": str(quantity),
                    "metadata[notes]": notes,
                }).encode('utf-8')

                req = urllib.request.Request(
                    "https://api.stripe.com/v1/checkout/sessions",
                    data=stripe_data,
                    headers={
                        "Authorization": f"Bearer {stripe_key}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    method="POST"
                )
                
                with urllib.request.urlopen(req) as response:
                    res_body = json.loads(response.read().decode('utf-8'))
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"url": res_body.get("url"), "sessionId": res_body.get("id")}).encode('utf-8'))
                    return
            except Exception as e:
                import json
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    # Asegurar tipos MIME para XML y XSL
    http.server.SimpleHTTPRequestHandler.extensions_map.update({
        '.xml': 'application/xml',
        '.xsl': 'application/xml',
    })
    print(f"Iniciando servidor local en http://localhost:{port} (con soporte para URLs limpias)...")
    http.server.test(HandlerClass=CleanURLHandler, port=port)

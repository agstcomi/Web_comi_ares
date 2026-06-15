import http.server
import os
import sys

class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Obtener la ruta sin parámetros de búsqueda ni fragmentos (#)
        path_without_query = self.path.split('?')[0].split('#')[0]
        translated_path = self.translate_path(path_without_query)
        
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

<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:template match="/">
    <html>
      <head>
        <title>Sitemap - Comissió de Festes d'Ares del Maestrat</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8f9fa;
            color: #212529;
            margin: 0;
            padding: 2rem;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
            background: #ffffff;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          }
          h1 {
            color: #111111;
            font-size: 2rem;
            margin-top: 0;
            border-bottom: 2px solid #eaeaea;
            padding-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .stats {
            font-size: 0.9rem;
            color: #6c757d;
            background: #f1f3f5;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 500;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1.5rem;
          }
          th {
            background-color: #f8f9fa;
            color: #495057;
            text-align: left;
            padding: 12px 16px;
            font-weight: 600;
            border-bottom: 2px solid #dee2e6;
          }
          td {
            padding: 12px 16px;
            border-bottom: 1px solid #eee;
            font-size: 0.9rem;
          }
          tr:hover {
            background-color: #f8f9fa;
          }
          a {
            color: #0076ff;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .lang-badge {
            display: inline-block;
            padding: 2px 8px;
            font-size: 0.75rem;
            font-weight: 600;
            border-radius: 4px;
            margin-right: 4px;
            background-color: #e9ecef;
            color: #495057;
          }
          p.desc {
            color: #495057;
            line-height: 1.5;
            margin-bottom: 1.5rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>
            <span>Mapa del Lloc (Sitemap)</span>
            <span class="stats">Total URLs: <xsl:value-of select="count(s:urlset/s:url)"/></span>
          </h1>
          <p class="desc">Aquest és el sitemap XML del lloc web de la Comissió de Festes d'Ares del Maestrat, generat per a cercadors com Google o Bing.</p>
          <table>
            <thead>
              <tr>
                <th>Ruta (URL)</th>
                <th>Prioritat</th>
                <th>Freqüència</th>
                <th>Darrera mod.</th>
                <th>Idiomes alternatius</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="s:urlset/s:url">
                <tr>
                  <td>
                    <a href="{s:loc}"><xsl:value-of select="s:loc"/></a>
                  </td>
                  <td>
                    <xsl:value-of select="s:priority"/>
                  </td>
                  <td>
                    <xsl:value-of select="s:changefreq"/>
                  </td>
                  <td>
                    <xsl:value-of select="s:lastmod"/>
                  </td>
                  <td>
                    <xsl:for-each select="xhtml:link">
                      <span class="lang-badge">
                        <xsl:value-of select="@hreflang"/>
                      </span>
                    </xsl:for-each>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

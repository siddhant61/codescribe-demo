import unittest
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]

class Elements(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids = []
        self.links = []
        self.tags = []
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if 'id' in attrs: self.ids.append(attrs['id'])
        if tag == 'a': self.links.append(attrs.get('href', ''))

class ReportShellTests(unittest.TestCase):
    def test_every_report_has_a_unique_accessible_content_entry(self):
        for path in sorted((ROOT / 'cluster-reports').glob('*.html')):
            with self.subTest(report=path.name):
                page = Elements(path.read_text())
                self.assertEqual([k for k,v in Counter(page.ids).items() if v>1], [])
                self.assertIn('#main-content', page.links)
                self.assertTrue(any(t=='main' and a.get('id')=='main-content' and a.get('tabindex')=='-1' for t,a in page.tags))

    def test_refined_pages_load_measured_sticky_header_offsets(self):
        paths = list((ROOT / 'cluster-reports').glob('*.html')) + [ROOT / 'research-methodology.html', ROOT / 'idp-portal.html']
        for path in paths:
            page = Elements(path.read_text())
            with self.subTest(page=path.name):
                self.assertTrue(any(t=='script' and a.get('src','').endswith('/page-offsets.js') for t,a in page.tags))
        css = (ROOT / 'assets/css/codescribe-pages.css').read_text()
        self.assertIn('scroll-padding-top:var(--cs-header-offset,100px)', css)
        self.assertIn('top:var(--cs-header-offset,100px)', css)
        self.assertIn('.cs-detail-page .page-header,.cs-report-page .page-header{padding:0}', css)

    def test_report_local_resources_and_fragments_resolve(self):
        for path in sorted((ROOT / 'cluster-reports').glob('*.html')):
            page = Elements(path.read_text())
            for tag,attrs in page.tags:
                u = attrs.get('src') or attrs.get('href')
                if not u or urlsplit(u).scheme or u.startswith('//'): continue
                url = urlsplit(u)
                target = (path.parent / url.path) if url.path else path
                with self.subTest(report=path.name, url=u):
                    self.assertTrue(target.is_file())
                    if url.fragment and target.suffix=='.html':
                        ids = Elements(target.read_text()).ids
                        self.assertTrue(url.fragment in ids or unquote(url.fragment) in ids)

if __name__ == '__main__': unittest.main()

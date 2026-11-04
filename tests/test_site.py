import unittest,re,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PAGES=['index.html','research-methodology.html','architecture-overview.html','reports-hub.html','knowledge-graph.html','idp-portal.html','site-map.html','wip.html']
class SiteTests(unittest.TestCase):
 def test_public_pages_have_identity_and_accessible_entry(self):
  for p in PAGES:
   with self.subTest(page=p):
    s=(ROOT/p).read_text()
    self.assertIn('CodeScribe',s)
    self.assertIn('href="#main-content"',s)
    self.assertIn('id="main-content"',s)
    self.assertIn('codescribe.css',s)
 def test_home_identifies_owner_and_evidence_limits(self):
  s=(ROOT/'index.html').read_text()
  for text in ['Siddhant Gadamsetti','historical snapshot','not a benchmark','research-methodology.html','reports-hub.html','knowledge-graph.html','idp/knowledge-graph-synthesized.json']:
   self.assertIn(text,s)
  self.assertNotIn('900+',s)
 def test_methodology_explains_legacy_claims(self):
  s=(ROOT/'research-methodology.html').read_text()
  self.assertIn('not independently validated',s)
  self.assertIn('Historical analysis',s)
  self.assertNotIn('<h2>Background & Context</h3>',s)
 def test_methodology_title_clears_legacy_gradient(self):
  s=(ROOT/'assets/css/codescribe.css').read_text()
  self.assertIn('-webkit-text-fill-color:var(--cs-ink)',s)
 def test_sitemap_cluster_link_is_not_the_main_graph(self):
  s=(ROOT/'site-map.html').read_text()
  self.assertIn('href="./idp-portal.html#knowledge-graphs">Cluster graph samples',s)
  self.assertIn('id="knowledge-graphs"',(ROOT/'idp-portal.html').read_text())
 def test_local_assets_and_page_links_resolve(self):
  for p in PAGES:
   for u in re.findall(r'(?:href|src)="([^"]+)"',(ROOT/p).read_text()):
    if u.startswith(('http:','https:','#','mailto:','data:','javascript:')): continue
    target=u.split('#')[0].split('?')[0]
    if target: self.assertTrue((ROOT/target).exists(),f'{p}: {u}')
if __name__=='__main__': unittest.main()

// Exercise production navigation behavior against a minimal DOM fixture.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/scripts/navigation.js', 'utf8');

function makeLink(href, classes = []) {
  const names = new Set(classes);
  const attributes = { href };
  return {
    handlers: {},
    classList: {
      contains: name => names.has(name),
      add: name => names.add(name),
      remove: name => names.delete(name)
    },
    getAttribute: name => attributes[name],
    setAttribute: (name, value) => { attributes[name] = value; },
    removeAttribute: name => { delete attributes[name]; },
    addEventListener(event, handler) { this.handlers[event] = handler; }
  };
}

function fixture({ url = 'https://example.test/index.html', primary = [], sections = [], anchors = [] } = {}) {
  let init;
  let scrolled = false;
  const events = {};
  const window = { location: new URL(url), addEventListener: (event, handler) => { events[event] = handler; } };
  const target = { scrollIntoView: () => { scrolled = true; } };
  const document = {
    baseURI: url,
    querySelectorAll: selector => ({
      '.nav-link': [...primary, ...sections],
      '.header-nav .nav-link': primary,
      '.methodology-nav .nav-link': sections,
      'a[href^="#"]': anchors
    })[selector] || [],
    querySelector: () => target,
    getElementById: () => null,
    addEventListener: (event, handler) => { init = handler; }
  };
  const history = { pushState: (state, title, href) => { window.location = new URL(href, window.location); } };
  vm.runInNewContext(source, { document, window, history, URL });
  init();
  return {
    events, window,
    click(link) {
      let prevented = false;
      link.handlers.click.call(link, { preventDefault: () => { prevented = true; } });
      return { prevented, scrolled };
    }
  };
}

test('skip link preserves native focus navigation', () => {
  const link = makeLink('#main-content', ['skip-link']);
  assert.deepEqual(fixture({ anchors: [link] }).click(link), { prevented: false, scrolled: false });
});

test('ordinary section links retain scrolling and update the fragment', () => {
  const link = makeLink('#overview');
  const page = fixture({ anchors: [link] });
  assert.deepEqual(page.click(link), { prevented: true, scrolled: true });
  assert.equal(page.window.location.hash, '#overview');
});

test('relative primary links resolve within a nested hosting path', () => {
  const home = makeLink('./index.html', ['active']);
  const graph = makeLink('./knowledge-graph.html');
  fixture({ url: 'https://example.test/projects/ai-workflow-portal/knowledge-graph.html?demo=1#graph', primary: [home, graph] });
  assert.equal(home.classList.contains('active'), false);
  assert.equal(graph.classList.contains('active'), true);
  assert.equal(graph.getAttribute('aria-current'), 'page');
});

test('directory URLs and index.html select the same Home link at each hosting root', () => {
  for (const path of ['/', '/index.html', '/ai-workflow-portal/', '/ai-workflow-portal/index.html']) {
    const home = makeLink('./index.html');
    fixture({ url: `https://example.test${path}`, primary: [home] });
    assert.equal(home.classList.contains('active'), true, path);
  }
});

test('external links with the same pathname are not current-page links', () => {
  const external = makeLink('https://elsewhere.test/index.html', ['active']);
  fixture({ primary: [external] });
  assert.equal(external.classList.contains('active'), false);
  assert.equal(external.getAttribute('aria-current'), undefined);
});

test('primary navigation does not clear methodology section state', () => {
  const overview = makeLink('#overview', ['active']);
  fixture({ primary: [makeLink('./index.html')], sections: [overview] });
  assert.equal(overview.classList.contains('active'), true);
  assert.equal(overview.getAttribute('aria-current'), undefined);
});

test('Back and Forward restore methodology section selection from the fragment', () => {
  const overview = makeLink('#overview', ['active']);
  const framework = makeLink('#framework');
  const approach = makeLink('#approach');
  const page = fixture({
    url: 'https://example.test/ai-workflow-portal/research-methodology.html',
    sections: [overview, framework, approach], anchors: [framework, approach]
  });
  page.click(framework);
  page.click(approach);
  assert.equal(approach.classList.contains('active'), true);
  page.window.location.hash = '#framework';
  page.events.popstate();
  assert.equal(framework.classList.contains('active'), true);
  assert.equal(approach.classList.contains('active'), false);
  page.window.location.hash = '';
  page.events.popstate();
  assert.equal(overview.classList.contains('active'), true);
  page.window.location.hash = '#approach';
  page.events.popstate();
  assert.equal(approach.classList.contains('active'), true);
});

test('direct fragment navigation selects the matching methodology section', () => {
  const overview = makeLink('#overview', ['active']);
  const framework = makeLink('#framework');
  const page = fixture({
    url: 'https://example.test/research-methodology.html#framework',
    sections: [overview, framework]
  });
  assert.equal(framework.classList.contains('active'), true);
  assert.equal(overview.classList.contains('active'), false);
  page.window.location.hash = '#overview';
  page.events.hashchange();
  assert.equal(overview.classList.contains('active'), true);
});

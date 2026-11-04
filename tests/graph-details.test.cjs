const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/scripts/knowledge-graph-mobile.js', 'utf8');

// Minimal event/focus fixture; mutations are delivered after the current event,
// matching the timing that matters when a relationship link replaces itself.
function fixture() {
  const target = () => ({
    listeners: {},
    addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); },
    dispatch(type, event = {}) { (this.listeners[type] || []).forEach(handler => handler(event)); },
    count(type) { return (this.listeners[type] || []).length; }
  });
  const document = Object.assign(target(), { readyState: 'loading', body: {} });
  const element = () => Object.assign(target(), {
    isConnected: true,
    closest: () => null,
    focus() { document.activeElement = this; }
  });
  const panel = Object.assign(element(), { style: {}, scrollTop: 50 });
  const close = element();
  const content = element();
  const opener = element();
  const children = new Set([close, content]);
  const classes = new Set(['hidden']);
  const pending = [];
  const observers = [];
  panel.contains = node => node === panel || children.has(node);
  panel.classList = {
    contains: name => classes.has(name),
    add(name) { classes.add(name); pending.push({ target: panel, type: 'attributes' }); },
    remove(name) { classes.delete(name); pending.push({ target: panel, type: 'attributes' }); }
  };
  const media = Object.assign(target(), { matches: true });
  const window = Object.assign(target(), { matchMedia: () => media });
  const elements = { 'details-panel': panel, 'details-close': close, 'details-content': content };
  document.getElementById = id => elements[id] || null;
  document.activeElement = opener;
  class MutationObserver {
    constructor(callback) { this.callback = callback; }
    observe(target, options) { observers.push({ target, options, callback: this.callback }); }
  }
  const flush = () => {
    const mutations = pending.splice(0);
    observers.forEach(observer => {
      const matching = mutations.filter(record => record.target === observer.target && observer.options[record.type]);
      if (matching.length) observer.callback(matching);
    });
  };
  vm.runInNewContext(source, { document, window, MutationObserver });
  document.dispatch('DOMContentLoaded');
  return {
    document, window, panel, close, content, opener, media, element, flush,
    hidden: () => classes.has('hidden'),
    open() { panel.classList.remove('hidden'); flush(); },
    click(clicked, path = [clicked, document]) {
      document.dispatch('click', { target: clicked, composedPath: () => path });
      flush();
    },
    replaceFocusedLink() {
      const link = element();
      children.add(link);
      link.focus();
      children.delete(link);
      link.isConnected = false;
      document.activeElement = document.body;
      pending.push({ target: content, type: 'childList' });
      return link;
    }
  };
}

test('a replaced relationship link remains an inside click and retains panel focus', () => {
  const f = fixture();
  f.open();
  const detachedLink = f.replaceFocusedLink();
  assert.equal(f.panel.contains(detachedLink), false);
  f.click(detachedLink, [detachedLink, f.content, f.panel, f.document]);
  assert.equal(f.hidden(), false);
  assert.equal(f.document.activeElement, f.close);
  f.document.dispatch('keydown', { key: 'Escape' });
  f.flush();
  assert.equal(f.hidden(), true);
  assert.equal(f.document.activeElement, f.opener);
});

test('a mobile outside click closes details without stealing outside focus', () => {
  const f = fixture();
  f.open();
  const outside = f.element();
  outside.focus();
  f.click(outside);
  assert.equal(f.hidden(), true);
  assert.equal(f.document.activeElement, outside);
});

test('outside-click dismissal follows the current breakpoint after resizing', () => {
  const f = fixture();
  f.open();
  f.media.matches = false;
  f.media.dispatch('change');
  f.click(f.element());
  assert.equal(f.hidden(), false);
  f.media.matches = true;
  f.media.dispatch('change');
  f.click(f.element());
  assert.equal(f.hidden(), true);
});

test('Close and Escape dismiss details and return focus to the opener', () => {
  for (const method of ['close', 'Escape']) {
    const f = fixture();
    f.open();
    assert.equal(f.document.activeElement, f.close);
    assert.equal(f.panel.scrollTop, 0);
    if (method === 'close') f.close.dispatch('click');
    else f.document.dispatch('keydown', { key: 'Escape' });
    f.flush();
    assert.equal(f.hidden(), true, method);
    assert.equal(f.document.activeElement, f.opener, method);
  }
});

test('repeated breakpoint changes do not reinstall interaction handlers', () => {
  const f = fixture();
  for (let i = 0; i < 6; i++) {
    f.media.matches = !f.media.matches;
    f.media.dispatch('change');
    f.window.dispatch('resize');
  }
  assert.equal(f.document.count('click'), 1);
  assert.equal(f.document.count('keydown'), 1);
  assert.equal(f.close.count('click'), 1);
  assert.equal(f.panel.count('touchstart'), 1);
  assert.equal(f.media.count('change'), 1);
  assert.equal(f.window.count('resize'), 0);
});

test('content changes in a hidden panel do not move focus', () => {
  const f = fixture();
  f.replaceFocusedLink();
  f.flush();
  assert.equal(f.hidden(), true);
  assert.equal(f.document.activeElement, f.document.body);
});

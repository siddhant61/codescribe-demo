const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise production presentation handlers with a small D3 selection fixture.
function fixture() {
  const controls = new Map();
  const categoryButtons = [];
  const control = id => {
    if (!controls.has(id)) controls.set(id, {
      value: '', listeners: {}, innerHTML: '',
      classList: { add() {}, remove() {} },
      addEventListener(event, handler) { this.listeners[event] = handler; }
    });
    return controls.get(id);
  };
  const select = data => ({
    entries: data.map(d => ({ data: d, styles: {}, classes: {} })),
    style(name, value) {
      this.entries.forEach(e => { e.styles[name] = typeof value === 'function' ? value(e.data) : value; });
      return this;
    },
    classed(name, value) {
      this.entries.forEach(e => { e.classes[name] = typeof value === 'function' ? value(e.data) : value; });
      return this;
    },
    selectAll() { return this.labels; }
  });
  const context = vm.createContext({
    document: { getElementById: control, querySelectorAll: () => categoryButtons, addEventListener() {} },
    window: {}, console
  });
  vm.runInContext(fs.readFileSync('assets/scripts/knowledge-graph.js', 'utf8'), context);
  const run = code => vm.runInContext(code, context);
  const nodes = [
    { id: 'Course', name: 'Course', category: 'CORE', type: 'Model', description: '', interactions: [], techDebt: [], sources: [], fx: 20, fy: 30 },
    { id: 'Quiz', name: 'Quiz', category: 'LEARN', type: 'Model', description: '', interactions: [], techDebt: [], sources: [], fx: null, fy: null }
  ];
  const links = [{ source: nodes[0], target: nodes[1] }];
  context.nodes = nodes;
  context.links = links;
  run('allNodes = nodes; allLinks = links; allWorkflows = [{id: "quiz", workflowName: "Quiz workflow", involvedComponents: ["Quiz"]}];');
  function replaceSelections() {
    context.nodeFixture = select(nodes);
    context.nodeFixture.labels = select(nodes);
    context.linkFixture = select(links);
    context.hullFixture = select(['CORE', 'LEARN']);
    run('nodeSelection = nodeFixture; linkSelection = linkFixture; hullSelection = hullFixture;');
  }
  replaceSelections();
  return { control, context, run, nodes, replaceSelections, categoryButtons };
}

test('rebuilt graph keeps Overview labels hidden and category nodes/links filtered', () => {
  const f = fixture();
  f.control('category-filter').value = 'CORE';
  f.run('currentViewMode = "overview"; restoreGraphPresentation();');
  f.replaceSelections();
  f.run('restoreGraphPresentation();');
  assert.deepEqual(f.context.nodeFixture.labels.entries.map(e => e.styles.display), ['none', 'none']);
  assert.deepEqual(f.context.nodeFixture.entries.map(e => e.styles.display), [null, 'none']);
  assert.equal(f.context.linkFixture.entries[0].styles.display, 'none');
  assert.deepEqual(f.context.hullFixture.entries.map(e => e.styles.display), [null, 'none']);
});

test('search highlighting survives category changes and replacement selections', () => {
  const f = fixture();
  f.run('setupSearch(); setupCategoryFilter();');
  const search = f.control('graph-search');
  search.value = 'course';
  search.listeners.input({ target: search });
  const category = f.control('category-filter');
  category.value = 'CORE';
  category.listeners.change({ target: category });
  f.replaceSelections();
  f.run('restoreGraphPresentation();');
  assert.equal(search.value, 'course');
  assert.deepEqual(f.context.nodeFixture.entries.map(e => e.classes.highlighted), [true, false]);
  assert.deepEqual(f.context.nodeFixture.entries.map(e => e.styles.display), [null, 'none']);
});

test('workflow highlighting survives replacement selections and keeps controls consistent', () => {
  const f = fixture();
  f.run('setupWorkflowSelector();');
  const workflow = f.control('workflow-selector');
  workflow.value = 'Quiz workflow';
  f.control('graph-search').value = 'course';
  workflow.listeners.change({ target: workflow });
  f.replaceSelections();
  f.run('restoreGraphPresentation();');
  assert.equal(f.control('graph-search').value, '');
  assert.equal(workflow.value, 'Quiz workflow');
  assert.deepEqual(f.context.nodeFixture.entries.map(e => e.classes.highlighted), [false, true]);
});

test('Reset View clears filters and selection, releases pins and resets zoom', () => {
  const f = fixture();
  for (const id of ['graph-search', 'workflow-selector', 'category-filter']) f.control(id).value = 'stale';
  f.run(`
    activeHighlight = { kind: 'search', value: 'course' };
    d3 = { zoomIdentity: { x: 0, y: 0, k: 1 } };
    zoom = { transform: () => {} };
    svg = { interrupt() { return this; }, call(fn, transform) { this.reset = transform; return this; } };
    simulation = { alpha(value) { this.value = value; return this; }, restart() { this.restarted = true; } };
    setupResetButton();
  `);
  f.control('reset-graph-btn').listeners.click();
  assert.equal(f.run('activeHighlight'), null);
  for (const id of ['graph-search', 'workflow-selector', 'category-filter']) assert.equal(f.control(id).value, '');
  assert.deepEqual(f.context.nodeFixture.entries.map(e => e.styles.display), [null, null]);
  assert.deepEqual(f.nodes.map(n => [n.fx, n.fy]), [[null, null], [null, null]]);
  assert.equal(f.run('svg.reset.k'), 1);
  assert.equal(f.run('simulation.restarted'), true);
});

test('category jump clears a conflicting filter so the destination is visible', () => {
  const f = fixture();
  const button = f.control('jump-learn');
  button.getAttribute = () => 'LEARN';
  f.categoryButtons.push(button);
  f.control('category-filter').value = 'CORE';
  f.run('visibleNodes = allNodes; applyCategoryFilter("CORE"); setupCategoryNavigator();');
  button.listeners.click();
  assert.equal(f.control('category-filter').value, '');
  assert.equal(f.context.nodeFixture.entries[1].styles.display, null);

  f.control('category-filter').value = 'LEARN';
  f.run('applyCategoryFilter("LEARN");');
  button.listeners.click();
  assert.equal(f.control('category-filter').value, 'LEARN');
  assert.equal(f.context.nodeFixture.entries[0].styles.display, 'none');
});

test('Enter and Space activate node details, while navigation keys remain native', () => {
  for (const key of ['Enter', ' ', 'Tab', 'ArrowDown']) {
    const f = fixture();
    let prevented = false;
    let stopped = false;
    f.context.keyEvent = {
      type: 'keydown', key,
      preventDefault() { prevented = true; },
      stopPropagation() { stopped = true; }
    };
    f.run('activateGraphNode(keyEvent, nodes[0]);');
    const activated = key === 'Enter' || key === ' ';
    assert.equal(prevented, activated);
    assert.equal(stopped, activated);
    assert.equal(f.run('activeHighlight?.value || null'), activated ? 'Course' : null);
    if (activated) assert.equal(f.context.nodeFixture.entries[0].classes.selected, true);
  }
});

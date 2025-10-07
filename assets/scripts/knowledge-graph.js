/**
 * Knowledge Graph Visualization for Xikolo Platform
 * Enhanced D3.js force-directed graph with workflow support
 */

// Category colors matching design tokens
const categoryColors = {
  CORE: '#3b82f6',    // blue
  LEARN: '#10b981',   // green
  COMM: '#f59e0b',    // amber
  ADMIN: '#8b5cf6',   // purple
  INFRA: '#ef4444',   // red
  SEC: '#ec4899',     // pink
  DEVOPS: '#06b6d4'   // cyan
};

let currentGraphData = null;
let allNodes = [];
let allLinks = [];
let allWorkflows = [];
let svg, g, simulation, zoom;
let width, height;
let nodeSelection, linkSelection, hullSelection;
let currentDetailLevel = 2; // 1=Low(50), 2=Medium(200), 3=High(868)
let currentViewMode = 'detailed'; // 'detailed' or 'overview'
let visibleNodes = [];
let visibleLinks = [];

/**
 * Initialize the knowledge graph visualization
 */
async function initKnowledgeGraph() {
  try {
    // Load knowledge graph data
    const response = await fetch('/idp/knowledge-graph-synthesized.json');
    const data = await response.json();
    
    currentGraphData = data;
    processGraphData(data);
    renderGraph();
    setupInteractions();
    
    // Hide loading indicator
    document.getElementById('graph-loading')?.classList.add('hidden');
  } catch (error) {
    console.error('Error loading knowledge graph:', error);
    const loader = document.getElementById('graph-loading');
    if (loader) {
      loader.innerHTML = `
        <div class="text-center p-xl">
          <p class="text-danger mb-md">Failed to load knowledge graph</p>
          <p class="text-sm text-secondary">${error.message}</p>
        </div>
      `;
    }
  }
}

/**
 * Process raw graph data into D3-friendly format
 */
function processGraphData(data) {
  const components = data.components || {};
  const workflows = data.workflows || {};
  
  // Create nodes from components
  allNodes = Object.entries(components).map(([id, component]) => {
    const category = detectCategory(id, component);
    return {
      id,
      name: id,
      category,
      type: component.type || 'Component',
      description: component.description || '',
      interactions: extractInteractionsList(component.interactions),
      techDebt: extractList(component.techDebt),
      sources: extractList(component.provenance?.sources),
      connections: 0
    };
  });
  
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));
  const linkMap = new Map();
  
  // Extract links from component interactions
  allNodes.forEach(node => {
    node.interactions.forEach(interaction => {
      // Extract component names from backticks in interaction text
      const matches = interaction.match(/`([^`]+)`/g);
      if (matches) {
        matches.forEach(match => {
          const targetId = match.replace(/`/g, '');
          if (nodeMap.has(targetId) && targetId !== node.id) {
            const linkKey = [node.id, targetId].sort().join('->');
            if (!linkMap.has(linkKey)) {
              linkMap.set(linkKey, {
                source: node.id,
                target: targetId,
                type: 'interaction',
                types: new Set(['interaction'])
              });
            } else {
              linkMap.get(linkKey).types.add('interaction');
            }
          }
        });
      }
    });
  });
  
  // Process workflows
  allWorkflows = Object.entries(workflows).map(([id, workflow]) => {
    const involved = extractList(workflow.involvedComponents);
    
    // Create workflow links between involved components
    for (let i = 0; i < involved.length; i++) {
      for (let j = i + 1; j < involved.length; j++) {
        const source = involved[i];
        const target = involved[j];
        if (nodeMap.has(source) && nodeMap.has(target)) {
          const linkKey = [source, target].sort().join('->');
          if (!linkMap.has(linkKey)) {
            linkMap.set(linkKey, {
              source,
              target,
              type: 'workflow',
              types: new Set(['workflow'])
            });
          } else {
            linkMap.get(linkKey).types.add('workflow');
          }
        }
      }
    }
    
    return {
      id,
      workflowName: workflow.workflowName || id,
      description: workflow.description || '',
      involvedComponents: involved,
      sources: extractList(workflow.provenance?.sources)
    };
  });
  
  allLinks = Array.from(linkMap.values());
  
  // Update connection counts
  allLinks.forEach(link => {
    if (nodeMap.has(link.source)) nodeMap.get(link.source).connections++;
    if (nodeMap.has(link.target)) nodeMap.get(link.target).connections++;
  });
  
  console.log(`Processed ${allNodes.length} nodes, ${allLinks.length} links, ${allWorkflows.length} workflows`);
}

/**
 * Detect category from component name and metadata
 */
function detectCategory(id, component) {
  const name = (id + ' ' + (component.type || '')).toLowerCase();
  
  if (name.match(/auth|user|session|login|course(?!.*item)|api.*gateway/i)) return 'CORE';
  if (name.match(/quiz|video|discussion|learn|achievement|gamif|poll|lti|proctor/i)) return 'LEARN';
  if (name.match(/notif|announce|referral|comm|email|message/i)) return 'COMM';
  if (name.match(/admin|analytics|content.*manage|support|voucher/i)) return 'ADMIN';
  if (name.match(/database|job|service|component|ui|time.*effort|system/i)) return 'INFRA';
  if (name.match(/security|cookie|recaptcha|sec/i)) return 'SEC';
  if (name.match(/test|monitor|i18n|devops/i)) return 'DEVOPS';
  
  return 'INFRA'; // default
}

/**
 * Filter nodes based on detail level
 * Level 1: Top 50 most connected (hubs)
 * Level 2: Top 200 important nodes
 * Level 3: All 868 nodes
 */
function filterNodesByDetailLevel(level) {
  const sortedNodes = [...allNodes].sort((a, b) => b.connections - a.connections);
  
  let nodeCount;
  switch(level) {
    case 1: nodeCount = 50; break;
    case 2: nodeCount = 200; break;
    case 3: nodeCount = allNodes.length; break;
    default: nodeCount = 200;
  }
  
  const topNodes = sortedNodes.slice(0, nodeCount);
  const visibleNodeIds = new Set(topNodes.map(n => n.id));
  
  // Filter links to only include those between visible nodes
  const filteredLinks = allLinks.filter(link => {
    const sourceId = link.source.id || link.source;
    const targetId = link.target.id || link.target;
    return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
  });
  
  return { nodes: topNodes, links: filteredLinks };
}

/**
 * Extract interactions as array of strings
 */
function extractInteractionsList(interactions) {
  if (!interactions) return [];
  if (Array.isArray(interactions)) return interactions;
  if (typeof interactions === 'object') {
    return Object.values(interactions).filter(v => typeof v === 'string');
  }
  return [];
}

/**
 * Extract generic list from various formats
 */
function extractList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return Object.values(data);
  return [data];
}

/**
 * Render the force-directed graph
 */
function renderGraph() {
  const container = document.getElementById('knowledge-graph');
  if (!container) return;
  
  const rect = container.getBoundingClientRect();
  width = Math.max(rect.width, 800);
  height = Math.max(rect.height, 600);
  
  // Apply detail level filter
  const filtered = filterNodesByDetailLevel(currentDetailLevel);
  visibleNodes = filtered.nodes;
  visibleLinks = filtered.links;
  
  // Clear existing
  d3.select('#knowledge-graph').selectAll('*').remove();
  
  // Create SVG
  svg = d3.select('#knowledge-graph')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', [0, 0, width, height])
    .attr('class', 'graph-svg');
  
  // Add zoom behavior
  zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
  
  svg.call(zoom);
  
  // Main group
  g = svg.append('g');
  
  // Create category clusters
  const categories = [...new Set(visibleNodes.map(n => n.category))];
  const clusterRadius = Math.min(width, height) * 0.25;
  const clusters = new Map(categories.map((cat, i) => {
    const angle = (i / categories.length) * 2 * Math.PI;
    return [cat, {
      x: width / 2 + Math.cos(angle) * clusterRadius,
      y: height / 2 + Math.sin(angle) * clusterRadius
    }];
  }));
  
  // Hull group for category backgrounds
  const hullGroup = g.insert('g', ':first-child').attr('class', 'hulls');
  hullSelection = hullGroup.selectAll('path');
  
  // Initialize nodes with cluster positions to reduce initial chaos
  visibleNodes.forEach(node => {
    const cluster = clusters.get(node.category);
    if (cluster) {
      node.x = cluster.x + (Math.random() - 0.5) * 100;
      node.y = cluster.y + (Math.random() - 0.5) * 100;
    }
  });
  
  // Create force simulation with better spacing
  simulation = d3.forceSimulation(visibleNodes)
    .force('link', d3.forceLink(visibleLinks).id(d => d.id).distance(150).strength(0.05))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 10).strength(0.9))
    .force('cluster', (alpha) => {
      visibleNodes.forEach(d => {
        const cluster = clusters.get(d.category);
        if (!cluster) return;
        // Stronger clustering force
        d.vx -= (d.x - cluster.x) * alpha * 0.15;
        d.vy -= (d.y - cluster.y) * alpha * 0.15;
      });
    })
    .alphaDecay(0.02) // Slower decay for better settling
    .on('tick', ticked);
  
  // Create links
  linkSelection = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(visibleLinks)
    .join('line')
    .attr('class', d => {
      const types = Array.from(d.types || ['interaction']).join(' ');
      return `link ${types}`;
    })
    .attr('stroke', '#94a3b8')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.4);
  
  // Create nodes
  const nodeGroup = g.append('g').attr('class', 'nodes');
  nodeSelection = nodeGroup.selectAll('g')
    .data(visibleNodes)
    .join('g')
    .attr('class', 'node')
    .call(drag(simulation));
  
  // Add circles
  nodeSelection.append('circle')
    .attr('r', d => getNodeRadius(d))
    .attr('fill', d => categoryColors[d.category] || categoryColors.INFRA)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2);
  
  // Add labels
  nodeSelection.append('text')
    .text(d => d.name.split('::').pop())
    .attr('dy', d => getNodeRadius(d) + 12)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', '#1e293b')
    .attr('pointer-events', 'none');
  
  // Add tooltips
  nodeSelection.append('title')
    .text(d => `${d.name}\n${d.type}\nCategory: ${d.category}\nConnections: ${d.connections}`);
  
  // Click handler
  nodeSelection.on('click', (event, d) => {
    event.stopPropagation();
    handleNodeClick(d);
  });
  
  // Background click to deselect
  svg.on('click', () => {
    clearHighlights();
    showDefaultPanel();
  });
  
  // Update statistics
  updateStats();
}

/**
 * Get node radius based on connections
 */
function getNodeRadius(node) {
  return 5 + Math.min(node.connections * 0.5, 15);
}

/**
 * Tick function for force simulation
 */
function ticked() {
  linkSelection
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);
  
  nodeSelection
    .attr('transform', d => `translate(${d.x},${d.y})`);
  
  // Update category hulls
  if (hullSelection) {
    const categories = [...new Set(visibleNodes.map(n => n.category))];
    hullSelection = hullSelection.data(categories, d => d);
    hullSelection.exit().remove();
    
    hullSelection = hullSelection.enter()
      .append('path')
      .attr('class', 'hull')
      .attr('fill', d => categoryColors[d])
      .attr('fill-opacity', 0.1)
      .attr('stroke', d => categoryColors[d])
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.3)
      .merge(hullSelection);
    
    hullSelection.attr('d', category => {
      const nodes = visibleNodes.filter(n => n.category === category);
      if (nodes.length < 3) return null;
      
      const padding = 40;
      const points = nodes.flatMap(n => {
        const r = getNodeRadius(n) + padding;
        return [
          [n.x, n.y],
          [n.x - r, n.y],
          [n.x + r, n.y],
          [n.x, n.y - r],
          [n.x, n.y + r]
        ];
      });
      
      const hull = d3.polygonHull(points);
      return hull ? `M${hull.join('L')}Z` : null;
    });
  }
}

/**
 * Drag behavior
 */
function drag(simulation) {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    // Keep node pinned at dragged position
  }
  
  return d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}

/**
 * Handle node click
 */
function handleNodeClick(node) {
  // Clear workflow highlights
  const workflowSelector = document.getElementById('workflow-selector');
  if (workflowSelector) workflowSelector.value = '';
  
  // Find connected nodes
  const connected = new Set([node.id]);
  allLinks.forEach(link => {
    const sourceId = link.source.id || link.source;
    const targetId = link.target.id || link.target;
    if (sourceId === node.id) connected.add(targetId);
    if (targetId === node.id) connected.add(sourceId);
  });
  
  // Highlight selected and connected nodes
  nodeSelection
    .classed('selected', d => d.id === node.id)
    .classed('highlighted', d => connected.has(d.id) && d.id !== node.id)
    .classed('dimmed', d => !connected.has(d.id));
  
  // Highlight relevant links
  linkSelection
    .classed('highlighted', d => {
      const sourceId = d.source.id || d.source;
      const targetId = d.target.id || d.target;
      return sourceId === node.id || targetId === node.id;
    })
    .classed('dimmed', d => {
      const sourceId = d.source.id || d.source;
      const targetId = d.target.id || d.target;
      return sourceId !== node.id && targetId !== node.id;
    });
  
  // Show details panel
  displayComponentDetails(node);
}

/**
 * Handle workflow selection
 */
function highlightWorkflow(workflowName) {
  const searchInput = document.getElementById('graph-search');
  if (searchInput) searchInput.value = '';
  
  clearHighlights();
  
  if (!workflowName) {
    showDefaultPanel();
    return;
  }
  
  const workflow = allWorkflows.find(w => w.workflowName === workflowName || w.id === workflowName);
  if (!workflow) return;
  
  const involved = new Set(workflow.involvedComponents);
  
  // Highlight workflow nodes
  nodeSelection
    .classed('highlighted', d => involved.has(d.id))
    .classed('dimmed', d => !involved.has(d.id));
  
  // Highlight workflow links
  linkSelection
    .classed('highlighted', d => {
      const sourceId = d.source.id || d.source;
      const targetId = d.target.id || d.target;
      return involved.has(sourceId) && involved.has(targetId);
    })
    .classed('dimmed', d => {
      const sourceId = d.source.id || d.source;
      const targetId = d.target.id || d.target;
      return !involved.has(sourceId) || !involved.has(targetId);
    });
  
  // Show workflow details
  displayWorkflowDetails(workflow);
}

/**
 * Clear all highlights
 */
function clearHighlights() {
  if (nodeSelection) {
    nodeSelection
      .classed('selected', false)
      .classed('highlighted', false)
      .classed('dimmed', false);
  }
  if (linkSelection) {
    linkSelection
      .classed('highlighted', false)
      .classed('dimmed', false);
  }
}

/**
 * Setup all interactions
 */
function setupInteractions() {
  setupSearch();
  setupCategoryFilter();
  setupWorkflowSelector();
  setupZoomControls();
  setupResetButton();
  setupFullscreenButton();
  setupDetailLevelSlider();
  setupViewModeToggle();
  setupCategoryNavigator();
}

/**
 * Setup search
 */
function setupSearch() {
  const searchInput = document.getElementById('graph-search');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    // Clear workflow selection
    const workflowSelector = document.getElementById('workflow-selector');
    if (workflowSelector) workflowSelector.value = '';
    
    clearHighlights();
    
    if (!query) return;
    
    // Find matching nodes
    const matches = new Set();
    allNodes.forEach(node => {
      if (node.name.toLowerCase().includes(query) ||
          node.type.toLowerCase().includes(query) ||
          node.description.toLowerCase().includes(query)) {
        matches.add(node.id);
      }
    });
    
    // Highlight matches
    nodeSelection
      .classed('highlighted', d => matches.has(d.id))
      .classed('dimmed', d => !matches.has(d.id));
    
    linkSelection.classed('dimmed', d => {
      const sourceId = d.source.id || d.source;
      const targetId = d.target.id || d.target;
      return !matches.has(sourceId) || !matches.has(targetId);
    });
  });
}

/**
 * Setup category filter
 */
function setupCategoryFilter() {
  const filterSelect = document.getElementById('category-filter');
  if (!filterSelect) return;
  
  // Populate categories
  const categories = ['All Categories', ...Object.keys(categoryColors)];
  filterSelect.innerHTML = categories.map(cat => 
    `<option value="${cat === 'All Categories' ? '' : cat}">${cat}</option>`
  ).join('');
  
  filterSelect.addEventListener('change', (e) => {
    const category = e.target.value;
    
    clearHighlights();
    
    if (!category) {
      // Show all
      nodeSelection.style('display', null);
      linkSelection.style('display', null);
      return;
    }
    
    // Filter by category
    const visible = new Set();
    nodeSelection.style('display', d => {
      const show = d.category === category;
      if (show) visible.add(d.id);
      return show ? null : 'none';
    });
    
    linkSelection.style('display', d => {
      const sourceId = d.source.id || d.source;
      const targetId = d.target.id || d.target;
      return visible.has(sourceId) && visible.has(targetId) ? null : 'none';
    });
  });
}

/**
 * Setup workflow selector
 */
function setupWorkflowSelector() {
  const selector = document.getElementById('workflow-selector');
  if (!selector) return;
  
  // Populate workflows
  selector.innerHTML = '<option value="">Select Workflow...</option>' +
    allWorkflows.slice(0, 50).map(w => // Limit to first 50 for performance
      `<option value="${w.workflowName}">${w.workflowName}</option>`
    ).join('');
  
  selector.addEventListener('change', (e) => {
    highlightWorkflow(e.target.value);
  });
}

/**
 * Setup zoom controls
 */
function setupZoomControls() {
  const zoomIn = document.getElementById('zoom-in-btn');
  const zoomOut = document.getElementById('zoom-out-btn');
  const zoomReset = document.getElementById('zoom-reset-btn');
  
  if (zoomIn) {
    zoomIn.addEventListener('click', () => {
      if (!svg || !zoom) return;
      svg.transition()
        .duration(300)
        .call(zoom.scaleBy, 1.3);
    });
  }
  
  if (zoomOut) {
    zoomOut.addEventListener('click', () => {
      if (!svg || !zoom) return;
      svg.transition()
        .duration(300)
        .call(zoom.scaleBy, 0.7);
    });
  }
  
  if (zoomReset) {
    zoomReset.addEventListener('click', () => {
      if (!svg || !zoom) return;
      svg.transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity);
    });
  }
}

/**
 * Setup reset button
 */
function setupResetButton() {
  const resetBtn = document.getElementById('reset-graph-btn');
  if (!resetBtn) return;
  
  resetBtn.addEventListener('click', () => {
    simulation.alpha(1).restart();
    clearHighlights();
    showDefaultPanel();
  });
}

/**
 * Setup fullscreen button
 */
function setupFullscreenButton() {
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  if (!fullscreenBtn) return;
  
  fullscreenBtn.addEventListener('click', () => {
    const viewport = document.querySelector('.graph-viewport');
    if (!viewport) return;
    
    if (!document.fullscreenElement) {
      // Copy current theme to viewport before entering fullscreen
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      viewport.setAttribute('data-theme', currentTheme);
      
      // Force background color based on theme
      if (currentTheme === 'dark') {
        viewport.style.backgroundColor = '#0f172a';
      } else {
        viewport.style.backgroundColor = '#ffffff';
      }
      
      // Enter fullscreen
      if (viewport.requestFullscreen) {
        viewport.requestFullscreen();
      } else if (viewport.webkitRequestFullscreen) {
        viewport.webkitRequestFullscreen();
      } else if (viewport.mozRequestFullScreen) {
        viewport.mozRequestFullScreen();
      } else if (viewport.msRequestFullscreen) {
        viewport.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen and reset background
      viewport.style.backgroundColor = '';
      
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  });
  
  // Update button text and ensure theme is maintained when fullscreen state changes
  const handleFullscreenChange = () => {
    const viewport = document.querySelector('.graph-viewport');
    const isFullscreen = !!(document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement);
    
    // Update button
    updateFullscreenButton();
    
    // Ensure theme is applied in fullscreen
    if (isFullscreen && viewport) {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      viewport.setAttribute('data-theme', currentTheme);
      
      if (currentTheme === 'dark') {
        viewport.style.backgroundColor = '#0f172a';
      } else {
        viewport.style.backgroundColor = '#ffffff';
      }
    }
  };
  
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  
  function updateFullscreenButton() {
    const isFullscreen = !!(document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement);
    fullscreenBtn.innerHTML = isFullscreen 
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>Exit Fullscreen'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>Fullscreen';
  }
}

/**
 * Update statistics
 */
function updateStats() {
  const nodeCount = document.getElementById('node-count');
  const edgeCount = document.getElementById('edge-count');
  const workflowCount = document.getElementById('workflow-count');
  
  if (nodeCount) nodeCount.textContent = `${visibleNodes.length} / ${allNodes.length}`;
  if (edgeCount) edgeCount.textContent = visibleLinks.length;
  if (workflowCount) workflowCount.textContent = allWorkflows.length;
}

/**
 * Display component details panel
 */
function displayComponentDetails(node) {
  const panel = document.getElementById('details-panel');
  const content = document.getElementById('details-content');
  if (!panel || !content) return;
  
  // Find workflows involving this component
  const workflows = allWorkflows.filter(w => 
    w.involvedComponents.includes(node.id)
  );
  
  content.innerHTML = `
    <h2 class="text-2xl font-bold mb-md">${node.name}</h2>
    <div class="flex gap-sm mb-lg">
      <span class="badge" style="background-color: ${categoryColors[node.category]}; color: white;">
        ${node.category}
      </span>
      <span class="badge badge-secondary">${node.type}</span>
    </div>
    
    <div class="mb-lg">
      <h3 class="font-semibold mb-sm">Description</h3>
      <p class="text-sm text-secondary">${node.description || 'No description available.'}</p>
    </div>
    
    <div class="mb-lg">
      <h3 class="font-semibold mb-sm">Interactions (${node.interactions.length})</h3>
      ${node.interactions.length > 0 
        ? `<ul class="text-sm space-y-sm">${node.interactions.slice(0, 10).map(i => 
            `<li>${highlightComponentLinks(i)}</li>`
          ).join('')}</ul>`
        : '<p class="text-sm text-secondary">No interactions documented.</p>'
      }
    </div>
    
    <div class="mb-lg">
      <h3 class="font-semibold mb-sm">Part of Workflows (${workflows.length})</h3>
      ${workflows.length > 0
        ? `<ul class="text-sm space-y-sm">${workflows.slice(0, 10).map(w =>
            `<li><a href="#" class="text-primary hover:underline" onclick="selectWorkflow('${w.workflowName}'); return false;">${w.workflowName}</a></li>`
          ).join('')}</ul>`
        : '<p class="text-sm text-secondary">Not part of any workflows.</p>'
      }
    </div>
    
    <div class="mb-lg">
      <h3 class="font-semibold mb-sm">Technical Debt</h3>
      ${node.techDebt.length > 0
        ? `<ul class="text-sm space-y-sm">${node.techDebt.slice(0, 5).map(t =>
            `<li>${t}</li>`
          ).join('')}</ul>`
        : '<p class="text-sm text-secondary">No technical debt recorded.</p>'
      }
    </div>
    
    <div>
      <h3 class="font-semibold mb-sm">Sources</h3>
      ${node.sources && node.sources.length > 0
        ? `<ul class="text-sm space-y-sm">${node.sources.map(s =>
            `<li class="text-secondary break-all">${s}</li>`
          ).join('')}</ul>`
        : '<p class="text-sm text-secondary">No source files recorded.</p>'
      }
    </div>
  `;
  
  panel.classList.remove('hidden');
}

/**
 * Display workflow details
 */
function displayWorkflowDetails(workflow) {
  const panel = document.getElementById('details-panel');
  const content = document.getElementById('details-content');
  if (!panel || !content) return;
  
  content.innerHTML = `
    <h2 class="text-2xl font-bold mb-md">${workflow.workflowName}</h2>
    
    <div class="mb-lg">
      <h3 class="font-semibold mb-sm">Description</h3>
      <p class="text-sm text-secondary">${workflow.description || 'No description available.'}</p>
    </div>
    
    <div class="mb-lg">
      <h3 class="font-semibold mb-sm">Involved Components (${workflow.involvedComponents.length})</h3>
      <ul class="text-sm space-y-sm">
        ${workflow.involvedComponents.slice(0, 20).map(comp =>
          `<li><a href="#" class="text-primary hover:underline" onclick="selectComponent('${comp}'); return false;">${comp}</a></li>`
        ).join('')}
      </ul>
    </div>
  `;
  
  panel.classList.remove('hidden');
}

/**
 * Show default panel
 */
function showDefaultPanel() {
  const panel = document.getElementById('details-panel');
  const content = document.getElementById('details-content');
  if (!panel || !content) return;
  
  content.innerHTML = `
    <div class="text-center p-xl">
      <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-16 w-16 text-secondary mb-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-lg font-semibold mb-sm">Explore the Architecture</h3>
      <p class="text-sm text-secondary">Click a node or select a workflow to view details</p>
    </div>
  `;
  
  panel.classList.remove('hidden');
}

/**
 * Highlight component links in text
 */
function highlightComponentLinks(text) {
  return text.replace(/`([^`]+)`/g, (match, comp) => {
    if (allNodes.find(n => n.id === comp)) {
      return `<a href="#" class="text-primary hover:underline font-mono text-xs" onclick="selectComponent('${comp}'); return false;">${comp}</a>`;
    }
    return `<code class="text-xs bg-gray-100 px-1 rounded">${comp}</code>`;
  });
}

/**
 * Global helper to select component
 */
window.selectComponent = function(componentId) {
  const node = allNodes.find(n => n.id === componentId);
  if (node) handleNodeClick(node);
};

/**
 * Global helper to select workflow
 */
window.selectWorkflow = function(workflowName) {
  const selector = document.getElementById('workflow-selector');
  if (selector) selector.value = workflowName;
  highlightWorkflow(workflowName);
};

/**
 * Setup detail level slider
 */
function setupDetailLevelSlider() {
  const slider = document.getElementById('detail-level');
  const label = document.getElementById('detail-level-label');
  
  if (!slider || !label) return;
  
  const updateLabel = (level) => {
    const labels = {
      1: 'Low (50 nodes)',
      2: 'Medium (200 nodes)',
      3: 'High (868 nodes)'
    };
    label.textContent = labels[level] || labels[2];
  };
  
  slider.addEventListener('input', (e) => {
    currentDetailLevel = parseInt(e.target.value);
    updateLabel(currentDetailLevel);
  });
  
  slider.addEventListener('change', (e) => {
    currentDetailLevel = parseInt(e.target.value);
    updateLabel(currentDetailLevel);
    // Re-render graph with new detail level
    renderGraph();
    updateStats();
  });
  
  // Initialize label
  updateLabel(currentDetailLevel);
}

/**
 * Setup view mode toggle
 */
function setupViewModeToggle() {
  const detailedBtn = document.getElementById('view-detailed');
  const overviewBtn = document.getElementById('view-overview');
  
  if (!detailedBtn || !overviewBtn) return;
  
  const updateButtons = () => {
    if (currentViewMode === 'detailed') {
      detailedBtn.classList.add('btn-primary');
      detailedBtn.classList.remove('btn-secondary');
      overviewBtn.classList.add('btn-secondary');
      overviewBtn.classList.remove('btn-primary');
    } else {
      overviewBtn.classList.add('btn-primary');
      overviewBtn.classList.remove('btn-secondary');
      detailedBtn.classList.add('btn-secondary');
      detailedBtn.classList.remove('btn-primary');
    }
  };
  
  detailedBtn.addEventListener('click', () => {
    if (currentViewMode === 'detailed') return;
    currentViewMode = 'detailed';
    updateButtons();
    // Show node labels
    if (nodeSelection) {
      nodeSelection.selectAll('text').style('display', null);
    }
  });
  
  overviewBtn.addEventListener('click', () => {
    if (currentViewMode === 'overview') return;
    currentViewMode = 'overview';
    updateButtons();
    // Hide node labels for cleaner overview
    if (nodeSelection) {
      nodeSelection.selectAll('text').style('display', 'none');
    }
  });
  
  updateButtons();
}

/**
 * Setup category navigator buttons
 */
function setupCategoryNavigator() {
  const categoryBtns = document.querySelectorAll('.category-nav-btn');
  
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      if (!category) return;
      
      // Find center of this category's nodes
      const categoryNodes = visibleNodes.filter(n => n.category === category);
      if (categoryNodes.length === 0) return;
      
      // Calculate center
      const centerX = categoryNodes.reduce((sum, n) => sum + n.x, 0) / categoryNodes.length;
      const centerY = categoryNodes.reduce((sum, n) => sum + n.y, 0) / categoryNodes.length;
      
      // Zoom to category
      if (svg && zoom) {
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(1.5)
          .translate(-centerX, -centerY);
        
        svg.transition()
          .duration(750)
          .call(zoom.transform, transform);
      }
    });
  });
}

/**
 * Watch for theme changes and update fullscreen if active
 */
function watchThemeChanges() {
  // Watch for theme changes on the document element
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        const viewport = document.querySelector('.graph-viewport');
        const isFullscreen = !!(document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement);
        
        if (isFullscreen && viewport) {
          const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
          viewport.setAttribute('data-theme', currentTheme);
          
          if (currentTheme === 'dark') {
            viewport.style.backgroundColor = '#0f172a';
          } else {
            viewport.style.backgroundColor = '#ffffff';
          }
        }
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initKnowledgeGraph();
  watchThemeChanges();
});

/**
 * Graph Metrics & SNA Centrality Calculation Module.
 * Pure JavaScript implementation with unit-checked algorithms for:
 * - Graph Density & Average Degree
 * - In-degree & Out-degree (directed mode)
 * - Connected Components (BFS component discovery)
 * - Degree Centrality: C_D(v) = deg(v) / (N - 1)
 * - Betweenness Centrality (Brandes' Algorithm): C_B(v) = sum(sigma_st(v) / sigma_st)
 * - Closeness Centrality: C_C(v) = (N - 1) / sum(dist(v, u))
 * - BFS and DFS traversal sequences
 */

/**
 * Builds an adjacency list from nodes and edges.
 */
export function buildAdjacencyList(nodes = [], edges = [], isDirected = false) {
  const adj = new Map();
  const inAdj = new Map();
  const nodeSet = new Set();

  nodes.forEach(n => {
    const id = String(n.id || n);
    adj.set(id, new Set());
    inAdj.set(id, new Set());
    nodeSet.add(id);
  });

  edges.forEach(e => {
    const u = String(e.source);
    const v = String(e.target);
    if (!adj.has(u)) {
      adj.set(u, new Set());
      inAdj.set(u, new Set());
      nodeSet.add(u);
    }
    if (!adj.has(v)) {
      adj.set(v, new Set());
      inAdj.set(v, new Set());
      nodeSet.add(v);
    }

    adj.get(u).add(v);
    inAdj.get(v).add(u);

    if (!isDirected) {
      adj.get(v).add(u);
      inAdj.get(u).add(v);
    }
  });

  return { adj, inAdj, nodes: Array.from(nodeSet) };
}

/**
 * Calculates Connected Components using BFS.
 */
export function findConnectedComponents(nodes = [], adj) {
  const visited = new Set();
  const components = [];

  nodes.forEach(nodeId => {
    if (!visited.has(nodeId)) {
      const comp = [];
      const queue = [nodeId];
      visited.add(nodeId);

      while (queue.length > 0) {
        const curr = queue.shift();
        comp.push(curr);
        const neighbors = adj.get(curr) || new Set();
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        });
      }
      components.push(comp);
    }
  });

  return components;
}

/**
 * Computes Exact Betweenness Centrality using Brandes' Algorithm (2001).
 * O(V * E) time complexity.
 */
export function computeBetweennessCentrality(nodes = [], adj, isDirected = false) {
  const C_B = {};
  nodes.forEach(v => { C_B[v] = 0.0; });

  nodes.forEach(s => {
    const S = [];
    const P = {};
    const sigma = {};
    const d = {};

    nodes.forEach(w => {
      P[w] = [];
      sigma[w] = 0;
      d[w] = -1;
    });

    sigma[s] = 1;
    d[s] = 0;
    const Q = [s];

    while (Q.length > 0) {
      const v = Q.shift();
      S.push(v);
      const neighbors = adj.get(v) || new Set();

      neighbors.forEach(w => {
        // Path discovery
        if (d[w] < 0) {
          Q.push(w);
          d[w] = d[v] + 1;
        }
        // Path counting
        if (d[w] === d[v] + 1) {
          sigma[w] += sigma[v];
          P[w].push(v);
        }
      });
    }

    // Accumulation: back-propagation of dependencies
    const delta = {};
    nodes.forEach(w => { delta[w] = 0.0; });

    while (S.length > 0) {
      const w = S.pop();
      P[w].forEach(v => {
        delta[v] += (sigma[v] / sigma[w]) * (1.0 + delta[w]);
      });
      if (w !== s) {
        C_B[w] += delta[w];
      }
    }
  });

  // Normalization for undirected graphs: divide by 2
  const N = nodes.length;
  const scale = (!isDirected && N > 2) ? 1.0 / ((N - 1) * (N - 2)) : (N > 2 ? 1.0 / ((N - 1) * (N - 2)) : 1.0);

  const normalized = {};
  nodes.forEach(v => {
    const raw = !isDirected ? C_B[v] / 2.0 : C_B[v];
    normalized[v] = N > 2 ? raw * (scale * 2.0) : raw;
  });

  return normalized;
}

/**
 * Computes Closeness Centrality.
 * C_C(v) = (N - 1) / sum(d(v, u)) for reachable nodes.
 */
export function computeClosenessCentrality(nodes = [], adj) {
  const C_C = {};
  const N = nodes.length;

  nodes.forEach(s => {
    const dist = {};
    nodes.forEach(v => { dist[v] = -1; });
    dist[s] = 0;
    const queue = [s];

    let totalDist = 0;
    let reachableCount = 0;

    while (queue.length > 0) {
      const v = queue.shift();
      const neighbors = adj.get(v) || new Set();

      neighbors.forEach(w => {
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1;
          totalDist += dist[w];
          reachableCount += 1;
          queue.push(w);
        }
      });
    }

    if (reachableCount > 0 && totalDist > 0) {
      // Wasserman & Faust formula for potentially disconnected graphs
      const rawCloseness = reachableCount / totalDist;
      C_C[s] = rawCloseness * (reachableCount / Math.max(N - 1, 1));
    } else {
      C_C[s] = 0.0;
    }
  });

  return C_C;
}

/**
 * Full SNA Metrics Suite calculation.
 */
export function computeGraphMetrics(nodes = [], edges = [], isDirected = false) {
  const { adj, inAdj, nodes: allNodeIds } = buildAdjacencyList(nodes, edges, isDirected);
  const N = allNodeIds.length;
  const E = edges.length;

  // Density
  let density = 0.0;
  if (N > 1) {
    density = isDirected
      ? E / (N * (N - 1))
      : (2.0 * E) / (N * (N - 1));
  }

  // Degrees
  const inDegreeMap = {};
  const outDegreeMap = {};
  const totalDegreeMap = {};
  const degreeCentralityMap = {};

  let sumDegree = 0;
  let sumInDegree = 0;
  let sumOutDegree = 0;

  allNodeIds.forEach(id => {
    const outDeg = (adj.get(id) || new Set()).size;
    const inDeg = (inAdj.get(id) || new Set()).size;
    const deg = isDirected ? outDeg + inDeg : outDeg;

    outDegreeMap[id] = outDeg;
    inDegreeMap[id] = inDeg;
    totalDegreeMap[id] = deg;

    sumOutDegree += outDeg;
    sumInDegree += inDeg;
    sumDegree += deg;

    degreeCentralityMap[id] = N > 1 ? deg / (N - 1) : 0.0;
  });

  const avgDegree = N > 0 ? (isDirected ? sumOutDegree / N : (2.0 * E) / N) : 0.0;
  const avgInDegree = N > 0 ? sumInDegree / N : 0.0;
  const avgOutDegree = N > 0 ? sumOutDegree / N : 0.0;

  // Components
  const components = findConnectedComponents(allNodeIds, adj);

  // Centralities
  const betweennessMap = computeBetweennessCentrality(allNodeIds, adj, isDirected);
  const closenessMap = computeClosenessCentrality(allNodeIds, adj);

  return {
    totalNodes: N,
    totalEdges: E,
    density: Math.min(Math.max(density, 0.0), 1.0),
    numConnectedComponents: components.length,
    components,
    averageDegree: avgDegree,
    averageInDegree: avgInDegree,
    averageOutDegree: avgOutDegree,
    inDegreeMap,
    outDegreeMap,
    totalDegreeMap,
    degreeCentralityMap,
    betweennessMap,
    closenessMap,
    isDirected,
  };
}

/**
 * Step-by-Step Breadth-First Search (BFS) Traversal Order.
 * Returns { visitedOrder, edgeSequence, distances }
 */
export function getBfsTraversal(startNodeId, nodes = [], edges = [], isDirected = false) {
  const { adj } = buildAdjacencyList(nodes, edges, isDirected);
  const start = String(startNodeId);
  if (!adj.has(start)) return { visitedOrder: [], edgeSequence: [], distances: {} };

  const visited = new Set([start]);
  const queue = [start];
  const visitedOrder = [start];
  const edgeSequence = [];
  const distances = { [start]: 0 };

  while (queue.length > 0) {
    const curr = queue.shift();
    const neighbors = Array.from(adj.get(curr) || []).sort();

    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        visitedOrder.push(neighbor);
        edgeSequence.push({ from: curr, to: neighbor });
        distances[neighbor] = distances[curr] + 1;
        queue.push(neighbor);
      }
    });
  }

  return { visitedOrder, edgeSequence, distances };
}

/**
 * Step-by-Step Depth-First Search (DFS) Traversal Order.
 * Returns { visitedOrder, edgeSequence, discoveryTime }
 */
export function getDfsTraversal(startNodeId, nodes = [], edges = [], isDirected = false) {
  const { adj } = buildAdjacencyList(nodes, edges, isDirected);
  const start = String(startNodeId);
  if (!adj.has(start)) return { visitedOrder: [], edgeSequence: [] };

  const visited = new Set();
  const visitedOrder = [];
  const edgeSequence = [];

  function dfs(curr, prev = null) {
    visited.add(curr);
    visitedOrder.push(curr);
    if (prev) {
      edgeSequence.push({ from: prev, to: curr });
    }

    const neighbors = Array.from(adj.get(curr) || []).sort();
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        dfs(neighbor, curr);
      }
    });
  }

  dfs(start);
  return { visitedOrder, edgeSequence };
}

/**
 * Computes N-Hop Neighborhood Nodes from a designated center node.
 */
export function getNHopNeighborhood(centerNodeId, maxHops = 1, nodes = [], edges = [], isDirected = false) {
  const { adj } = buildAdjacencyList(nodes, edges, isDirected);
  const start = String(centerNodeId);
  const result = new Set([start]);
  const hopMap = { [start]: 0 };

  if (!adj.has(start)) return { nodeIds: Array.from(result), hopMap };

  let currentFrontier = [start];

  for (let hop = 1; hop <= maxHops; hop++) {
    const nextFrontier = [];
    currentFrontier.forEach(u => {
      const neighbors = adj.get(u) || new Set();
      neighbors.forEach(v => {
        if (!result.has(v)) {
          result.add(v);
          hopMap[v] = hop;
          nextFrontier.push(v);
        }
      });
    });
    currentFrontier = nextFrontier;
    if (currentFrontier.length === 0) break;
  }

  return { nodeIds: Array.from(result), hopMap };
}

/**
 * Unit Check verification on a known test graph:
 * Kite Graph (4 nodes: A, B, C, D with edges A-B, B-C, A-C, C-D).
 * Node C is the bridge to D.
 * Exact analytical properties:
 * - N = 4, E = 4
 * - Degrees: A: 2, B: 2, C: 3, D: 1
 * - Degree centrality: A: 2/3 (0.667), B: 2/3 (0.667), C: 3/3 (1.000), D: 1/3 (0.333)
 * - Betweenness: C has highest betweenness (only node connecting D to {A, B}), C = 2/3 = 0.667 (or 2.0 unnormalized)
 * - Components = 1
 * - Density: 2*4 / (4*3) = 8/12 = 0.667
 */
export function runGraphMetricsUnitCheck() {
  const testNodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }];
  const testEdges = [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' },
    { source: 'A', target: 'C' },
    { source: 'C', target: 'D' },
  ];

  const metrics = computeGraphMetrics(testNodes, testEdges, false);
  const bfs = getBfsTraversal('A', testNodes, testEdges, false);
  const dfs = getDfsTraversal('A', testNodes, testEdges, false);

  const checks = {
    nodesCountCorrect: metrics.totalNodes === 4,
    edgesCountCorrect: metrics.totalEdges === 4,
    componentsCountCorrect: metrics.numConnectedComponents === 1,
    densityCorrect: Math.abs(metrics.density - 0.6667) < 0.005,
    cHighestBetweenness: metrics.betweennessMap['C'] > metrics.betweennessMap['A'] && metrics.betweennessMap['C'] > metrics.betweennessMap['D'],
    dDegreeIsOne: metrics.totalDegreeMap['D'] === 1,
    cDegreeIsThree: metrics.totalDegreeMap['C'] === 3,
    bfsOrderValid: bfs.visitedOrder[0] === 'A' && bfs.visitedOrder.includes('D'),
    dfsOrderValid: dfs.visitedOrder[0] === 'A' && dfs.visitedOrder.length === 4,
  };

  const allPassed = Object.values(checks).every(Boolean);
  return { allPassed, checks, metrics, bfs, dfs };
}

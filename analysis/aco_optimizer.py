"""
Ant Colony Optimization (ACO) Path Optimizer.

========================================================================================
ALGORITHMIC OBJECTIVE & PROBLEM FORMULATION:
In maritime network analysis, covert transfers and multi-tier STS operations frequently
occur across multi-hop relay chains (Origin -> Intermediary Feeders -> Destination).

The objective of this ACO module is:
    Given a source vessel S and destination vessel D in graph G, find the optimal
    multi-hop path P = (v_0, v_1, ..., v_k) that maximizes the cumulative interaction
    risk and rendezvous likelihood while penalizing path resistance.

FORMAL MATHEMATICAL SPECIFICATION:
    1. Heuristic Desirability (eta_ij):
       eta_ij = (edge_risk_ij * log(1 + interaction_count_ij)) / (distance_nm_ij + 0.1)
    2. Pheromone Trail (tau_ij):
       Initialized uniformly to tau_0.
    3. Transition Probability:
       P_ij^k = [tau_ij]^alpha * [eta_ij]^beta / sum_l([tau_il]^alpha * [eta_il]^beta)
    4. Pheromone Evaporation & Update:
       tau_ij <- (1 - rho) * tau_ij + sum_k(Delta_tau_ij^k)
       where Delta_tau_ij = Q * Path_Fitness

ACADEMIC & ETHICAL DISCLAIMER:
    ACO is an exploratory graph-path optimization heuristic. The discovery of a path
    does NOT prove or establish that any vessel along the path is participating in
    illicit activities or belongs to a shadow fleet. It is an analytical tool to surface
    plausible interaction chains for human maritime domain expert review.
========================================================================================
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple, Union
import math
import random
import networkx as nx


@dataclass
class ACOResult:
    """Encapsulates the output of an ACO graph path optimization run."""
    source: str
    destination: str
    best_path: List[str]
    best_path_vessel_names: List[str]
    path_fitness: float
    total_hops: int
    cumulative_risk: float
    convergence_history: List[float]
    iterations_run: int
    found_valid_path: bool
    disclaimer: str = (
        "ACO is an exploratory path search heuristic. Discovered paths do NOT constitute "
        "proof of illicit activity or shadow fleet membership."
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert result to JSON-serializable dictionary for API responses."""
        return {
            "source": self.source,
            "destination": self.destination,
            "best_path": self.best_path,
            "best_path_vessel_names": self.best_path_vessel_names,
            "path_fitness": round(self.path_fitness, 4),
            "total_hops": self.total_hops,
            "cumulative_risk": round(self.cumulative_risk, 4),
            "iterations_run": self.iterations_run,
            "found_valid_path": self.found_valid_path,
            "disclaimer": self.disclaimer,
        }


class AntColonyPathOptimizer:
    """
    Ant Colony Optimization algorithm applied to Maritime Vessel Interaction Graphs.
    """

    def __init__(
        self,
        graph: Union[nx.Graph, nx.DiGraph],
        num_ants: int = 15,
        num_iterations: int = 30,
        alpha: float = 1.0,        # Pheromone importance factor
        beta: float = 2.0,         # Heuristic desirability importance factor
        evaporation_rate: float = 0.2,  # Pheromone evaporation rate (rho)
        q_deposit: float = 10.0,   # Pheromone deposit scaling factor
        initial_pheromone: float = 1.0,
        seed: Optional[int] = 42,
    ):
        """
        Initialize the Ant Colony Optimizer.

        Args:
            graph: NetworkX graph with node and edge attributes.
            num_ants: Number of ants deployed per iteration.
            num_iterations: Number of optimization cycles.
            alpha: Weight of pheromone concentration in transition rule.
            beta: Weight of local heuristic desirability in transition rule.
            evaporation_rate: Fraction of pheromone evaporated each iteration (0 < rho < 1).
            q_deposit: Base quantity of pheromone deposited by successful ants.
            initial_pheromone: Initial uniform pheromone level on all edges.
            seed: Random seed for deterministic reproducibility.
        """
        self.graph = graph
        self.num_ants = num_ants
        self.num_iterations = num_iterations
        self.alpha = alpha
        self.beta = beta
        self.evaporation_rate = evaporation_rate
        self.q_deposit = q_deposit
        self.initial_pheromone = initial_pheromone
        self.seed = seed

        if seed is not None:
            random.seed(seed)

        # Initialize pheromone map on undirected/directed edge keys
        self.pheromones: Dict[Tuple[str, str], float] = {}
        self.heuristics: Dict[Tuple[str, str], float] = {}
        self._initialize_graph_attributes()

    def _edge_key(self, u: str, v: str) -> Tuple[str, str]:
        """Normalize edge key based on graph directedness."""
        if self.graph.is_directed():
            return (u, v)
        return (u, v) if u <= v else (v, u)

    def _initialize_graph_attributes(self) -> None:
        """Precompute heuristic values and initialize uniform pheromone trails."""
        for u, v, data in self.graph.edges(data=True):
            key = self._edge_key(u, v)
            self.pheromones[key] = self.initial_pheromone

            # Heuristic calculation: higher interaction risk & count, shorter distance = higher desirability
            risk = data.get("interaction_risk", 0.5)
            count = data.get("interaction_count", 1)
            dist = data.get("avg_distance_nm", 0.5)

            # Heuristic formula (safely non-zero)
            eta = (risk * math.log1p(count)) / (dist + 0.1)
            self.heuristics[key] = max(eta, 0.01)

    def _calculate_path_fitness(self, path: List[str]) -> Tuple[float, float]:
        """
        Evaluate path fitness:
            Cumulative Risk: sum of interaction_risk along edges.
            Fitness: Cumulative Risk penalized by path length (to encourage efficient chains).
        """
        if len(path) < 2:
            return 0.0, 0.0

        cum_risk = 0.0
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            data = self.graph.get_edge_data(u, v, default={})
            cum_risk += data.get("interaction_risk", 0.5)

        hops = len(path) - 1
        # Fitness balances cumulative risk with parsimony (hops penalty)
        fitness = cum_risk / math.sqrt(hops)
        return fitness, cum_risk

    def _ant_search(self, source: str, destination: str, max_steps: int) -> Optional[List[str]]:
        """A single ant attempts to build a path from source to destination without looping."""
        current = source
        path = [current]
        visited = {current}

        while current != destination and len(path) < max_steps:
            neighbors = [n for n in self.graph.neighbors(current) if n not in visited]
            if not neighbors:
                # Dead end reached
                return None

            # Calculate transition probabilities
            weights = []
            for nbr in neighbors:
                key = self._edge_key(current, nbr)
                tau = self.pheromones.get(key, self.initial_pheromone)
                eta = self.heuristics.get(key, 0.01)
                prob = (tau ** self.alpha) * (eta ** self.beta)
                weights.append(prob)

            total_weight = sum(weights)
            if total_weight <= 0.0:
                next_node = random.choice(neighbors)
            else:
                probabilities = [w / total_weight for w in weights]
                next_node = random.choices(neighbors, weights=probabilities, k=1)[0]

            path.append(next_node)
            visited.add(next_node)
            current = next_node

        return path if current == destination else None

    def find_optimal_path(
        self,
        source: str,
        destination: str,
        max_hops: Optional[int] = None,
    ) -> ACOResult:
        """
        Execute the ACO path search from source MMSI to destination MMSI.

        Args:
            source: MMSI string of source vessel.
            destination: MMSI string of target vessel.
            max_hops: Maximum permitted path length (default: number of nodes).

        Returns:
            ACOResult object with path details, fitness, and convergence history.
        """
        source = str(source)
        destination = str(destination)

        # Sanity checks
        if not self.graph.has_node(source):
            raise ValueError(f"Source vessel MMSI {source} not present in graph.")
        if not self.graph.has_node(destination):
            raise ValueError(f"Destination vessel MMSI {destination} not present in graph.")

        # Check reachability in component
        if not nx.has_path(self.graph, source, destination):
            return ACOResult(
                source=source,
                destination=destination,
                best_path=[],
                best_path_vessel_names=[],
                path_fitness=0.0,
                total_hops=0,
                cumulative_risk=0.0,
                convergence_history=[],
                iterations_run=0,
                found_valid_path=False,
            )

        if max_hops is None:
            max_hops = max(self.graph.number_of_nodes(), 5)

        global_best_path: Optional[List[str]] = None
        global_best_fitness = -1.0
        global_best_cum_risk = 0.0
        convergence_history: List[float] = []

        for iteration in range(self.num_iterations):
            iteration_paths: List[Tuple[List[str], float, float]] = []

            # 1. Ants construct solutions
            for _ in range(self.num_ants):
                path = self._ant_search(source, destination, max_steps=max_hops)
                if path is not None:
                    fitness, cum_risk = self._calculate_path_fitness(path)
                    iteration_paths.append((path, fitness, cum_risk))

            # 2. Update global best if an ant found an improved path
            if iteration_paths:
                iter_best_path, iter_best_fitness, iter_cum_risk = max(
                    iteration_paths, key=lambda item: item[1]
                )
                if iter_best_fitness > global_best_fitness:
                    global_best_fitness = iter_best_fitness
                    global_best_path = iter_best_path
                    global_best_cum_risk = iter_cum_risk

            convergence_history.append(
                global_best_fitness if global_best_fitness > 0 else 0.0
            )

            # 3. Pheromone Evaporation
            for key in self.pheromones:
                self.pheromones[key] *= (1.0 - self.evaporation_rate)
                # Keep floor on pheromones to prevent stagnation
                self.pheromones[key] = max(self.pheromones[key], 0.001)

            # 4. Pheromone Deposit by successful paths
            for path, fitness, _ in iteration_paths:
                deposit = (self.q_deposit * fitness) / len(path)
                for i in range(len(path) - 1):
                    key = self._edge_key(path[i], path[i + 1])
                    if key in self.pheromones:
                        self.pheromones[key] += deposit

            # Elitist reinforcement for global best path
            if global_best_path is not None:
                elite_deposit = self.q_deposit * global_best_fitness
                for i in range(len(global_best_path) - 1):
                    key = self._edge_key(global_best_path[i], global_best_path[i + 1])
                    if key in self.pheromones:
                        self.pheromones[key] += elite_deposit

        # If no ant found destination, fallback to shortest path as baseline
        if global_best_path is None:
            if nx.has_path(self.graph, source, destination):
                fallback = nx.shortest_path(self.graph, source, destination)
                fit, risk = self._calculate_path_fitness(fallback)
                global_best_path = fallback
                global_best_fitness = fit
                global_best_cum_risk = risk

        # Resolve vessel names
        names = []
        if global_best_path:
            for node in global_best_path:
                node_data = self.graph.nodes.get(node, {})
                names.append(node_data.get("vessel_name", f"MMSI_{node}"))

        return ACOResult(
            source=source,
            destination=destination,
            best_path=global_best_path or [],
            best_path_vessel_names=names,
            path_fitness=global_best_fitness if global_best_fitness > 0 else 0.0,
            total_hops=len(global_best_path) - 1 if global_best_path else 0,
            cumulative_risk=global_best_cum_risk,
            convergence_history=convergence_history,
            iterations_run=self.num_iterations,
            found_valid_path=bool(global_best_path),
        )

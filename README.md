# Shadow Fleet Detection — Social Network Analysis (SNA) & Ant Colony Optimization (ACO) Module

**Team Project**: Shadow Fleet Detection using AIS Data, Social Network Analysis (SNA), and Ant Colony Optimization (ACO)  
**Assigned Subsystem**: Member 3 — Network Modeling, Centrality Metrics, Composite Risk Scoring, and ACO Path Optimization  

---

## 1. Important Disclaimers & Ethics

> [!IMPORTANT]
> **Synthetic Illustrative Data Only**:
> All vessel names, MMSI identifiers, timestamps, geographic positions, and interaction events in this repository are **strictly synthetic illustrative mock data** generated for algorithmic verification and software architecture design. No real vessels, AIS broadcasts, or real-world maritime entities are represented or accused of wrongdoing.

> [!CAUTION]
> **ACO & SNA Algorithmic Scope**:
> Ant Colony Optimization (ACO) is utilized strictly as a **heuristic graph-path search algorithm** to identify plausible multi-hop transfer chains and interaction pathways between vessels. **ACO and SNA metrics do NOT prove that a vessel is part of a shadow fleet, illicit operation, or sanctions evasion scheme.** All metrics serve exclusively as exploratory triage tools to assist human maritime analysts in prioritizing investigations.

---

## 2. Architecture & File Structure

```text
shadow-fleet-sna/
├── data/
│   ├── sample_vessels.csv           # Synthetic vessel metadata (MMSI, flag, type, risk factors)
│   └── sample_interactions.csv      # Synthetic interaction logs (STS, proximity, durations)
├── analysis/
│   ├── __init__.py                  # Clean public exports for external integration
│   ├── graph_builder.py             # NetworkX graph construction from DataFrames/CSVs
│   ├── sna_metrics.py               # Degree, betweenness, closeness, clustering, components
│   ├── risk_scoring.py              # Explainable composite network risk index
│   └── aco_optimizer.py             # Ant Colony Optimization multi-hop path search
├── tests/
│   ├── __init__.py
│   ├── test_graph_builder.py        # Unit tests for graph construction & attributes
│   ├── test_sna_metrics.py          # Unit tests for centrality & components
│   ├── test_risk_scoring.py         # Unit tests for score normalization & tiers
│   ├── test_aco_optimizer.py        # Unit tests for ACO path validity & convergence
│   └── test_pipeline.py             # End-to-end integration test of entire pipeline
├── main.py                          # Full runnable demo and visualization generator
├── requirements.txt                 # Project dependencies
└── README.md                        # Documentation and team integration guide
```

---

## 3. Mathematical & Algorithmic Methodology

### A. Graph Formulation
We model the maritime domain as an attributed graph $G = (V, E)$:
- **Nodes ($V$)**: Individual vessels indexed by synthetic MMSI. Attributes include flag state, vessel category, flag-of-convenience risk weight ($I_{\text{flag}}$), dark AIS gap count ($N_{\text{gap}}$), and spoofing discrepancy count ($N_{\text{spf}}$).
- **Edges ($E$)**: Bilateral observed rendezvous events (e.g., Ship-to-Ship transfers, loitering proximity, bunkering). Attributes include interaction frequency, average duration in hours, proximity in nautical miles, and interaction risk score.

### B. Social Network Analysis (SNA) Centralities
1. **Degree Centrality ($C_{\text{deg}}$)**:
   $$C_{\text{deg}}(v) = \frac{\text{deg}(v)}{|V| - 1}$$
   Identifies high-density hub vessels engaging in frequent bilateral rendezvous.
2. **Betweenness Centrality ($C_{\text{bet}}$)**:
   $$C_{\text{bet}}(v) = \sum_{s \neq v \neq t} \frac{\sigma_{st}(v)}{\sigma_{st}}$$
   Identifies crucial "bridge" or intermediary feeder vessels connecting disparate maritime subgraphs or facilitating multi-hop transfer chains.
3. **Connected Components**:
   Partitions the graph into disjoint subgraphs $\mathcal{C}_1, \mathcal{C}_2, \dots$ to isolate independent clusters of activity from benign traffic.

### C. Composite Network Risk Scoring
Combines topological network metrics with vessel behavioral indicators into an interpretable index $S_{\text{risk}} \in [0.0, 1.0]$:
$$S_{\text{risk}} = w_{\text{deg}} \cdot C_{\text{deg}} + w_{\text{bet}} \cdot C_{\text{bet}} + w_{\text{flag}} \cdot I_{\text{flag}} + w_{\text{gap}} \cdot \tilde{N}_{\text{gap}} + w_{\text{spf}} \cdot \tilde{N}_{\text{spf}}$$

**Risk Tiers**:
- `CRITICAL_MONITORING`: $S_{\text{risk}} \ge 0.65$
- `ELEVATED_ATTENTION`: $0.45 \le S_{\text{risk}} < 0.65$
- `MODERATE_INTERACTION`: $0.25 \le S_{\text{risk}} < 0.45$
- `BASELINE_LEGITIMATE`: $S_{\text{risk}} < 0.25$

### D. Ant Colony Optimization (ACO) Graph Pathfinder
- **Objective**: Given a designated origin tanker $S$ and destination terminal/vessel $D$, find the optimal multi-hop transfer pathway $P = (v_0, v_1, \dots, v_k)$ maximizing cumulative interaction risk while avoiding unnecessary detour hops:
  $$\text{Fitness}(P) = \frac{\sum_{(u, v) \in P} \text{interaction\_risk}(u, v)}{\sqrt{k}}$$
- **Heuristic Desirability ($\eta_{ij}$)**:
  $$\eta_{ij} = \frac{\text{risk}_{ij} \cdot \ln(1 + \text{count}_{ij})}{\text{distance}_{ij} + 0.1}$$
- **State Transition Rule**:
  $$p_{ij}^k = \frac{[\tau_{ij}]^\alpha \cdot [\eta_{ij}]^\beta}{\sum_{l \in \mathcal{N}_i^{\text{unvisited}}} [\tau_{il}]^\alpha \cdot [\eta_{il}]^\beta}$$
- **Pheromone Update & Evaporation**:
  $$\tau_{ij} \leftarrow (1 - \rho)\tau_{ij} + \sum_k \Delta \tau_{ij}^k + \Delta \tau_{ij}^{\text{elite}}$$

---

## 4. Setup & Execution Instructions

### Prerequisites
- Python 3.10+
- Activated Virtual Environment (`.venv`)

### 1. Install Dependencies
```bash
cd shadow-fleet-sna
pip install -r requirements.txt
```

### 2. Run the Full Pipeline Demonstration
```bash
python main.py
```
This will:
1. Ingest synthetic vessel metadata and interaction logs.
2. Construct the NetworkX interaction graph and output topological summary statistics.
3. Calculate degree and betweenness centralities, identifying high-risk bridge vessels.
4. Compute composite network risk scores with primary driver explanations.
5. Execute the ACO pathfinder from origin to destination.
6. Export an annotated network visualization plot to `network_visualization.png`.

### 3. Run the Test Suite
Run all unit and integration tests using `pytest`:
```bash
pytest tests/ -v
```
Or using Python's built-in `unittest` runner:
```bash
python -m unittest discover tests -v
```

---

## 5. Team Integration Guide

This module is designed for clean decoupled integration into your team's shared repository and backend services:

### Integration with Member 1 (AIS Ingestion & Cleaning)
Member 1 can directly pass a cleaned Pandas DataFrame of rendezvous events to `build_vessel_graph`:
```python
from analysis.graph_builder import build_vessel_graph

# Replace synthetic data with Member 1's processed DataFrame
G = build_vessel_graph(member1_vessels_df, member1_interactions_df)
```

### Integration with Member 2 (ML / Behavioral Anomaly Detection)
Member 2's anomaly probabilities can be supplied to `compute_composite_risk_scores` as custom risk weights or node attributes:
```python
from analysis.risk_scoring import compute_composite_risk_scores

# Adjust weights to prioritize Member 2's ML anomaly indicators
custom_weights = {
    "weight_degree": 0.15,
    "weight_betweenness": 0.25,
    "weight_flag": 0.20,
    "weight_ais_gaps": 0.20,
    "weight_spoofing": 0.20,
}
scored_df = compute_composite_risk_scores(sna_df, weights=custom_weights)
```

### Integration with Backend API (FastAPI / Flask)
All modules provide JSON-serializable outputs for REST endpoints:
```python
from fastapi import FastAPI
from analysis.sna_metrics import export_metrics_to_dict
from analysis.aco_optimizer import AntColonyPathOptimizer

app = FastAPI()

@app.get("/api/vessels/centrality")
def get_vessel_centralities():
    return export_metrics_to_dict(sna_df)

@app.post("/api/optimizer/aco-path")
def run_aco_path(source: str, destination: str):
    aco = AntColonyPathOptimizer(G)
    result = aco.find_optimal_path(source, destination)
    return result.to_dict()  # Includes disclaimer and hops
```

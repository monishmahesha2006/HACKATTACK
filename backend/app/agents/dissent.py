from typing import Any, Dict, List, Tuple
from scipy.stats import kendalltau

class DissentEngine:
    """Computes structural and ranking dissent between two candidate plans."""

    def compute_dissent(
        self,
        plan_a_steps: List[Dict[str, Any]],
        plan_b_steps: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        tools_a = [s.get("tool") for s in plan_a_steps]
        tools_b = [s.get("tool") for s in plan_b_steps]

        differing_decisions = []

        # Compare tool sequence and presence
        set_a = set(tools_a)
        set_b = set(tools_b)
        
        only_in_a = set_a - set_b
        only_in_b = set_b - set_a

        if only_in_a:
            differing_decisions.append(f"Planner A selected tools not in Planner B: {', '.join(only_in_a)}")
        if only_in_b:
            differing_decisions.append(f"Planner B selected tools not in Planner A: {', '.join(only_in_b)}")

        # Check ordering of shared tools
        shared_tools = [t for t in tools_a if t in set_b]
        if len(shared_tools) >= 2:
            ranks_a = [tools_a.index(t) for t in shared_tools]
            ranks_b = [tools_b.index(t) for t in shared_tools]
            tau, _ = kendalltau(ranks_a, ranks_b)
            # Tau is between -1 and 1; map to dissent score (0 to 1)
            tau_val = 1.0 if (tau is None or str(tau) == "nan") else tau
            order_dissent = max(0.0, min(1.0, (1.0 - tau_val) / 2.0))
        else:
            order_dissent = 0.0

        # Structural set difference
        jaccard = len(set_a.intersection(set_b)) / len(set_a.union(set_b)) if set_a.union(set_b) else 1.0
        structural_dissent = 1.0 - jaccard

        # Overall dissent score
        overall_dissent = round(0.6 * structural_dissent + 0.4 * order_dissent, 3)

        if not differing_decisions and overall_dissent < 0.15:
            differing_decisions.append("Both planners converged on identical DAG structure and tool precedence.")

        return {
            "score": overall_dissent,
            "differing_decisions": differing_decisions
        }

dissent_engine = DissentEngine()

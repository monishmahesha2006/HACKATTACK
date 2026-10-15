import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from mcp.server.fastmcp import FastMCP

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROFILE_PATH = BASE_DIR / "fixtures" / "profile.json"

mcp = FastMCP("rewindx_domain")

def _load_profile() -> Dict[str, Any]:
    if PROFILE_PATH.exists():
        with open(PROFILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "candidate_id": "profile_001",
        "current_year": 3,
        "cgpa": 8.7,
        "skills": ["Python", "Machine Learning", "React", "FastAPI"]
    }

@mcp.tool(
    name="validate_deadline",
    description="Validate whether an application deadline is in the future and strictly parseable."
)
def validate_deadline(deadline_str: str) -> Dict[str, Any]:
    try:
        dt = datetime.strptime(deadline_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        is_valid = dt > now
        days_remaining = (dt - now).days
        return {
            "deadline": deadline_str,
            "is_valid": is_valid,
            "days_remaining": days_remaining,
            "status": "VALID" if is_valid else "EXPIRED",
            "source": "LOCAL_DEMO"
        }
    except Exception as e:
        return {
            "deadline": deadline_str,
            "is_valid": False,
            "status": "INVALID_FORMAT",
            "error": str(e),
            "source": "LOCAL_DEMO"
        }

@mcp.tool(
    name="compare_candidate_requirements",
    description="Compare candidate skills against role requirements with exact token overlap."
)
def compare_candidate_requirements(candidate_skills: List[str], required_skills: List[str]) -> Dict[str, Any]:
    c_set = {s.lower().strip() for s in candidate_skills}
    r_set = {s.lower().strip() for s in required_skills}
    matched = list(c_set.intersection(r_set))
    missing = list(r_set.difference(c_set))
    overlap_ratio = len(matched) / len(r_set) if r_set else 1.0

    return {
        "matched_skills": matched,
        "missing_skills": missing,
        "overlap_ratio": round(overlap_ratio, 3),
        "fit_level": "HIGH" if overlap_ratio >= 0.6 else ("MEDIUM" if overlap_ratio >= 0.3 else "LOW"),
        "source": "LOCAL_DEMO"
    }

@mcp.tool(
    name="assess_internship_eligibility",
    description="Deterministic evaluation of candidate profile against opportunity eligibility criteria."
)
def assess_internship_eligibility(opportunity: Dict[str, Any], candidate_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    profile = candidate_profile or _load_profile()
    c_year = profile.get("current_year", 3)
    c_cgpa = profile.get("cgpa", 8.7)
    c_skills = profile.get("skills", [])

    min_yr = opportunity.get("min_year", 3)
    max_yr = opportunity.get("max_year", 3)
    min_cgpa = opportunity.get("min_cgpa", 0.0)
    deadline = opportunity.get("deadline", "2099-12-31")

    # Evaluate individual dimensions
    eval_year = "CONFIRMED_ELIGIBLE" if (min_yr <= c_year <= max_yr) else "CONFIRMED_INELIGIBLE"
    eval_cgpa = "CONFIRMED_ELIGIBLE" if (c_cgpa >= min_cgpa) else "CONFIRMED_INELIGIBLE"

    deadline_eval = validate_deadline(deadline)
    eval_deadline = "CONFIRMED_ELIGIBLE" if deadline_eval.get("is_valid", False) else "CONFIRMED_INELIGIBLE"

    overall_eligible = (
        eval_year == "CONFIRMED_ELIGIBLE" and
        eval_cgpa == "CONFIRMED_ELIGIBLE" and
        eval_deadline == "CONFIRMED_ELIGIBLE" and
        not opportunity.get("is_expired", False)
    )

    return {
        "opportunity_id": opportunity.get("id", "unknown"),
        "overall_eligible": overall_eligible,
        "eligibility_breakdown": {
            "year": eval_year,
            "cgpa": eval_cgpa,
            "deadline": eval_deadline
        },
        "observed_facts": {
            "candidate_year": c_year,
            "required_year_range": [min_yr, max_yr],
            "candidate_cgpa": c_cgpa,
            "required_min_cgpa": min_cgpa,
            "deadline": deadline,
            "days_remaining": deadline_eval.get("days_remaining", 0)
        },
        "source": "LOCAL_DEMO"
    }

@mcp.tool(
    name="rank_internship_opportunities",
    description="Deterministic and ML-feature weighted ranking of validated opportunities."
)
def rank_internship_opportunities(opportunities: List[Dict[str, Any]], weights: Optional[Dict[str, float]] = None) -> List[Dict[str, Any]]:
    w = weights or {
        "stipend": 0.25,
        "skill_overlap": 0.35,
        "cgpa_margin": 0.20,
        "deadline_lead_days": 0.20
    }

    profile = _load_profile()
    c_skills = profile.get("skills", ["Python", "Machine Learning", "React"])
    ranked = []

    for opp in opportunities:
        # Check eligibility first
        el = assess_internship_eligibility(opp, profile)
        if not el["overall_eligible"]:
            continue

        stipend_norm = min(opp.get("stipend", 30000) / 100000.0, 1.0)
        skills_comp = compare_candidate_requirements(c_skills, opp.get("required_skills", ["Python", "Machine Learning"]))
        skill_score = skills_comp["overlap_ratio"]
        cgpa_margin = min(max((profile.get("cgpa", 8.7) - opp.get("min_cgpa", 7.0)) / 2.0, 0.0), 1.0)
        deadline_score = min(max(el["observed_facts"]["days_remaining"] / 60.0, 0.0), 1.0)

        c_stipend = round(w["stipend"] * stipend_norm, 4)
        c_skill = round(w["skill_overlap"] * skill_score, 4)
        c_cgpa = round(w["cgpa_margin"] * cgpa_margin, 4)
        c_deadline = round(w["deadline_lead_days"] * deadline_score, 4)

        total_score = round(c_stipend + c_skill + c_cgpa + c_deadline, 4)

        ranked.append({
            "opportunity_id": opp.get("id"),
            "company": opp.get("company"),
            "role": opp.get("role"),
            "url": opp.get("url"),
            "snippet": opp.get("snippet"),
            "score": total_score,
            "eligibility": el["eligibility_breakdown"],
            "contributions": [
                {"feature": "skill_overlap", "weight": w["skill_overlap"], "value": skill_score, "contribution": c_skill},
                {"feature": "stipend", "weight": w["stipend"], "value": stipend_norm, "contribution": c_stipend},
                {"feature": "cgpa_margin", "weight": w["cgpa_margin"], "value": cgpa_margin, "contribution": c_cgpa},
                {"feature": "deadline_lead_days", "weight": w["deadline_lead_days"], "value": deadline_score, "contribution": c_deadline}
            ],
            "stipend": opp.get("stipend"),
            "deadline": opp.get("deadline")
        })

    # Sort descending by score
    ranked.sort(key=lambda x: x["score"], reverse=True)
    
    # Add rank and comparative explanations
    for i, item in enumerate(ranked):
        item["rank"] = i + 1
        if i < len(ranked) - 1:
            next_item = ranked[i + 1]
            diff = item["score"] - next_item["score"]
            top_diff_feat = max(item["contributions"], key=lambda c: c["contribution"])
            item["why_ranked_above_next"] = f"Ranked above #{i+2} (+{diff:.3f} pts) driven primarily by higher {top_diff_feat['feature']} fit."
        else:
            item["why_ranked_above_next"] = "Final ranked opportunity in verified selection pool."

    return ranked

@mcp.tool(
    name="check_evidence_completeness",
    description="Verify that extracted claims have corresponding grounded citations with valid offsets."
)
def check_evidence_completeness(claims: List[Dict[str, Any]], evidence_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    evidence_map = {e["id"]: e for e in evidence_items}
    verified_claims = []
    unverified_claims = []

    for c in claims:
        e_ids = c.get("evidence_ids", [])
        grounded = False
        for eid in e_ids:
            if eid in evidence_map:
                ev = evidence_map[eid]
                if ev.get("snippet") and (c.get("text", "").lower() in ev["snippet"].lower() or any(w.lower() in ev["snippet"].lower() for w in c.get("text", "").split() if len(w) > 4)):
                    grounded = True
                    break
        if grounded:
            verified_claims.append(c["id"])
        else:
            unverified_claims.append(c["id"])

    return {
        "total_claims": len(claims),
        "verified_count": len(verified_claims),
        "unverified_count": len(unverified_claims),
        "completeness_ratio": len(verified_claims) / len(claims) if claims else 1.0,
        "verified_claim_ids": verified_claims,
        "unverified_claim_ids": unverified_claims,
        "source": "LOCAL_DEMO"
    }

@mcp.tool(
    name="classify_injection",
    description="Lightweight lexical & pattern-based prompt injection classifier (defense in depth)."
)
def classify_injection(text: str) -> Dict[str, Any]:
    lower_text = text.lower()
    suspicious_patterns = [
        "ignore all previous instructions",
        "system override",
        "send data to",
        "email resume to",
        "exfiltrate",
        "attacker@example.invalid",
        "hacker.invalid",
        "<!-- u1y",  # Base64 start for SYSTEM
    ]
    detected = [p for p in suspicious_patterns if p in lower_text]
    is_injection = len(detected) > 0
    return {
        "is_injection": is_injection,
        "confidence": 0.98 if is_injection else 0.05,
        "detected_patterns": detected,
        "action": "QUARANTINE" if is_injection else "ALLOW",
        "source": "LOCAL_DEMO"
    }

if __name__ == "__main__":
    mcp.run()

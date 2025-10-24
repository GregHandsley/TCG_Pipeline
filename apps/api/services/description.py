from __future__ import annotations
from typing import Any, Dict
from services.llm import generate_text
from core.settings import settings

def _safe(x, default="—"):
    return x if (x is not None and str(x).strip() != "") else default

def _grade_summary(grade_json: Dict[str, Any] | None) -> Dict[str, Any]:
    """
    Extract a concise, buyer-friendly grading summary.
    Looks for Ximilar structure: records[0].grades.{corners,edges,surface,centering,final,condition}
    """
    out = {"corners": None, "edges": None, "surface": None, "centering": None, "final": None, "condition": None}
    if not isinstance(grade_json, dict):
        return out
    recs = grade_json.get("records") or []
    if not recs or not isinstance(recs[0], dict):
        return out
    g = recs[0].get("grades") or {}
    for k in out.keys():
        out[k] = g.get(k)
    return out

def _keywords(name: str, set_name: str, number: str, rarity: str, language: str | None, edition: str | None) -> str:
    kws = [name, set_name, f"#{number}"]
    if rarity and rarity != "—":
        kws.append(rarity)
    if language:
        kws.append(language)
    if edition:
        kws.append(edition)
    # de-dup and join
    seen, uniq = set(), []
    for k in kws:
        k = str(k).strip()
        if k and k.lower() not in seen:
            uniq.append(k)
            seen.add(k.lower())
    return ", ".join(uniq[:6])

def build_listing_description(
    id_norm: Dict[str, Any],
    grade_json: Dict[str, Any] | None,
    confidence: float,          # kept for future analytics; not shown to buyers
    needsManualReview: bool
) -> Dict[str, str]:
    """
    Build a consistent, buyer-friendly eBay description WITHOUT confidence %.
    Sections:
      - Title (short, keyword-rich)
      - Intro (benefit-forward)
      - Highlights (condition + benefits)
      - Details (set, number, language, edition, rarity)
      - Photos guidance
      - SEO keywords (invisible to buyer if you omit from your eBay template later)
      - Buyer info (shipping/returns/contact)
    """
    best = (id_norm or {}).get("best") or {}

    name     = _safe(best.get("name"), "Trading Card")
    set_name = _safe(best.get("set"), "Unknown Set")
    number   = _safe(best.get("number"), "?")
    rarity   = _safe(best.get("rarity"), "—")
    language = best.get("language") or None
    edition  = best.get("edition") or None

    # Grading summary
    gs = _grade_summary(grade_json)
    final_grade = gs.get("final")
    condition   = gs.get("condition")  # e.g., "Mint", "Near Mint"
    corners     = gs.get("corners")
    edges       = gs.get("edges")
    surface     = gs.get("surface")
    centering   = gs.get("centering")

    # ---- Title (consistent pattern) ----
    # eBay often truncates around 80–120 chars; we stay concise but rich.
    title_core = f"{name} #{number} | {set_name}"
    if rarity and rarity != "—":
        title_core += f" | {rarity}"
    if condition:
        title_core += f" | {condition}"
    title = f"[REVIEW REQUIRED] {title_core}" if needsManualReview else title_core

    # ---- Intro: benefit-forward, no confidence % ----
    intro = (
        f"{name} from the {set_name} set — professionally graded using AI-based image analysis "
        f"to provide consistent, transparent condition assessment for collectors."
    )

    # ---- Highlights (bullets) ----
    # Keep benefits first, then feature. Avoid jargon.
    highlights: list[str] = []
    if condition or final_grade:
        cond_line = "Condition: "
        parts = []
        if condition:
            parts.append(str(condition))
        if final_grade:
            parts.append(f"Final Grade: {final_grade}")
        highlights.append(cond_line + " • ".join(parts))
    # component grades
    comps = []
    if corners is not None:  comps.append(f"Corners {corners}")
    if edges is not None:    comps.append(f"Edges {edges}")
    if surface is not None:  comps.append(f"Surface {surface}")
    if centering is not None:comps.append(f"Centering {centering}")
    if comps:
        highlights.append("Subgrades: " + ", ".join(comps))
    # benefits
    highlights.append("Assessed with AI for consistent, unbiased grading — buy with confidence.")
    highlights.append("Ideal for collectors seeking quality and clarity on condition.")

    # ---- Details (plain, honest facts) ----
    details_lines: list[str] = []
    details_lines.append(f"Set: {set_name}")
    details_lines.append(f"Card Number: {number}")
    if rarity and rarity != "—":
        details_lines.append(f"Rarity: {rarity}")
    if language:
        details_lines.append(f"Language: {language}")
    if edition:
        details_lines.append(f"Edition: {edition}")

    # ---- Photos guidance ----
    photos_lines = [
        "Photos: High-quality images show the exact card you’ll receive.",
        "Any minor imperfections visible in photos have been considered within the AI grading.",
    ]

    # ---- SEO / Keywords (natural terms) ----
    seo_line = f"Keywords: { _keywords(name, set_name, number, rarity, language, edition) }"
    # If you’d rather not show keywords publicly, you can strip this line before posting.

    # ---- Buyer info (from env for consistency) ----
    buyer_info_lines = [
        f"Shipping: {settings.shipping_info}",
        f"Returns: {settings.returns_policy}",
        "Questions: Happy to help — message me for details."
    ]

    # ---- Assemble description (concise + skimmable) ----
    # Use simple text with short paragraphs and bullets compatible with eBay.
    desc_lines: list[str] = []
    # Intro headline
    desc_lines.append(f"{name} #{number} — {set_name}")
    desc_lines.append(intro)
    desc_lines.append("")  # spacer

    # Highlights bullets
    desc_lines.append("Highlights:")
    for h in highlights:
        desc_lines.append(f"• {h}")
    desc_lines.append("")

    # Details bullets
    desc_lines.append("Details:")
    for d in details_lines:
        desc_lines.append(f"• {d}")
    desc_lines.append("")

    # Photos
    desc_lines.append("Photos:")
    for p in photos_lines:
        desc_lines.append(f"• {p}")
    desc_lines.append("")

    # Buyer info
    desc_lines.append("Buyer Information:")
    for b in buyer_info_lines:
        desc_lines.append(f"• {b}")
    desc_lines.append("")

    # SEO keywords (optional to include)
    desc_lines.append(seo_line)

    description = "\n".join(desc_lines)

    return {"title": title, "description": description}
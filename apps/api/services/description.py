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
    # No [REVIEW REQUIRED] prefix - keep title clean for customers
    title = f"{name} #{number} | {set_name}"
    if rarity and rarity != "—":
        title += f" | {rarity}"
    if condition:
        title += f" | {condition}"

    # ---- Intro: benefit-forward, highlights AI grading ----
    intro = (
        f"{name} from the {set_name} set. This card has been professionally analyzed using advanced AI grading technology "
        f"that examines every detail including corners, edges, surface quality, and centering to provide you with a "
        f"comprehensive, unbiased condition assessment."
    )

    # ---- Highlights (bullets) ----
    # Keep benefits first, then feature. Avoid jargon. NO NUMERIC GRADES or CONFIDENCE.
    highlights: list[str] = []
    
    # Condition (text only, no numbers)
    if condition:
        highlights.append(f"Overall Condition: {condition}")
    
    # Detailed condition assessment
    condition_details = []
    if corners is not None:
        if corners >= 9.5:
            condition_details.append("excellent corner sharpness with minimal wear")
        elif corners >= 8.5:
            condition_details.append("very good corners with slight edge wear")
        elif corners >= 7.5:
            condition_details.append("good corners showing some visible wear")
        else:
            condition_details.append("corners showing noticeable wear and rounding")
    
    if edges is not None:
        if edges >= 9.5:
            condition_details.append("crisp, clean edges with no chipping")
        elif edges >= 8.5:
            condition_details.append("very good edges with minimal wear")
        elif edges >= 7.5:
            condition_details.append("edges showing some minor wear")
        else:
            condition_details.append("edges with visible wear and potential damage")
    
    if surface is not None:
        if surface >= 9.5:
            condition_details.append("pristine surface with excellent gloss and no scratches")
        elif surface >= 8.5:
            condition_details.append("excellent surface with minimal imperfections")
        elif surface >= 7.5:
            condition_details.append("good surface with some visible wear or minor scratches")
        else:
            condition_details.append("surface showing noticeable scratches, scuffs, or wear")
    
    if centering is not None:
        if centering >= 9.5:
            condition_details.append("excellent centering with perfect alignment")
        elif centering >= 8.5:
            condition_details.append("very good centering, slightly off-center")
        elif centering >= 7.5:
            condition_details.append("acceptable centering with noticeable offset")
        else:
            condition_details.append("off-center with significant alignment issues")
    
    if condition_details:
        highlights.append("Detailed Assessment: " + "; ".join(condition_details))
    
    # AI grading highlight
    highlights.append("AI Professional Grading: This card underwent comprehensive AI analysis using advanced image recognition "
                     "to evaluate every aspect of condition. The assessment is objective, consistent, and detailed.")
    highlights.append("Quality Assurance: Graded using the same rigorous standards applied to all cards for fair, accurate evaluation.")

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
        "Photos: High-resolution images captured under professional lighting to accurately represent condition.",
        "AI Analysis: Every photo has been analyzed by AI grading software that detects and assesses even minor imperfections.",
        "Transparency: Any visible wear, scratches, or condition issues shown in photos have been evaluated and included in the assessment above.",
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
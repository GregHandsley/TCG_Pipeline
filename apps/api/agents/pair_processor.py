"""
Pair processing logic for card pairs (front + back)
"""
from typing import Any, Dict


class PairProcessor:
    """Handles processing of card pairs (front + back)"""
    
    def __init__(self, thought_logger):
        self.thought_logger = thought_logger
    
    def combine_grades(self, front_grade: Dict[str, Any], back_grade: Dict[str, Any]) -> Dict[str, Any]:
        """
        Combine front and back grades by averaging numeric values.
        Returns a combined grade result with averaged scores.
        """
        front_records = front_grade.get("records", [])
        back_records = back_grade.get("records", [])
        
        if not front_records or not back_records:
            # If either is missing, return the one that exists, or front as fallback
            return front_grade if front_records else (back_grade if back_records else front_grade)
        
        front_grades = front_records[0].get("grades", {})
        back_grades = back_records[0].get("grades", {})
        
        # Average numeric grade components
        combined_grades = {}
        numeric_fields = ["corners", "edges", "surface", "centering", "final"]
        
        for field in numeric_fields:
            front_val = front_grades.get(field)
            back_val = back_grades.get(field)
            
            if front_val is not None and back_val is not None:
                combined_grades[field] = (front_val + back_val) / 2.0
            elif front_val is not None:
                combined_grades[field] = front_val
            elif back_val is not None:
                combined_grades[field] = back_val
        
        # For condition string, use the one from the final grade (or front as fallback)
        combined_grades["condition"] = front_grades.get("condition") or back_grades.get("condition")
        
        # Combine records - use front record as base but update grades
        combined_record = front_records[0].copy()
        combined_record["grades"] = combined_grades
        
        # Prefer front grading images, but include back if front doesn't have them
        if not combined_record.get("_full_url_card") and back_records[0].get("_full_url_card"):
            combined_record["_full_url_card"] = back_records[0].get("_full_url_card")
        if not combined_record.get("_exact_url_card") and back_records[0].get("_exact_url_card"):
            combined_record["_exact_url_card"] = back_records[0].get("_exact_url_card")
        
        return {
            "records": [combined_record],
            "statistics": front_grade.get("statistics", {})  # Use front statistics
        }
    
    def merge_pair_results(
        self, 
        front_result: Dict[str, Any], 
        back_result: Dict[str, Any], 
        pair_index: int
    ) -> Dict[str, Any]:
        """Merge front and back results into a single pair result"""
        pair_result = {
            "card_index": pair_index,  # Keep for compatibility
            "pair_index": pair_index,
            "steps_completed": [],
            "results": {
                "front": {},
                "back": {}
            },
            "errors": [],
            "agent_thoughts": []
        }
        
        # Merge results
        pair_result["results"]["front"] = front_result["results"]
        pair_result["results"]["back"] = back_result["results"]
        pair_result["steps_completed"].extend([f"front_{s}" for s in front_result["steps_completed"]])
        pair_result["steps_completed"].extend([f"back_{s}" for s in back_result["steps_completed"]])
        pair_result["errors"].extend([f"front_{e}" for e in front_result["errors"]])
        pair_result["errors"].extend([f"back_{e}" for e in back_result["errors"]])
        
        # Use front identification for the pair (since we only identify the front)
        if "identification" in front_result["results"]:
            pair_result["results"]["identification"] = front_result["results"]["identification"]
        
        # Combine front and back grades for the pair
        front_grade = front_result["results"].get("grade")
        back_grade = back_result["results"].get("grade")
        
        if front_grade and back_grade:
            # Combine grades by averaging numeric values
            combined_grade = self.combine_grades(front_grade, back_grade)
            pair_result["results"]["grade"] = combined_grade
            self.thought_logger.log_thought(
                f"Card pair {pair_index+1}: Combined condition assessment from both front and back - averaging the grades for a complete evaluation!", 
                "success"
            )
        elif front_grade:
            # If only front grade is available, use it
            pair_result["results"]["grade"] = front_grade
            self.thought_logger.log_thought(
                f"Card pair {pair_index+1}: Using front card's condition grade for the pair.", 
                "step"
            )
        elif back_grade:
            # If only back grade is available, use it
            pair_result["results"]["grade"] = back_grade
            self.thought_logger.log_thought(
                f"Card pair {pair_index+1}: Using back card's condition grade for the pair.", 
                "step"
            )
        
        # Use front description for the pair
        if "listing_description" in front_result["results"]:
            pair_result["results"]["listing_description"] = front_result["results"]["listing_description"]
        
        return pair_result


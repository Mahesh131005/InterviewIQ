import os
import google.generativeai as genai

# Initialize Gemini GenAI
api_key = os.getenv('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)

class AdaptiveEngine:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
    def determine_next_difficulty(self, current_difficulty, passed_testcases, total_testcases, runtime_ms, target_runtime_ms=1000):
        """
        An algorithmic approach to determining the next question's difficulty 
        based on the user's performance on the current question.
        
        Args:
            current_difficulty (str): 'easy', 'medium', or 'hard'
            passed_testcases (int): Number of test cases passed
            total_testcases (int): Total number of test cases
            runtime_ms (float): Execution time of the user's code
            target_runtime_ms (float): Expected baseline execution time
            
        Returns:
            dict: The recommended difficulty string and reasoning
        """
        # Feature 1: Correctness (0.0 to 1.0)
        correctness = passed_testcases / total_testcases if total_testcases > 0 else 0
        
        # Feature 2: Speed efficiency multiplier
        # 1.0 = average, >1.0 = very fast, <1.0 = slow
        speed_factor = target_runtime_ms / runtime_ms if runtime_ms > 0 else 1.0
        
        # Define difficulty levels as a numerical continuous spectrum
        diff_levels = ['easy', 'medium', 'hard']
        current_idx = diff_levels.index(current_difficulty.lower())
        
        # ML Logic Thresholds:
        # If user failed significantly (< 50% correctness), make it easier.
        if correctness < 0.5:
            next_idx = max(0, current_idx - 1)
            reasoning = "Candidate struggled with correctness. Reducing difficulty."
            
        # If user passed most but not all (50% - 99%), keep the same difficulty.
        elif correctness < 1.0:
            next_idx = current_idx
            reasoning = "Candidate solved partially. Maintaining current difficulty level."
            
        # If user passed perfectly (100%), check their speed/efficiency.
        else:
            if speed_factor >= 1.2:  # 20% faster than average
                next_idx = min(len(diff_levels) - 1, current_idx + 1)
                reasoning = "Perfect correctness and highly efficient runtime. Increasing difficulty."
            elif speed_factor < 0.5: # 2x slower than average
                next_idx = current_idx
                reasoning = "Perfect correctness but inefficient runtime. Maintaining current difficulty to test optimization further."
            else:
                next_idx = min(len(diff_levels) - 1, current_idx + 1)
                reasoning = "Perfect correctness. Progressing to harder difficulty."
                
        return {
            "recommended_difficulty": diff_levels[next_idx],
            "reasoning": reasoning
        }

    def generate_context_aware_followup(self, problem_title, problem_description, user_code, user_language):
        """
        Uses an LLM to generate a highly specific follow up question directly tied 
        to the logic the candidate just wrote, rather than a generic prompt.
        """
        if not api_key:
            return {
                "follow_up_question": "How would you optimize your time and space complexity?",
                "is_generic_fallback": True
            }

        prompt = f"""
        You are a senior technical interviewer at a top tech company. 
        Your candidate just submitted a solution for the problem "{problem_title}".
        
        Problem Description: 
        {problem_description}
        
        Candidate's Code ({user_language}):
        ```
        {user_code}
        ```
        
        Analyze the specific code the candidate wrote. Do not give them the optimal answer. 
        Instead, ask a specific, thought-provoking follow-up question based ONLY on their specific implementation. 
        
        Examples:
        - If they used a nested loop (O(N^2)), ask how they might compute the same result in a single pass using a HashMap.
        - If they used recursion, ask about stack depth limitations and how to migrate it to iteration or memoization.
        - If their solution is perfectly optimal, ask them what would happen to their specific loop structure if the input stream was infinite or didn't fit in memory.
        
        Return ONLY the follow-up question text in a strict but encouraging tone, with no formatting or markdown.
        """

        try:
            response = self.model.generate_content(prompt)
            return {
                "follow_up_question": response.text.strip(),
                "is_generic_fallback": False
            }
        except Exception as e:
            print(f"Error generating follow up ML prompt: {e}")
            return {
                "follow_up_question": "Could you explain the algorithmic complexity of your specific approach?",
                "is_generic_fallback": True
            }

    def generate_socratic_hint(self, problem_title, problem_description, user_code, user_language):
        """
        Acts as a strict but helpful interviewer giving a nudge when the candidate is stuck.
        Does not give the answer. Points out a logical flaw or suggests a concept to consider.
        """
        if not api_key:
            return {
                "hint": "Consider the optimal data structure for this problem's constraints. Could a HashMap or two-pointer approach work here?",
                "is_generic_fallback": True
            }

        prompt = f"""
        You are a strict but helpful technical interviewer. 
        Your candidate is stuck and asked for a hint on the problem "{problem_title}".
        
        Problem Description:
        {problem_description}
        
        Candidate's Current In-Progress Code ({user_language}):
        ```
        {user_code}
        ```
        
        Provide a single, short hint (max 2 sentences). 
        DO NOT provide code. DO NOT give the exact answer. 
        Point out a logical flaw in their current structure (e.g. 'Your while loop condition might miss the final element...') 
        OR suggest a data structure/approach they should consider (e.g. 'To achieve O(N) time, consider keeping track of seen elements using a Hash Set.')
        Keep it encouraging but prompt them to think.
        """

        try:
            response = self.model.generate_content(prompt)
            return {
                "hint": response.text.strip(),
                "is_generic_fallback": False
            }
        except Exception as e:
            print(f"Error generating Socratic hint prompt: {e}")
            return {
                "hint": "Check your loop bounds and consider if you are using the most efficient data structure for lookups.",
                "is_generic_fallback": True
            }

# Example usage/tester
if __name__ == "__main__":
    engine = AdaptiveEngine()
    print(engine.determine_next_difficulty("medium", 10, 10, 45, 1000))
    # Returns 'hard' because of high speed and 100% test cases

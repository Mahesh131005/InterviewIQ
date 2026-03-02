import re
import os
import json
import google.generativeai as genai

class ExplanationEvaluator:
    """Evaluates code explanations using Google Gemini API"""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # Use gemini-1.5-flash for fast, structured evaluations
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
            print("WARNING: GEMINI_API_KEY not found. Falling back to heuristic explanation evaluation.", flush=True)

    def evaluate_explanation(self, code, question_description, user_explanation, language):
        """Evaluate code explanation using Gemini or fallback to heuristics"""
        if not user_explanation or len(user_explanation.strip()) == 0:
            return {
                'clarity_score': 0.0,
                'logic_score': 0.0,
                'depth_score': 0.0,
                'feedback': 'No explanation provided',
            }

        if self.model:
            return self._evaluate_with_gemini(code, question_description, user_explanation, language)
        else:
            return self._evaluate_with_heuristics(code, question_description, user_explanation, language)

    def _evaluate_with_gemini(self, code, question_description, user_explanation, language):
        prompt = f"""You are an expert technical interviewer evaluating a candidate's code explanation. 
        
Question Description:
{question_description}

Candidate's Code ({language}):
```
{code}
```

Candidate's Explanation:
{user_explanation}

Evaluate the candidate's explanation strictly on these three axes on a scale of 0.0 to 1.0:
1. clarity_score: How clear and easy to understand is the explanation?
2. logic_score: Does the explanation correctly describe the logic/algorithm used in the code?
3. depth_score: Does it discuss time/space complexity, trade-offs, or edge cases?

Also provide a concise 'feedback' string (max 3 sentences) giving direct, constructive feedback to the candidate.

Output ONLY a raw JSON object with no markdown formatting or backticks:
{{
  "clarity_score": 0.8,
  "logic_score": 0.9,
  "depth_score": 0.5,
  "feedback": "Your explanation of the algorithm is clear, but..."
}}"""
        try:
            response = self.model.generate_content(prompt)
            # Clean up the response in case the model returns markdown code blocks
            res_text = response.text.strip().removeprefix('```json').removeprefix('```').removesuffix('```').strip()
            result = json.loads(res_text)
            
            # Ensure scores fall in 0.0 - 1.0
            return {
                'clarity_score': max(0.0, min(1.0, float(result.get('clarity_score', 0.5)))),
                'logic_score': max(0.0, min(1.0, float(result.get('logic_score', 0.5)))),
                'depth_score': max(0.0, min(1.0, float(result.get('depth_score', 0.5)))),
                'feedback': result.get('feedback', 'Thank you for your explanation.'),
            }
        except Exception as e:
            print(f"Gemini Explanation Eval Error: {e}", flush=True)
            return self._evaluate_with_heuristics(code, question_description, user_explanation, language)

    def _evaluate_with_heuristics(self, code, question_description, user_explanation, language):
        clarity_score = self._evaluate_clarity(user_explanation)
        logic_score = self._evaluate_logic(user_explanation, code)
        depth_score = self._evaluate_depth(user_explanation, code)
        feedback = self._generate_feedback(clarity_score, logic_score, depth_score, user_explanation)
        return {
            'clarity_score': clarity_score,
            'logic_score': logic_score,
            'depth_score': depth_score,
            'feedback': feedback,
        }
    
    def _evaluate_clarity(self, explanation):
        clarity_score = 0.5
        sentences = re.split(r'[.!?]+', explanation)
        sentences = [s for s in sentences if s.strip()]
        if len(sentences) >= 3: clarity_score += 0.2
        structural_markers = ['first', 'then', 'finally', 'next', 'because', 'therefore']
        marker_count = sum(1 for marker in structural_markers if marker in explanation.lower())
        if marker_count >= 2: clarity_score += 0.15
        explanation_words = len(explanation.split())
        if 50 < explanation_words < 300: clarity_score += 0.1
        if explanation_words < 20: clarity_score = max(0.2, clarity_score - 0.3)
        return min(1.0, clarity_score)
    
    def _evaluate_logic(self, explanation, code):
        logic_score = 0.5
        algorithm_keywords = ['algorithm', 'approach', 'method', 'strategy', 'technique']
        if sum(1 for kw in algorithm_keywords if kw in explanation.lower()) > 0: logic_score += 0.25
        tradeoff_keywords = ['tradeoff', 'trade-off', 'vs', 'instead', 'benefit', 'cost']
        if sum(1 for kw in tradeoff_keywords if kw in explanation.lower()) > 0: logic_score += 0.15
        complexity_keywords = ['complexity', 'time', 'space', 'efficient', 'optimize']
        if sum(1 for kw in complexity_keywords if kw in explanation.lower()) > 0: logic_score += 0.1
        return min(1.0, logic_score)
    
    def _evaluate_depth(self, explanation, code):
        depth_score = 0.5
        edge_case_keywords = ['edge case', 'corner case', 'boundary', 'special', 'empty', 'null']
        if sum(1 for kw in edge_case_keywords if kw in explanation.lower()) > 0: depth_score += 0.2
        impl_keywords = ['variable', 'array', 'pointer', 'iterator', 'data structure', 'hash']
        if sum(1 for kw in impl_keywords if kw in explanation.lower()) > 0: depth_score += 0.2
        reflection_keywords = ['learned', 'realized', 'initially', 'mistake', 'improved']
        if sum(1 for kw in reflection_keywords if kw in explanation.lower()) > 0: depth_score += 0.1
        return min(1.0, depth_score)
    
    def _generate_feedback(self, clarity_score, logic_score, depth_score, explanation):
        feedback_parts = []
        if clarity_score >= 0.7: feedback_parts.append('✓ Clear and well-structured explanation.')
        elif clarity_score >= 0.5: feedback_parts.append('Consider adding more transitions between ideas for better clarity.')
        else: feedback_parts.append('Please provide a more detailed explanation with clear logical flow.')
        
        if logic_score >= 0.7: feedback_parts.append('✓ Strong logical reasoning.')
        elif logic_score >= 0.5: feedback_parts.append('Consider discussing the algorithm choice and why it works.')
        else: feedback_parts.append('Please explain the approach and algorithm clearly.')
        
        if depth_score >= 0.7: feedback_parts.append('✓ Shows deep understanding of edge cases and complexity.')
        elif depth_score >= 0.5: feedback_parts.append('Consider mentioning edge cases and complexity analysis.')
        else: feedback_parts.append('Discuss how your solution handles edge cases and its time/space complexity.')
        return ' '.join(feedback_parts)

    def generate_followup_question(self, code, explanation):
        """Generate a contextual follow-up question based on code and explanation"""
        if self.model:
            prompt = f"Based on this code:\n```\n{code}\n```\nAnd the candidate's explanation:\n{explanation}\n\nAsk one single targeted, technical follow-up question (max 2 sentences) about their approach, time complexity, or a potential edge case. Return ONLY the question."
            try:
                response = self.model.generate_content(prompt)
                return response.text.strip()
            except Exception as e:
                print(f"Gemini follow up generation error: {e}", flush=True)
        return "Can you describe the time and space complexity of your solution, and any trade-offs you considered?"

    def evaluate_followup_answer(self, question, answer, code):
        """Evaluate the candidate's answer to the follow-up question"""
        if self.model:
            prompt = f"Based on this code:\n```\n{code}\n```\nFollow-up Question asked:\n{question}\n\nCandidate's Answer:\n{answer}\n\nEvaluate the answer out of 100 on accuracy and depth. Return ONLY a raw JSON object with no markdown formatting:\n{{\n  \"score\": 85,\n  \"feedback\": \"Good explanation of O(N) complexity.\"\n}}"
            try:
                response = self.model.generate_content(prompt)
                res_text = response.text.strip().removeprefix('```json').removeprefix('```').removesuffix('```').strip()
                result = json.loads(res_text)
                return {
                    'score': float(result.get('score', 50)),
                    'feedback': result.get('feedback', 'Thank you for your response.')
                }
            except Exception as e:
                print(f"Gemini follow up eval error: {e}", flush=True)
        # Heuristic fallback
        score = 50
        if len(answer.split()) > 20: score += 25
        return {'score': score, 'feedback': 'Answer recorded (heuristic evaluation used due to missing API context).'}

class BehavioralEvaluator:
    """Evaluates behavioral responses using Google Gemini API"""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
            print("WARNING: GEMINI_API_KEY not found. Falling back to heuristic behavioral evaluation.", flush=True)

    def evaluate_behavior(self, behavioral_response):
        """Evaluate behavioral/STAR format response"""
        if not behavioral_response or len(behavioral_response.strip()) == 0:
            return {
                'behavioral_score': 0.0,
                'feedback': 'No response provided',
            }

        if self.model:
            return self._evaluate_with_gemini(behavioral_response)
        else:
            return self._evaluate_with_heuristics(behavioral_response)

    def _evaluate_with_gemini(self, behavioral_response):
        prompt = f"""You are an expert HR interviewer grading a behavioral interview response.

Candidate's Response:
{behavioral_response}

Evaluate the candidate's response on a scale of 0.0 to 1.0 based on two main factors:
1. STAR Structure: Did they structure the response well? (Situation, Task, Action, Result)
2. Professional Qualities: Did they demonstrate leadership, ownership, collaboration, or learning?

Combine these into a single `behavioral_score` (0.0 to 1.0).
Also provide a concise 'feedback' string (max 3 sentences) giving direct, constructive feedback to the candidate.

Output ONLY a raw JSON object with no markdown formatting or backticks:
{{
  "behavioral_score": 0.85,
  "feedback": "You clearly laid out the situation and your actions. Great demonstration of ownership!"
}}"""
        try:
            response = self.model.generate_content(prompt)
            res_text = response.text.strip().removeprefix('```json').removeprefix('```').removesuffix('```').strip()
            result = json.loads(res_text)
            
            return {
                'behavioral_score': max(0.0, min(1.0, float(result.get('behavioral_score', 0.5)))),
                'feedback': result.get('feedback', 'Thank you for your response.'),
            }
        except Exception as e:
            print(f"Gemini Behavioral Eval Error: {e}", flush=True)
            return self._evaluate_with_heuristics(behavioral_response)
            
    def _evaluate_with_heuristics(self, response):
        star_score = self._check_star_structure(response)
        qualities_score = self._evaluate_qualities(response)
        behavioral_score = (star_score + qualities_score) / 2
        feedback = self._generate_behavior_feedback(star_score, qualities_score, response)
        
        return {
            'behavioral_score': behavioral_score,
            'feedback': feedback,
        }
    
    def _check_star_structure(self, response):
        score = 0.3
        if any(kw in response.lower() for kw in ['was', 'faced', 'project', 'team', 'company', 'while working']): score += 0.15
        if any(kw in response.lower() for kw in ['was responsible', 'had to', 'needed to', 'tasked', 'assigned']): score += 0.15
        if any(kw in response.lower() for kw in ['did', 'implemented', 'decided', 'created', 'developed', 'wrote']): score += 0.15
        if any(kw in response.lower() for kw in ['resulted', 'outcome', 'success', 'improved', 'increased', 'delivered']): score += 0.15
        return min(1.0, score)
    
    def _evaluate_qualities(self, response):
        score = 0.3
        if any(kw in response.lower() for kw in ['led', 'managed', 'mentored', 'guided', 'coordinated']): score += 0.15
        if any(kw in response.lower() for kw in ['responsible', 'owned', 'took initiative', 'proactive', 'accountable']): score += 0.15
        if any(kw in response.lower() for kw in ['team', 'worked with', 'collaborated', 'communicated', 'together']): score += 0.15
        if any(kw in response.lower() for kw in ['learned', 'improved', 'growth', 'developed', 'gained']): score += 0.15
        return min(1.0, score)
    
    def _generate_behavior_feedback(self, star_score, qualities_score, response):
        feedback_parts = []
        if star_score >= 0.7: feedback_parts.append('✓ Good STAR structure with clear situation, task, action, and result.')
        elif star_score >= 0.5: feedback_parts.append('Your response could be clearer with: Situation → Task → Action → Result.')
        else: feedback_parts.append('Structure your answer as: What was the situation? What was your task? What action did you take? What was the result?')
        
        if qualities_score >= 0.7: feedback_parts.append('✓ Strong demonstration of leadership, ownership, and collaboration.')
        elif qualities_score >= 0.5: feedback_parts.append('Emphasize how you took ownership and worked with your team.')
        else: feedback_parts.append('Consider highlighting your role, decisions, and impact on the team.')
        
        response_length = len(response.split())
        if response_length < 30: feedback_parts.append('Provide more detail in your story to better demonstrate competencies.')
        elif response_length > 500: feedback_parts.append('While detailed, try to be more concise - aim for 50-150 words.')
        
        return ' '.join(feedback_parts)

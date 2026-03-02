from flask import Flask, request, jsonify
import os
import sys
from executor import CodeExecutor
from complexity_analyzer import ComplexityAnalyzer
from evaluator import ExplanationEvaluator, BehavioralEvaluator
from adaptive_engine import AdaptiveEngine

app = Flask(__name__)

# Initialize components
code_executor = CodeExecutor(
    timeout_ms=int(os.getenv('CODE_TIMEOUT', 2000)),
    memory_limit_mb=int(os.getenv('MEMORY_LIMIT', 256))
)
complexity_analyzer = ComplexityAnalyzer()
explanation_evaluator = ExplanationEvaluator()
behavioral_evaluator = BehavioralEvaluator()
adaptive_engine = AdaptiveEngine()

# Health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'Python Microservice',
        'timestamp': __import__('datetime').datetime.now().isoformat()
    })

# Code execution endpoint
@app.route('/execute-code', methods=['POST'])
def execute_code():
    try:
        data = request.get_json()
        
        if not data or 'code' not in data or 'language' not in data or 'testCases' not in data:
            return jsonify({'error': 'Missing required fields: code, language, testCases'}), 400
        
        code = data['code']
        language = data['language']
        test_cases = data['testCases']
        
        if not code or not language or not test_cases:
            return jsonify({'error': 'Code, language, and test cases cannot be empty'}), 400
        
        # Execute code
        result = code_executor.execute(code, language, test_cases)
        
        return jsonify({
            'passedTestcases': result['passed'],
            'totalTestcases': result['total'],
            'runtimeMs': result['runtime_ms'],
            'memoryMb': result['memory_mb'],
            'errorMessage': result.get('error'),
            'actualOutput': result.get('actual_output')
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Complexity analysis endpoint
@app.route('/analyze-complexity', methods=['POST'])
def analyze_complexity():
    try:
        data = request.get_json()
        
        if not data or 'code' not in data or 'language' not in data:
            return jsonify({'error': 'Missing required fields: code, language'}), 400
        
        code = data['code']
        language = data['language']
        expected_complexity = data.get('expected_complexity')
        
        # Analyze complexity
        analysis = complexity_analyzer.analyze(code, language)
        
        # Compare with expected if provided
        if expected_complexity:
            comparison = ComplexityAnalyzer.compare_complexity(
                analysis['predicted_complexity'],
                expected_complexity
            )
            analysis['complexity_gap'] = comparison['gap']
            analysis['efficiency_score'] = comparison['efficiency_score']
        
        return jsonify({
            'predicted_complexity': analysis['predicted_complexity'],
            'complexity_gap': analysis.get('complexity_gap', 'Not analyzed'),
            'efficiency_score': analysis.get('efficiency_score', 0.5),
            'details': analysis.get('details', ''),
            'loop_count': analysis.get('loop_count', 0),
            'has_recursion': analysis.get('has_recursion', False),
            'uses_hashmap': analysis.get('uses_hashmap', False),
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Explanation evaluation endpoint
@app.route('/evaluate-explanation', methods=['POST'])
def evaluate_explanation():
    try:
        data = request.get_json()
        
        if not data or 'code' not in data or 'user_explanation' not in data:
            return jsonify({'error': 'Missing required fields: code, user_explanation'}), 400
        
        code = data['code']
        question_description = data.get('question_description', '')
        user_explanation = data['user_explanation']
        language = data.get('language', 'python')
        
        # Evaluate explanation
        result = explanation_evaluator.evaluate_explanation(
            code,
            question_description,
            user_explanation,
            language
        )
        
        return jsonify({
            'clarity_score': result['clarity_score'],
            'logic_score': result['logic_score'],
            'depth_score': result['depth_score'],
            'feedback': result['feedback'],
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Behavioral evaluation endpoint
@app.route('/evaluate-behavior', methods=['POST'])
def evaluate_behavior():
    try:
        data = request.get_json()
        
        if not data or 'behavioral_response' not in data:
            return jsonify({'error': 'Missing required field: behavioral_response'}), 400
        
        behavioral_response = data['behavioral_response']
        
        # Evaluate behavioral response
        result = behavioral_evaluator.evaluate_behavior(behavioral_response)
        
        return jsonify({
            'behavioral_score': result['behavioral_score'],
            'feedback': result['feedback'],
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/determine-next-difficulty', methods=['POST'])
def determine_next_difficulty():
    try:
        data = request.get_json()
        current_difficulty = data.get('current_difficulty', 'medium')
        passed_testcases = data.get('passed_testcases', 0)
        total_testcases = data.get('total_testcases', 0)
        runtime_ms = data.get('runtime_ms', 0)
        target_runtime_ms = data.get('target_runtime_ms', 1000)
        
        result = adaptive_engine.determine_next_difficulty(
            current_difficulty, passed_testcases, total_testcases, runtime_ms, target_runtime_ms
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate-followup', methods=['POST'])
def generate_followup():
    try:
        data = request.get_json()
        problem_title = data.get('problem_title', 'Coding Problem')
        problem_description = data.get('problem_description', '')
        user_code = data.get('code', '')
        user_language = data.get('language', 'python')
        
        result = adaptive_engine.generate_context_aware_followup(
            problem_title, problem_description, user_code, user_language
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate-hint', methods=['POST'])
def generate_hint():
    try:
        data = request.get_json()
        problem_title = data.get('problem_title', 'Coding Problem')
        problem_description = data.get('problem_description', '')
        user_code = data.get('code', '')
        user_language = data.get('language', 'python')
        
        result = adaptive_engine.generate_socratic_hint(
            problem_title, problem_description, user_code, user_language
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/evaluate-followup', methods=['POST'])
def evaluate_followup():
    try:
        data = request.get_json()
        question = data.get('question', '')
        answer = data.get('answer', '')
        code = data.get('code', '')
        result = explanation_evaluator.evaluate_followup_answer(question, answer, code)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Error handler
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('DEBUG', 'False') == 'True'
    app.run(host='0.0.0.0', port=port, debug=debug)

import ast
import re

class ComplexityAnalyzer:
    """Analyzes time and space complexity of code"""
    
    COMPLEXITY_MAP = {
        'O(1)': 1,
        'O(log n)': 2,
        'O(n)': 3,
        'O(n log n)': 4,
        'O(n^2)': 5,
        'O(n^3)': 6,
        'O(2^n)': 7,
        'O(n!)': 8,
    }
    
    COMPLEXITY_NAMES = {v: k for k, v in COMPLEXITY_MAP.items()}
    
    def __init__(self):
        self.for_loops = 0
        self.while_loops = 0
        self.nested_depth = 0
        self.has_recursion = False
        self.array_access = False
        self.hash_map = False
    
    def analyze(self, code, language):
        """Analyze code complexity"""
        try:
            if language.lower() == 'python':
                return self._analyze_python(code)
            elif language.lower() in ['cpp', 'c++']:
                return self._analyze_cpp(code)
            elif language.lower() == 'java':
                return self._analyze_java(code)
            else:
                return {
                    'predicted_complexity': 'Unknown',
                    'complexity_gap': 'Unknown',
                    'efficiency_score': 0.5,
                    'details': f'Language {language} not fully analyzed'
                }
        except Exception as e:
            return {
                'predicted_complexity': 'Unknown',
                'complexity_gap': 'Unknown',
                'efficiency_score': 0.5,
                'details': f'Analysis error: {str(e)}'
            }
    
    def _analyze_python(self, code):
        """Analyze Python code"""
        self.reset()
        
        try:
            tree = ast.parse(code)
            self._walk_python_ast(tree)
        except SyntaxError:
            return {
                'predicted_complexity': 'Unknown',
                'complexity_gap': 'Unknown',
                'efficiency_score': 0.5,
                'details': 'Syntax error in code'
            }
        
        return self._calculate_complexity()
    
    def _analyze_cpp(self, code):
        """Analyze C++ code"""
        self.reset()
        
        # Count nested loops
        for_pattern = r'\bfor\s*\('
        for_count = len(re.findall(for_pattern, code))
        
        while_pattern = r'\bwhile\s*\('
        while_count = len(re.findall(while_pattern, code))
        
        self.for_loops = for_count
        self.while_loops = while_count
        
        # Check for common patterns
        if 'std::map' in code or 'unordered_map' in code:
            self.hash_map = True
        
        if 'std::vector' in code and '[' in code:
            self.array_access = True
        
        # Check for recursion
        func_pattern = r'(\w+)\s*\([^)]*\)'
        if re.search(r'return\s+' + r'\w+\s*\(', code):
            self.has_recursion = True
        
        return self._calculate_complexity()
    
    def _analyze_java(self, code):
        """Analyze Java code"""
        self.reset()
        
        # Count nested loops
        for_pattern = r'\bfor\s*\('
        for_count = len(re.findall(for_pattern, code))
        
        while_pattern = r'\bwhile\s*\('
        while_count = len(re.findall(while_pattern, code))
        
        self.for_loops = for_count
        self.while_loops = while_count
        
        # Check for common patterns
        if 'HashMap' in code or 'TreeMap' in code:
            self.hash_map = True
        
        if 'Array' in code and '[' in code:
            self.array_access = True
        
        return self._calculate_complexity()
    
    def _walk_python_ast(self, node, depth=0):
        """Walk Python AST to count loops and analyze structure"""
        for child in ast.walk(node):
            if isinstance(child, (ast.For, ast.While)):
                self.nested_depth = max(self.nested_depth, depth + 1)
                if isinstance(child, ast.For):
                    self.for_loops += 1
                else:
                    self.while_loops += 1
            
            if isinstance(child, ast.Subscript):
                self.array_access = True
            
            if isinstance(child, ast.Call):
                if isinstance(child.func, ast.Name):
                    if child.func.id in ['dict', 'set', 'defaultdict']:
                        self.hash_map = True
                    # Check for recursion
                    for name_node in ast.walk(node):
                        if isinstance(name_node, ast.FunctionDef):
                            if any(isinstance(c, ast.Call) and
                                   isinstance(c.func, ast.Name) and
                                   c.func.id == name_node.name
                                   for c in ast.walk(child)):
                                self.has_recursion = True
    
    def _calculate_complexity(self):
        """Calculate predicted complexity based on analysis"""
        total_loops = self.for_loops + self.while_loops
        
        if self.has_recursion:
            predicted = 'O(2^n)'  # Conservative estimate
        elif total_loops >= 3:
            predicted = 'O(n^3)'
        elif total_loops == 2:
            if self.has_recursion:
                predicted = 'O(n log n)'
            else:
                predicted = 'O(n^2)'
        elif total_loops == 1:
            if self.hash_map:
                predicted = 'O(n)'
            else:
                predicted = 'O(n)'
        else:
            predicted = 'O(1)'
        
        return {
            'predicted_complexity': predicted,
            'complexity_gap': 'Under analysis',
            'efficiency_score': 0.7,
            'details': f'Loops: {total_loops}, Recursion: {self.has_recursion}, HashMap: {self.hash_map}',
            'loop_count': total_loops,
            'has_recursion': self.has_recursion,
            'uses_hashmap': self.hash_map,
        }
    
    def reset(self):
        """Reset analysis state"""
        self.for_loops = 0
        self.while_loops = 0
        self.nested_depth = 0
        self.has_recursion = False
        self.array_access = False
        self.hash_map = False
    
    @staticmethod
    def compare_complexity(predicted, expected):
        """Compare predicted vs expected complexity"""
        analyzer = ComplexityAnalyzer()
        
        pred_val = analyzer.COMPLEXITY_MAP.get(predicted, 0)
        exp_val = analyzer.COMPLEXITY_MAP.get(expected, 0)
        
        if pred_val == 0 or exp_val == 0:
            return {
                'gap': 'Unknown',
                'efficiency_score': 0.5,
                'matches': False
            }
        
        if pred_val == exp_val:
            return {
                'gap': 'Matches expected',
                'efficiency_score': 1.0,
                'matches': True
            }
        elif pred_val < exp_val:
            return {
                'gap': f'Better than expected ({expected})',
                'efficiency_score': 1.0,
                'matches': False
            }
        else:
            diff = pred_val - exp_val
            if diff == 1:
                score = 0.7
            elif diff == 2:
                score = 0.4
            else:
                score = 0.2
            
            return {
                'gap': f'Worse than expected (predicted: {predicted}, expected: {expected})',
                'efficiency_score': score,
                'matches': False
            }

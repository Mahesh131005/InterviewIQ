import os
import sys
import json
import subprocess
import time
import tempfile
from pathlib import Path

class CodeExecutor:
    """Handles code execution with timeout and memory limits"""
    
    def __init__(self, timeout_ms=2000, memory_limit_mb=256):
        self.timeout_s = timeout_ms / 1000
        self.memory_limit_mb = memory_limit_mb
    
    def execute_cpp(self, code, test_cases):
        """Execute C++ code with test cases"""
        passed = 0
        total = len(test_cases)
        runtime_ms = 0
        memory_mb = 0
        error_msg = None
        
        with tempfile.TemporaryDirectory() as tmpdir:
            # Write source file
            cpp_file = Path(tmpdir) / 'solution.cpp'
            cpp_file.write_text(code)
            
            # Compile
            compile_cmd = f'g++ -o {tmpdir}/solution {cpp_file} -Wall'
            try:
                result = subprocess.run(
                    compile_cmd,
                    shell=True,
                    capture_output=True,
                    timeout=5,
                    text=True
                )
                if result.returncode != 0:
                    error_msg = result.stderr or result.stdout or "Compilation failed"
                    return {
                        'passed': 0,
                        'total': total,
                        'runtime_ms': 0,
                        'memory_mb': 0,
                        'error': error_msg
                    }
            except subprocess.TimeoutExpired:
                error_msg = 'Compilation timeout'
                return {
                    'passed': 0,
                    'total': total,
                    'runtime_ms': 0,
                    'memory_mb': 0,
                    'error': error_msg
                }
            
            # Run test cases
            exe_path = f'{tmpdir}/solution'
            last_actual_output = ""
            for test_case in test_cases:
                start_time = time.time()
                try:
                    result = subprocess.run(
                        exe_path,
                        input=test_case.get('input', ''),
                        capture_output=True,
                        timeout=self.timeout_s,
                        text=True
                    )
                    elapsed = (time.time() - start_time) * 1000
                    runtime_ms = max(runtime_ms, elapsed)
                    
                    if result.returncode != 0:
                        error_msg = f"Runtime Error (Exit code {result.returncode})\n" + result.stderr.strip()
                        break
                    
                    last_actual_output = result.stdout.strip()
                    expected_raw = test_case.get('expectedOutput', '').strip()
                    
                    if expected_raw:
                         expected_words = " ".join(expected_raw.split())
                         actual_words = " ".join(last_actual_output.split())
                         
                         if actual_words == expected_words:
                             passed += 1
                         else:
                             # DO NOT break here. Just record the error and we can break or continue.
                             # If we break, we don't return the full results. Let's return what we have.
                             error_msg = f"Failed Test Case.\nExpected:\n{expected_raw}\n\nActual:\n{last_actual_output}"
                             break
                    else:
                         passed += 1 # Custom test case
                    
                except subprocess.TimeoutExpired:
                    error_msg = f'Execution timeout on test case'
                    break
                except Exception as e:
                    error_msg = str(e)
                    break
        
        return {
            'passed': passed,
            'total': total,
            'runtime_ms': runtime_ms,
            'memory_mb': memory_mb,
            'error': error_msg,
            'actual_output': last_actual_output
        }
    
    def execute_python(self, code, test_cases):
        """Execute Python code natively with test cases via STDIN/STDOUT"""
        passed = 0
        total = len(test_cases)
        runtime_ms = 0
        error_msg = None
        
        with tempfile.TemporaryDirectory() as tmpdir:
            py_file = Path(tmpdir) / 'solution.py'
            py_file.write_text(code)
            
            last_actual_output = ""
            for test_case in test_cases:
                start_time = time.time()
                try:
                    expected_raw = test_case.get('expectedOutput', '').strip()
                    
                    # Pass raw input directly to Python via stdin
                    input_data = test_case.get('input', '').strip()
                    if input_data and not input_data.endswith('\n'):
                        input_data += '\n'
                        
                    result = subprocess.run(
                        [sys.executable, str(py_file)],
                        input=input_data,
                        capture_output=True,
                        timeout=self.timeout_s,
                        text=True
                    )
                    elapsed = (time.time() - start_time) * 1000
                    runtime_ms = max(runtime_ms, elapsed)
                    
                    if result.returncode != 0 and result.stderr:
                        error_msg = result.stderr
                        break
                    
                    actual_out = result.stdout.strip()
                    last_actual_output = actual_out
                    
                    if expected_raw:
                        expected_words = " ".join(expected_raw.split())
                        actual_words = " ".join(actual_out.split())
                        if actual_words == expected_words:
                            passed += 1
                        else:
                            error_msg = f"Failed Test Case.\nExpected:\n{expected_raw}\n\nActual:\n{actual_out}"
                            break
                    else:
                        passed += 1
                
                except subprocess.TimeoutExpired:
                    error_msg = 'Execution timeout'
                    break
                except Exception as e:
                    error_msg = str(e)
                    break
        
        return {
            'passed': passed,
            'total': total,
            'runtime_ms': runtime_ms,
            'memory_mb': 0,
            'error': error_msg,
            'actual_output': last_actual_output
        }

    def execute_java(self, code, test_cases):
        """Execute Java code using javac and java"""
        passed = 0
        total = len(test_cases)
        runtime_ms = 0
        error_msg = None
        
        with tempfile.TemporaryDirectory() as tmpdir:
            java_file = Path(tmpdir) / 'Solution.java'
            java_file.write_text(code)
            
            # Compile Java
            compile_cmd = f'javac {java_file}'
            try:
                result = subprocess.run(
                    compile_cmd,
                    shell=True,
                    capture_output=True,
                    timeout=5,
                    text=True
                )
                if result.returncode != 0:
                    error_msg = result.stderr
                    return {
                        'passed': 0,
                        'total': total,
                        'runtime_ms': 0,
                        'memory_mb': 0,
                        'error': error_msg
                    }
            except subprocess.TimeoutExpired:
                error_msg = 'Compilation timeout'
                return {
                    'passed': 0,
                    'total': total,
                    'runtime_ms': 0,
                    'memory_mb': 0,
                    'error': error_msg
                }
            
            # Run Test Cases
            last_actual_output = ""
            for test_case in test_cases:
                start_time = time.time()
                try:
                    expected_raw = test_case.get('expectedOutput', '').strip()
                    
                    input_data = test_case.get('input', '').strip()
                    if input_data and not input_data.endswith('\n'):
                        input_data += '\n'
                        
                    result = subprocess.run(
                        ['java', '-cp', tmpdir, 'Solution'],
                        input=input_data,
                        capture_output=True,
                        timeout=self.timeout_s,
                        text=True
                    )
                    elapsed = (time.time() - start_time) * 1000
                    runtime_ms = max(runtime_ms, elapsed)
                    
                    if result.returncode != 0 and result.stderr:
                        error_msg = result.stderr
                        break
                    
                    actual_out = result.stdout.strip()
                    last_actual_output = actual_out
                    
                    if expected_raw:
                        expected_words = " ".join(expected_raw.split())
                        actual_words = " ".join(actual_out.split())
                        if actual_words == expected_words:
                            passed += 1
                        else:
                            error_msg = f"Failed Test Case.\nExpected:\n{expected_raw}\n\nActual:\n{actual_out}"
                            break
                    else:
                         passed += 1
                        
                except subprocess.TimeoutExpired:
                    error_msg = 'Execution timeout'
                    break
                except Exception as e:
                    error_msg = str(e)
                    break
        
        return {
            'passed': passed,
            'total': total,
            'runtime_ms': runtime_ms,
            'memory_mb': 0,
            'error': error_msg,
            'actual_output': last_actual_output
        }
    
    def execute(self, code, language, test_cases):
        """Execute code in specified language"""
        language = language.lower()
        
        if language in ['cpp', 'c++']:
            return self.execute_cpp(code, test_cases)
        elif language == 'python':
            return self.execute_python(code, test_cases)
        elif language == 'java':
            return self.execute_java(code, test_cases)
        else:
            return {
                'passed': 0,
                'total': len(test_cases),
                'runtime_ms': 0,
                'memory_mb': 0,
                'error': f'Unsupported language: {language}'
            }

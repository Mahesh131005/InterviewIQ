"""
AI Interviewer Flask Blueprint — Ollama-powered conversational interviewer.
Provides chat, scoring, and health-check endpoints.
"""
import os
import json
import uuid
import random
import requests
from flask import Blueprint, request, jsonify
from interviewer_prompts import construct_system_prompt, construct_scoring_prompt

interviewer_bp = Blueprint('interviewer', __name__, url_prefix='/interviewer')

# --- Configuration ---
OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'localhost:11434')
OLLAMA_URL = f"http://{OLLAMA_HOST}"
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'mistral')
OLLAMA_TIMEOUT = int(os.getenv('OLLAMA_TIMEOUT', 60))

# --- In-memory session store ---
# Key: session_id -> { conversation_history: [], turn_counts: {phase: int}, ... }
sessions = {}

# --- Load fallback questions ---
FALLBACK_PATH = os.path.join(os.path.dirname(__file__), 'fallback_questions.json')
try:
    with open(FALLBACK_PATH, 'r') as f:
        FALLBACK_QUESTIONS = json.load(f)
except Exception:
    FALLBACK_QUESTIONS = {}


def check_ollama_available(model=None):
    """Check if Ollama is running and has the requested model."""
    model = model or OLLAMA_MODEL
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        if r.status_code != 200:
            return False
        models = [m.get("name", "") for m in r.json().get("models", [])]
        return any(model in m for m in models)
    except Exception:
        return False


def call_ollama(prompt, model=None):
    """Call Ollama's generate API. Returns the response text or None on failure."""
    model = model or OLLAMA_MODEL
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_predict": 150
                }
            },
            timeout=OLLAMA_TIMEOUT
        )
        if response.status_code == 200:
            return response.json().get("response", "").strip()
        return None
    except Exception as e:
        print(f"[AI Interviewer] Ollama call failed: {e}")
        return None


def get_fallback_response(phase, context):
    """Get a rule-based fallback response when Ollama is unavailable."""
    company = context.get('company_track', 'default')
    topics = context.get('topic_tags', [])
    topic_key = topics[0].lower() if topics else 'default'

    if phase == 'intro':
        pool = FALLBACK_QUESTIONS.get('intro', [])
    elif phase == 'closing':
        pool = FALLBACK_QUESTIONS.get('closing', [])
    elif phase == 'behavioral':
        beh = FALLBACK_QUESTIONS.get('behavioral', {})
        pool = beh.get(company, beh.get('default', []))
    else:
        section = FALLBACK_QUESTIONS.get(phase, {})
        if isinstance(section, list):
            pool = section
        elif isinstance(section, dict):
            pool = section.get(topic_key, section.get('default', []))
        else:
            pool = []

    if not pool:
        pool = ["That's interesting. Can you elaborate on your thinking?"]

    return random.choice(pool)


# --- Phase transition logic ---
PHASE_ORDER = ['intro', 'approach', 'coding', 'debrief', 'behavioral', 'closing']
PHASE_MAX_TURNS = {
    'intro': 1,
    'approach': 3,
    'coding': 4,
    'debrief': 3,
    'behavioral': 2,
    'closing': 1,
}


def determine_next_phase(current_phase, turn_count, code_submitted=False):
    """Determine if we should advance to the next phase."""
    max_turns = PHASE_MAX_TURNS.get(current_phase, 3)

    # Special: jump to debrief if code is submitted during approach/coding
    if code_submitted and current_phase in ('approach', 'coding'):
        return 'debrief'

    if turn_count >= max_turns:
        idx = PHASE_ORDER.index(current_phase) if current_phase in PHASE_ORDER else 0
        if idx + 1 < len(PHASE_ORDER):
            return PHASE_ORDER[idx + 1]

    return current_phase


# --- Endpoints ---

@interviewer_bp.route('/health', methods=['GET'])
def health():
    """Check Ollama availability and model status."""
    ollama_ok = check_ollama_available()
    return jsonify({
        'status': 'ok',
        'ollama_available': ollama_ok,
        'ollama_host': OLLAMA_HOST,
        'model': OLLAMA_MODEL,
        'fallback_mode': not ollama_ok,
        'active_sessions': len(sessions)
    })


@interviewer_bp.route('/chat', methods=['POST'])
def chat():
    """Main conversational endpoint."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON body provided'}), 400

    session_id = data.get('session_id')
    phase = data.get('phase', 'intro')
    user_message = data.get('user_message', '')
    context = data.get('context', {})
    code_submitted = data.get('code_submitted', False)

    if not session_id:
        return jsonify({'error': 'session_id is required'}), 400

    # Initialize session if new
    if session_id not in sessions:
        sessions[session_id] = {
            'conversation_history': [],
            'turn_counts': {p: 0 for p in PHASE_ORDER},
            'context': context,
        }

    session = sessions[session_id]

    # Update context with latest data (code snapshot may change)
    session['context'].update(context)

    # Add candidate message to history (if not empty — intro has no user msg)
    if user_message.strip():
        session['conversation_history'].append({
            'role': 'candidate',
            'content': user_message
        })

    # Increment turn count for current phase
    session['turn_counts'][phase] = session['turn_counts'].get(phase, 0) + 1

    # Determine phase transition
    next_phase = determine_next_phase(
        phase,
        session['turn_counts'].get(phase, 0),
        code_submitted
    )

    # Build context with conversation history for prompt
    prompt_context = {**session['context']}
    prompt_context['conversation_history'] = session['conversation_history']

    # Try Ollama first, fallback to rule-based
    interviewer_message = None
    if check_ollama_available():
        prompt = construct_system_prompt(next_phase, prompt_context, user_message)
        interviewer_message = call_ollama(prompt)

    if not interviewer_message:
        interviewer_message = get_fallback_response(next_phase, prompt_context)

    # Add interviewer response to history
    session['conversation_history'].append({
        'role': 'interviewer',
        'content': interviewer_message
    })

    # Check if session should end
    end_session = (next_phase == 'closing' and
                   session['turn_counts'].get('closing', 0) >= 1)

    return jsonify({
        'interviewer_message': interviewer_message,
        'phase': next_phase,
        'is_followup': phase == next_phase,
        'end_session': end_session
    })


@interviewer_bp.route('/score', methods=['POST'])
def score():
    """Score the full conversation at session end."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON body provided'}), 400

    session_id = data.get('session_id')
    context = data.get('context', {})

    if not session_id:
        return jsonify({'error': 'session_id is required'}), 400

    session = sessions.get(session_id)
    history = session['conversation_history'] if session else []

    if not history:
        return jsonify({
            'explanation_score': 50,
            'behavioral_score': 50,
            'explanation_feedback': 'No conversation to evaluate.',
            'behavioral_feedback': 'No behavioral questions were asked.'
        })

    # Try Ollama scoring
    result = None
    if check_ollama_available():
        prompt = construct_scoring_prompt(history, context)
        raw = call_ollama(prompt)
        if raw:
            try:
                # Try to extract JSON from response
                # Sometimes LLM wraps in markdown code blocks
                cleaned = raw.strip()
                if cleaned.startswith('```'):
                    cleaned = cleaned.split('\n', 1)[-1]
                    cleaned = cleaned.rsplit('```', 1)[0]
                result = json.loads(cleaned)
            except json.JSONDecodeError:
                print(f"[AI Interviewer] Failed to parse scoring JSON: {raw}")

    if not result:
        # Heuristic fallback scoring
        candidate_msgs = [m for m in history if m['role'] == 'candidate']
        avg_length = sum(len(m['content']) for m in candidate_msgs) / max(len(candidate_msgs), 1)

        # Simple heuristic: longer, more detailed responses = higher scores
        explanation_score = min(85, max(30, int(avg_length / 3)))
        behavioral_score = min(75, max(25, int(avg_length / 4)))

        result = {
            'explanation_score': explanation_score,
            'behavioral_score': behavioral_score,
            'explanation_feedback': 'Scored using heuristic evaluation (Ollama unavailable).',
            'behavioral_feedback': 'Scored using heuristic evaluation (Ollama unavailable).'
        }

    # Clean up session
    if session_id in sessions:
        del sessions[session_id]

    return jsonify(result)

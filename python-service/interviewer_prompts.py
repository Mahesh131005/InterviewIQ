"""
Prompt construction helpers for the AI Interviewer module.
Builds dynamic system prompts for Ollama LLM calls.
"""


def construct_system_prompt(phase, context, user_message):
    """Build the full LLM prompt for the interviewer chat."""
    company = context.get('company_track', 'a tech company')
    title = context.get('question_title', 'Coding Problem')
    description = context.get('question_description', '')
    expected = context.get('expected_complexity', 'optimal')
    difficulty = context.get('difficulty', 'Medium')
    topics = ', '.join(context.get('topic_tags', []))
    code_snapshot = context.get('user_code_snapshot', '')
    history = context.get('conversation_history', [])

    formatted_history = format_history(history)

    code_section = ''
    if code_snapshot and phase in ('coding', 'debrief'):
        # Trim code to last 40 lines to save context window
        lines = code_snapshot.strip().split('\n')
        trimmed = '\n'.join(lines[-40:])
        code_section = f"\nCandidate's current code:\n```\n{trimmed}\n```\n"

    prompt = f"""You are a senior software engineer at {company} conducting a technical interview.
You are interviewing a candidate for a software engineering role.
The problem you have given them is: "{title}" — {description}
Difficulty: {difficulty}. Topics: {topics}.
The expected optimal solution has a time complexity of {expected}.
The current interview phase is: {phase}.

Your personality: Professional but friendly. Concise. You ask ONE question at a time.
You never reveal the answer. You guide with Socratic questioning.
You evaluate: problem-solving approach, communication clarity, complexity awareness, and code quality.

Phase-specific behavior:
- intro: Greet the candidate warmly. Introduce yourself briefly as a senior engineer at {company}. Present the problem clearly and concisely. Ask them to start by explaining their initial approach before writing any code.
- approach: Listen to their approach. Ask clarifying questions. Probe their understanding of edge cases and complexity. Ask about time/space tradeoffs.
- coding: Glance at their code snapshot. Ask targeted questions about specific implementation choices. Do NOT evaluate correctness — just probe thinking. Ask "why" questions.
- debrief: The candidate has submitted their code. Ask optimization questions. Ask what happens at scale (e.g., 10^9 input). Ask about alternative approaches or data structures.
- behavioral: Ask one STAR-format behavioral question relevant to {company}'s engineering culture. For Google: ambiguous problems. For Amazon: customer obsession. For Meta: move fast. For Microsoft: collaboration.
- closing: Wrap up warmly. Tell them the session is ending. Give one sentence of genuine, specific encouragement based on what they did well.

{code_section}
Conversation so far:
{formatted_history}

Candidate's latest message: "{user_message}"

Respond as the interviewer. Ask only ONE focused question or make ONE observation. Keep your response under 60 words. Do not use markdown formatting. Speak naturally as a human interviewer would."""

    return prompt


def construct_scoring_prompt(conversation_history, context):
    """Build the evaluation prompt for end-of-session scoring."""
    company = context.get('company_track', 'a tech company')
    title = context.get('question_title', 'Coding Problem')
    expected = context.get('expected_complexity', 'optimal')

    formatted = format_history(conversation_history, max_turns=20)

    prompt = f"""You are a senior engineering hiring manager at {company}.
Review this interview conversation transcript:

{formatted}

The problem was: "{title}" with expected optimal complexity {expected}.

Score the candidate on TWO dimensions (0 to 100 each):

1. EXPLANATION SCORE: Did they clearly articulate their approach, complexity reasoning, and design choices? Were they able to explain their thinking step by step?
2. BEHAVIORAL SCORE: Did they demonstrate strong communication, structured thinking, and a collaborative attitude? Did they ask good clarifying questions?

Respond ONLY in this exact JSON format with no other text:
{{"explanation_score": <number 0-100>, "behavioral_score": <number 0-100>, "explanation_feedback": "<one sentence>", "behavioral_feedback": "<one sentence>"}}"""

    return prompt


def format_history(history, max_turns=10):
    """Format conversation history, trimmed to last N turns."""
    if not history:
        return "(No conversation yet — this is the start of the interview)"

    # Trim to last max_turns entries
    trimmed = history[-max_turns:]

    lines = []
    for msg in trimmed:
        role = msg.get('role', 'unknown')
        content = msg.get('content', '')
        if role == 'interviewer':
            lines.append(f"Interviewer: {content}")
        elif role == 'candidate':
            lines.append(f"Candidate: {content}")
    return '\n'.join(lines) if lines else "(No conversation yet)"

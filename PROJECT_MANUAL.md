# AI Code Interviewer - User Manual & Project Overview

Welcome to the AI Code Interviewer! This document serves as a comprehensive guide to understanding what the project is, what it does, and how data moves through the system.

## 1. Problem Statement
Preparing for software engineering interviews is challenging. Candidates often practice coding on platforms that only evaluate whether the code works (correctness), but real interviews also evaluate **code efficiency** (time and space complexity), **communication** (how well you explain your approach), and **behavioral traits** (how you handle specific situations). 

The **AI Code Interviewer** solves this by providing a comprehensive, realistic interview simulation environment. It not only tests your code against edge cases but also analyzes the complexity of your algorithm, evaluates your written explanations, and even provides behavioral feedback—all in one place.

---

## 2. All Features

### 🎯 Core Interview System
*   **Company-Specific Tracks:** Practice questions tailored to the styles of top tech companies (e.g., Google, Amazon, Meta).
*   **Adaptive Difficulty:** The platform adjusts the difficulty of questions (Easy, Medium, Hard) based on your past performance.
*   **Smart Question Selection:** Automatically identifies and prioritizes topics you are weak at (e.g., Dynamic Programming, Graphs).

### 💻 Code Evaluation & Sandboxing
*   **Multi-Language Support:** Write and execute code in Python, C++, and Java.
*   **Real-Time Execution:** Code runs in an isolated, secure sandbox.
*   **Complexity Analysis:** Automatically predicts the Big O Time and Space complexity of your solution.
*   **Edge Case Testing:** Validates your code against both visible and hidden test cases.

### 📊 Comprehensive Multi-Dimensional Scoring
You receive a detailed breakdown of your performance:
1.  **Correctness (40%):** How many test cases passed.
2.  **Efficiency (20%):** How optimal your code is (predicted complexity vs. expected complexity).
3.  **Explanation (20%):** How clearly you communicate your logic and design rationale.
4.  **Behavioral (20%):** Evaluation of your soft skills using the STAR (Situation-Task-Action-Result) method.

### 📈 Analytics Dashboard
*   **Performance Tracking:** Visual charts tracking your scores over time.
*   **Topic Breakdown:** See exactly which data structures or algorithms you need to study more.

---

## 3. User Workflow (How to use it)

1.  **Onboarding:** The user registers and logs into the platform.
2.  **Dashboard:** The user lands on the dashboard, viewing their historical analytics and weak areas.
3.  **Start Interview:** The user initiates a new interview and optionally selects a target company.
4.  **Coding Phase:** 
    *   The system presents a coding problem.
    *   The user writes their code in the built-in editor.
    *   The user writes an explanation of their approach.
5.  **Submission:** The user submits the code. The system runs it, analyzes the complexity, and evaluates the explanation.
6.  **Results & Feedback:** The user immediately sees their multi-dimensional score and feedback.
7.  **Review:** The user's analytics are updated on the dashboard for future tracking.

---

## 4. Data Flow & Architecture

The project is built using a modern microservices architecture consisting of three main parts:
1.  **Frontend (React + Vite):** The user interface.
2.  **Backend API (Node.js + Express):** The central brain handling logic, auth, and database interactions.
3.  **Python Microservice (Flask):** A specialized service for safely executing user code and analyzing algorithm complexity.
4.  **Database (PostgreSQL):** Stores all persistent data.

### Step-by-Step Data Flow for a Code Submission:

1.  **User Action (Frontend):** The user clicks "Submit Code" on the React frontend.
2.  **API Request:** The Frontend sends a POST request containing the `code`, `language`, and `question_id` to the **Node.js Backend**.
3.  **Database Lookup:** The Node.js Backend queries the **PostgreSQL Database** to fetch the expected complexity and hidden test cases for that specific question.
4.  **Delegation (Backend -> Python Service):** The Node.js Backend forwards the user's code and the test cases to the **Python Microservice**.
5.  **Execution & Analysis (Python Service):** 
    *   The Python service executes the code in a secure subprocess against the test cases.
    *   It uses Python's Abstract Syntax Tree (AST) module to analyze loops, recursion, and data structures to predict the Time/Space complexity.
6.  **Results Return:** The Python service sends the execution results (Pass/Fail, Runtime, Memory, Predicted Complexity) back to the **Node.js Backend**.
7.  **Scoring Generation:** The Node.js Backend calculates the final multi-dimensional scores (Correctness, Efficiency, etc.).
8.  **Database Save:** The final submission record and updated analytics are saved to the **PostgreSQL Database**.
9.  **Response to User:** The Node.js Backend sends the final scores and feedback back to the **Frontend**, which renders the result charts for the user.

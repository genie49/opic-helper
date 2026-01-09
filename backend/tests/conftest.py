"""
Pytest fixtures and configuration for backend tests.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
import asyncio

from app.main import app
from app.agents.evaluation_agent import evaluate_answer
from app.agents.question_generation_agent import generate_question


@pytest.fixture
def client():
    """Create a test client for FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_user_id():
    """Mock user ID for authentication."""
    return "test-user-id"


@pytest.fixture
def mock_token_data(mock_user_id):
    """Mock token data."""
    return {
        "user_id": mock_user_id,
        "exp": 9999999999,
    }


@pytest.fixture
def mock_evaluate_answer(monkeypatch):
    """Mock evaluation agent."""

    async def mock_evaluate(*args, **kwargs):
        from app.agents.evaluation_agent import (
            EvaluationResult,
            EvaluationScores,
            Feedback,
        )

        return EvaluationResult(
            evaluated_level="IM2",
            scores=EvaluationScores(
                utterance=7,
                grammar=7,
                vocabulary=6,
                structure=7,
                pronunciation=7,
            ),
            feedback=Feedback(
                strengths=["Good sentence structure", "Clear pronunciation"],
                weaknesses=["Limited vocabulary", "Few connectors"],
                improvements=[
                    "Use more varied adjectives",
                    "Add connectors like however",
                ],
                model_answer="I would like to tell you about my favorite cafe...",
            ),
            overall_comment="Good overall performance.",
        )

    monkeypatch.setattr("app.agents.evaluation_agent.evaluate_answer", mock_evaluate)
    return mock_evaluate


@pytest.fixture
def mock_generate_question(monkeypatch):
    """Mock question generation agent."""

    async def mock_generate(*args, **kwargs):
        from app.agents.question_generation_agent import GeneratedQuestion

        return GeneratedQuestion(
            topic="카페",
            question_type="experience",
            question_text="Tell me about a memorable experience at a cafe.",
            expected_answer_structure="도입 → 시간/장소 → 상황 전개 → 느낀 점",
            key_vocabulary=["memorable", "experience", "atmosphere", "conversation"],
            difficulty_level="IM2",
        )

    monkeypatch.setattr(
        "app.agents.question_generation_agent.generate_question", mock_generate
    )
    return mock_generate


@pytest.fixture
def sample_feedback_data():
    """Sample feedback data for testing."""
    return {
        "questionId": "question-1",
        "answerText": "I often go to a cafe near my house to study and relax.",
        "evaluatedLevel": "IM2",
        "scores": {
            "utterance": 7,
            "grammar": 7,
            "vocabulary": 6,
            "structure": 7,
            "pronunciation": 7,
        },
        "feedback": {
            "strengths": ["Good sentence structure"],
            "weaknesses": ["Limited vocabulary"],
            "improvements": ["Use more varied adjectives"],
            "model_answer": "I would like to tell you about my favorite cafe...",
        },
    }


@pytest.fixture
def sample_question():
    """Sample question data for testing."""
    return {
        "id": "question-1",
        "topicName": "카페",
        "questionType": "experience",
        "questionText": "Tell me about a memorable experience at a cafe.",
    }


@pytest.fixture
def sample_exam_session():
    """Sample exam session data for testing."""
    return {
        "questionCount": 12,
        "sessionId": "exam-session-1",
        "questions": [
            {
                "id": "question-1",
                "topicName": "카페",
                "questionType": "experience",
                "questionText": "Tell me about a memorable experience at a cafe.",
            }
        ],
    }


@pytest.fixture
def sample_generate_request():
    """Sample question generation request."""
    return {
        "topic": "카페",
        "questionType": "experience",
        "currentLevel": "IM2",
        "targetLevel": "IH",
    }


@pytest.fixture
def sample_achievement_criteria():
    """Sample achievement criteria data."""
    return {
        "IM2": {
            "minUtterance": 7,
            "minWords": 90,
            "minConnectors": 2,
            "minModifiers": 5,
        },
        "IH": {
            "minUtterance": 10,
            "minWords": 150,
            "minConnectors": 3,
            "minModifiers": 8,
        },
    }

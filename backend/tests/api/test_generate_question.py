"""
Test question generation API endpoint.
"""

import pytest
from fastapi import status


class TestGenerateQuestion:
    """Test question generation endpoint."""

    def test_generate_question_success(self, client, mock_generate_question):
        """Test successful question generation."""
        response = client.post(
            "/api/generate-question",
            json={
                "topic": "카페",
                "question_type": "experience",
                "current_level": "IM2",
                "target_level": "IH",
            },
            headers={
                "Authorization": "Bearer test-token",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert "question" in data
        assert data["question"]["topic"] == "카페"
        assert data["question"]["question_type"] == "experience"

    def test_generate_question_minimal_params(self, client, mock_generate_question):
        """Test question generation with minimal parameters."""
        response = client.post(
            "/api/generate-question",
            json={
                "topic": "카페",
                "question_type": "experience",
                # Uses defaults for current_level and target_level
            },
            headers={
                "Authorization": "Bearer test-token",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True

    def test_generate_question_invalid_params(self, client):
        """Test question generation with invalid parameters."""
        response = client.post(
            "/api/generate-question",
            json={
                "question_type": "experience",
                # Missing required 'topic' field
            },
            headers={
                "Authorization": "Bearer test-token",
            },
        )

        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_400_BAD_REQUEST,
        ]

    def test_generate_question_different_types(self, client, mock_generate_question):
        """Test question generation with different question types."""
        types = ["description", "routine", "experience", "roleplay", "surprise"]

        for q_type in types:
            response = client.post(
                "/api/generate-question",
                json={
                    "topic": "카페",
                    "question_type": q_type,
                    "current_level": "IM2",
                    "target_level": "IH",
                },
                headers={
                    "Authorization": "Bearer test-token",
                },
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
            assert data["question"]["question_type"] == q_type

    def test_generate_question_different_topics(self, client, mock_generate_question):
        """Test question generation with different topics."""
        topics = ["카페", "음악", "여행", "집", "운동", "일상"]

        for topic in topics:
            response = client.post(
                "/api/generate-question",
                json={
                    "topic": topic,
                    "question_type": "experience",
                    "current_level": "IM2",
                    "target_level": "IH",
                },
                headers={
                    "Authorization": "Bearer test-token",
                },
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
            assert data["question"]["topic"] == topic

    def test_generate_question_structure(self, client, mock_generate_question):
        """Test that generated question has correct structure."""
        response = client.post(
            "/api/generate-question",
            json={
                "topic": "카페",
                "question_type": "experience",
                "current_level": "IM2",
                "target_level": "IH",
            },
            headers={
                "Authorization": "Bearer test-token",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        question = data["question"]

        assert "topic" in question
        assert "question_type" in question
        assert "question_text" in question
        assert "expected_answer_structure" in question
        assert "key_vocabulary" in question
        assert "difficulty_level" in question

        assert isinstance(question["key_vocabulary"], list)
        assert len(question["key_vocabulary"]) >= 3

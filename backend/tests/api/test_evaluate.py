"""
Test evaluation API endpoints.
"""

import pytest
import json
from unittest.mock import AsyncMock, patch

from fastapi import status


class TestEvaluateSSE:
    """Test SSE evaluation endpoint."""

    @pytest.mark.asyncio
    async def test_evaluate_sse_success(self, client, mock_token_data):
        """Test successful SSE evaluation."""
        from app.agents.evaluation_agent import (
            EvaluationResult,
            EvaluationScores,
            Feedback,
            QuantitativeMetrics,
        )

        mock_eval_result = EvaluationResult(
            evaluated_level="IM2",
            scores=EvaluationScores(
                utterance=7, grammar=7, vocabulary=6, structure=7, pronunciation=7
            ),
            feedback=Feedback(
                strengths=["Good sentence structure"],
                weaknesses=["Limited vocabulary"],
                improvements=["Use more varied adjectives"],
                model_answer="I would like to tell you about...",
            ),
            quantitative_metrics=QuantitativeMetrics(
                word_count=50, ttr=0.75, sentence_count=8, connector_count=2
            ),
            overall_comment="Good performance.",
        )

        with patch("app.api.evaluate.evaluate_answer") as mock_evaluate:
            mock_evaluate.return_value = mock_eval_result

            response = client.post(
                "/api/evaluate",
                json={
                    "question": "Tell me about your favorite cafe.",
                    "answer": "I often go to a cafe near my house.",
                },
                headers={
                    "Authorization": "Bearer test-token",
                },
            )

            # SSE returns 200, not JSON
            assert response.status_code == status.HTTP_200_OK


class TestEvaluateSync:
    """Test sync evaluation endpoint."""

    def test_evaluate_sync_success(self, client, mock_evaluate_answer):
        """Test successful sync evaluation."""
        response = client.post(
            "/api/evaluate/sync",
            json={
                "question": "Tell me about your favorite cafe.",
                "answer": "I often go to a cafe near my house.",
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
        assert "result" in data
        assert data["result"]["evaluated_level"] == "IM2"

    def test_evaluate_sync_invalid_params(self, client):
        """Test sync evaluation with invalid parameters."""
        response = client.post(
            "/api/evaluate/sync",
            json={
                "question": "Tell me about your favorite cafe.",
                # Missing required 'answer' field
            },
            headers={
                "Authorization": "Bearer test-token",
            },
        )

        # FastAPI validates required fields automatically
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_400_BAD_REQUEST,
        ]

    def test_evaluate_sync_different_levels(self, client, mock_evaluate_answer):
        """Test sync evaluation with different level combinations."""
        level_combinations = [
            ("NL", "NM"),
            ("IM2", "IH"),
            ("IH", "AL"),
        ]

        for current, target in level_combinations:
            response = client.post(
                "/api/evaluate/sync",
                json={
                    "question": "Tell me about your favorite cafe.",
                    "answer": "I often go to a cafe near my house.",
                    "current_level": current,
                    "target_level": target,
                },
                headers={
                    "Authorization": "Bearer test-token",
                },
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True

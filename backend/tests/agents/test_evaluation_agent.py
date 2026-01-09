"""
Test evaluation agent functionality.
"""

import pytest
from unittest.mock import AsyncMock, patch

from app.agents.evaluation_agent import (
    create_evaluation_agent,
    evaluate_answer,
    EvaluationScores,
    Feedback,
    QuantitativeMetrics,
    EvaluationResult,
)


class TestEvaluationScores:
    """Test EvaluationScores model."""

    def test_evaluation_scores_valid(self):
        """Test that valid scores are accepted."""
        scores = EvaluationScores(
            utterance=7,
            grammar=7,
            vocabulary=6,
            structure=7,
            pronunciation=7,
        )
        assert scores.utterance == 7
        assert scores.grammar == 7
        assert scores.vocabulary == 6
        assert scores.structure == 7
        assert scores.pronunciation == 7

    def test_evaluation_scores_bounds(self):
        """Test that scores must be within valid range."""
        with pytest.raises(ValueError):
            EvaluationScores(
                utterance=11,  # Should fail (>10)
                grammar=7,
                vocabulary=6,
                structure=7,
                pronunciation=7,
            )

        with pytest.raises(ValueError):
            EvaluationScores(
                utterance=7,
                grammar=-1,  # Should fail (<0)
                vocabulary=6,
                structure=7,
                pronunciation=7,
            )


class TestFeedback:
    """Test Feedback model."""

    def test_feedback_valid(self):
        """Test that valid feedback is accepted."""
        feedback = Feedback(
            strengths=["Good sentence structure"],
            weaknesses=["Limited vocabulary"],
            improvements=["Use more varied adjectives"],
            model_answer="I would like to tell you about...",
        )
        assert len(feedback.strengths) == 1
        assert len(feedback.weaknesses) == 1
        assert len(feedback.improvements) == 1


class TestQuantitativeMetrics:
    """Test QuantitativeMetrics model."""

    def test_quantitative_metrics_valid(self):
        """Test that valid metrics are accepted."""
        metrics = QuantitativeMetrics(
            word_count=100,
            ttr=0.75,
            sentence_count=8,
            connector_count=3,
        )
        assert metrics.word_count == 100
        assert metrics.ttr == 0.75
        assert metrics.sentence_count == 8
        assert metrics.connector_count == 3

    def test_ttr_bounds(self):
        """Test that TTR must be within valid range."""
        with pytest.raises(ValueError):
            QuantitativeMetrics(
                word_count=100,
                ttr=1.5,  # Should fail (>1)
                sentence_count=8,
                connector_count=3,
            )

        with pytest.raises(ValueError):
            QuantitativeMetrics(
                word_count=100,
                ttr=-0.1,  # Should fail (<0)
                sentence_count=8,
                connector_count=3,
            )


class TestCreateEvaluationAgent:
    """Test evaluation agent creation."""

    def test_create_evaluation_agent(self):
        """Test that evaluation agent can be created."""
        agent = create_evaluation_agent()
        assert agent is not None


class TestEvaluateAnswer:
    """Test evaluate_answer function."""

    @pytest.mark.asyncio
    async def test_evaluate_answer_basic(self):
        """Test basic evaluation functionality."""
        question = "Tell me about your favorite cafe."
        answer = "I often go to a cafe near my house to study and relax."

        with patch("app.agents.evaluation_agent.ChatXAI") as mock_llm:
            mock_result = AsyncMock()
            mock_result.evaluated_level = "IM2"
            mock_result.scores = EvaluationScores(
                utterance=7, grammar=7, vocabulary=6, structure=7, pronunciation=7
            )
            mock_result.feedback = Feedback(
                strengths=["Good sentence structure"],
                weaknesses=["Limited vocabulary"],
                improvements=["Use more varied adjectives"],
                model_answer="I would like to tell you about...",
            )
            mock_result.overall_comment = "Good performance."

            mock_llm_instance = AsyncMock()
            mock_llm_instance.ainvoke = AsyncMock(return_value=mock_result)
            mock_llm.return_value = mock_llm_instance

            result = await evaluate_answer(
                question=question,
                answer=answer,
                current_level="IM2",
                target_level="IH",
            )

            assert result is not None
            assert result.evaluated_level == "IM2"
            assert result.scores.utterance == 7
            assert result.feedback.strengths[0] == "Good sentence structure"

    @pytest.mark.asyncio
    async def test_evaluate_answer_with_parameters(self):
        """Test evaluation with different parameters."""
        question = "Describe your daily routine."
        answer = "I wake up at 7 AM, eat breakfast, and go to work."

        result = await evaluate_answer(
            question=question,
            answer=answer,
            current_level="NH",
            target_level="IM1",
        )

        assert result is not None
        assert isinstance(result, EvaluationResult)

    @pytest.mark.asyncio
    async def test_evaluate_answer_empty_answer(self):
        """Test evaluation with empty answer."""
        question = "Tell me about your favorite cafe."
        answer = ""

        result = await evaluate_answer(
            question=question,
            answer=answer,
            current_level="IM2",
            target_level="IH",
        )

        # Should still return a result even with empty answer
        assert result is not None

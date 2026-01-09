"""
Test question generation agent functionality.
"""

import pytest
from unittest.mock import AsyncMock, patch

from app.agents.question_generation_agent import (
    create_question_generation_agent,
    generate_question,
    GeneratedQuestion,
)


class TestGeneratedQuestion:
    """Test GeneratedQuestion model."""

    def test_generated_question_valid(self):
        """Test that valid question is accepted."""
        question = GeneratedQuestion(
            topic="카페",
            question_type="experience",
            question_text="Tell me about a memorable experience at a cafe.",
            expected_answer_structure="도입 → 시간/장소 → 상황 전개 → 느낀 점",
            key_vocabulary=["memorable", "experience", "atmosphere"],
            difficulty_level="IM2",
        )
        assert question.topic == "카페"
        assert question.question_type == "experience"
        assert len(question.key_vocabulary) == 3
        assert question.difficulty_level == "IM2"

    def test_generated_question_topic_options(self):
        """Test various topic options."""
        topics = ["카페", "음악", "여행", "집", "운동"]
        for topic in topics:
            question = GeneratedQuestion(
                topic=topic,
                question_type="experience",
                question_text="Tell me about...",
                expected_answer_structure="도입 → 설명",
                key_vocabulary=["test"],
                difficulty_level="IM2",
            )
            assert question.topic == topic

    def test_generated_question_question_types(self):
        """Test various question types."""
        types = ["description", "routine", "experience", "roleplay", "surprise"]
        for q_type in types:
            question = GeneratedQuestion(
                topic="카페",
                question_type=q_type,
                question_text="Tell me about...",
                expected_answer_structure="도입 → 설명",
                key_vocabulary=["test"],
                difficulty_level="IM2",
            )
            assert question.question_type == q_type

    def test_generated_question_difficulty_levels(self):
        """Test various difficulty levels."""
        levels = ["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"]
        for level in levels:
            question = GeneratedQuestion(
                topic="카페",
                question_type="experience",
                question_text="Tell me about...",
                expected_answer_structure="도입 → 설명",
                key_vocabulary=["test"],
                difficulty_level=level,
            )
            assert question.difficulty_level == level


class TestCreateQuestionGenerationAgent:
    """Test question generation agent creation."""

    def test_create_question_generation_agent(self):
        """Test that question generation agent can be created."""
        agent = create_question_generation_agent()
        assert agent is not None


class TestGenerateQuestion:
    """Test generate_question function."""

    @pytest.mark.asyncio
    async def test_generate_question_basic(self):
        """Test basic question generation."""
        with patch("app.agents.question_generation_agent.ChatXAI") as mock_llm:
            mock_result = AsyncMock()
            mock_result.topic = "카페"
            mock_result.question_type = "experience"
            mock_result.question_text = (
                "Tell me about a memorable experience at a cafe."
            )
            mock_result.expected_answer_structure = (
                "도입 → 시간/장소 → 상황 전개 → 느낀 점"
            )
            mock_result.key_vocabulary = ["memorable", "experience", "atmosphere"]
            mock_result.difficulty_level = "IM2"

            mock_llm_instance = AsyncMock()
            mock_llm_instance.ainvoke = AsyncMock(return_value=mock_result)
            mock_llm.return_value = mock_llm_instance

            result = await generate_question(
                topic="카페",
                question_type="experience",
                current_level="IM2",
                target_level="IH",
            )

            assert result is not None
            assert result.topic == "카페"
            assert result.question_type == "experience"
            assert result.difficulty_level == "IM2"
            assert len(result.key_vocabulary) == 3

    @pytest.mark.asyncio
    async def test_generate_question_different_types(self):
        """Test generation with different question types."""
        types = ["description", "routine", "experience", "roleplay", "surprise"]

        for q_type in types:
            with patch("app.agents.question_generation_agent.ChatXAI") as mock_llm:
                mock_result = AsyncMock()
                mock_result.topic = "카페"
                mock_result.question_type = q_type
                mock_result.question_text = "Tell me about..."
                mock_result.expected_answer_structure = "도입 → 설명"
                mock_result.key_vocabulary = ["test"]
                mock_result.difficulty_level = "IM2"

                mock_llm_instance = AsyncMock()
                mock_llm_instance.ainvoke = AsyncMock(return_value=mock_result)
                mock_llm.return_value = mock_llm_instance

                result = await generate_question(
                    topic="카페",
                    question_type=q_type,
                    current_level="IM2",
                    target_level="IH",
                )

                assert result.question_type == q_type

    @pytest.mark.asyncio
    async def test_generate_question_different_levels(self):
        """Test generation with different difficulty levels."""
        levels = ["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"]

        for level in levels:
            with patch("app.agents.question_generation_agent.ChatXAI") as mock_llm:
                mock_result = AsyncMock()
                mock_result.topic = "카페"
                mock_result.question_type = "experience"
                mock_result.question_text = "Tell me about..."
                mock_result.expected_answer_structure = "도입 → 설명"
                mock_result.key_vocabulary = ["test"]
                mock_result.difficulty_level = level

                mock_llm_instance = AsyncMock()
                mock_llm_instance.ainvoke = AsyncMock(return_value=mock_result)
                mock_llm.return_value = mock_llm_instance

                result = await generate_question(
                    topic="카페",
                    question_type="experience",
                    current_level=level,
                    target_level="IH",
                )

                assert result.difficulty_level == level

    @pytest.mark.asyncio
    async def test_generate_question_default_params(self):
        """Test generation with default parameters."""
        with patch("app.agents.question_generation_agent.ChatXAI") as mock_llm:
            mock_result = AsyncMock()
            mock_result.topic = "일상"
            mock_result.question_type = "experience"
            mock_result.question_text = "Tell me about..."
            mock_result.expected_answer_structure = "도입 → 설명"
            mock_result.key_vocabulary = ["test"]
            mock_result.difficulty_level = "IM2"

            mock_llm_instance = AsyncMock()
            mock_llm_instance.ainvoke = AsyncMock(return_value=mock_result)
            mock_llm.return_value = mock_llm_instance

            result = await generate_question()

            assert result.topic == "일상"
            assert result.question_type == "experience"

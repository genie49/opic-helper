import { render, screen } from '@testing-library/react';
import EvaluationFeedback from '@/components/EvaluationFeedback';

describe('EvaluationFeedback Component', () => {
  const mockResult = {
    evaluated_level: 'IM2',
    scores: {
      utterance: 7,
      grammar: 7,
      vocabulary: 6,
      structure: 7,
      pronunciation: 7,
    },
    feedback: {
      strengths: ['Good sentence structure', 'Clear pronunciation'],
      weaknesses: ['Limited vocabulary', 'Few connectors'],
      improvements: ['Use more varied adjectives', 'Add connectors like however'],
      model_answer: 'I would like to tell you about my favorite cafe...',
    },
  };

  it('renders without crashing', () => {
    render(<EvaluationFeedback result={mockResult} />);
    // Component should render without errors
  });

  it('displays evaluated level', () => {
    render(<EvaluationFeedback result={mockResult} />);
    expect(screen.getByText('IM2')).toBeInTheDocument();
    expect(screen.getByText(/AI 산출 등급/i)).toBeInTheDocument();
  });

  it('displays total score', () => {
    render(<EvaluationFeedback result={mockResult} />);
    const totalScore = Object.values(mockResult.scores).reduce((sum, score) => sum + score, 0);
    expect(screen.getByText(`${totalScore} / 50`)).toBeInTheDocument();
  });

  it('displays all score categories', () => {
    render(<EvaluationFeedback result={mockResult} />);

    expect(screen.getByText(/발화력/i)).toBeInTheDocument();
    expect(screen.getByText(/문법/i)).toBeInTheDocument();
    expect(screen.getByText(/어휘력/i)).toBeInTheDocument();
    expect(screen.getByText(/구조/i)).toBeInTheDocument();
    expect(screen.getByText(/발음/i)).toBeInTheDocument();
  });

  it('calculates correct total score', () => {
    render(<EvaluationFeedback result={mockResult} />);
    const totalScore = 7 + 7 + 6 + 7 + 7; // 34
    expect(screen.getByText(`${totalScore} / 50`)).toBeInTheDocument();
  });

  it('displays individual scores', () => {
    render(<EvaluationFeedback result={mockResult} />);

    expect(screen.getByText('7/10')).toBeInTheDocument(); // utterance
    expect(screen.getByText('6/10')).toBeInTheDocument(); // vocabulary
  });

  it('shows strengths', () => {
    render(<EvaluationFeedback result={mockResult} />);
    expect(screen.getByText('Good sentence structure')).toBeInTheDocument();
  });

  it('shows weaknesses', () => {
    render(<EvaluationFeedback result={mockResult} />);
    expect(screen.getByText('Limited vocabulary')).toBeInTheDocument();
  });

  it('shows improvements', () => {
    render(<EvaluationFeedback result={mockResult} />);
    expect(screen.getByText('Use more varied adjectives')).toBeInTheDocument();
  });

  it('shows model answer', () => {
    render(<EvaluationFeedback result={mockResult} />);
    expect(screen.getByText(/모범 답안/i)).toBeInTheDocument();
    expect(screen.getByText('I would like to tell you about my favorite cafe...')).toBeInTheDocument();
  });

  it('calculates correct grade for high scores', () => {
    const highScoreResult = {
      ...mockResult,
      scores: {
        utterance: 9,
        grammar: 9,
        vocabulary: 9,
        structure: 9,
        pronunciation: 9,
      },
    };

    render(<EvaluationFeedback result={highScoreResult} />);
    expect(screen.getByText(/우수/i)).toBeInTheDocument();
  });

  it('calculates correct grade for medium scores', () => {
    const mediumScoreResult = {
      ...mockResult,
      scores: {
        utterance: 5,
        grammar: 5,
        vocabulary: 5,
        structure: 5,
        pronunciation: 5,
      },
    };

    render(<EvaluationFeedback result={mediumScoreResult} />);
    expect(screen.getByText(/보통/i)).toBeInTheDocument();
  });

  it('calculates correct grade for low scores', () => {
    const lowScoreResult = {
      ...mockResult,
      scores: {
        utterance: 3,
        grammar: 3,
        vocabulary: 3,
        structure: 3,
        pronunciation: 3,
      },
    };

    render(<EvaluationFeedback result={lowScoreResult} />);
    expect(screen.getByText(/개선 필요/i)).toBeInTheDocument();
  });

  it('shows progress bars for each category', () => {
    render(<EvaluationFeedback result={mockResult} />);

    // Check if progress bars are rendered (via style attribute)
    const progressBarElements = screen.getAllByRole('progressbar');
    expect(progressBarElements.length).toBeGreaterThan(0);
  });

  it('shows grade badge with correct color', () => {
    render(<EvaluationFeedback result={mockResult} />);
    
    // For IM2 with score 7, should show '양호' (yellow)
    const gradeBadge = screen.getByText(/양호/i);
    expect(gradeBadge).toBeInTheDocument();
  });

  it('handles empty strengths array', () => {
    const noStrengthsResult = {
      ...mockResult,
      feedback: {
        ...mockResult.feedback,
        strengths: [],
      },
    };

    render(<EvaluationFeedback result={noStrengthsResult} />);
    // Should not crash, just show no strengths
  });

  it('handles empty weaknesses array', () => {
    const noWeaknessesResult = {
      ...mockResult,
      feedback: {
        ...mockResult.feedback,
        weaknesses: [],
      },
    };

    render(<EvaluationFeedback result={noWeaknessesResult} />);
    // Should not crash, just show no weaknesses
  });

  it('handles empty improvements array', () => {
    const noImprovementsResult = {
      ...mockResult,
      feedback: {
        ...mockResult.feedback,
        improvements: [],
      },
    };

    render(<EvaluationFeedback result={noImprovementsResult} />);
    // Should not crash, just show no improvements
  });

  it('displays level in context message', () => {
    render(<EvaluationFeedback result={mockResult} />);
    expect(screen.getByText(/IM2 수준에 해당합니다/i)).toBeInTheDocument();
  });

  it('displays all feedback sections', () => {
    render(<EvaluationFeedback result={mockResult} />);

    expect(screen.getByText(/잘한 점/i)).toBeInTheDocument();
    expect(screen.getByText(/부족한 점/i)).toBeInTheDocument();
    expect(screen.getByText(/개선 방안/i)).toBeInTheDocument();
  });
});

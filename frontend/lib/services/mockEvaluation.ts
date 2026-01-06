interface MockEvaluation {
  evaluated_level: "IM1" | "IM2" | "IM3" | "IH";
  scores: {
    utterance: number;
    grammar: number;
    vocabulary: number;
    structure: number;
    pronunciation: number;
  };
  feedback: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    model_answer: string;
  };
}

function generateRandomScore(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getLevelFromScore(totalScore: number): "IM1" | "IM2" | "IM3" | "IH" {
  if (totalScore >= 45) return "IH";
  if (totalScore >= 35) return "IM3";
  if (totalScore >= 25) return "IM2";
  return "IM1";
}

function generateFeedback(
  scores: MockEvaluation["scores"],
  questionText: string
): MockEvaluation["feedback"] {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvements: string[] = [];

  if (scores.utterance >= 8) {
    strengths.push("자연스러운 억양과 강세 사용이 돋보입니다.");
  } else if (scores.utterance < 6) {
    weaknesses.push("억양과 강세가 다소 단조롭습니다.");
    improvements.push("다양한 강세와 억양을 사용해보세요.");
  }

  if (scores.grammar >= 8) {
    strengths.push("문법 실수가 거의 없습니다.");
  } else if (scores.grammar < 6) {
    weaknesses.push("문법 오류가 발생했습니다.");
    improvements.push("기본 문형 연습을 더 해보세요.");
  }

  if (scores.vocabulary >= 8) {
    strengths.push("다양하고 적절한 어휘를 사용했습니다.");
  } else if (scores.vocabulary < 6) {
    weaknesses.push("어휘 선택이 제한적입니다.");
    improvements.push("주제 관련 어휘를 더 공부해보세요.");
  }

  if (scores.structure >= 8) {
    strengths.push("논리적인 구조로 답변을 구성했습니다.");
  } else if (scores.structure < 6) {
    weaknesses.push("답변 구조가 다소 산만합니다.");
    improvements.push("서론-본론-결론 구조를 활용해보세요.");
  }

  if (scores.pronunciation >= 8) {
    strengths.push("발음이 명확하고 알아듣기 쉽습니다.");
  } else if (scores.pronunciation < 6) {
    weaknesses.push("발음이 다소 불명확합니다.");
    improvements.push("천천히 그리고 명확하게 발음하는 연습을 해보세요.");
  }

  if (strengths.length === 0) {
    strengths.push("답변의 길이가 적절합니다.");
  }

  const modelAnswer = generateModelAnswer(questionText);

  return {
    strengths,
    weaknesses,
    improvements,
    model_answer: modelAnswer,
  };
}

function generateModelAnswer(questionText: string): string {
  const templates = [
    "저는 이 주제에 대해 다음과 같이 생각합니다. 먼저, [개인적 경험]을 통해 이 경험을 하게 되었습니다. 그때의 경험은 [구체적 사례]로 인해 기억에 남습니다. 특히, [세부 사항] 때문에 인상 깊었습니다. 이 경험을 통해 [교훈/느낀 점]을 배웠습니다. 앞으로도 이러한 경험을 통해 더 많이 배우고 싶습니다.",
    "제가 이 주제에 대해 말씀드리겠습니다. 저는 [개인적 경험]을 한 적이 있습니다. 그때 저는 [구체적 사례]를 경험했는데, 이는 [세부 사항] 때문에 매우 중요한 경험이었습니다. 이 경험을 통해 저는 [교훈/느낀 점]을 깨달았습니다. 이러한 경험을 통해 저는 [개인적 성장]을 이룰 수 있었습니다.",
    "저의 경험을 공유하겠습니다. 저는 [개인적 경험]을 해보았습니다. 그때 저는 [구체적 사례]를 겪었는데, 이는 [세부 사항] 때문에 매우 인상적이었습니다. 이 경험을 통해 저는 [교훈/느낀 점]을 배웠습니다. 이 경험은 저에게 [개인적 성장]을 가져다주었습니다.",
  ];

  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

export function evaluateAnswer(
  transcription: string,
  questionText: string
): MockEvaluation {
  const utteranceScore = generateRandomScore(6, 10);
  const grammarScore = generateRandomScore(6, 10);
  const vocabularyScore = generateRandomScore(6, 10);
  const structureScore = generateRandomScore(6, 10);
  const pronunciationScore = generateRandomScore(6, 10);

  const scores = {
    utterance: utteranceScore,
    grammar: grammarScore,
    vocabulary: vocabularyScore,
    structure: structureScore,
    pronunciation: pronunciationScore,
  };

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const evaluatedLevel = getLevelFromScore(totalScore);
  const feedback = generateFeedback(scores, questionText);

  return {
    evaluated_level: evaluatedLevel,
    scores,
    feedback,
  };
}

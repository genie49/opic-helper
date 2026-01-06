interface EvaluationResult {
  evaluated_level: string;
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

interface EvaluationFeedbackProps {
  result: EvaluationResult;
}

export default function EvaluationFeedback({ result }: EvaluationFeedbackProps) {
  const totalScore = Object.values(result.scores).reduce((sum, score) => sum + score, 0);

  const getGrade = (score: number) => {
    if (score >= 9) return { label: '우수', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (score >= 7) return { label: '양호', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (score >= 5) return { label: '보통', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { label: '개선 필요', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const levelGrade = getGrade(totalScore / 5);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">평가 결과</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">{totalScore}</div>
          <div className={`text-xl ${levelGrade.color}`}>
            {result.evaluated_level}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">상세 점수</h3>
        <div className="space-y-4">
          {[
            { key: 'utterance', label: '발화력' },
            { key: 'grammar', label: '문법' },
            { key: 'vocabulary', label: '어휘력' },
            { key: 'structure', label: '구조' },
            { key: 'pronunciation', label: '발음' },
          ].map((item) => {
            const score = result.scores[item.key as keyof typeof result.scores];
            const grade = getGrade(score);
            return (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm">{item.label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${grade.bgColor.replace('bg-', 'bg-')}`}
                      style={{ width: `${(score / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {result.feedback.strengths.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-900">✨ 강점</h3>
          <ul className="space-y-2">
            {result.feedback.strengths.map((strength, index) => (
              <li key={index} className="text-green-800">
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.feedback.weaknesses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-900">⚠️ 약점</h3>
          <ul className="space-y-2">
            {result.feedback.weaknesses.map((weakness, index) => (
              <li key={index} className="text-red-800">
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.feedback.improvements.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">💡 개선 포인트</h3>
          <ul className="space-y-2">
            {result.feedback.improvements.map((improvement, index) => (
              <li key={index} className="text-blue-800">
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">모범 답안</h3>
        <p className="text-gray-800 leading-relaxed">
          {result.feedback.model_answer}
        </p>
      </div>
    </div>
  );
}

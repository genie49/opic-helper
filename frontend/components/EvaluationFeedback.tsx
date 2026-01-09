import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    if (score >= 9) return { label: '우수', color: 'text-emerald-600', bgColor: 'bg-emerald-500', lightBg: 'bg-emerald-50' };
    if (score >= 7) return { label: '양호', color: 'text-blue-600', bgColor: 'bg-blue-500', lightBg: 'bg-blue-50' };
    if (score >= 5) return { label: '보통', color: 'text-amber-600', bgColor: 'bg-amber-500', lightBg: 'bg-amber-50' };
    return { label: '개선 필요', color: 'text-rose-600', bgColor: 'bg-rose-500', lightBg: 'bg-rose-50' };
  };

  const levelGrade = getGrade(totalScore / 5);

  return (
    <div className="space-y-8">
      {/* Level Card */}
      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <div className="text-center md:text-left">
              <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-widest mb-2">AI 산출 등급</p>
              <div className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                {result.evaluated_level}
              </div>
            </div>
            
            <div className="h-24 w-px bg-slate-700 hidden md:block" />
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <div className="text-4xl font-black text-primary-foreground">
                  {totalScore} <span className="text-sm font-normal text-slate-500">/ 50</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${levelGrade.lightBg} ${levelGrade.color}`}>
                  {levelGrade.label}
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                당신의 답변은 현재 <span className="text-white font-bold">{result.evaluated_level}</span> 수준에 해당합니다. 
                아래 상세 분석을 통해 부족한 부분을 보완해 보세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Detailed Scores */}
        <Card className="border-none shadow-lg shadow-slate-200/50">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold">영역별 상세 점수</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {[
              { key: 'utterance', label: '발화력 (Utterance)' },
              { key: 'grammar', label: '문법 (Grammar)' },
              { key: 'vocabulary', label: '어휘력 (Vocabulary)' },
              { key: 'structure', label: '구조 (Structure)' },
              { key: 'pronunciation', label: '발음 (Pronunciation)' },
            ].map((item) => {
              const score = result.scores[item.key as keyof typeof result.scores];
              const grade = getGrade(score);
              return (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">{item.label}</span>
                    <span className={`text-sm font-bold ${grade.color}`}>{score}/10</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${grade.bgColor}`}
                      style={{ width: `${(score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Feedback Cards */}
        <div className="space-y-6">
          {result.feedback.strengths.length > 0 && (
            <Card className="border-none shadow-md shadow-emerald-100/50 bg-emerald-50/30 border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  좋은 점
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.feedback.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-emerald-900/80 leading-relaxed flex gap-2">
                      <span className="text-emerald-500">•</span> {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.feedback.weaknesses.length > 0 && (
            <Card className="border-none shadow-md shadow-rose-100/50 bg-rose-50/30 border-l-4 border-l-rose-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-rose-800 uppercase tracking-wider flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  아쉬운 점
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.feedback.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-sm text-rose-900/80 leading-relaxed flex gap-2">
                      <span className="text-rose-500">•</span> {weakness}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.feedback.improvements.length > 0 && (
            <Card className="border-none shadow-md shadow-blue-100/50 bg-blue-50/30 border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 2v10"/><path d="m4.93 4.93 4.24 4.24"/><path d="M2 12h10"/><path d="m4.93 19.07 4.24-4.24"/><path d="M12 22v-10"/><path d="m19.07 19.07-4.24-4.24"/><path d="M22 12H12"/><path d="m19.07 4.93-4.24 4.24"/></svg>
                  개선 팁
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.feedback.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-blue-900/80 leading-relaxed flex gap-2">
                      <span className="text-blue-500">•</span> {improvement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Model Answer */}
      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
        <CardHeader className="bg-slate-900 text-white p-6">
          <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-3">
            <span className="p-1.5 bg-primary rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
            모범 답안
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-10 bg-slate-50/30">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="absolute -top-4 -left-4 text-slate-100 -z-10"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V5C14.017 3.89543 14.9124 3 16.017 3H19.017C21.2261 3 23.017 4.79086 23.017 7V15C23.017 18.866 19.883 22 16.017 22H14.017V21ZM1 15C1 18.866 4.13401 22 8 22H10V21L10 18C10 16.8954 9.10457 16 8 16H5C4.44772 16 4 15.5523 4 15V9C4 8.44772 4.44772 8 5 8H8C9.10457 8 10 7.10457 10 6V5C10 3.89543 9.10457 3 8 3H5C2.79086 3 1 4.79086 1 7V15Z"/></svg>
            <p className="text-base md:text-lg text-slate-700 leading-relaxed italic relative z-10">
              {result.feedback.model_answer}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import PronunciationFeedback from "@/components/PronunciationFeedback";
import EvaluationFeedback from "@/components/EvaluationFeedback";
import { evaluateAnswer } from "@/lib/services/mockEvaluation";
import { TranscriptionResult } from "@/lib/whisper/WhisperService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalAttempts: number;
  masteredQuestions: number;
  inProgressQuestions: number;
  notAttemptedQuestions: number;
  avgScore: string;
}

export default function PracticePage() {
  const [question, setQuestion] = useState<any>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadDashboardStats();
    loadQuestion();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "데이터를 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    }
  };

  const loadQuestion = async () => {
    setIsLoadingQuestion(true);
    try {
      const response = await fetch("/api/question/next");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "문제를 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setQuestion(data.question);
    } catch (error) {
      console.error("문제 로드 실패:", error);
      alert("문제를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleTranscriptionComplete = async (result: TranscriptionResult) => {
    setTranscriptionResult(result);
    setShowFeedback(true);

    if (!question) return;

    try {
      setIsSaving(true);

      const evaluation = evaluateAnswer(result.text, question.questionText);
      setEvaluationResult(evaluation);

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: question.id,
          answerText: result.text,
          evaluatedLevel: evaluation.evaluated_level,
          scores: evaluation.scores,
          feedback: evaluation.feedback,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "피드백 저장에 실패했습니다.");
      }

      await loadDashboardStats();
    } catch (error) {
      console.error("평가 및 저장 실패:", error);
      alert("평가 결과 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextQuestion = () => {
    setTranscriptionResult(null);
    setShowFeedback(false);
    loadQuestion();
  };

  const handleSkipQuestion = () => {
    setTranscriptionResult(null);
    setShowFeedback(false);
    loadQuestion();
  };

  if (isLoadingQuestion) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <span className="p-2 bg-primary/10 rounded-xl text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
            </span>
            실전 연습
          </h1>
          <p className="mt-1 text-muted-foreground ml-12">
            AI가 추천하는 맞춤형 문제로 실전 감각을 익히세요.
          </p>
        </div>
        <div className="flex gap-2 ml-12 md:ml-0">
          <Button variant="outline" size="lg" onClick={handleSkipQuestion} className="hover:bg-slate-100 transition-colors">
            문제 건너뛰기
          </Button>
          <Button 
            variant="default" 
            size="lg" 
            onClick={handleNextQuestion} 
            disabled={!showFeedback}
            className="shadow-lg shadow-primary/20"
          >
            다음 문제 →
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Sidebar - Question Info (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-lg shadow-slate-200/50 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold">문제 정보</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {question ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">주제</p>
                    <p className="text-xl font-bold text-primary">{question.topic || "로딩 중..."}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">문제 유형</p>
                      <p className="font-semibold text-slate-700">{question?.questionType || "-"}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">목표 시간</p>
                      <p className="font-semibold text-slate-700">90초</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">난이도</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold uppercase">
                        Level {question?.difficultyLevel || "-"}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(parseInt(question?.difficultyLevel || "0") / 5) * 100}%` }} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="h-12 bg-slate-100 animate-pulse rounded-lg" />
                  <div className="h-12 bg-slate-100 animate-pulse rounded-lg" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg shadow-slate-200/50 overflow-hidden bg-indigo-50 border-l-4 border-l-indigo-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-indigo-800 uppercase tracking-wider">학습 팁</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-indigo-900/80 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700 mt-0.5">1</span>
                  도입부에서 상황을 명확히 설정하세요.
                </li>
                <li className="flex gap-3 text-sm text-indigo-900/80 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700 mt-0.5">2</span>
                  구체적인 형용사와 부사를 사용하여 경험을 묘사하세요.
                </li>
                <li className="flex gap-3 text-sm text-indigo-900/80 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700 mt-0.5">3</span>
                  자신의 감정이나 느낀 점으로 깔끔하게 마무리하세요.
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-lg shadow-slate-200/50 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold">오늘의 학습 현황</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xl font-bold text-primary">{stats?.masteredQuestions || 0}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">숙달</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xl font-bold text-slate-700">{stats?.avgScore || "0.0"}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">평점</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Question & Answer (8 columns) */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xl font-bold">문제</CardTitle>
                <CardDescription>질문을 잘 듣고(또는 읽고) 답변해 주세요.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
              </Button>
            </CardHeader>
            <CardContent className="pt-8 pb-10 px-8">
              {question && (
                <div className="relative">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-primary/20 rounded-full" />
                  <p className="text-2xl font-medium leading-relaxed text-slate-800 italic">
                    "{question.questionText}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-xl font-bold">답변 녹음</CardTitle>
              <CardDescription>버튼을 클릭하여 답변을 시작하세요. (최대 2분)</CardDescription>
            </CardHeader>
            <CardContent className="pt-10 pb-12">
              <div className="flex flex-col items-center">
                <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
              </div>
            </CardContent>
          </Card>

          {/* Transcription & Feedback */}
          {showFeedback && transcriptionResult && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                <CardHeader className="bg-emerald-50 border-b border-emerald-100 pb-4">
                  <CardTitle className="text-xl font-bold text-emerald-800">텍스트 분석 결과</CardTitle>
                  <CardDescription className="text-emerald-700/70">음성 인식 결과를 확인하고 발음을 체크해보세요.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <PronunciationFeedback result={transcriptionResult} />
                </CardContent>
              </Card>
              
              {isSaving && (
                <Card className="border-none shadow-xl shadow-slate-200/50 p-12 flex flex-col items-center justify-center space-y-4">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-slate-800">AI 정밀 평가 중</h4>
                    <p className="text-sm text-muted-foreground mt-1">답변 내용을 분석하여 등급을 산출하고 있습니다...</p>
                  </div>
                </Card>
              )}
              
              {!isSaving && evaluationResult && (
                <div className="animate-in zoom-in-95 duration-500">
                  <EvaluationFeedback result={evaluationResult} />
                  <div className="mt-8 flex justify-center">
                    <Button 
                      size="xl" 
                      onClick={handleNextQuestion}
                      className="h-16 px-12 rounded-2xl shadow-2xl shadow-primary/30 font-bold transition-all hover:scale-105 active:scale-95"
                    >
                      다음 문제 풀기
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

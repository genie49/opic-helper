"use client";

import { useState, useEffect } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import PronunciationFeedback from "@/components/PronunciationFeedback";
import EvaluationFeedback from "@/components/EvaluationFeedback";
import { evaluateAnswer } from "@/lib/services/mockEvaluation";
import { TranscriptionResult } from "@/lib/whisper/WhisperService";

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
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/dashboard", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("데이터를 불러오는데 실패했습니다.");
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
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/question/next", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("문제를 불러오는데 실패했습니다.");
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

      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
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
        throw new Error("피드백 저장에 실패했습니다.");
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
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">연습하기</h1>
        <p className="text-muted-foreground">
          맞춤형 문제로 OPIc 실력을 향상시키세요
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Sidebar - Question Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-lg bg-card text-card-foreground shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">문제 정보</h3>
              {question ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">주제</p>
                    <p className="text-2xl font-bold text-primary">{question.topic || "로딩 중..."}</p>
                  </div>
                  <div className="space-y-2" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">문제 유형</p>
                    <p className="text-lg">{question?.questionType || "-"}</p>
                  </div>
                  <div className="space-y-2" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">난이도</p>
                    <p className="text-lg">{question?.difficultyLevel || "-"}</p>
                  </div>
                  <div className="space-y-2" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">목표 시간</p>
                    <p className="text-lg">90초</p>
                  </div>
                </>
              ) : (
                <div className="animate-pulse text-sm text-muted-foreground">
                  로딩 중...
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-card text-card-foreground shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">학습 팁</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 도입 - 상황 설정</li>
                <li>• 전개 - 구체적 경험</li>
                <li>• 마무리 - 느낀 점</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content - Question & Answer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg bg-card text-card-foreground shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">문제</h3>
              <p className="text-muted-foreground text-sm">
                아래 문제에 답변해주세요
              </p>
              {question && (
                <div className="bg-muted p-6 rounded-lg">
                  <p className="text-lg leading-relaxed text-foreground">
                    {question.questionText}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-card text-card-foreground shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">답변 녹음</h3>
              <p className="text-muted-foreground text-sm">
                준비가 되면 녹음 버튼을 눌러주세요
              </p>

              <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
            </div>
          </div>

          {/* Transcription & Feedback */}
          {showFeedback && transcriptionResult && (
            <>
              <PronunciationFeedback result={transcriptionResult} />
              {isSaving && (
                <div className="rounded-lg bg-card text-card-foreground shadow-sm border p-6">
                  <div className="flex items-center gap-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    <p>평가 결과 저장 중...</p>
                  </div>
                </div>
              )}
              {!isSaving && evaluationResult && (
                <EvaluationFeedback result={evaluationResult} />
              )}
            </>
          )}

          {/* Progress Card */}
          <div className="rounded-lg bg-card text-card-foreground shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">진행 상황</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats?.masteredQuestions || 0}</p>
                  <p className="text-sm text-muted-foreground">숙달됨</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats?.inProgressQuestions || 0}</p>
                  <p className="text-sm text-muted-foreground">진행 중</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats?.avgScore || "0.0"}</p>
                  <p className="text-sm text-muted-foreground">평균 점수</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSkipQuestion}
            className="flex-1 px-4 py-2 bg-card hover:bg-accent/50 hover:bg-accent/50 border border-input bg-background text-foreground hover:bg-accent/50"
          >
            문제 건너뛰기
          </button>
          <button
            onClick={handleNextQuestion}
            disabled={showFeedback}
            className="flex-1 px-4 py-2 bg-primary text-primary hover:bg-primary/90"
          >
            다음 문제
          </button>
        </div>
      </div>
    </div>
  );
}

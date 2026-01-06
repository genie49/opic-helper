"use client";

import { useState, useEffect } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import PronunciationFeedback from "@/components/PronunciationFeedback";
import EvaluationFeedback from "@/components/EvaluationFeedback";
import { evaluateAnswer } from "@/lib/services/mockEvaluation";
import { TranscriptionResult } from "@/lib/whisper/WhisperService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface RoleplayContext {
  scenario: string;
  role: string;
  context: string;
  expected_interactions: number;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  topic: string;
  difficultyLevel: string;
  roleplayContext?: RoleplayContext;
}

export default function RoleplayPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [currentInteraction, setCurrentInteraction] = useState(0);
  const [interactions, setInteractions] = useState<Array<{
    question: string;
    answer: string;
    transcriptionResult?: TranscriptionResult;
    evaluationResult?: any;
  }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConversationStarted, setIsConversationStarted] = useState(false);

  useEffect(() => {
    loadQuestion();
  }, []);

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
        throw new Error("롤플레이 문제를 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setQuestion(data.question);
      setCurrentInteraction(0);
      setInteractions([]);
      setIsConversationStarted(false);

      if (data.question.questionType === 'roleplay' && data.question.roleplayContext) {
        const context = data.question.roleplayContext as RoleplayContext;
        setCurrentQuestion(`${context.scenario}\n\n${data.question.questionText}`);
      } else {
        setCurrentQuestion(data.question.questionText);
      }
    } catch (error) {
      console.error("문제 로드 실패:", error);
      alert("롤플레이 문제를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const startConversation = () => {
    setIsConversationStarted(true);
  };

  const generateFollowUpQuestion = (index: number): string => {
    const questions = [
      "Could you tell me more about that?",
      "What happened next?",
      "How did that make you feel?",
      "Can you explain in more detail?",
      "What was the outcome?",
    ];
    return questions[index % questions.length];
  };

  const handleTranscriptionComplete = async (result: TranscriptionResult) => {
    if (!question) return;

    try {
      setIsSaving(true);

      const evaluation = evaluateAnswer(result.text, question.questionText);

      const newInteraction = {
        question: currentQuestion,
        answer: result.text,
        transcriptionResult: result,
        evaluationResult: evaluation,
      };

      const updatedInteractions = [...interactions, newInteraction];
      setInteractions(updatedInteractions);

      const expectedInteractions = question.roleplayContext?.expected_interactions || 3;

      if (currentInteraction < expectedInteractions - 1) {
        setCurrentInteraction(currentInteraction + 1);
        setCurrentQuestion(generateFollowUpQuestion(currentInteraction));
      } else {
        setShowFeedback(true);

        const token = localStorage.getItem("access_token");
        const allAnswers = updatedInteractions.map(i => i.answer).join(" ");

        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId: question.id,
            answerText: allAnswers,
            evaluatedLevel: evaluation.evaluated_level,
            scores: evaluation.scores,
            feedback: evaluation.feedback,
          }),
        });

        if (!response.ok) {
          throw new Error("피드백 저장에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("평가 및 저장 실패:", error);
      alert("평가 결과 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setCurrentInteraction(0);
    setInteractions([]);
    setShowFeedback(false);
    setIsConversationStarted(true);
    if (question?.questionType === 'roleplay' && question.roleplayContext) {
      const context = question.roleplayContext as RoleplayContext;
      setCurrentQuestion(`${context.scenario}\n\n${question.questionText}`);
    } else {
      setCurrentQuestion(question?.questionText || "");
    }
  };

  const handleNextQuestion = () => {
    loadQuestion();
  };

  if (isLoadingQuestion) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">롤플레이 연습</h1>
        <p className="text-muted-foreground">
          대화형 상황에서 실전처럼 연습하세요
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Sidebar - Scenario Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>롤플레이 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">주제</p>
                <p className="text-2xl font-bold text-primary">{question?.topic || "로딩 중..."}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">문제 유형</p>
                <p className="text-lg">{question?.questionType === 'roleplay' ? '롤플레이' : '일반'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">난이도</p>
                <p className="text-lg">{question?.difficultyLevel || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">상호작용</p>
                <p className="text-lg">
                  {currentInteraction + 1}/{question?.roleplayContext?.expected_interactions || 3}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>대화 팁</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 상황을 명확하게 이해하세요</li>
                <li>• 자연스러운 대화를 지향하세요</li>
                <li>• 질문에 직접적으로 답변하세요</li>
                <li>• 구체적인 예시를 들어보세요</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Roleplay Conversation */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>시나리오</CardTitle>
              <CardDescription>상황을 확인하고 대화를 시작하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-6 rounded-lg">
                <p className="text-lg leading-relaxed text-foreground whitespace-pre-line">
                  {currentQuestion}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card>
            <CardHeader>
              <CardTitle>대화</CardTitle>
              <CardDescription>녹음으로 대화를 진행하세요</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Chat Messages */}
              <div className="space-y-4 mb-4 min-h-[300px]">
                {interactions.length > 0 ? (
                  interactions.map((interaction, index) => (
                    <div key={index} className="space-y-2">
                      {/* AI Message */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                          AI
                        </div>
                        <div className="flex-1 bg-muted p-3 rounded-lg">
                          <p className="text-sm">{interaction.question}</p>
                        </div>
                      </div>

                      {/* User Message */}
                      <div className="flex gap-3 justify-end">
                        <div className="flex-1 bg-primary text-primary-foreground p-3 rounded-lg max-w-[80%]">
                          <p className="text-sm">{interaction.answer}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-semibold">
                          나
                        </div>
                      </div>

                      {interaction.transcriptionResult && (
                        <PronunciationFeedback result={interaction.transcriptionResult} />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <p className="text-sm">대화를 시작하려면 아래 버튼을 눌러주세요</p>
                  </div>
                )}
              </div>

              {/* Input Area */}
              {!isConversationStarted ? (
                <div className="flex gap-2">
                  <Button
                    onClick={startConversation}
                    className="flex-1"
                    size="lg"
                  >
                    대화 시작
                  </Button>
                  <Button
                    onClick={handleNextQuestion}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    다른 문제
                  </Button>
                </div>
              ) : (
                <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
              )}

              {/* Action Buttons */}
              {isConversationStarted && (
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    처음부터 다시
                  </Button>
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!showFeedback}
                    className="flex-1"
                  >
                    다음 문제
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">진행 상황</span>
                <span className="text-sm text-muted-foreground">
                  {currentInteraction + 1}/{question?.roleplayContext?.expected_interactions || 3}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${((currentInteraction + 1) / (question?.roleplayContext?.expected_interactions || 3)) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Final Evaluation */}
          {showFeedback && interactions.length > 0 && (
            <>
              {isSaving && (
                <div className="rounded-lg bg-card text-card-foreground shadow-sm border p-6">
                  <div className="flex items-center gap-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    <p>평가 결과 저장 중...</p>
                  </div>
                </div>
              )}
              {!isSaving && interactions[interactions.length - 1].evaluationResult && (
                <EvaluationFeedback result={interactions[interactions.length - 1].evaluationResult} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </span>
            AI 롤플레이
          </h1>
          <p className="mt-1 text-muted-foreground ml-12">
            실제 상황 같은 시나리오를 통해 AI와 자연스럽게 대화하며 실전 감각을 익힙니다.
          </p>
        </div>
        <div className="flex gap-2 ml-12 md:ml-0">
          <Button variant="outline" size="lg" onClick={handleReset} className="hover:bg-slate-100 transition-colors">
            다시 시작
          </Button>
          <Button 
            variant="default" 
            size="lg" 
            onClick={handleNextQuestion} 
            disabled={!showFeedback}
            className="shadow-lg shadow-indigo-200"
          >
            다음 문제 →
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Sidebar - Scenario Info (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-lg shadow-slate-200/50 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold">시나리오 정보</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {question ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">주제</p>
                    <p className="text-xl font-bold text-indigo-600">{question.topic || "로딩 중..."}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">난이도</p>
                      <p className="font-semibold text-slate-700">{question?.difficultyLevel || "-"}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">상호작용</p>
                      <p className="font-semibold text-slate-700">
                        {currentInteraction + 1} / {question?.roleplayContext?.expected_interactions || 3}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">진행률</span>
                      <span className="text-xs font-black text-indigo-600">
                        {Math.round(((currentInteraction + 1) / (question?.roleplayContext?.expected_interactions || 3)) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                        style={{ width: `${((currentInteraction + 1) / (question?.roleplayContext?.expected_interactions || 3)) * 100}%` }} 
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-slate-100 rounded w-1/2" />
                  <div className="h-20 bg-slate-100 rounded w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg shadow-slate-200/50 overflow-hidden bg-indigo-50 border-l-4 border-l-indigo-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-indigo-800 uppercase tracking-wider">롤플레이 팁</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-indigo-900/80 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700 mt-0.5">!</span>
                  상대방의 역할에 맞춰 적절한 존칭을 사용하세요.
                </li>
                <li className="flex gap-3 text-sm text-indigo-900/80 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700 mt-0.5">?</span>
                  상대방에게 되묻는 질문을 추가하여 대화를 이어가세요.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Chat Interface (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[600px] bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">상황극 대화</CardTitle>
                  <CardDescription>녹음 버튼을 눌러 답변을 전송하세요.</CardDescription>
                </div>
                {isConversationStarted && (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live Session</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth bg-slate-50/30">
              {/* Initial Scenario Prompt */}
              {question && (
                <div className="flex justify-center mb-8">
                  <div className="max-w-[90%] bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center shadow-sm">
                    <p className="text-indigo-900 font-medium leading-relaxed italic">
                      {currentQuestion.split('\n\n')[0]}
                    </p>
                    <div className="mt-4 pt-4 border-t border-indigo-100/50 text-indigo-800 text-lg font-bold">
                      "{currentQuestion.split('\n\n')[1] || question.questionText}"
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {interactions.length > 0 ? (
                interactions.map((interaction, index) => (
                  <div key={index} className="space-y-8">
                    {/* User Answer */}
                    <div className="flex flex-col items-end gap-2 animate-in slide-in-from-right-4 duration-300">
                      <div className="max-w-[80%] bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md shadow-indigo-200">
                        <p className="text-sm font-medium leading-relaxed">{interaction.answer}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">You · {index + 1}번째 발화</span>
                    </div>

                    {/* AI Question */}
                    <div className="flex flex-col items-start gap-2 animate-in slide-in-from-left-4 duration-300">
                      <div className="flex gap-3 max-w-[80%]">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-indigo-600">AI</span>
                        </div>
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                          <p className="text-sm font-semibold text-slate-800 leading-relaxed italic">"{interaction.question}"</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase ml-11">AI Assistant</span>
                    </div>
                    
                    {/* Interaction level feedback (optional, minimized) */}
                    {interaction.transcriptionResult && index === interactions.length - 1 && !showFeedback && (
                      <div className="animate-in fade-in zoom-in-95 duration-500">
                        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                          <CardContent className="p-0">
                            <PronunciationFeedback result={interaction.transcriptionResult} />
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                ))
              ) : !isConversationStarted && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">롤플레이 준비 완료</h3>
                    <p className="text-slate-500 mt-2 max-w-xs">AI와 실시간 대화를 시작하려면 아래 버튼을 누르세요.</p>
                  </div>
                </div>
              )}
            </CardContent>

            <CardHeader className="border-t border-slate-100 bg-white p-8 shrink-0">
              {!isConversationStarted ? (
                <div className="flex gap-4 w-full">
                  <Button
                    onClick={startConversation}
                    className="flex-1 h-14 text-lg font-bold shadow-lg shadow-indigo-100"
                    size="lg"
                  >
                    대화 시작하기
                  </Button>
                  <Button
                    onClick={handleNextQuestion}
                    variant="outline"
                    className="flex-1 h-14 text-lg font-bold"
                    size="lg"
                  >
                    다른 시나리오
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
                  {isSaving && (
                    <p className="mt-4 text-xs font-bold text-indigo-600 animate-pulse">평가 결과를 산출하고 있습니다...</p>
                  )}
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Final Evaluation */}
          {showFeedback && interactions.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-200">
                  종합 평가 결과
                </div>
              </div>
              <EvaluationFeedback result={interactions[interactions.length - 1].evaluationResult} />
              <div className="mt-10 flex justify-center">
                <Button 
                  size="xl" 
                  onClick={handleNextQuestion}
                  className="h-16 px-12 rounded-2xl shadow-2xl shadow-indigo-200 font-bold transition-all hover:scale-105 active:scale-95 bg-indigo-600"
                >
                  새로운 롤플레이 시작
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

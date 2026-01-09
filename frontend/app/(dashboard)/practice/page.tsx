"use client";

import { useState, useEffect } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import PronunciationFeedback from "@/components/PronunciationFeedback";
import EvaluationFeedback from "@/components/EvaluationFeedback";
import { evaluateAnswer } from "@/lib/services/mockEvaluation";
import { evaluateWithAI, shouldUseAI, convertMockToEvaluationResult, EvaluationProgress } from "@/lib/services/aiEvaluation";
import { createClient } from "@/lib/supabase/client";
import { TranscriptionResult } from "@/lib/whisper/WhisperService";
import {
  Card,
  Text,
  Title,
  Group,
  Stack,
  Button,
  SimpleGrid,
  Progress,
  Badge,
  Box,
  Paper,
  Loader,
  Center,
  ThemeIcon,
  List,
  Skeleton,
  Grid,
  Blockquote,
  rem,
  SegmentedControl,
  Textarea,
} from "@mantine/core";
import {
  IconMicrophone,
  IconVolume,
  IconPlayerSkipForward,
  IconArrowRight,
  IconBulb,
  IconCheck,
  IconStar,
  IconClock,
  IconTarget,
  IconKeyboard,
} from "@tabler/icons-react";

interface DashboardStats {
  totalAttempts: number;
  masteredQuestions: number;
  inProgressQuestions: number;
  notAttemptedQuestions: number;
  avgScore: string;
}

interface UserLevel {
  currentLevelCode: string;
  targetLevelCode: string;
}

export default function PracticePage() {
  const [question, setQuestion] = useState<any>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [textInput, setTextInput] = useState("");
  const [evaluationProgress, setEvaluationProgress] = useState<EvaluationProgress | null>(null);
  const [userLevel, setUserLevel] = useState<UserLevel>({ currentLevelCode: "IM2", targetLevelCode: "IH" });

  useEffect(() => {
    loadUserProfile();
    loadDashboardStats();
    loadQuestion();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setUserLevel({
          currentLevelCode: data.profile.currentLevel?.levelCode || "IM2",
          targetLevelCode: data.profile.targetLevel?.levelCode || "IH",
        });
      }
    } catch (error) {
      console.error("프로필 로드 실패:", error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard");

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
      const response = await fetch("/api/question");

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
    setEvaluationProgress(null);

    if (!question) return;

    try {
      setIsSaving(true);

      let evaluation;

      if (shouldUseAI()) {
        // AI 평가 사용
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("로그인이 필요합니다.");
        }

        const aiResult = await evaluateWithAI(
          session.access_token,
          question.id,
          question.questionText,
          result.text,
          userLevel.currentLevelCode,
          userLevel.targetLevelCode,
          {
            onProgress: (progress) => {
              setEvaluationProgress(progress);
            },
          }
        );

        if (!aiResult) {
          throw new Error("AI 평가에 실패했습니다.");
        }

        evaluation = {
          evaluated_level: aiResult.evaluated_level,
          scores: aiResult.scores,
          feedback: aiResult.feedback,
        };
      } else {
        // Mock 평가 사용
        evaluation = evaluateAnswer(result.text, question.questionText);
      }

      setEvaluationResult(evaluation);
      setEvaluationProgress(null);

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
        throw new Error("피드백 저장에 실패했습니다.");
      }

      await loadDashboardStats();
    } catch (error) {
      console.error("평가 및 저장 실패:", error);
      alert("평가 결과 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
      setEvaluationProgress(null);
    }
  };

  const handleNextQuestion = () => {
    setTranscriptionResult(null);
    setShowFeedback(false);
    setEvaluationResult(null);
    setTextInput("");
    loadQuestion();
  };

  const handleSkipQuestion = () => {
    setTranscriptionResult(null);
    setShowFeedback(false);
    setEvaluationResult(null);
    setTextInput("");
    loadQuestion();
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;

    const words = textInput.trim().split(/\s+/);
    const wordTimestamps = words.map((word, index) => ({
      word,
      timestamp: [index * 0.5, (index + 1) * 0.5] as [number, number],
      confidence: 1.0,
    }));

    const result: TranscriptionResult = {
      text: textInput.trim(),
      words: wordTimestamps,
      avgConfidence: 1.0,
      lowConfidenceWords: [],
    };

    handleTranscriptionComplete(result);
  };

  if (isLoadingQuestion) {
    return (
      <Center py={80}>
        <Loader size="lg" color="violet" />
      </Center>
    );
  }

  return (
    <Stack gap="xl" pb={80}>
      {/* Header */}
      <Group justify="space-between" align="flex-start" pb="md" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
        <Group gap="md">
          <ThemeIcon size={48} radius="md" variant="light">
            <IconMicrophone size={24} />
          </ThemeIcon>
          <Box>
            <Title order={2} fw={800}>실전 연습</Title>
            <Text c="dimmed">AI가 추천하는 맞춤형 문제로 실전 감각을 익히세요.</Text>
          </Box>
        </Group>
        <Group gap="sm">
          <Button
            variant="outline"
            size="md"
            leftSection={<IconPlayerSkipForward size={18} />}
            onClick={handleSkipQuestion}
          >
            건너뛰기
          </Button>
          <Button
            size="md"
            rightSection={<IconArrowRight size={18} />}
            onClick={handleNextQuestion}
            disabled={!showFeedback}
          >
            다음 문제
          </Button>
        </Group>
      </Group>

      <Grid gutter="xl">
        {/* Left Sidebar */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="lg">
            {/* Question Info Card */}
            <Card shadow="sm" radius="lg" padding={0} withBorder>
              <Box p="md" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
                <Title order={5} fw={700}>문제 정보</Title>
              </Box>
              <Box p="lg">
                {question ? (
                  <Stack gap="lg">
                    <Box>
                      <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>주제</Text>
                      <Text size="lg" fw={700} c="violet">{question.topic || "로딩 중..."}</Text>
                    </Box>
                    <SimpleGrid cols={2}>
                      <Box>
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>문제 유형</Text>
                        <Text fw={600}>{question?.questionType || "-"}</Text>
                      </Box>
                      <Box ta="right">
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>목표 시간</Text>
                        <Text fw={600}>90초</Text>
                      </Box>
                    </SimpleGrid>
                    <Box pt="md" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
                      <Group justify="space-between" mb="xs">
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase">난이도</Text>
                        <Badge size="sm" variant="light">
                          Level {question?.difficultyLevel || "-"}
                        </Badge>
                      </Group>
                      <Progress
                        value={(parseInt(question?.difficultyLevel || "0") / 5) * 100}
                        size="sm"
                        radius="xl"
                        color="violet"
                      />
                    </Box>
                  </Stack>
                ) : (
                  <Stack gap="md">
                    <Skeleton height={40} radius="md" />
                    <Skeleton height={40} radius="md" />
                  </Stack>
                )}
              </Box>
            </Card>

            {/* Tips Card */}
            <Card
              shadow="sm"
              radius="lg"
              padding="lg"
              withBorder
              style={{ borderLeft: "4px solid var(--mantine-color-violet-6)" }}
            >
              <Group gap="xs" mb="md">
                <ThemeIcon size="sm" variant="light" color="violet">
                  <IconBulb size={14} />
                </ThemeIcon>
                <Text size="sm" fw={700} c="violet" tt="uppercase">학습 팁</Text>
              </Group>
              <List
                spacing="sm"
                size="sm"
                center
                icon={
                  <ThemeIcon size={20} radius="xl" variant="light" color="violet">
                    <IconCheck size={12} />
                  </ThemeIcon>
                }
              >
                <List.Item>도입부에서 상황을 명확히 설정하세요.</List.Item>
                <List.Item>구체적인 형용사와 부사를 사용하여 경험을 묘사하세요.</List.Item>
                <List.Item>자신의 감정이나 느낀 점으로 깔끔하게 마무리하세요.</List.Item>
              </List>
            </Card>

            {/* Stats Card */}
            <Card shadow="sm" radius="lg" padding={0} withBorder>
              <Box p="md" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
                <Text size="sm" fw={700}>오늘의 학습 현황</Text>
              </Box>
              <SimpleGrid cols={2} p="md" spacing="md">
                <Paper p="md" radius="md" bg="violet.0" ta="center">
                  <Text fz="xl" fw={700} c="violet">{stats?.masteredQuestions || 0}</Text>
                  <Text size="xs" fw={600} c="dimmed" tt="uppercase">숙달</Text>
                </Paper>
                <Paper p="md" radius="md" bg="gray.1" ta="center">
                  <Text fz="xl" fw={700}>{stats?.avgScore || "0.0"}</Text>
                  <Text size="xs" fw={600} c="dimmed" tt="uppercase">평점</Text>
                </Paper>
              </SimpleGrid>
            </Card>
          </Stack>
        </Grid.Col>

        {/* Main Content */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="xl">
            {/* Question Card */}
            <Card shadow="md" radius="lg" padding={0} withBorder>
              <Group justify="space-between" p="lg" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
                <Box>
                  <Title order={4} fw={700}>문제</Title>
                  <Text size="sm" c="dimmed">질문을 잘 듣고(또는 읽고) 답변해 주세요.</Text>
                </Box>
                <Button variant="subtle" size="sm" leftSection={<IconVolume size={16} />}>
                  듣기
                </Button>
              </Group>
              <Box p="xl">
                {question && (
                  <Blockquote
                    color="violet"
                    iconSize={0}
                    p="lg"
                    styles={{
                      root: { backgroundColor: "var(--mantine-color-gray-0)" },
                    }}
                  >
                    <Text size="xl" fw={500} style={{ lineHeight: 1.8 }}>
                      {question.questionText}
                    </Text>
                  </Blockquote>
                )}
              </Box>
            </Card>

            {/* Answer Input Card */}
            <Card shadow="md" radius="lg" padding={0} withBorder>
              <Group justify="space-between" p="lg" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
                <Box>
                  <Title order={4} fw={700}>답변 입력</Title>
                  <Text size="sm" c="dimmed">
                    {inputMode === "voice"
                      ? "버튼을 클릭하여 답변을 시작하세요. (최대 2분)"
                      : "영어로 답변을 작성하고 제출하세요."}
                  </Text>
                </Box>
                <SegmentedControl
                  value={inputMode}
                  onChange={(value) => setInputMode(value as "voice" | "text")}
                  data={[
                    {
                      value: "voice",
                      label: (
                        <Center style={{ gap: 8 }}>
                          <IconMicrophone size={16} />
                          <span>음성</span>
                        </Center>
                      ),
                    },
                    {
                      value: "text",
                      label: (
                        <Center style={{ gap: 8 }}>
                          <IconKeyboard size={16} />
                          <span>텍스트</span>
                        </Center>
                      ),
                    },
                  ]}
                />
              </Group>
              <Box py={48} px="lg">
                {inputMode === "voice" ? (
                  <Center>
                    <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
                  </Center>
                ) : (
                  <Stack gap="md">
                    <Textarea
                      placeholder="Write your answer in English..."
                      minRows={5}
                      maxRows={10}
                      autosize
                      size="md"
                      value={textInput}
                      onChange={(e) => setTextInput(e.currentTarget.value)}
                      styles={{
                        input: {
                          fontSize: rem(16),
                          lineHeight: 1.8,
                        },
                      }}
                    />
                    <Group justify="flex-end">
                      <Button
                        size="md"
                        rightSection={<IconArrowRight size={18} />}
                        onClick={handleTextSubmit}
                        disabled={!textInput.trim()}
                      >
                        제출하기
                      </Button>
                    </Group>
                  </Stack>
                )}
              </Box>
            </Card>

            {/* Feedback Section */}
            {showFeedback && transcriptionResult && (
              <Stack gap="xl">
                {/* Transcription Result */}
                <Card shadow="md" radius="lg" padding={0} withBorder bg="teal.0">
                  <Box p="lg" style={{ borderBottom: "1px solid var(--mantine-color-teal-2)" }}>
                    <Title order={4} fw={700} c="teal.8">텍스트 분석 결과</Title>
                    <Text size="sm" c="teal.7">음성 인식 결과를 확인하고 발음을 체크해보세요.</Text>
                  </Box>
                  <Box p={0}>
                    <PronunciationFeedback result={transcriptionResult} />
                  </Box>
                </Card>

                {/* Loading State */}
                {isSaving && (
                  <Card shadow="md" radius="lg" p={48} withBorder>
                    <Center>
                      <Stack align="center" gap="md" w="100%" maw={400}>
                        <Loader size="lg" color="violet" />
                        <Box ta="center" w="100%">
                          <Text fw={700}>AI 정밀 평가 중</Text>
                          <Text size="sm" c="dimmed" mb="md">
                            {evaluationProgress?.message || "답변 내용을 분석하여 등급을 산출하고 있습니다..."}
                          </Text>
                          {evaluationProgress && (
                            <Progress
                              value={evaluationProgress.progress}
                              size="sm"
                              radius="xl"
                              color="violet"
                              animated
                            />
                          )}
                        </Box>
                      </Stack>
                    </Center>
                  </Card>
                )}

                {/* Evaluation Result */}
                {!isSaving && evaluationResult && (
                  <Stack gap="lg">
                    <EvaluationFeedback result={evaluationResult} />
                    <Center>
                      <Button
                        size="xl"
                        radius="xl"
                        rightSection={<IconArrowRight size={20} />}
                        onClick={handleNextQuestion}
                        styles={{
                          root: { height: rem(64), paddingInline: rem(48) },
                        }}
                      >
                        다음 문제 풀기
                      </Button>
                    </Center>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

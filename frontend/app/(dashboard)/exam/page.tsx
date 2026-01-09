"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Text,
  Title,
  Group,
  Stack,
  Button,
  SimpleGrid,
  Badge,
  Box,
  Paper,
  ThemeIcon,
  Divider,
  Center,
  Progress,
  SegmentedControl,
} from "@mantine/core";
import {
  IconClock,
  IconFileText,
  IconMicrophone,
  IconTrophy,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

export default function ExamPage() {
  const router = useRouter();
  const [examState, setExamState] = useState<"intro" | "active" | "report">("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(40 * 60); // 40 minutes in seconds
  const [questions, setQuestions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [report, setReport] = useState<any>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartExam = async () => {
    try {
      const response = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionCount: 12 }),
      });

      if (!response.ok) throw new Error("모의고사 시작 실패");

      const data = await response.json();
      setSessionId(data.session.id);
      setQuestions(data.questions);
      setExamState("active");

      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleCompleteExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("모의고사 시작 실패:", error);
      alert("모의고사를 시작하는 중 오류가 발생했습니다.");
    }
  };

  const handleCompleteExam = async () => {
    try {
      const response = await fetch(`/api/exam/${sessionId}/complete`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("모의고사 완료 실패");

      const data = await response.json();
      setReport(data.report);
      setExamState("report");
    } catch (error) {
      console.error("모의고사 완료 실패:", error);
      alert("모의고사 완료 중 오류가 발생했습니다.");
    }
  };

  const handleSubmitAnswer = async (questionId: string, answerText: string) => {
    try {
      const response = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId,
          answerText,
        }),
      });

      if (!response.ok) throw new Error("답안 제출 실패");

      setAnswers((prev) => ({ ...prev, [questionId]: answerText }));

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        handleCompleteExam();
      }
    } catch (error) {
      console.error("답안 제출 실패:", error);
      alert("답안 제출 중 오류가 발생했습니다.");
    }
  };

  if (examState === "intro") {
    return (
      <Center py={80}>
        <Stack gap="xl" maw={600} w="100%">
          <ThemeIcon size={80} radius="xl" color="violet" variant="light">
            <IconFileText size={40} />
          </ThemeIcon>
          <Stack align="center" gap="xs">
            <Title order={1} fw={800}>OPIc 모의고사</Title>
            <Text size="lg" c="dimmed" ta="center">
              실제 OPIc와 동일한 형식으로 평가를 진행하세요
            </Text>
          </Stack>

          <Card shadow="xl" radius="lg" padding="xl" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600}>문제 수</Text>
                <Badge size="lg" color="blue">12문제</Badge>
              </Group>
              <Divider />
              <Group justify="space-between">
                <Text fw={600}>시험 시간</Text>
                <Badge size="lg" color="orange">40분</Badge>
              </Group>
              <Divider />
              <Group justify="space-between">
                <Text fw={600}>평가 기준</Text>
                <Badge size="lg" color="violet">AI 자동 평가</Badge>
              </Group>
            </Stack>
          </Card>

          <Paper p="md" radius="md" bg="blue.0" withBorder>
            <Group gap="sm">
              <IconCheck color="green" size={20} />
              <Text size="sm">
                모의고사는 실제 OPIc와 유사한 형식으로 진행됩니다.
                제한 시간 내에 모든 문제에 답변해야 합니다.
              </Text>
            </Group>
          </Paper>

          <Button
            size="xl"
            fullWidth
            leftSection={<IconMicrophone size={20} />}
            onClick={handleStartExam}
          >
            모의고사 시작하기
          </Button>
        </Stack>
      </Center>
    );
  }

  if (examState === "active" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const isTimeLow = timeRemaining < 5 * 60; // Less than 5 minutes

    return (
      <Stack gap="xl" maw={1000} mx="auto" py="xl">
        {/* Header */}
        <Card shadow="md" radius="lg" padding="lg" withBorder>
          <Group justify="space-between">
            <Stack gap={0}>
              <Title order={3} fw={700}>OPIc 모의고사</Title>
              <Text size="sm" c="dimmed">
                문제 {currentQuestionIndex + 1} / {questions.length}
              </Text>
            </Stack>
            <Stack gap={0} align="flex-end">
              <Group gap="xs">
                <IconClock size={20} color={isTimeLow ? "red" : "violet"} />
                <Text
                  size="xl"
                  fw={700}
                  c={isTimeLow ? "red" : "violet"}
                >
                  {formatTime(timeRemaining)}
                </Text>
              </Group>
              <Progress value={progress} w={200} color="violet" />
            </Stack>
          </Group>
        </Card>

        {/* Question */}
        <Card shadow="xl" radius="lg" padding="xl" withBorder>
          <Stack gap="md">
            <Group gap="sm">
              <Badge size="lg" color="blue">{currentQuestion.topicName}</Badge>
              <Badge size="lg" variant="light" color="gray">
                {currentQuestion.questionType}
              </Badge>
            </Group>
            <Title order={2}>{currentQuestion.questionText}</Title>
          </Stack>
        </Card>

        {/* Answer Input */}
        <Card shadow="md" radius="lg" padding="xl" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>답변하기</Text>
              <Badge variant="outline">
                {answers[currentQuestion.id] ? "완료" : "미완료"}
              </Badge>
            </Group>

            <Paper p="xl" radius="md" bg="gray.0" withBorder>
              <Stack align="center" gap="md">
                <ThemeIcon size={64} radius="xl" color="violet" variant="light">
                  <IconMicrophone size={32} />
                </ThemeIcon>
                <Text c="dimmed" ta="center">
                  음성 입력을 시작하려면 마이크 아이콘을 누르세요
                </Text>
                <Button size="lg" color="violet" radius="xl">
                  <IconMicrophone size={20} style={{ marginRight: 8 }} />
                  녹음 시작
                </Button>
              </Stack>
            </Paper>

            <SimpleGrid cols={2}>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  handleSubmitAnswer(currentQuestion.id, "");
                }}
                disabled={currentQuestionIndex === 0}
              >
                이전 문제
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  handleSubmitAnswer(currentQuestion.id, "");
                }}
              >
                {currentQuestionIndex === questions.length - 1 ? "모의고사 완료" : "다음 문제"}
              </Button>
            </SimpleGrid>
          </Stack>
        </Card>
      </Stack>
    );
  }

  if (examState === "report" && report) {
    return (
      <Stack gap="xl" maw={800} mx="auto" py="xl">
        {/* Header */}
        <Stack align="center" gap="md">
          <ThemeIcon size={80} radius="xl" color="yellow" variant="light">
            <IconTrophy size={40} />
          </ThemeIcon>
          <Title order={1} fw={800}>모의고사 완료!</Title>
          <Text size="lg" c="dimmed">
            축하합니다! 모의고사를 성공적으로 완료했습니다.
          </Text>
        </Stack>

        {/* Summary Card */}
        <Card shadow="xl" radius="lg" padding="xl" withBorder>
          <SimpleGrid cols={2} spacing="xl">
            <Stack gap="xs">
              <Text size="xs" fw={600} c="dimmed">총 점수</Text>
              <Text size="xl" fw={800} c="violet">
                {report.totalScore} / {report.totalQuestions * 50}
              </Text>
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={600} c="dimmed">평균 점수</Text>
              <Text size="xl" fw={800} c="blue">{report.averageScore}점</Text>
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={600} c="dimmed">전체 레벨</Text>
              <Text size="xl" fw={800} c="green">{report.overallLevel || "-"}</Text>
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={600} c="dimmed">완료 문제</Text>
              <Text size="xl" fw={800}>{report.answeredQuestions} / {report.totalQuestions}</Text>
            </Stack>
          </SimpleGrid>
        </Card>

        {/* Score Breakdown */}
        <Card shadow="md" radius="lg" padding="lg" withBorder>
          <Title order={4} fw={700} mb="md">영역별 점수</Title>
          <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="md">
            <Stack gap="xs" align="center">
              <Text size="xs" c="dimmed">발화량</Text>
              <Text fw={700} size="lg" c="blue">{report.scoreBreakdown.utterance}</Text>
            </Stack>
            <Stack gap="xs" align="center">
              <Text size="xs" c="dimmed">문법</Text>
              <Text fw={700} size="lg" c="green">{report.scoreBreakdown.grammar}</Text>
            </Stack>
            <Stack gap="xs" align="center">
              <Text size="xs" c="dimmed">어휘</Text>
              <Text fw={700} size="lg" c="yellow">{report.scoreBreakdown.vocabulary}</Text>
            </Stack>
            <Stack gap="xs" align="center">
              <Text size="xs" c="dimmed">구조</Text>
              <Text fw={700} size="lg" c="purple">{report.scoreBreakdown.structure}</Text>
            </Stack>
            <Stack gap="xs" align="center">
              <Text size="xs" c="dimmed">발음</Text>
              <Text fw={700} size="lg" c="orange">{report.scoreBreakdown.pronunciation}</Text>
            </Stack>
          </SimpleGrid>
        </Card>

        {/* Actions */}
        <SimpleGrid cols={2}>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            대시보드로 이동
          </Button>
          <Button
            size="lg"
            color="violet"
            onClick={() => {
              setExamState("intro");
              setCurrentQuestionIndex(0);
              setTimeRemaining(40 * 60);
              setQuestions([]);
              setSessionId(null);
              setAnswers({});
              setReport(null);
            }}
          >
            다시 응시하기
          </Button>
        </SimpleGrid>
      </Stack>
    );
  }

  return null;
}

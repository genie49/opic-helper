"use client";

import { useState, useEffect } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import PronunciationFeedback from "@/components/PronunciationFeedback";
import EvaluationFeedback from "@/components/EvaluationFeedback";
import { evaluateAnswer } from "@/lib/services/mockEvaluation";
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
  ScrollArea,
  Avatar,
  rem,
  Indicator,
  SegmentedControl,
  Textarea,
} from "@mantine/core";
import {
  IconMessages,
  IconRefresh,
  IconArrowRight,
  IconBulb,
  IconUser,
  IconRobot,
  IconPlayerPlay,
  IconArrowsShuffle,
  IconMicrophone,
  IconKeyboard,
} from "@tabler/icons-react";

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
  const [interactions, setInteractions] = useState<
    Array<{
      question: string;
      answer: string;
      transcriptionResult?: TranscriptionResult;
      evaluationResult?: any;
    }>
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConversationStarted, setIsConversationStarted] = useState(false);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [textInput, setTextInput] = useState("");

  useEffect(() => {
    loadQuestion();
  }, []);

  const loadQuestion = async () => {
    setIsLoadingQuestion(true);
    try {
      const response = await fetch("/api/question");

      if (!response.ok) {
        throw new Error("롤플레이 문제를 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setQuestion(data.question);
      setCurrentInteraction(0);
      setInteractions([]);
      setIsConversationStarted(false);

      if (
        data.question.questionType === "roleplay" &&
        data.question.roleplayContext
      ) {
        const context = data.question.roleplayContext as RoleplayContext;
        setCurrentQuestion(
          `${context.scenario}\n\n${data.question.questionText}`
        );
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

      const expectedInteractions =
        question.roleplayContext?.expected_interactions || 3;

      if (currentInteraction < expectedInteractions - 1) {
        setCurrentInteraction(currentInteraction + 1);
        setCurrentQuestion(generateFollowUpQuestion(currentInteraction));
      } else {
        setShowFeedback(true);

        const allAnswers = updatedInteractions.map((i) => i.answer).join(" ");

        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
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
    setTextInput("");
    if (question?.questionType === "roleplay" && question.roleplayContext) {
      const context = question.roleplayContext as RoleplayContext;
      setCurrentQuestion(`${context.scenario}\n\n${question.questionText}`);
    } else {
      setCurrentQuestion(question?.questionText || "");
    }
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

    setTextInput("");
    handleTranscriptionComplete(result);
  };

  const handleNextQuestion = () => {
    loadQuestion();
  };

  if (isLoadingQuestion) {
    return (
      <Center py={80}>
        <Loader size="lg" color="indigo" />
      </Center>
    );
  }

  const expectedInteractions =
    question?.roleplayContext?.expected_interactions || 3;
  const progressPercent = Math.round(
    ((currentInteraction + 1) / expectedInteractions) * 100
  );

  return (
    <Stack gap="xl" pb={80}>
      {/* Header */}
      <Group
        justify="space-between"
        align="flex-start"
        pb="md"
        style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}
      >
        <Group gap="md">
          <ThemeIcon size={48} radius="md" variant="light" color="indigo">
            <IconMessages size={24} />
          </ThemeIcon>
          <Box>
            <Title order={2} fw={800}>
              AI 롤플레이
            </Title>
            <Text c="dimmed">
              실제 상황 같은 시나리오를 통해 AI와 자연스럽게 대화하며 실전
              감각을 익힙니다.
            </Text>
          </Box>
        </Group>
        <Group gap="sm">
          <Button
            variant="outline"
            size="md"
            leftSection={<IconRefresh size={18} />}
            onClick={handleReset}
          >
            다시 시작
          </Button>
          <Button
            size="md"
            color="indigo"
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
            {/* Scenario Info Card */}
            <Card shadow="sm" radius="lg" padding={0} withBorder>
              <Box
                p="md"
                style={{
                  borderBottom: "1px solid var(--mantine-color-gray-2)",
                }}
              >
                <Title order={5} fw={700}>
                  시나리오 정보
                </Title>
              </Box>
              <Box p="lg">
                {question ? (
                  <Stack gap="lg">
                    <Box>
                      <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
                        주제
                      </Text>
                      <Text size="lg" fw={700} c="indigo">
                        {question.topic || "로딩 중..."}
                      </Text>
                    </Box>
                    <SimpleGrid cols={2}>
                      <Box>
                        <Text
                          size="xs"
                          fw={600}
                          c="dimmed"
                          tt="uppercase"
                          mb={4}
                        >
                          난이도
                        </Text>
                        <Text fw={600}>{question?.difficultyLevel || "-"}</Text>
                      </Box>
                      <Box ta="right">
                        <Text
                          size="xs"
                          fw={600}
                          c="dimmed"
                          tt="uppercase"
                          mb={4}
                        >
                          상호작용
                        </Text>
                        <Text fw={600}>
                          {currentInteraction + 1} / {expectedInteractions}
                        </Text>
                      </Box>
                    </SimpleGrid>
                    <Box
                      pt="md"
                      style={{
                        borderTop: "1px solid var(--mantine-color-gray-2)",
                      }}
                    >
                      <Group justify="space-between" mb="xs">
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                          진행률
                        </Text>
                        <Text size="xs" fw={700} c="indigo">
                          {progressPercent}%
                        </Text>
                      </Group>
                      <Progress
                        value={progressPercent}
                        size="sm"
                        radius="xl"
                        color="indigo"
                        animated
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
              bg="indigo.0"
              style={{ borderLeft: "4px solid var(--mantine-color-indigo-6)" }}
            >
              <Group gap="xs" mb="md">
                <ThemeIcon size="sm" variant="light" color="indigo">
                  <IconBulb size={14} />
                </ThemeIcon>
                <Text size="sm" fw={700} c="indigo" tt="uppercase">
                  롤플레이 팁
                </Text>
              </Group>
              <List spacing="sm" size="sm" c="indigo.9">
                <List.Item
                  icon={
                    <Text fw={700} c="indigo" size="xs">
                      !
                    </Text>
                  }
                >
                  상대방의 역할에 맞춰 적절한 존칭을 사용하세요.
                </List.Item>
                <List.Item
                  icon={
                    <Text fw={700} c="indigo" size="xs">
                      ?
                    </Text>
                  }
                >
                  상대방에게 되묻는 질문을 추가하여 대화를 이어가세요.
                </List.Item>
              </List>
            </Card>
          </Stack>
        </Grid.Col>

        {/* Main Content - Chat Interface */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="lg">
            <Card
              shadow="md"
              radius="lg"
              padding={0}
              withBorder
              style={{
                minHeight: 600,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Chat Header */}
              <Group
                justify="space-between"
                p="lg"
                style={{
                  borderBottom: "1px solid var(--mantine-color-gray-2)",
                }}
              >
                <Box>
                  <Title order={4} fw={700}>
                    상황극 대화
                  </Title>
                  <Text size="sm" c="dimmed">
                    녹음 버튼을 눌러 답변을 전송하세요.
                  </Text>
                </Box>
                {isConversationStarted && (
                  <Indicator color="green" processing>
                    <Badge color="green" variant="light" size="sm">
                      Live Session
                    </Badge>
                  </Indicator>
                )}
              </Group>

              {/* Chat Messages */}
              <ScrollArea style={{ flex: 1 }} p="lg" bg="gray.0">
                <Stack gap="xl">
                  {/* Initial Scenario */}
                  {question && (
                    <Center>
                      <Paper
                        p="lg"
                        radius="lg"
                        bg="indigo.0"
                        withBorder
                        maw="90%"
                        ta="center"
                      >
                        <Text c="indigo.9" fs="italic" mb="md">
                          {currentQuestion.split("\n\n")[0]}
                        </Text>
                        <Text size="lg" fw={700} c="indigo.8">
                          "
                          {currentQuestion.split("\n\n")[1] ||
                            question.questionText}
                          "
                        </Text>
                      </Paper>
                    </Center>
                  )}

                  {/* Chat Messages */}
                  {interactions.length > 0
                    ? interactions.map((interaction, index) => (
                        <Stack key={index} gap="lg">
                          {/* User Message */}
                          <Group justify="flex-end">
                            <Stack gap={4} align="flex-end" maw="80%">
                              <Paper
                                p="md"
                                radius="lg"
                                bg="indigo.6"
                                c="white"
                                style={{ borderTopRightRadius: 4 }}
                              >
                                <Text size="sm">{interaction.answer}</Text>
                              </Paper>
                              <Text size="xs" c="dimmed">
                                You · {index + 1}번째 발화
                              </Text>
                            </Stack>
                          </Group>

                          {/* AI Message */}
                          <Group align="flex-start">
                            <Avatar
                              size="sm"
                              radius="md"
                              color="indigo"
                              variant="light"
                            >
                              AI
                            </Avatar>
                            <Stack gap={4} maw="80%">
                              <Paper
                                p="md"
                                radius="lg"
                                bg="white"
                                withBorder
                                style={{ borderTopLeftRadius: 4 }}
                              >
                                <Text size="sm" fw={500} fs="italic">
                                  "{interaction.question}"
                                </Text>
                              </Paper>
                              <Text size="xs" c="dimmed">
                                AI Assistant
                              </Text>
                            </Stack>
                          </Group>

                          {/* Pronunciation Feedback */}
                          {interaction.transcriptionResult &&
                            index === interactions.length - 1 &&
                            !showFeedback && (
                              <Card
                                shadow="sm"
                                radius="md"
                                padding={0}
                                withBorder
                              >
                                <PronunciationFeedback
                                  result={interaction.transcriptionResult}
                                />
                              </Card>
                            )}
                        </Stack>
                      ))
                    : !isConversationStarted && (
                        <Center py={60}>
                          <Stack align="center" gap="md">
                            <ThemeIcon
                              size={80}
                              radius="xl"
                              variant="light"
                              color="indigo"
                            >
                              <IconMessages size={40} />
                            </ThemeIcon>
                            <Title order={4}>롤플레이 준비 완료</Title>
                            <Text size="sm" c="dimmed" maw={300} ta="center">
                              AI와 실시간 대화를 시작하려면 아래 버튼을
                              누르세요.
                            </Text>
                          </Stack>
                        </Center>
                      )}
                </Stack>
              </ScrollArea>

              {/* Chat Input */}
              <Box
                p="xl"
                style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
              >
                {!isConversationStarted ? (
                  <SimpleGrid cols={2} spacing="md">
                    <Button
                      size="lg"
                      color="indigo"
                      leftSection={<IconPlayerPlay size={20} />}
                      onClick={startConversation}
                      h={56}
                    >
                      대화 시작하기
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      leftSection={<IconArrowsShuffle size={20} />}
                      onClick={handleNextQuestion}
                      h={56}
                    >
                      다른 시나리오
                    </Button>
                  </SimpleGrid>
                ) : (
                  <Stack gap="md">
                    <Group justify="center">
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
                    {inputMode === "voice" ? (
                      <Center>
                        <Stack align="center" gap="md">
                          <VoiceRecorder
                            onTranscriptionComplete={handleTranscriptionComplete}
                          />
                          {isSaving && (
                            <Text
                              size="xs"
                              fw={600}
                              c="indigo"
                              className="animate-pulse"
                            >
                              평가 결과를 산출하고 있습니다...
                            </Text>
                          )}
                        </Stack>
                      </Center>
                    ) : (
                      <Stack gap="sm">
                        <Textarea
                          placeholder="Write your response in English..."
                          minRows={3}
                          maxRows={6}
                          autosize
                          size="md"
                          value={textInput}
                          onChange={(e) => setTextInput(e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleTextSubmit();
                            }
                          }}
                          styles={{
                            input: {
                              fontSize: rem(16),
                              lineHeight: 1.6,
                            },
                          }}
                        />
                        <Group justify="flex-end">
                          <Button
                            color="indigo"
                            rightSection={<IconArrowRight size={18} />}
                            onClick={handleTextSubmit}
                            disabled={!textInput.trim() || isSaving}
                          >
                            전송
                          </Button>
                        </Group>
                        {isSaving && (
                          <Text
                            size="xs"
                            fw={600}
                            c="indigo"
                            ta="center"
                            className="animate-pulse"
                          >
                            평가 결과를 산출하고 있습니다...
                          </Text>
                        )}
                      </Stack>
                    )}
                  </Stack>
                )}
              </Box>
            </Card>

            {/* Final Evaluation */}
            {showFeedback && interactions.length > 0 && (
              <Stack gap="lg">
                <Center>
                  <Badge
                    size="lg"
                    color="indigo"
                    variant="filled"
                    tt="uppercase"
                  >
                    종합 평가 결과
                  </Badge>
                </Center>
                <EvaluationFeedback
                  result={
                    interactions[interactions.length - 1].evaluationResult
                  }
                />
                <Center>
                  <Button
                    size="xl"
                    radius="xl"
                    color="indigo"
                    rightSection={<IconArrowRight size={20} />}
                    onClick={handleNextQuestion}
                    styles={{
                      root: { height: rem(64), paddingInline: rem(48) },
                    }}
                  >
                    새로운 롤플레이 시작
                  </Button>
                </Center>
              </Stack>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

"use client";

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
  SegmentedControl,
  Progress,
  Divider,
  Center,
  rem,
  Loader,
} from "@mantine/core";
import {
  IconBook,
  IconStar,
  IconClock,
  IconFlame,
  IconArrowRight,
  IconChevronDown,
  IconHistory,
  IconChartBar,
  IconFileText,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";

interface FeedbackItem {
  id: string;
  questionId: string;
  questionText: string;
  answerText: string;
  evaluatedLevel: string;
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
  quantitativeMetrics?: {
    word_count: number;
    ttr: number;
    sentence_count: number;
    connector_count: number;
  };
  createdAt: string;
}

interface DashboardStats {
  totalAttempts: number;
  masteredQuestions: number;
  inProgressQuestions: number;
  notAttemptedQuestions: number;
  avgScore: string;
  levelHistory: Array<{ level: string; achievedAt: Date }>;
}

export default function HistoryPage() {
  const [period, setPeriod] = useState("month");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistoryData();
  }, [period]);

  const loadHistoryData = async () => {
    try {
      setIsLoading(true);

      const [feedbacksRes, dashboardRes] = await Promise.all([
        fetch("/api/dashboard"),
      ]);

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setStats(data.stats);
        setFeedbacks(data.recentFeedbacks.map((f: any) => ({
          ...f,
          questionText: f.questionText,
          evaluatedLevel: f.evaluatedLevel,
          totalScore: f.totalScore,
        })));
      }
    } catch (error) {
      console.error("히스토리 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Center py={80}>
        <Loader size="lg" />
      </Center>
    );
  }

  const total = (stats?.masteredQuestions || 0) + (stats?.inProgressQuestions || 0) + (stats?.notAttemptedQuestions || 0) || 1;
  const masteredPercent = Math.round(((stats?.masteredQuestions || 0) / total) * 100);

  const statsData = [
    { label: "총 연습 횟수", value: `${stats?.totalAttempts || 0}회`, sub: "누적 학습 기록", icon: IconBook, color: "blue" },
    { label: "평균 평점", value: `${stats?.avgScore || "0"}점`, sub: "전체 평균", icon: IconStar, color: "yellow" },
    { label: "숙달도", value: `${masteredPercent}%`, sub: "완성된 문제 비율", icon: IconChartBar, color: "green" },
    { label: "진행 중", value: `${stats?.inProgressQuestions || 0}개`, sub: "학습 중인 문제", icon: IconFileText, color: "violet" },
  ];

  return (
    <Stack gap="xl" pb={80}>
      {/* Header */}
      <Group justify="space-between" align="flex-start" pb="md" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
        <Group gap="md">
          <ThemeIcon size={48} radius="md" color="dark">
            <IconHistory size={24} />
          </ThemeIcon>
          <Box>
            <Title order={2} fw={800}>학습 히스토리</Title>
            <Text c="dimmed">당신의 성장 궤적을 확인하고 취약점을 파악하세요.</Text>
          </Box>
        </Group>
        <SegmentedControl
          value={period}
          onChange={setPeriod}
          data={[
            { label: "이번 주", value: "week" },
            { label: "이번 달", value: "month" },
            { label: "전체", value: "all" },
          ]}
        />
      </Group>

      {/* Stats Overview */}
      <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="lg">
        {statsData.map((stat, i) => (
          <Card key={i} shadow="sm" radius="lg" padding="lg" withBorder>
            <Group justify="space-between" mb="md">
              <ThemeIcon variant="light" size="lg" radius="md" color={stat.color}>
                <stat.icon size={18} />
              </ThemeIcon>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                {stat.label}
              </Text>
            </Group>
            <Title order={2} fw={800}>{stat.value}</Title>
            <Text size="xs" c="dimmed" fs="italic" mt={4}>{stat.sub}</Text>
          </Card>
        ))}
      </SimpleGrid>

      {/* Activity List */}
      <Card shadow="sm" radius="lg" padding={0} withBorder>
        <Box p="lg" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
          <Title order={4} fw={700}>상세 활동 기록</Title>
          <Text size="sm" c="dimmed">연습별 세부 평가 항목을 확인하세요.</Text>
        </Box>

        <Stack gap={0}>
          {feedbacks.length > 0 ? (
            feedbacks.map((feedback, i) => (
              <Box key={i}>
                {i > 0 && <Divider />}
                <Box
                  p="xl"
                  style={{ cursor: "pointer" }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <Group gap="lg" align="flex-start">
                    {/* Level Badge */}
                    <Paper
                      w={56}
                      h={56}
                      radius="lg"
                      withBorder
                      shadow="sm"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Text fz="lg" fw={800} c="violet">{feedback.evaluatedLevel}</Text>
                    </Paper>

                    {/* Content */}
                    <Stack gap="sm" style={{ flex: 1 }}>
                      <Group justify="space-between">
                        <Title order={5} fw={700} lineClamp={1}>{feedback.questionText}</Title>
                        <Text size="xs" c="dimmed" fs="italic">
                          {new Date(feedback.createdAt).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </Text>
                      </Group>

                      <Group gap="xs">
                        <Badge size="sm" variant="light" color="blue">발화 {feedback.scores.utterance}</Badge>
                        <Badge size="sm" variant="light" color="green">문법 {feedback.scores.grammar}</Badge>
                        <Badge size="sm" variant="light" color="yellow">어휘 {feedback.scores.vocabulary}</Badge>
                        <Badge size="sm" variant="light" color="purple">구조 {feedback.scores.structure}</Badge>
                        <Badge size="sm" variant="light" color="orange">발음 {feedback.scores.pronunciation}</Badge>
                        <Box style={{ flex: 1 }} />
                        <Group gap={4}>
                          <Text fw={700}>{feedback.scores.utterance + feedback.scores.grammar + feedback.scores.vocabulary + feedback.scores.structure + feedback.scores.pronunciation}</Text>
                          <Text size="xs" c="dimmed">/ 100</Text>
                        </Group>
                      </Group>

                      {/* Quantitative Metrics */}
                      {feedback.quantitativeMetrics && (
                        <SimpleGrid cols={4} spacing="xs">
                          <Paper p="xs" radius="md" bg="blue.0">
                            <Text size="xs" c="dimmed">단어 수</Text>
                            <Text fw={700} c="blue">{feedback.quantitativeMetrics.word_count}</Text>
                          </Paper>
                          <Paper p="xs" radius="md" bg="green.0">
                            <Text size="xs" c="dimmed">TTR</Text>
                            <Text fw={700} c="green">{(feedback.quantitativeMetrics.ttr * 100).toFixed(1)}%</Text>
                          </Paper>
                          <Paper p="xs" radius="md" bg="violet.0">
                            <Text size="xs" c="dimmed">문장 수</Text>
                            <Text fw={700} c="violet">{feedback.quantitativeMetrics.sentence_count}</Text>
                          </Paper>
                          <Paper p="xs" radius="md" bg="yellow.0">
                            <Text size="xs" c="dimmed">접속사</Text>
                            <Text fw={700} c="yellow">{feedback.quantitativeMetrics.connector_count}</Text>
                          </Paper>
                        </SimpleGrid>
                      )}

                      {/* AI Feedback Summary */}
                      <Paper p="md" radius="md" bg="gray.0" withBorder>
                        <Group gap="xs" align="flex-start">
                          <Badge size="xs" color="violet" variant="filled">AI FEEDBACK</Badge>
                          <Text size="sm" style={{ flex: 1 }}>
                            {feedback.feedback.strengths[0] || feedback.feedback.weaknesses[0] || feedback.feedback.improvements[0]}
                          </Text>
                        </Group>
                      </Paper>
                    </Stack>

                    {/* Actions */}
                    <Stack gap="xs" align="center">
                      <Button variant="subtle" size="xs">상세 리포트</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        radius="xl"
                        w={40}
                        h={40}
                        p={0}
                      >
                        <IconArrowRight size={16} />
                      </Button>
                    </Stack>
                  </Group>
                </Box>
              </Box>
            ))
          ) : (
            <Center py={60}>
              <Stack align="center" gap="md">
                <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                  <IconHistory size={32} />
                </ThemeIcon>
                <Title order={4} c="dimmed">아직 연습 기록이 없네요</Title>
                <Text size="sm" c="dimmed" maw={300} ta="center">
                  연습을 시작하고 AI의 정밀한 피드백을 받아보세요.
                </Text>
                <Button
                  variant="outline"
                  mt="sm"
                  onClick={() => (window.location.href = "/practice")}
                >
                  첫 연습 시작하기
                </Button>
              </Stack>
            </Center>
          )}
        </Stack>

        <Center p="xl" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
          <Button
            variant="outline"
            size="md"
            leftSection={<IconChevronDown size={16} />}
          >
            이전 기록 더 불러오기
          </Button>
        </Center>
      </Card>
    </Stack>
  );
}

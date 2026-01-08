"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Text,
  Title,
  Group,
  Stack,
  Button,
  SimpleGrid,
  Progress,
  RingProgress,
  ThemeIcon,
  Paper,
  Skeleton,
  Badge,
  Box,
  Divider,
  Center,
  rem,
} from "@mantine/core";
import {
  IconMicrophone,
  IconMessages,
  IconSettings,
  IconTrophy,
  IconFlame,
  IconTarget,
  IconChartBar,
  IconPlayerPlay,
  IconArrowRight,
  IconFileText,
  IconCheck,
  IconClock,
  IconQuestionMark,
} from "@tabler/icons-react";

interface DashboardStats {
  totalAttempts: number;
  masteredQuestions: number;
  inProgressQuestions: number;
  notAttemptedQuestions: number;
  avgScore: string;
  levelHistory: Array<{ level: string; achievedAt: Date }>;
}

interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  currentLevel: {
    id: string;
    levelCode: string;
    levelName: string;
  };
  targetLevel: {
    id: string;
    levelCode: string;
    levelName: string;
  };
}

interface RecentFeedback {
  id: string;
  questionId: string;
  questionText: string;
  evaluatedLevel: string;
  totalScore: number;
  createdAt: Date;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState<RecentFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");

      if (!response.ok) {
        throw new Error("데이터를 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setUser(data.user);
      setStats(data.stats);
      setRecentFeedbacks(data.recentFeedbacks);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Stack gap="xl">
        <Group justify="space-between">
          <Stack gap="xs">
            <Skeleton height={40} width={200} />
            <Skeleton height={20} width={350} />
          </Stack>
          <Skeleton height={42} width={140} radius="md" />
        </Group>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          <Skeleton height={200} radius="md" />
          <Skeleton height={200} radius="md" />
          <Skeleton height={200} radius="md" />
        </SimpleGrid>
      </Stack>
    );
  }

  const total = (stats?.masteredQuestions || 0) + (stats?.inProgressQuestions || 0) + (stats?.notAttemptedQuestions || 0) || 1;
  const masteredPercent = Math.round(((stats?.masteredQuestions || 0) / total) * 100);

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="flex-start">
        <Box>
          <Title order={1} fw={800}>대시보드</Title>
          <Text size="lg" c="dimmed" mt={4}>
            {user ? (
              <>반가워요, <Text span fw={600} c="dark">{user.displayName}</Text>님! 오늘도 목표 등급을 향해 달려볼까요?</>
            ) : (
              "OPIc 학습 진행 상황을 확인하세요"
            )}
          </Text>
        </Box>
        <Button
          size="lg"
          radius="md"
          rightSection={<IconPlayerPlay size={18} />}
          onClick={() => router.push("/practice")}
        >
          연습 시작하기
        </Button>
      </Group>

      {/* Level & Stats Grid */}
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        {/* Current Level Card */}
        {user && (
          <Card
            shadow="xl"
            radius="lg"
            padding="xl"
            style={{
              background: "linear-gradient(135deg, var(--mantine-color-violet-6) 0%, var(--mantine-color-violet-8) 100%)",
              color: "white",
            }}
          >
            <Stack align="center" gap="md">
              <Text size="sm" fw={500} style={{ opacity: 0.8 }}>현재 실력</Text>
              <Title order={1} fz={72} fw={900} lh={1}>
                {user.currentLevel?.levelCode || "-"}
              </Title>
              <Badge
                size="lg"
                variant="light"
                color="white"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                {user.currentLevel?.levelName || "미설정"}
              </Badge>
              <Text size="sm" style={{ opacity: 0.7 }}>
                목표: <Text span fw={700}>{user.targetLevel?.levelCode || "-"}</Text> ({user.targetLevel?.levelName || "미설정"})
              </Text>
            </Stack>
          </Card>
        )}

        {/* Stats Cards */}
        <SimpleGrid cols={2} spacing="md" style={{ gridColumn: user ? "span 2" : "span 3" }}>
          <Card shadow="sm" radius="md" padding="lg" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">전체 시도</Text>
              <ThemeIcon variant="light" size="lg" radius="md">
                <IconFlame size={18} />
              </ThemeIcon>
            </Group>
            <Title order={2} fw={700}>{stats?.totalAttempts || 0}회</Title>
            <Text size="xs" c="dimmed" mt={4}>누적 학습 횟수</Text>
          </Card>

          <Card shadow="sm" radius="md" padding="lg" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">평균 점수</Text>
              <ThemeIcon variant="light" size="lg" radius="md" color="yellow">
                <IconTrophy size={18} />
              </ThemeIcon>
            </Group>
            <Title order={2} fw={700}>{stats?.avgScore || "0.0"}점</Title>
            <Text size="xs" c="dimmed" mt={4}>전체 평균 평점</Text>
          </Card>

          <Card shadow="sm" radius="md" padding="lg" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">숙달 문제</Text>
              <ThemeIcon variant="light" size="lg" radius="md" color="green">
                <IconCheck size={18} />
              </ThemeIcon>
            </Group>
            <Title order={2} fw={700}>{stats?.masteredQuestions || 0}개</Title>
            <Text size="xs" c="dimmed" mt={4}>완벽히 정복한 문제</Text>
          </Card>

          <Card shadow="sm" radius="md" padding="lg" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">진행 중</Text>
              <ThemeIcon variant="light" size="lg" radius="md" color="blue">
                <IconClock size={18} />
              </ThemeIcon>
            </Group>
            <Title order={2} fw={700}>{stats?.inProgressQuestions || 0}개</Title>
            <Text size="xs" c="dimmed" mt={4}>학습 진행 중인 문제</Text>
          </Card>
        </SimpleGrid>
      </SimpleGrid>

      {/* Quick Actions & Progress */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Quick Actions */}
        <Card shadow="sm" radius="lg" padding={0} withBorder>
          <Box p="lg" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
            <Title order={4} fw={700}>빠른 실행</Title>
            <Text size="sm" c="dimmed">학습 도구에 바로 접근하세요</Text>
          </Box>
          <Stack gap={0}>
            <Button
              variant="subtle"
              size="xl"
              justify="flex-start"
              leftSection={<IconMicrophone size={22} />}
              rightSection={<IconArrowRight size={16} style={{ marginLeft: "auto" }} />}
              onClick={() => router.push("/practice")}
              fullWidth
              styles={{
                root: { borderRadius: 0, height: rem(64) },
                inner: { justifyContent: "flex-start" },
              }}
            >
              실전 연습 문제 풀기
            </Button>
            <Divider />
            <Button
              variant="subtle"
              size="xl"
              justify="flex-start"
              leftSection={<IconMessages size={22} />}
              rightSection={<IconArrowRight size={16} style={{ marginLeft: "auto" }} />}
              onClick={() => router.push("/roleplay")}
              fullWidth
              styles={{
                root: { borderRadius: 0, height: rem(64) },
                inner: { justifyContent: "flex-start" },
              }}
            >
              AI 롤플레이 연습
            </Button>
            <Divider />
            <Button
              variant="subtle"
              size="xl"
              justify="flex-start"
              color="gray"
              leftSection={<IconSettings size={22} />}
              rightSection={<IconArrowRight size={16} style={{ marginLeft: "auto" }} />}
              onClick={() => router.push("/survey")}
              fullWidth
              styles={{
                root: { borderRadius: 0, height: rem(64) },
                inner: { justifyContent: "flex-start" },
              }}
            >
              맞춤 설정 (서베이) 수정
            </Button>
          </Stack>
        </Card>

        {/* Progress Card */}
        <Card shadow="sm" radius="lg" padding="lg" withBorder>
          <Title order={4} fw={700} mb="xs">학습 현황</Title>
          <Text size="sm" c="dimmed" mb="xl">전체 문제 대비 숙달도</Text>

          <Center mb="xl">
            <RingProgress
              size={180}
              thickness={16}
              roundCaps
              sections={[
                { value: masteredPercent, color: "green" },
                { value: Math.round(((stats?.inProgressQuestions || 0) / total) * 100), color: "violet" },
              ]}
              label={
                <Center>
                  <Stack gap={0} align="center">
                    <Text fz={32} fw={700}>{masteredPercent}%</Text>
                    <Text size="xs" c="dimmed">달성률</Text>
                  </Stack>
                </Center>
              }
            />
          </Center>

          <SimpleGrid cols={3} spacing="sm">
            <Paper p="md" radius="md" bg="green.0" ta="center">
              <Text fz="xl" fw={700} c="green.7">{stats?.masteredQuestions || 0}</Text>
              <Text size="xs" fw={600} c="green.6" tt="uppercase">숙달</Text>
            </Paper>
            <Paper p="md" radius="md" bg="violet.0" ta="center">
              <Text fz="xl" fw={700} c="violet.7">{stats?.inProgressQuestions || 0}</Text>
              <Text size="xs" fw={600} c="violet.6" tt="uppercase">진행</Text>
            </Paper>
            <Paper p="md" radius="md" bg="gray.1" ta="center">
              <Text fz="xl" fw={700} c="gray.7">{stats?.notAttemptedQuestions || 0}</Text>
              <Text size="xs" fw={600} c="gray.6" tt="uppercase">미시도</Text>
            </Paper>
          </SimpleGrid>
        </Card>
      </SimpleGrid>

      {/* Recent Feedbacks */}
      <Card shadow="sm" radius="lg" padding={0} withBorder>
        <Group justify="space-between" p="lg" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
          <Box>
            <Title order={4} fw={700}>최근 연습 리포트</Title>
            <Text size="sm" c="dimmed">가장 최근에 받은 AI 피드백입니다</Text>
          </Box>
          <Button
            variant="subtle"
            rightSection={<IconArrowRight size={16} />}
            onClick={() => router.push("/history")}
          >
            전체 보기
          </Button>
        </Group>

        {recentFeedbacks.length > 0 ? (
          <Stack gap={0}>
            {recentFeedbacks.map((feedback, index) => (
              <Box key={feedback.id}>
                {index > 0 && <Divider />}
                <Group
                  gap="lg"
                  p="lg"
                  style={{ cursor: "pointer" }}
                  className="hover:bg-gray-50 transition-colors"
                  onClick={() => router.push(`/history/${feedback.id}`)}
                >
                  <Paper
                    w={48}
                    h={48}
                    radius="lg"
                    withBorder
                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Text fw={700} c="violet">{feedback.evaluatedLevel}</Text>
                  </Paper>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600} lineClamp={1}>{feedback.questionText}</Text>
                    <Text size="sm" c="dimmed">
                      {new Date(feedback.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </Box>
                  <Stack gap={4} align="flex-end">
                    <Group gap={4}>
                      <Text fz="lg" fw={700}>{feedback.totalScore}</Text>
                      <Text size="xs" c="dimmed">/ 100</Text>
                    </Group>
                    <Progress
                      value={feedback.totalScore}
                      size="sm"
                      w={80}
                      color={feedback.totalScore >= 80 ? "green" : feedback.totalScore >= 60 ? "yellow" : "red"}
                    />
                  </Stack>
                </Group>
              </Box>
            ))}
          </Stack>
        ) : (
          <Center py={60}>
            <Stack align="center" gap="md">
              <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                <IconFileText size={32} />
              </ThemeIcon>
              <Title order={4} c="dimmed">아직 연습 기록이 없네요</Title>
              <Text size="sm" c="dimmed" maw={300} ta="center">
                연습을 시작하고 AI의 정밀한 피드백을 받아보세요.
              </Text>
              <Button
                variant="outline"
                mt="sm"
                onClick={() => router.push("/practice")}
              >
                첫 연습 시작하기
              </Button>
            </Stack>
          </Center>
        )}
      </Card>
    </Stack>
  );
}

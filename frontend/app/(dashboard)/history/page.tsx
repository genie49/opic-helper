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
} from "@mantine/core";
import {
  IconBook,
  IconStar,
  IconClock,
  IconFlame,
  IconArrowRight,
  IconChevronDown,
  IconHistory,
} from "@tabler/icons-react";
import { useState } from "react";

const stats = [
  { label: "총 연습 횟수", value: "48회", sub: "+12 이번 주", icon: IconBook, color: "blue" },
  { label: "평균 평점", value: "78점", sub: "+3.2% 상승", icon: IconStar, color: "yellow" },
  { label: "누적 학습 시간", value: "12.5h", sub: "목표 달성 82%", icon: IconClock, color: "green" },
  { label: "연속 학습", value: "15일", sub: "최고 기록 경신 중", icon: IconFlame, color: "red" },
];

const activities = [
  {
    title: "카페 - 기억에 남는 경험",
    level: "IM3",
    score: 85,
    time: "2시간 전",
    tags: ["발화량 9", "문법 8", "어휘 7"],
    feedback: "문장 수가 충분하고 도입-전개 구조가 아주 양호합니다.",
  },
  {
    title: "집 - 현재 거주지 묘사",
    level: "IM2",
    score: 75,
    time: "어제",
    tags: ["발화량 8", "문법 7", "어휘 7"],
    feedback: "전반적으로 유창하나 더 다양한 형용사를 사용하면 좋습니다.",
  },
  {
    title: "수영 - 일상 루틴",
    level: "IM2",
    score: 70,
    time: "2일 전",
    tags: ["발화량 7", "문법 7", "어휘 6"],
    feedback: "접속사 활용을 늘려 문장의 연결성을 개선해 보세요.",
  },
];

export default function HistoryPage() {
  const [period, setPeriod] = useState("month");

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
        {stats.map((stat, i) => (
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
          {activities.map((activity, i) => (
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
                    <Text fz="lg" fw={800} c="violet">{activity.level}</Text>
                  </Paper>

                  {/* Content */}
                  <Stack gap="sm" style={{ flex: 1 }}>
                    <Group justify="space-between">
                      <Title order={5} fw={700}>{activity.title}</Title>
                      <Text size="xs" c="dimmed" fs="italic">{activity.time}</Text>
                    </Group>

                    <Group gap="xs">
                      {activity.tags.map((tag, j) => (
                        <Badge key={j} size="sm" variant="light" color="gray">
                          {tag}
                        </Badge>
                      ))}
                      <Box style={{ flex: 1 }} />
                      <Group gap={4}>
                        <Text fw={700}>{activity.score}</Text>
                        <Text size="xs" c="dimmed">/ 100</Text>
                      </Group>
                    </Group>

                    <Paper p="md" radius="md" bg="gray.0" withBorder>
                      <Group gap="xs" align="flex-start">
                        <Badge size="xs" color="violet" variant="filled">AI FEEDBACK</Badge>
                        <Text size="sm" style={{ flex: 1 }}>{activity.feedback}</Text>
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
          ))}
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

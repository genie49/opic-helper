"use client";

import Link from "next/link";
import {
  Container,
  Title,
  Text,
  Button,
  SimpleGrid,
  ThemeIcon,
  Stack,
  Group,
  Paper,
  Box,
  rem,
} from "@mantine/core";
import {
  IconArrowRight,
  IconMicrophone,
  IconBrain,
  IconChartLine,
} from "@tabler/icons-react";
import Image from "next/image";

const features = [
  {
    icon: IconMicrophone,
    title: "실시간 음성 연습",
    description: "마이크로 직접 답변하고 AI가 즉시 피드백을 제공합니다.",
  },
  {
    icon: IconBrain,
    title: "AI 맞춤 학습",
    description: "취약점을 분석해 당신에게 필요한 문제를 추천합니다.",
  },
  {
    icon: IconChartLine,
    title: "성장 트래킹",
    description: "학습 진도와 점수 변화를 한눈에 확인하세요.",
  },
];

export default function Home() {
  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, var(--mantine-color-blue-0) 0%, var(--mantine-color-body) 50%)",
      }}
    >
      {/* Hero Section */}
      <Container size="lg" pt={{ base: rem(80), md: rem(120) }} pb={{ base: rem(60), md: rem(80) }}>
        <Stack align="center" gap="xl">
          <Title
            order={1}
            ta="center"
            fz={{ base: rem(32), sm: rem(48), md: rem(56) }}
            fw={800}
            style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            AI와 함께하는{" "}
            <br className="sm:hidden" />
            <Text
              component="span"
              variant="gradient"
              gradient={{ from: "blue", to: "cyan", deg: 90 }}
              inherit
            >
              OPIc 마스터
            </Text>
          </Title>

          <Text
            c="dimmed"
            ta="center"
            fz={{ base: "md", sm: "lg" }}
            maw={500}
            lh={1.6}
            px="md"
          >
            실시간 AI 평가와 맞춤형 피드백으로
            <br />
            목표 등급 달성을 도와드립니다.
          </Text>

          <Button
            component={Link}
            href="/dashboard"
            size="xl"
            radius="md"
            rightSection={<IconArrowRight size={20} />}
            mt="md"
            fullWidth={false}
            style={{ width: "fit-content" }}
          >
            시작하기
          </Button>
        </Stack>
      </Container>

      {/* Features Section */}
      <Container size="lg" pb={{ base: rem(80), md: rem(120) }}>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
          {features.map((feature) => (
            <Paper
              key={feature.title}
              p="xl"
              radius="lg"
              withBorder
              className="hover:shadow-md transition-shadow"
              style={{ borderColor: "var(--mantine-color-gray-2)" }}
            >
              <ThemeIcon size={48} radius="md" variant="light" mb="md">
                <feature.icon size={24} />
              </ThemeIcon>
              <Text fw={700} fz="lg" mb={rem(8)}>
                {feature.title}
              </Text>
              <Text c="dimmed" fz="sm" lh={1.6}>
                {feature.description}
              </Text>
            </Paper>
          ))}
        </SimpleGrid>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        py="xl"
        style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
      >
        <Container size="lg">
          <Group justify="space-between" align="center" gap="md">
            <Text fw={700} fz="lg">OPIc Helper</Text>
            <Text fz="xs" c="dimmed">
              © 2025 OPIc Helper. All rights reserved.
            </Text>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
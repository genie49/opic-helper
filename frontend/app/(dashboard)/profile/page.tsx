"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Text,
  Title,
  Group,
  Stack,
  Button,
  SimpleGrid,
  Box,
  Paper,
  Loader,
  Center,
  ThemeIcon,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import {
  IconUser,
  IconTarget,
  IconLogout,
  IconDeviceFloppy,
  IconCheck,
  IconChartBar,
} from "@tabler/icons-react";

interface UserProfile {
  id: string;
  displayName: string;
  currentLevel?: {
    id: string;
    levelCode: string;
    levelName: string;
  };
  targetLevel?: {
    id: string;
    levelCode: string;
    levelName: string;
  };
}

interface Level {
  id: string;
  levelCode: string;
  levelName: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [currentLevelId, setCurrentLevelId] = useState("");
  const [targetLevelId, setTargetLevelId] = useState("");

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);

      const [profileRes, levelsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/levels"),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
        setDisplayName(data.profile.displayName || "");
        setCurrentLevelId(data.profile.currentLevel?.id || "");
        setTargetLevelId(data.profile.targetLevel?.id || "");
      }

      if (levelsRes.ok) {
        const data = await levelsRes.json();
        setLevels(data.levels);
      }
    } catch (error) {
      console.error("프로필 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          currentLevelId,
          targetLevelId,
        }),
      });

      if (!response.ok) throw new Error("저장 실패");

      alert("프로필이 업데이트되었습니다.");
      router.push("/dashboard");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Center py={80}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="xl" maw={800} mx="auto" pb={80}>
      {/* Header */}
      <Group justify="space-between" align="flex-start" pb="md" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
        <Group gap="md">
          <ThemeIcon size={48} radius="md" variant="light" color="gray">
            <IconUser size={24} />
          </ThemeIcon>
          <Box>
            <Title order={2} fw={800}>프로필 설정</Title>
            <Text c="dimmed">사용자 정보와 학습 목표를 관리하세요.</Text>
          </Box>
        </Group>
        <Button
          size="md"
          leftSection={<IconDeviceFloppy size={18} />}
          onClick={handleSave}
          loading={isSaving}
        >
          변경 사항 저장
        </Button>
      </Group>

      {/* Basic Info Card */}
      <Card shadow="sm" radius="lg" padding={0} withBorder>
        <Box p="lg" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
          <Title order={4} fw={700}>기본 정보</Title>
          <Text size="sm" c="dimmed">서비스에서 표시될 이름을 설정합니다.</Text>
        </Box>
        <Box p="xl">
          <TextInput
            label="표시 이름"
            placeholder="이름을 입력하세요"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            size="md"
            styles={{
              label: { fontWeight: 600, marginBottom: 8, textTransform: "uppercase", fontSize: 12, letterSpacing: 1 },
            }}
          />
        </Box>
      </Card>

      {/* Current Level Card */}
      <Card shadow="sm" radius="lg" padding={0} withBorder>
        <Box p="lg" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
          <Group gap="xs">
            <IconChartBar size={20} />
            <Title order={4} fw={700}>현재 레벨</Title>
          </Group>
          <Text size="sm" c="dimmed">현재 본인의 OPIc 실력 수준을 선택하세요. 맞춤형 학습 콘텐츠를 제공합니다.</Text>
        </Box>
        <Box p="xl">
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
            {levels.map((level) => {
              const isSelected = currentLevelId === level.id;
              return (
                <UnstyledButton key={level.id} onClick={() => setCurrentLevelId(level.id)}>
                  <Paper
                    p="lg"
                    radius="lg"
                    withBorder
                    style={{
                      borderWidth: 2,
                      borderColor: isSelected ? "var(--mantine-color-blue-6)" : "var(--mantine-color-gray-2)",
                      backgroundColor: isSelected ? "var(--mantine-color-blue-0)" : "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <Stack align="center" gap="xs">
                      <Text fz={28} fw={900} c={isSelected ? "blue" : "dimmed"}>
                        {level.levelCode}
                      </Text>
                      <Text size="xs" fw={600} c={isSelected ? "blue.7" : "dimmed"} tt="uppercase" ta="center">
                        {level.levelName}
                      </Text>
                      {isSelected && (
                        <ThemeIcon size="xs" radius="xl" color="blue">
                          <IconCheck size={10} />
                        </ThemeIcon>
                      )}
                    </Stack>
                  </Paper>
                </UnstyledButton>
              );
            })}
          </SimpleGrid>
        </Box>
      </Card>

      {/* Target Level Card */}
      <Card shadow="sm" radius="lg" padding={0} withBorder>
        <Box p="lg" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
          <Group gap="xs">
            <IconTarget size={20} />
            <Title order={4} fw={700}>목표 레벨</Title>
          </Group>
          <Text size="sm" c="dimmed">목표로 하는 OPIc 등급을 선택하세요. AI가 이에 맞춰 피드백을 조정합니다.</Text>
        </Box>
        <Box p="xl">
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
            {levels.map((level) => {
              const isSelected = targetLevelId === level.id;
              return (
                <UnstyledButton key={level.id} onClick={() => setTargetLevelId(level.id)}>
                  <Paper
                    p="lg"
                    radius="lg"
                    withBorder
                    style={{
                      borderWidth: 2,
                      borderColor: isSelected ? "var(--mantine-color-violet-6)" : "var(--mantine-color-gray-2)",
                      backgroundColor: isSelected ? "var(--mantine-color-violet-0)" : "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <Stack align="center" gap="xs">
                      <Text fz={28} fw={900} c={isSelected ? "violet" : "dimmed"}>
                        {level.levelCode}
                      </Text>
                      <Text size="xs" fw={600} c={isSelected ? "violet.7" : "dimmed"} tt="uppercase" ta="center">
                        {level.levelName}
                      </Text>
                      {isSelected && (
                        <ThemeIcon size="xs" radius="xl" color="violet">
                          <IconCheck size={10} />
                        </ThemeIcon>
                      )}
                    </Stack>
                  </Paper>
                </UnstyledButton>
              );
            })}
          </SimpleGrid>
        </Box>
      </Card>

      {/* Account Management Card */}
      <Card shadow="sm" radius="lg" padding={0} withBorder bg="red.0">
        <Box p="lg" style={{ borderBottom: "1px solid var(--mantine-color-red-2)" }}>
          <Title order={4} fw={700} c="red.8">계정 관리</Title>
          <Text size="sm" c="red.6">로그아웃 및 계정 관련 설정입니다.</Text>
        </Box>
        <Box p="xl">
          <form action="/auth/logout" method="post">
            <Button
              type="submit"
              variant="outline"
              color="red"
              fullWidth
              size="md"
              leftSection={<IconLogout size={18} />}
            >
              로그아웃
            </Button>
          </form>
        </Box>
      </Card>
    </Stack>
  );
}

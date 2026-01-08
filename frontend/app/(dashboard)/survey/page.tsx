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
  RingProgress,
  Checkbox,
  Grid,
  Badge,
  Alert,
  UnstyledButton,
} from "@mantine/core";
import {
  IconPencil,
  IconHome,
  IconShoppingBag,
  IconMoodSmile,
  IconRun,
  IconWorld,
  IconDeviceFloppy,
  IconX,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";

interface SurveyCategory {
  id: string;
  name: string;
  description: string;
  options: string[];
  icon: React.ReactNode;
}

const surveyCategories: SurveyCategory[] = [
  {
    id: "residence",
    name: "거주지",
    description: "현재 살고 있는 곳과 관련된 주제",
    options: ["집", "방", "외관", "아파트", "단독주택", "원룸"],
    icon: <IconHome size={18} />,
  },
  {
    id: "leisure",
    name: "여가활동",
    description: "여가 시간에 하는 활동",
    options: ["카페", "영화", "쇼핑", "독서", "인터넷 쇼핑", "게임"],
    icon: <IconShoppingBag size={18} />,
  },
  {
    id: "hobby",
    name: "취미",
    description: "특별히 좋아하는 활동",
    options: ["음악 감상", "요리", "그림 그리기", "사진 찍기", "댄스", "악기 연주"],
    icon: <IconMoodSmile size={18} />,
  },
  {
    id: "exercise",
    name: "운동",
    description: "건강을 위해 하는 활동",
    options: ["수영", "요가", "조깅", "헬스", "자전거", "등산"],
    icon: <IconRun size={18} />,
  },
  {
    id: "travel",
    name: "여행",
    description: "여행 관련 경험",
    options: ["국내여행", "해외여행", "가족 여행", "친구와 여행", "단독 여행", "단체 여행"],
    icon: <IconWorld size={18} />,
  },
];

export default function SurveyPage() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [existingSelections, setExistingSelections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadExistingSurvey();
  }, []);

  const loadExistingSurvey = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/survey");

      if (!response.ok) {
        throw new Error("서베이 데이터를 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setExistingSelections(data.selections || []);

      const items = new Set<string>();
      data.selections.forEach((selection: any) => {
        items.add(`${selection.category}-${selection.selection}`);
      });
      setSelectedItems(items);
    } catch (error) {
      console.error("서베이 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionChange = (category: string, option: string, checked: boolean) => {
    const key = `${category}-${option}`;
    const newSelectedItems = new Set(selectedItems);

    if (checked) {
      if (newSelectedItems.size >= 12) {
        alert("최대 12개까지만 선택할 수 있습니다.");
        return;
      }
      newSelectedItems.add(key);
    } else {
      newSelectedItems.delete(key);
    }

    setSelectedItems(newSelectedItems);
  };

  const handleSave = async () => {
    if (selectedItems.size < 6) {
      alert("최소 6개 이상 선택해야 합니다.");
      return;
    }

    try {
      setIsSaving(true);

      const selections = Array.from(selectedItems).map((item) => {
        const [category, selection] = item.split("-");
        return { category, selection };
      });

      const response = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selections }),
      });

      if (!response.ok) {
        throw new Error("서베이 저장에 실패했습니다.");
      }

      const data = await response.json();
      alert(data.message);

      router.push("/dashboard");
    } catch (error) {
      console.error("서베이 저장 실패:", error);
      alert("서베이 저장에 실패했습니다.");
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

  const progressPercent = Math.round((selectedItems.size / 12) * 100);
  const isValid = selectedItems.size >= 6 && selectedItems.size <= 12;

  return (
    <Stack gap="xl" pb={80}>
      {/* Header */}
      <Group justify="space-between" align="flex-start" pb="md" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
        <Group gap="md">
          <ThemeIcon size={48} radius="md" variant="light">
            <IconPencil size={24} />
          </ThemeIcon>
          <Box>
            <Title order={2} fw={800}>맞춤형 서베이 설정</Title>
            <Text c="dimmed">관심 주제를 선택하면 AI가 당신에게 꼭 맞는 문제를 출제합니다.</Text>
          </Box>
        </Group>
        <Group gap="sm">
          <Button
            variant="outline"
            size="md"
            leftSection={<IconX size={18} />}
            onClick={() => router.push("/dashboard")}
          >
            취소
          </Button>
          <Button
            size="md"
            leftSection={<IconDeviceFloppy size={18} />}
            onClick={handleSave}
            disabled={!isValid || isSaving}
            loading={isSaving}
          >
            설정 완료하기
          </Button>
        </Group>
      </Group>

      <Grid gutter="xl">
        {/* Sidebar - Selection Status */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card shadow="lg" radius="lg" padding={0} withBorder style={{ position: "sticky", top: 100 }}>
            <Box p="lg" bg="dark.7" c="white">
              <Title order={4} fw={700}>선택 현황</Title>
              <Text size="sm" c="gray.4">최소 6개에서 최대 12개까지 선택 가능합니다.</Text>
            </Box>
            <Box p="xl">
              <Center mb="xl">
                <RingProgress
                  size={160}
                  thickness={12}
                  roundCaps
                  sections={[{ value: progressPercent, color: "violet" }]}
                  label={
                    <Center>
                      <Stack gap={0} align="center">
                        <Text fz={36} fw={900}>{selectedItems.size}</Text>
                        <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 2 }}>Selected</Text>
                      </Stack>
                    </Center>
                  }
                />
              </Center>

              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm" fw={600} c="dimmed">진행률</Text>
                  <Text size="sm" fw={700} c="violet">{Math.round((selectedItems.size / 6) * 100)}%</Text>
                </Group>

                {selectedItems.size < 6 ? (
                  <Alert
                    variant="light"
                    color="yellow"
                    icon={<IconAlertCircle size={18} />}
                    title="추가 선택 필요"
                  >
                    <Text size="xs">
                      최소 <Text span fw={700}>6개</Text> 이상의 주제를 선택해야 연습을 시작할 수 있습니다. (현재 {6 - selectedItems.size}개 더 필요)
                    </Text>
                  </Alert>
                ) : (
                  <Alert
                    variant="light"
                    color="green"
                    icon={<IconCheck size={18} />}
                    title="선택 완료"
                  >
                    <Text size="xs">
                      충분한 주제가 선택되었습니다! 이제 실전 연습이 가능합니다.
                    </Text>
                  </Alert>
                )}
              </Stack>
            </Box>
          </Card>
        </Grid.Col>

        {/* Main Content - Categories */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {surveyCategories.map((category) => (
              <Card key={category.id} shadow="md" radius="lg" padding={0} withBorder>
                <Box p="md" bg="gray.0" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
                  <Group gap="sm">
                    <ThemeIcon variant="light" size="lg" radius="md">
                      {category.icon}
                    </ThemeIcon>
                    <Box>
                      <Title order={5} fw={700}>{category.name}</Title>
                      <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>{category.id}</Text>
                    </Box>
                  </Group>
                </Box>
                <Stack gap={0} p="md">
                  {category.options.map((option) => {
                    const key = `${category.id}-${option}`;
                    const isChecked = selectedItems.has(key);
                    return (
                      <UnstyledButton
                        key={option}
                        onClick={() => handleSelectionChange(category.id, option, !isChecked)}
                        style={{ width: "100%" }}
                      >
                        <Paper
                          p="sm"
                          radius="md"
                          withBorder
                          mb={8}
                          style={{
                            borderColor: isChecked ? "var(--mantine-color-violet-5)" : "var(--mantine-color-gray-2)",
                            backgroundColor: isChecked ? "var(--mantine-color-violet-0)" : "white",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Group justify="space-between">
                            <Text size="sm" fw={600} c={isChecked ? "violet.7" : "dark"}>
                              {option}
                            </Text>
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectionChange(category.id, option, e.currentTarget.checked);
                              }}
                              color="violet"
                              size="sm"
                              radius="sm"
                            />
                          </Group>
                        </Paper>
                      </UnstyledButton>
                    );
                  })}
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

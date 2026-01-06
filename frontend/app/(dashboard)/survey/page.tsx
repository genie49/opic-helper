"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface SurveyCategory {
  id: string;
  name: string;
  description: string;
  options: string[];
}

const surveyCategories: SurveyCategory[] = [
  {
    id: "residence",
    name: "거주지",
    description: "현재 살고 있는 곳과 관련된 주제",
    options: [
      "집",
      "방",
      "외관",
      "아파트",
      "단독주택",
      "원룸",
    ],
  },
  {
    id: "leisure",
    name: "여가활동",
    description: "여가 시간에 하는 활동",
    options: [
      "카페",
      "영화",
      "쇼핑",
      "독서",
      "인터넷 쇼핑",
      "게임",
    ],
  },
  {
    id: "hobby",
    name: "취미",
    description: "특별히 좋아하는 활동",
    options: [
      "음악 감상",
      "요리",
      "그림 그리기",
      "사진 찍기",
      "댄스",
      "악기 연주",
    ],
  },
  {
    id: "exercise",
    name: "운동",
    description: "건강을 위해 하는 활동",
    options: [
      "수영",
      "요가",
      "조깅",
      "헬스",
      "자전거",
      "등산",
    ],
  },
  {
    id: "travel",
    name: "여행",
    description: "여행 관련 경험",
    options: [
      "국내여행",
      "해외여행",
      "가족 여행",
      "친구와 여행",
      "단독 여행",
      "단체 여행",
    ],
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
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/survey", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

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

      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
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
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  const hasExistingSurvey = existingSelections.length > 0;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">서베이</h1>
        <p className="text-muted-foreground">
          관심 주제를 선택하여 맞춤형 문제를 받으세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>선택 안내</CardTitle>
          <CardDescription>
            각 카테고리에서 1-2개의 항목을 선택해주세요. (최소 6개, 최대 12개)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold">{selectedItems.size}</div>
            <div className="flex-1">
              <p className="text-sm font-medium">선택된 항목</p>
              <p className="text-xs text-muted-foreground">
                최소 6개, 최대 12개 (현재: {selectedItems.size}/12)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {surveyCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.options.map((option) => {
                  const isChecked = selectedItems.has(`${category.id}-${option}`);
                  return (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${category.id}-${option}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleSelectionChange(category.id, option, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`${category.id}-${option}`}
                        className="cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
        >
          취소
        </Button>
        <Button
          onClick={handleSave}
          disabled={selectedItems.size < 6 || selectedItems.size > 12 || isSaving}
        >
          {isSaving ? "저장 중..." : "저장하기"}
        </Button>
      </div>

      {hasExistingSurvey && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">
            현재 저장된 서베이
          </h3>
          <div className="space-y-2">
            {existingSelections.map((selection, index) => (
              <div key={index} className="text-blue-800">
                <span className="font-medium">{selection.category}:</span> {selection.selection}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
      const response = await fetch("/api/survey");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error("로그인이 필요합니다.");
        }
        throw new Error(errorData.error || "서베이 데이터를 불러오는데 실패했습니다.");
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
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error("로그인이 필요합니다.");
        }
        throw new Error(errorData.error || "서베이 저장에 실패했습니다.");
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
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <span className="p-2 bg-primary/10 rounded-xl text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </span>
            맞춤형 서베이 설정
          </h1>
          <p className="mt-1 text-muted-foreground ml-12">
            관심 주제를 선택하면 AI가 당신에게 꼭 맞는 문제를 출제합니다.
          </p>
        </div>
        <div className="flex gap-2 ml-12 md:ml-0">
          <Button variant="ghost" size="lg" onClick={() => router.push("/dashboard")}>
            취소
          </Button>
          <Button 
            variant="default" 
            size="lg" 
            onClick={handleSave} 
            disabled={selectedItems.size < 6 || selectedItems.size > 12 || isSaving}
            className="shadow-lg shadow-primary/20"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                저장 중...
              </span>
            ) : "설정 완료하기"}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Selection Status Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden sticky top-24">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="text-lg font-bold">선택 현황</CardTitle>
              <CardDescription className="text-slate-400">최소 6개에서 최대 12개까지 선택 가능합니다.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-slate-100"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 - (364.4 * selectedItems.size) / 12}
                      className="text-primary transition-all duration-500 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-800">{selectedItems.size}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">진행률</span>
                  <span className="font-bold text-primary">{Math.round((selectedItems.size / 6) * 100)}%</span>
                </div>
                {selectedItems.size < 6 ? (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                      최소 <span className="font-bold">6개</span> 이상의 주제를 선택해야 연습을 시작할 수 있습니다. (현재 {6 - selectedItems.size}개 더 필요)
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                      충분한 주제가 선택되었습니다! 이제 실전 연습이 가능합니다.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Grid */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {surveyCategories.map((category) => (
              <Card key={category.id} className="border-none shadow-lg shadow-slate-200/50 overflow-hidden group hover:shadow-xl transition-all">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                      {category.id === 'residence' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                      {category.id === 'leisure' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
                      {category.id === 'hobby' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>}
                      {category.id === 'exercise' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-4.3-4.3"/><path d="m3 3 4.3 4.3"/><path d="M18 11a6 6 0 1 0-12 0 6 6 0 0 0 12 0Z"/></svg>}
                      {category.id === 'travel' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"/><path d="M12 2v20"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/><path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10"/></svg>}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{category.name}</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest">{category.id}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-2">
                    {category.options.map((option) => {
                      const key = `${category.id}-${option}`;
                      const isChecked = selectedItems.has(key);
                      return (
                        <div 
                          key={option} 
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer hover:bg-slate-50 ${
                            isChecked ? 'border-primary bg-primary/5' : 'border-slate-100'
                          }`}
                          onClick={() => handleSelectionChange(category.id, option, !isChecked)}
                        >
                          <Label
                            htmlFor={key}
                            className="flex-1 font-semibold text-slate-700 cursor-pointer"
                          >
                            {option}
                          </Label>
                          <Checkbox
                            id={key}
                            checked={isChecked}
                            className="h-5 w-5 rounded-md"
                            onCheckedChange={(checked) =>
                              handleSelectionChange(category.id, option, checked as boolean)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

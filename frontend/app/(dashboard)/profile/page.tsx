"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

interface UserProfile {
  id: string;
  displayName: string;
  currentLevelId: string;
  targetLevelId: string;
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
  const [targetLevelId, setTargetLevelId] = useState("");

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("access_token");
      
      // Load profile and levels in parallel
      const [profileRes, levelsRes] = await Promise.all([
        fetch("/api/profile", {
          headers: { "Authorization": `Bearer ${token}` },
        }),
        // Assuming there might be a mastery/levels API or we use a fixed list for now
        // For simplicity in this mock-heavy stage, let's use fixed levels or fetch if available
        fetch("/api/mastery", {
          headers: { "Authorization": `Bearer ${token}` },
        })
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
        setDisplayName(data.profile.displayName || "");
        setTargetLevelId(data.profile.targetLevelId || "");
      }

      // Mock levels if mastery API doesn't return them directly in the expected format
      const mockLevels = [
        { id: "1", levelCode: "IL", levelName: "Intermediate Low" },
        { id: "2", levelCode: "IM1", levelName: "Intermediate Mid 1" },
        { id: "3", levelCode: "IM2", levelName: "Intermediate Mid 2" },
        { id: "4", levelCode: "IM3", levelName: "Intermediate Mid 3" },
        { id: "5", levelCode: "IH", levelName: "Intermediate High" },
        { id: "6", levelCode: "AL", levelName: "Advanced Low" },
      ];
      setLevels(mockLevels);

    } catch (error) {
      console.error("프로필 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName,
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
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <span className="p-2 bg-slate-100 rounded-xl text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            프로필 설정
          </h1>
          <p className="mt-1 text-muted-foreground ml-12">
            사용자 정보와 학습 목표를 관리하세요.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="shadow-lg shadow-primary/20 ml-12 md:ml-0"
        >
          {isSaving ? "저장 중..." : "변경 사항 저장"}
        </Button>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-lg font-bold">기본 정보</CardTitle>
          <CardDescription>서비스에서 표시될 이름을 설정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-bold text-slate-600 uppercase tracking-wider">표시 이름</Label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
              placeholder="이름을 입력하세요"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-lg font-bold">학습 목표 설정</CardTitle>
          <CardDescription>목표로 하는 OPIc 등급을 선택하세요. AI가 이에 맞춰 피드백을 조정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {levels.map((level) => (
              <div 
                key={level.id}
                onClick={() => setTargetLevelId(level.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 group ${
                  targetLevelId === level.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className={`text-2xl font-black ${targetLevelId === level.id ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {level.levelCode}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest text-center ${targetLevelId === level.id ? 'text-primary/70' : 'text-slate-400'}`}>
                  {level.levelName}
                </span>
                {targetLevelId === level.id && (
                  <div className="mt-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-rose-50 border-b border-rose-100">
          <CardTitle className="text-lg font-bold text-rose-800">계정 관리</CardTitle>
          <CardDescription className="text-rose-600/70">로그아웃 및 계정 관련 설정입니다.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form action="/auth/logout" method="post">
            <Button variant="outline" type="submit" className="w-full h-12 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-bold">
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

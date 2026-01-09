import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProfileMenu } from "./ProfileMenu";
import { createClient } from "@/lib/supabase/server";

import Image from "next/image";

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-8 max-w-7xl mx-auto">
        <div className="mr-8 flex items-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">OPIc Helper</span>
          </Link>
        </div>

        <nav className="flex flex-1 items-center justify-between">
          {user ? (
            <>
              <div className="flex items-center space-x-1 md:space-x-2 text-sm font-medium">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                  대시보드
                </Link>
                <Link
                  href="/practice"
                  className="px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                  연습하기
                </Link>
                <Link
                  href="/roleplay"
                  className="px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                  롤플레이
                </Link>
                <Link
                  href="/history"
                  className="px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                  학습 기록
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <ProfileMenu user={user} />
              </div>
            </>
          ) : (
            <>
              <div className="flex-1" />
              <div className="flex items-center space-x-4">
                <Button asChild variant="ghost" className="hover:bg-accent">
                  <Link href="/login">로그인</Link>
                </Button>
                <Button asChild className="shadow-md shadow-primary/20">
                  <Link href="/login">무료로 시작하기</Link>
                </Button>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

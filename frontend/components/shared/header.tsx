"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">OPIc Helper</span>
          </Link>
        </div>

        <nav className="flex flex-1 items-center justify-between space-x-2">
          <div className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              대시보드
            </Link>
            <Link
              href="/practice"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              연습하기
            </Link>
            <Link
              href="/roleplay"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              롤플레이
            </Link>
            <Link
              href="/history"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              학습 기록
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatar-placeholder.png" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </nav>
      </div>
    </header>
  );
}

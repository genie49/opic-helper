import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-8 max-w-7xl mx-auto">
        <div className="mr-8 flex items-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg transform transition-transform group-hover:scale-105">
              O
            </div>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 focus:outline-none p-1 rounded-full hover:bg-accent transition-colors">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.user_metadata?.full_name?.[0]?.toUpperCase() ||
                           user.email?.[0]?.toUpperCase() ||
                           "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2 shadow-lg border-border/50">
                    <DropdownMenuLabel className="font-normal px-2 py-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">
                          {user.user_metadata?.full_name || "사용자"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem asChild className="rounded-md">
                      <Link href="/dashboard" className="cursor-pointer">대시보드</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-md">
                      <Link href="/profile" className="cursor-pointer">프로필 설정</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem asChild className="rounded-md text-destructive focus:text-destructive focus:bg-destructive/10">
                      <form action="/auth/logout" method="post" className="w-full">
                        <button type="submit" className="w-full text-left cursor-pointer">
                          로그아웃
                        </button>
                      </form>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

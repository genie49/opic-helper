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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">OPIc Helper</span>
          </Link>
        </div>

        <nav className="flex flex-1 items-center justify-between space-x-2">
          {user ? (
            <>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 focus:outline-none">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {user.user_metadata?.full_name?.[0]?.toUpperCase() ||
                           user.email?.[0]?.toUpperCase() ||
                           "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.full_name || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">대시보드</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">프로필 설정</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <form action="/auth/logout" method="post" className="w-full">
                        <button type="submit" className="w-full text-left">
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
                <Button asChild variant="outline">
                  <Link href="/login">로그인</Link>
                </Button>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

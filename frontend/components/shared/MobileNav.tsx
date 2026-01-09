"use client";

import { Drawer, Burger, Stack, UnstyledButton, rem, Text, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconLayoutDashboard, IconMicrophone, IconHistory, IconHome } from "@tabler/icons-react";

interface MobileNavProps {
  user: any;
}

export function MobileNav({ user }: MobileNavProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const pathname = usePathname();

  const links = [
    { label: "홈", href: "/", icon: IconHome },
    ...(user
      ? [
          { label: "대시보드", href: "/dashboard", icon: IconLayoutDashboard },
          { label: "연습하기", href: "/practice", icon: IconMicrophone },
          { label: "학습 기록", href: "/history", icon: IconHistory },
        ]
      : []),
  ];

  return (
    <>
      <Burger opened={opened} onClick={open} aria-label="Toggle navigation" size="sm" className="md:hidden" />

      <Drawer
        opened={opened}
        onClose={close}
        title={<Text fw={800} size="xl">OPIc Helper</Text>}
        padding="md"
        size="80%"
        position="right"
        styles={{
          header: { borderBottom: "1px solid var(--mantine-color-gray-2)", marginBottom: rem(12), paddingBottom: rem(12) },
        }}
      >
        <Stack gap="xs">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <UnstyledButton
                key={link.href}
                component={Link}
                href={link.href}
                onClick={close}
                style={{
                  padding: `${rem(12)} ${rem(16)}`,
                  borderRadius: "var(--mantine-radius-md)",
                  backgroundColor: isActive ? "var(--mantine-color-blue-0)" : "transparent",
                  color: isActive ? "var(--mantine-color-blue-7)" : "var(--mantine-color-gray-7)",
                }}
                className="transition-colors hover:bg-gray-50"
              >
                <Group gap="md">
                  <link.icon style={{ width: rem(22), height: rem(22) }} />
                  <Text size="md" fw={isActive ? 700 : 500}>
                    {link.label}
                  </Text>
                </Group>
              </UnstyledButton>
            );
          })}
          
          {!user && (
            <Stack gap="sm" mt="xl">
              <UnstyledButton
                component={Link}
                href="/login"
                onClick={close}
                style={{
                  padding: rem(12),
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px solid var(--mantine-color-gray-3)",
                  textAlign: "center"
                }}
                className="hover:bg-gray-50 transition-colors"
              >
                <Text size="sm" fw={600}>로그인</Text>
              </UnstyledButton>
              <UnstyledButton
                component={Link}
                href="/login"
                onClick={close}
                style={{
                  padding: rem(12),
                  borderRadius: "var(--mantine-radius-md)",
                  backgroundColor: "var(--mantine-color-blue-6)",
                  color: "white",
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(34, 139, 230, 0.25)"
                }}
                className="hover:brightness-110 transition-all active:scale-95"
              >
                <Text size="sm" fw={700}>무료로 시작하기</Text>
              </UnstyledButton>
            </Stack>
          )}
        </Stack>
      </Drawer>
    </>
  );
}

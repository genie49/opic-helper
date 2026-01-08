"use client";

import { Menu, Avatar, Text, Group, UnstyledButton, rem } from "@mantine/core";
import {
  IconUser,
  IconSettings,
  IconLogout,
  IconChevronDown,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProfileMenuProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/auth/logout";
    document.body.appendChild(form);
    form.submit();
  };

  const displayName = user.user_metadata?.full_name || "사용자";
  const email = user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url;
  const initials =
    user.user_metadata?.full_name?.[0]?.toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <Menu
      width={260}
      position="bottom-end"
      transitionProps={{ transition: "pop-top-right" }}
      withinPortal
      shadow="lg"
    >
      <Menu.Target>
        <UnstyledButton
          style={{
            padding: "4px 8px",
            borderRadius: "var(--mantine-radius-md)",
          }}
          className="hover:bg-gray-100 transition-colors"
        >
          <Group gap="xs">
            <Avatar
              src={avatarUrl}
              alt={displayName}
              radius="xl"
              size="sm"
              color="violet"
            >
              {initials}
            </Avatar>
            <Text size="sm" fw={500} className="hidden sm:block">
              {displayName}
            </Text>
            <IconChevronDown
              style={{ width: rem(14), height: rem(14) }}
              className="text-gray-500"
            />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Text size="sm" fw={600}>
            {displayName}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {email}
          </Text>
        </Menu.Label>

        <Menu.Divider />

        <Menu.Item
          component={Link}
          href="/dashboard"
          leftSection={
            <IconLayoutDashboard
              style={{ width: rem(16), height: rem(16) }}
            />
          }
        >
          대시보드
        </Menu.Item>

        <Menu.Item
          component={Link}
          href="/profile"
          leftSection={
            <IconSettings style={{ width: rem(16), height: rem(16) }} />
          }
        >
          프로필 설정
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          color="red"
          leftSection={
            <IconLogout style={{ width: rem(16), height: rem(16) }} />
          }
          onClick={handleLogout}
        >
          로그아웃
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

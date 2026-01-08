"use client";

import { MantineProvider as BaseMantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";

const theme = createTheme({
  primaryColor: "violet",
  fontFamily: "var(--font-nunito), sans-serif",
  defaultRadius: "md",
  colors: {
    violet: [
      "#f3f0ff",
      "#e5dbff",
      "#d0bfff",
      "#b197fc",
      "#9775fa",
      "#845ef7",
      "#7950f2",
      "#7048e8",
      "#6741d9",
      "#5f3dc4",
    ],
  },
});

export function MantineProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseMantineProvider theme={theme} defaultColorScheme="light">
      {children}
    </BaseMantineProvider>
  );
}

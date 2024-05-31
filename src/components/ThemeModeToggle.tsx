"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export function ThemeModeToggle() {
  const { theme, setTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(0);

  const themes = [
    { name: "light", icon: <IconMoon size={20} /> },
    { name: "dark", icon: <IconSun size={24} /> },
  ];

  const getThemeIndex = (value = "") => {
    return themes
      .map((item) => item.name)
      .indexOf(value ? value : theme || "dark");
  };

  useEffect(() => {
    setCurrentTheme(getThemeIndex());
  });

  const toggleThemes = (selectTheme = "") => {
    const nextIndex = selectTheme
      ? getThemeIndex(selectTheme)
      : (getThemeIndex(selectTheme) + 1) % themes.length;

    setCurrentTheme(nextIndex);
    setTheme(themes[nextIndex].name);
  };

  return (
    <div
      className={`relative w-8 sm:w-14 h-8 bg-neutral-900 dark:bg-neutral-100 rounded-full overflow-hidden transition-all duration-500`}
    >
      <section
        className={`cursor-pointer absolute left-0 flex flex-col items-center justify-center w-full h-16 transition-all duration-500`}
        style={{
          top: `${-2 * currentTheme}rem`,
        }}
        onClick={() => toggleThemes()}
      >
        {themes.map(({ name, icon }, index) => (
          <article
            key={`theme-mode-toggle-${index}`}
            className={`grid place-content-center px-3 h-8 text-white dark:text-neutral-900 transition-all duration-100`}
          >
            {icon}
          </article>
        ))}
      </section>
    </div>
  );
}

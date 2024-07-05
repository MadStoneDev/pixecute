import { ReactNode } from "react";
import Link from "next/link";

type MainItem = {
  name?: string;
  component?: ReactNode | null;
};

type SecondaryItem = {
  name?: string;
  href?: string;
  icon?: ReactNode | undefined;
  disabled?: boolean;
};

interface HomeCardProps {
  data: MainItem | SecondaryItem;
  type?: "main" | "secondary";
}

export default function HomeCard({ data, type = "main" }: HomeCardProps) {
  if (type === "main") {
    const mainData = data as MainItem;
    return (
      <>
        <div
          className={`px-4 py-2 bg-neutral-900 dark:bg-neutral-100 rounded-t-2xl text-neutral-100 dark:text-neutral-900 font-medium overflow-hidden`}
        >
          {mainData.name}
        </div>
        <div className={`grow`}>
          {mainData.component !== undefined ? mainData.component : null}
        </div>
      </>
    );
  } else if (type === "secondary") {
    const secondaryData = data as SecondaryItem;
    return (
      <Link
        href={secondaryData.href || "/"}
        className={`${
          secondaryData.disabled ? "pointer-events-none" : ""
        } group py-2 flex flex-col gap-2 `}
      >
        <div
          className={`py-2 grid place-content-center w-full h-20 bg-white dark:bg-neutral-800 ${
            secondaryData.disabled ? "" : "group-hover:bg-primary-600"
          } rounded-xl ${
            secondaryData.disabled
              ? ""
              : "shadow-2xl shadow-neutral-400 dark:shadow-neutral-900 group-hover:text-neutral-100"
          } transition-all duration-300`}
        >
          {secondaryData.icon !== undefined ? secondaryData.icon : null}
        </div>
        <p
          className={`text-xs md:text-sm text-center tracking-wide font-medium text-neutral-500 dark:text-neutral-600 ${
            !secondaryData.disabled
              ? "group-hover:text-neutral-900 group-hover:dark:text-neutral-100"
              : ""
          } transition-all duration-300`}
        >
          {secondaryData.name}
        </p>
      </Link>
    );
  }
}

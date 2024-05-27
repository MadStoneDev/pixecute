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
      <article
        className={`col-span-2 flex flex-col h-full bg-neutral-50 dark:bg-neutral-800 rounded-t-3xl rounded-b-3xl shadow-lg shadow-neutral-200 dark:shadow-neutral-900 transition-all duration-300`}
      >
        <div
          className={`px-4 py-2 bg-neutral-900 dark:bg-neutral-100 rounded-t-2xl text-neutral-100 dark:text-neutral-900 font-medium overflow-hidden`}
        >
          {mainData.name}
        </div>
        <div className={`grow`}>
          {mainData.component !== undefined ? mainData.component : null}
        </div>
      </article>
    );
  } else if (type === "secondary") {
    const secondaryData = data as SecondaryItem;
    return (
      <Link
        href={secondaryData.href || "/"}
        className={`${
          secondaryData.disabled ? "pointer-events-none" : ""
        } group flex flex-col gap-2`}
        style={{
          aspectRatio: 2,
        }}
      >
        <div
          className={`grid place-content-center w-full h-full bg-white dark:bg-neutral-800 ${
            secondaryData.disabled ? "" : "group-hover:bg-rose-600"
          } woulrounded-xl ${
            !secondaryData.disabled
              ? "shadow-lg shadow-neutral-200 dark:shadow-neutral-900 group-hover:text-neutral-100"
              : ""
          } transition-all duration-300`}
        >
          {secondaryData.icon !== undefined ? secondaryData.icon : null}
        </div>
        <p
          className={`text-sm text-center tracking-wide font-medium text-neutral-400 dark:text-neutral-600  ${
            !secondaryData.disabled
              ? "group-hover:text-neutral-900 group-hover:dark:text-neutral-100"
              : ""
          } transition-all duration-700`}
        >
          {secondaryData.name}
        </p>
      </Link>
    );
  }
}

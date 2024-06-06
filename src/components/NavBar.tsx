"use client";

import { ThemeModeToggle } from "@/components/ThemeModeToggle";
import {
  IconArrowBack,
  IconArrowLeft,
  IconDeviceFloppy,
  IconFileDownload,
  IconMenu2,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NavBar() {
  const pathname = usePathname();

  const [maxWidth, setMaxWidth] = useState("max-w-[1000px]");

  useEffect(() => {
    setTimeout(() => {
      setMaxWidth("max-w-full");
    }, 700);
  }, []);

  return (
    <nav
      className={`mx-auto relative flex w-full ${
        pathname === "/editor" ? maxWidth : ""
      } min-h-14 bg-primary-700 z-50 transition-all duration-300`}
    >
      <h2
        className={`pointer-events-none px-4 absolute top-0 left-0 grid place-content-center w-full h-full font-poppins text-neutral-900 text-2xl font-extrabold uppercase`}
      >
        Pixecute
      </h2>

      <section
        className={`px-4 md:px-10 w-full flex items-center justify-between`}
      >
        {pathname === "/editor" ? (
          <article className={`flex items-center gap-2`}>
            <Link href={"/"} title={"Go Back"}>
              <IconArrowLeft size={24} />
            </Link>
            {/*<Link*/}
            {/*  href={"/"}*/}
            {/*  title={"Save"}*/}
            {/*  className={`grid place-content-center w-10 h-10 bg-neutral-100 dark:bg-neutral-900 rounded-full text-neutral-900 dark:text-neutral-100 hover:text-primary-600 transition-all duration-300`}*/}
            {/*>*/}
            {/*  <IconDeviceFloppy size={24} />*/}
            {/*</Link>*/}
            {/*<Link*/}
            {/*  href={"/"}*/}
            {/*  title={"Export"}*/}
            {/*  className={`grid place-content-center w-10 h-10 bg-neutral-100 dark:bg-neutral-900 rounded-full text-neutral-900 dark:text-neutral-100 hover:text-primary-600 transition-all duration-300`}*/}
            {/*>*/}
            {/*  <IconFileDownload size={24} />*/}
            {/*</Link>*/}
          </article>
        ) : (
          <IconMenu2 size={24} className={`cursor-pointer`} />
        )}

        <article className={`flex gap-2`}>
          <ThemeModeToggle />
        </article>
      </section>
    </nav>
  );
}

import NavBar from "@/components/NavBar";
import { IconLifebuoy, IconTools, IconUserShield } from "@tabler/icons-react";
import Link from "next/link";
import HomeCard from "@/components/HomeCard";
import Footer from "@/components/Footer";
import NewArtworkForm from "@/components/NewArtworkForm";
import { ReactNode } from "react";

export default function Home() {
  return (
    <main
      className={`mx-auto flex flex-col gap-4 w-full max-w-[1200px] h-dvh bg-neutral-100 dark:bg-neutral-900 shadow-2xl shadow-neutral-800`}
    >
      <NavBar />

      <section className={`px-4 md:px-10 w-full h-[30%]`}>
        <article className={`w-full h-full bg-neutral-600`}></article>
      </section>

      <section className={`px-4 md:px-10 my-6 grow flex flex-col gap-8`}>
        <div className={`grow grid grid-cols-6 gap-8`}>
          {MAIN_ITEMS.map((item, index) => (
            <HomeCard key={`home-main-card-${index}`} data={item} />
          ))}
        </div>

        {/*<div className={`grid grid-cols-6 gap-8`}>*/}
        {/*  {SECONDARY_ITEMS.map((item, index) => (*/}
        {/*    <HomeCard*/}
        {/*      key={`secondary-nav-${index}`}*/}
        {/*      data={item}*/}
        {/*      type="secondary"*/}
        {/*    />*/}
        {/*  ))}*/}
        {/*</div>*/}
      </section>

      <Footer />
    </main>
  );
}

type MainItem = {
  name?: string;
  component?: ReactNode | null;
};

type SecondaryItem = {
  name?: string;
  href?: string;
  icon?: ReactNode | undefined;
};

const MAIN_ITEMS: MainItem[] = [
  {
    name: "New Artwork",
    component: <NewArtworkForm />,
  },
  {
    name: "Recent Artworks",
  },
  {
    name: "Community Artworks",
  },
];

const SECONDARY_ITEMS: SecondaryItem[] = [
  {
    href: "/",
    name: "Login",
    icon: <IconUserShield size={35} stroke={1} />,
  },

  { href: "/", name: "Help" },
  { href: "/", name: "About" },
  { href: "/", name: "Pixcel Community" },
  { href: "/", name: "Settings", icon: <IconTools size={35} stroke={1} /> },
  { href: "/", name: "Help", icon: <IconLifebuoy size={38} stroke={1} /> },
];

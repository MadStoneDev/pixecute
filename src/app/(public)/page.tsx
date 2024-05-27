import { ReactNode } from "react";

import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import HomeCard from "@/components/HomeCard";
import NewArtworkForm from "@/components/NewArtworkForm";

import {
  IconLifebuoy,
  IconNews,
  IconTools,
  IconUserShield,
} from "@tabler/icons-react";

export default function Home() {
  return (
    <main
      className={`mx-auto flex flex-col gap-4 w-full max-w-[1200px] min-h-dvh bg-neutral-100 dark:bg-neutral-900 shadow-2xl shadow-neutral-800`}
    >
      <NavBar />

      <section className={`px-4 md:px-10 w-full h-[200px]`}>
        <article className={`w-full h-full bg-neutral-600`}></article>
      </section>

      <section className={`px-4 md:px-10 my-6 grow flex flex-col gap-8`}>
        <div className={`grow grid grid-cols-6 gap-8`}>
          {MAIN_ITEMS.map((item, index) => (
            <HomeCard key={`home-main-card-${index}`} data={item} />
          ))}
        </div>

        <div className={`grid grid-cols-6 gap-8`}>
          {SECONDARY_ITEMS.map((item, index) => (
            <HomeCard
              key={`secondary-nav-${index}`}
              data={item}
              type="secondary"
            />
          ))}
        </div>
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
  disabled?: boolean;
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
    icon: <IconUserShield size={35} stroke={1.2} />,
  },

  {
    href: "/",
    name: "Pixecute Community",
    icon: <span className={`font-extrabold text-3xl`}>P</span>,
  },
  { href: "/", name: "Settings", icon: <IconTools size={35} stroke={1.1} /> },
  { href: "/", name: "News", icon: <IconNews size={35} stroke={1.1} /> },
  { href: "/", name: "Help", icon: <IconLifebuoy size={38} stroke={1} /> },
  {
    href: "/",
    name: "Download",
    icon: <span className={`text-sm`}>Coming Soon</span>,
    disabled: true,
  },
];

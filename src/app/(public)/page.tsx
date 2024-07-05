import { ReactNode } from "react";

import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import HomeCard from "@/components/HomeCard";
import NewArtworkForm from "@/components/NewArtworkForm";

import { IconLifebuoy, IconNews, IconTools } from "@tabler/icons-react";

export default function Home() {
  return (
    <main
      className={`mx-auto flex-grow flex flex-col items-stretch w-full max-w-[1000px] h-dvh bg-neutral-100 dark:bg-neutral-900 shadow-xl shadow-neutral-900 z-10`}
    >
      <NavBar />

      <div
        className={`flex-grow relative mx-auto pt-6 pb-3 flex flex-col w-full overflow-y-auto`}
      >
        {/* Feature Image */}
        <section className={`px-4 md:px-10 w-full`}>
          <article className={`w-full h-full`}>
            <img
              src={`/pixecute_feature.png`}
              alt={`Pixecute Feature Image`}
              className={`w-full h-[150px] sm:h-[200px] object-cover`}
            />
          </article>
        </section>

        {/* Main Block */}
        <section
          className={`grow px-4 md:px-10 py-6 flex flex-col items-around gap-6`}
        >
          <article
            className={`mx-auto grid grid-cols-1 w-full sm:max-w-[350px] h-fit`}
          >
            {MAIN_ITEMS.map((item, index) => (
              <div
                key={`home-main-card-${index}`}
                className={`mx-auto ${
                  index < 2 ? "" : "hidden lg:block"
                } col-span-2 flex flex-col w-full bg-neutral-50 dark:bg-neutral-800 rounded-t-3xl rounded-b-3xl shadow-2xl shadow-neutral-400 dark:shadow-neutral-900 transition-all duration-300`}
              >
                <HomeCard data={item} />
              </div>
            ))}
          </article>

          <article
            className={`mx-auto grid grid-cols-3 gap-4 sm:gap-8 w-full sm:max-w-[350px]`}
          >
            {SECONDARY_ITEMS.map((item, index) => (
              <HomeCard
                key={`secondary-nav-${index}`}
                data={item}
                type="secondary"
              />
            ))}
          </article>
        </section>

        <Footer />
      </div>
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
  // {
  //   name: "Recent Artworks",
  // },
  // {
  //   name: "Community Artworks",
  // },
];

const SECONDARY_ITEMS: SecondaryItem[] = [
  // {
  //   href: "/",
  //   name: "Login",
  //   icon: <IconUserShield size={35} stroke={1.2} />,
  // },
  // {
  //   href: "/",
  //   name: "Pixecute Community",
  //   icon: <span className={`font-extrabold text-3xl`}>P</span>,
  // },
  { href: "/", name: "Settings", icon: <IconTools size={35} stroke={1.1} /> },
  { href: "/", name: "News", icon: <IconNews size={35} stroke={1.1} /> },
  { href: "/", name: "Help", icon: <IconLifebuoy size={38} stroke={1} /> },
  // {
  //   href: "/",
  //   name: "Download",
  //   icon: <span className={`text-sm`}>Coming Soon</span>,
  //   disabled: true,
  // },
];

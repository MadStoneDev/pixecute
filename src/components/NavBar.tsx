import { ThemeModeToggle } from "@/components/ThemeModeToggle";
import { UserMenu } from "@/components/UserMenu";

export const NavBar = () => {
  return (
    <nav
      className={`relative flex items-center justify-center w-full bg-primary-700`}
    >
      <h2
        className={`mt-2 mb-3 px-4 text-2xl font-extrabold uppercase text-neutral-100`}
      >
        Pixecute
      </h2>

      <article className={`absolute right-10 flex items-center gap-3`}>
        <UserMenu />
        <ThemeModeToggle />
      </article>
    </nav>
  );
};

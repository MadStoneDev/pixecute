import { ThemeModeToggle } from "@/components/ThemeModeToggle";
import { IconMenu2 } from "@tabler/icons-react";

export default function NavBar() {
  return (
    <nav className={`relative w-full h-16`}>
      <section>
        <h2
          className={`pointer-events-none px-4 absolute top-0 left-0 grid place-content-center w-full h-full font-poppins text-2xl font-extrabold uppercase`}
        >
          Pixcel
        </h2>
      </section>

      <section
        className={`px-4 md:px-10 w-full h-full flex items-center justify-between`}
      >
        <IconMenu2 size={24} className={`cursor-pointer`} />
        <ThemeModeToggle />
      </section>
    </nav>
  );
}

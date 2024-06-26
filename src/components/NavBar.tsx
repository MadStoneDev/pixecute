export const NavBar = () => {
  return (
    <nav
      className={`py-2 flex items-center justify-center w-full bg-primary-700`}
    >
      <h2 className={`px-4 text-2xl font-extrabold uppercase text-neutral-900`}>
        Pixecute
      </h2>

      <article className={`flex gap-2`}>
        <ThemeModeToggle />
      </article>
    </nav>
  );
};

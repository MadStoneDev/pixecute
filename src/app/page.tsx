import { NavBar } from "@/components/NavBar";
import Footer from "@/components/Footer";
import NewArtworkForm from "@/components/NewArtworkForm";

export default function Home() {
  return (
    <main className="flex flex-col items-center w-full max-w-[1000px] h-dvh bg-neutral-100 dark:bg-neutral-900 shadow-xl shadow-neutral-900 z-10">
      <NavBar />
      <section
        className={`flex-grow pt-6 pb-2 flex flex-col w-full overflow-y-auto`}
      >
        {/* Feature Image */}
        <article className={`px-4 md:px-10 w-full`}>
          <img
            src={`/pixecute_feature.png`}
            alt={`Pixecute Feature Image`}
            className={`w-full h-[150px] sm:h-[200px] object-cover`}
          />
        </article>
        <article className={`flex-grow py-6`}>
          <div
            className={`mx-auto col-span-2 flex flex-col w-full sm:max-w-[350px] bg-neutral-50 dark:bg-neutral-800 rounded-t-3xl rounded-b-3xl shadow-2xl shadow-neutral-400 dark:shadow-neutral-900 transition-all duration-300`}
          >
            <div
              className={`px-4 py-2 bg-neutral-900 dark:bg-neutral-100 rounded-t-2xl text-neutral-100 dark:text-neutral-900 font-medium overflow-hidden`}
            >
              New Artwork
            </div>
            <div className={`grow`}>
              <NewArtworkForm />
            </div>
          </div>
        </article>
        <Footer />
      </section>
    </main>
  );
}

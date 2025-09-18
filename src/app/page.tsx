import { NavBar } from "@/components/NavBar";
import Footer from "@/components/Footer";
import NewArtworkForm from "@/components/NewArtworkForm";
import ArtworkBrowser from "@/components/ArtworkBrowser";

export default function Home() {
  return (
    <main className="flex flex-col items-center w-full max-w-[1200px] h-dvh bg-neutral-100 dark:bg-neutral-900 shadow-xl shadow-neutral-900 z-10">
      <NavBar />
      <section className="flex-grow pt-6 pb-2 flex flex-col w-full overflow-y-auto">
        {/* Feature Image */}
        <article className="px-4 md:px-10 w-full">
          <img
            src="/pixecute_feature.png"
            alt="Pixecute Feature Image"
            className="w-full h-[120px] sm:h-[150px] object-cover"
          />
        </article>

        {/* Main Content Grid */}
        <article className="flex-grow py-6 px-4 md:px-10">
          <div className="flex flex-col gap-6 items-center h-full">
            {/* New Artwork Card */}
            <div className="flex flex-col">
              <div className="flex-grow bg-neutral-50 dark:bg-neutral-800 rounded-t-3xl rounded-b-3xl shadow-2xl shadow-neutral-400 dark:shadow-neutral-900 transition-all duration-300 flex flex-col">
                <div className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 rounded-t-2xl text-neutral-100 dark:text-neutral-900 font-medium overflow-hidden">
                  New Artwork
                </div>
                <div className="flex-grow overflow-hidden">
                  <NewArtworkForm />
                </div>
              </div>
            </div>

            {/* Artwork Browser Card */}
            <div className="flex flex-col">
              <div className="flex-grow bg-neutral-50 dark:bg-neutral-800 rounded-t-3xl rounded-b-3xl shadow-2xl shadow-neutral-400 dark:shadow-neutral-900 transition-all duration-300 flex flex-col">
                <div className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 rounded-t-2xl text-neutral-100 dark:text-neutral-900 font-medium overflow-hidden">
                  Open Existing
                </div>
                <div className="flex-grow overflow-hidden">
                  <ArtworkBrowser />
                </div>
              </div>
            </div>
          </div>
        </article>

        <Footer />
      </section>
    </main>
  );
}

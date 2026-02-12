import VoiceHUD from "@/components/VoiceHUD/VoiceHUD";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-6">
            <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
                <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                    Commute Commander Intent Parser initialized.
                </p>
            </div>

            <div className="flex-grow flex items-center justify-center w-full">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tighter">Mind Meld</h1>
                    <p className="text-zinc-500">Hold to speak. Release to execute.</p>
                </div>
            </div>

            <VoiceHUD />
        </main>
    );
}

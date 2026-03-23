import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { hydrateCurrentDemoSession } from "./lib/demo-users";

const STARTUP_SPLASH_MS = 1500;
const SESSION_HYDRATION_TIMEOUT_MS = 4000;

function App() {
  const [showStartupSplash, setShowStartupSplash] = useState(true);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        await Promise.race([
          hydrateCurrentDemoSession(),
          new Promise((resolve) => window.setTimeout(resolve, SESSION_HYDRATION_TIMEOUT_MS)),
        ]);
      } catch (error) {
        console.error("Startup session hydration failed.", error);
      } finally {
        if (active) setShowStartupSplash(false);
      }
    }, STARTUP_SPLASH_MS);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  if (showStartupSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-700 to-blue-500 px-6">
        <div className="text-center text-white">
          <img
            src="/noBG_mortipay.png"
            alt="Morti Pay"
            className="w-96 h-96 object-contain mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold">Morti Pay</h1>
          <p className="text-blue-100 mt-1">Motorcycle Financing App</p>
          <div className="mt-5 w-10 h-10 mx-auto rounded-full border-4 border-white/30 border-t-white animate-spin" />
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default App;

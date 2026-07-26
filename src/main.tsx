import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNative } from "./lib/native";

createRoot(document.getElementById("root")!).render(<App />);

window.requestAnimationFrame(() => {
  document.documentElement.dataset.pixelSqueezeHydrated = "true";
});

// Bootstrap Capacitor plugins (no-op on web).
initNative();

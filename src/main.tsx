import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

window.requestAnimationFrame(() => {
  document.documentElement.dataset.pixelSqueezeHydrated = "true";
});

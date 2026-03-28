import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js?v=5").then((registration) => {
            console.log("✅ SW registered: ", registration);
            // Ensure SW updates faster
            registration.update();
        }).catch((registrationError) => {
            console.log("❌ SW registration failed: ", registrationError);
        });
    });
}

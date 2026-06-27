import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "../src/styles/index.css";

import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={2500}
    />
  </>
);
import { RouterProvider } from "react-router";
import { AppProvider } from "./context/AppContext";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      {/* Adicionando o Toaster globalmente para exibir os popups. richColors deixa os de sucesso verdes e os de erro vermelhos */}
      <Toaster
        richColors
        position="top-right"
        duration={2000}
      />
    </AppProvider>
  );
}
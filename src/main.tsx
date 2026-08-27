import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "@/App"
import { AppErrorBoundary } from "@/components/common/AppErrorBoundary"
import { LocaleProvider } from "@/i18n/LocaleProvider"
import { AppRouter } from "@/routing/AppRouter"
import "@/styles.css"

const rootElement = document.getElementById("root")
if (rootElement === null) throw new Error("ReliaForge root element is missing")

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppRouter>
      <LocaleProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </LocaleProvider>
    </AppRouter>
  </React.StrictMode>,
)

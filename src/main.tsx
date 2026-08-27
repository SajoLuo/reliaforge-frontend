import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { App } from "@/App"
import { AppErrorBoundary } from "@/components/common/AppErrorBoundary"
import "@/styles.css"

const rootElement = document.getElementById("root")
if (rootElement === null) throw new Error("ReliaForge root element is missing")

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>,
)

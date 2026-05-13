import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import DetachedResults from "./DetachedResults";
import DetachedChecklist from "./DetachedChecklist";
import ResultDetailView from "./ResultDetailView";
import "./index.css";
import "./i18n";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: "#1e1e1e", color: "#f48771", height: "100vh", fontFamily: "sans-serif" }}>
          <h2 style={{ fontSize: 16 }}>Something went wrong.</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 10 }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: "pre-wrap", opacity: 0.6, fontSize: 10, marginTop: 10 }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const query = new URLSearchParams(window.location.search);
const windowParam = query.get("window");

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      {windowParam === "results" ? <DetachedResults /> : 
       windowParam === "checklist" ? <DetachedChecklist /> : 
       windowParam === "result_detail" ? <ResultDetailView /> :
       <App />}
    </ErrorBoundary>
  </React.StrictMode>
);

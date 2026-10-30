
import { useState, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-jsx";
import "./App.css";

const API = "http://127.0.0.1:8000";

export default function App() {
    const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("codesense-theme");
    return savedTheme ? savedTheme === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );

    localStorage.setItem(
      "codesense-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);
  const [repo, setRepo] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("explain");
  const [activePage, setActivePage] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [indexed, setIndexed] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function indexRepository() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API}/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository_path: repo }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Indexing failed");
      }

      setIndexed(true);
      setResult({ type: "index", data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function askCopilot(e) {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const endpoint = mode === "search" ? "/search" : "/explain";

      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          limit: 3,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Request failed");
      }

      setResult({ type: mode, data });
    } catch (err) {
      setError(
        `${err.message}. Check that your FastAPI backend is running.`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✳</div>

          <div>
            <h2>CodeSense AI</h2>
            <span>Developer Copilot</span>
          </div>
        </div>

        <div className="side-label">WORKSPACE</div>

        <button
  className={`nav-item ${activePage === "dashboard" ? "active" : ""}`}
  onClick={() => setActivePage("dashboard")}
>
  &nbsp; Dashboard
</button>

<button
  className={`nav-item ${activePage === "repository" ? "active" : ""}`}
  onClick={() => setActivePage("repository")}
>
   &nbsp; Repository Explorer
</button>

<button
  className={`nav-item ${activePage === "assistant" ? "active" : ""}`}
  onClick={() => {
    setActivePage("assistant");
    setMode("explain");
  }}
>
   &nbsp; AI Code Assistant
</button>

<button
  className={`nav-item ${activePage === "search" ? "active" : ""}`}
  onClick={() => {
    setActivePage("search");
    setMode("search");
  }}
>
   &nbsp; Semantic Search
</button>

<button
  className={`nav-item ${activePage === "quality" ? "active" : ""}`}
  onClick={() => setActivePage("quality")}
>
   &nbsp; Code Quality
</button>

<button
  className={`nav-item ${activePage === "settings" ? "active" : ""}`}
  onClick={() => setActivePage("settings")}
>
   &nbsp; Settings
</button>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <span>Local AI workspace</span>
          <span className="online">●</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
  Workspace / <b>
    {activePage === "dashboard"
      ? "Dashboard"
      : activePage === "repository"
      ? "Repository Explorer"
      : activePage === "assistant"
      ? "AI Code Assistant"
      : activePage === "search"
      ? "Semantic Search"
      : activePage === "quality"
      ? "Code Quality"
      : "Settings"}
  </b>
</div>

           <h1>
  {activePage === "dashboard"
    ? "Dashboard"
    : activePage === "repository"
    ? "Repository Explorer"
    : activePage === "assistant"
    ? "AI Code Assistant"
    : activePage === "search"
    ? "Semantic Search"
    : activePage === "quality"
    ? "Code Quality & Security"
    : "Settings"}
</h1>
            <p>
              {activePage === "dashboard"
                ? "Overview of your code intelligence workspace."
                : activePage === "repository"
                ? "Index and manage the repository used by your copilot."
                : activePage === "assistant"
                ? "Ask questions and get explanations grounded in your code."
                : activePage === "search"
                ? "Find relevant code using natural-language queries."
                : activePage === "quality"
                ? "Review code maintainability, security, and dependencies."
                : "Manage your workspace preferences and configuration."}
            </p>
          </div>

                    <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={() => setDarkMode((previous) => !previous)}
              aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
              title={`Switch to ${darkMode ? "light" : "dark"} mode`}
            >
              {darkMode ? "☀️ " : "🌙 "}
            </button>

            <div className="local-badge">
              <span />
              LOCAL ENVIRONMENT
            </div>
          </div>
        </header>
        {activePage === "quality" && (
  <section className="quality-page">
    <div className="page-intro">
      <span className="section-label">CODE ANALYSIS</span>
      <h2>Code Quality & Security</h2>
      <p>
        Review your codebase for maintainability, potential security
        risks, and opportunities for improvement.
      </p>
    </div>

    <div className="quality-grid">
      <div className="panel quality-card">
        <span className="card-label">Code Quality</span>
        <h3>Code Analysis</h3>
        <p>
          Evaluate code structure, readability, and maintainability.
        </p>
        <span className="feature-status">Analysis not configured</span>
      </div>

      <div className="panel quality-card">
        <span className="card-label">Security</span>
        <h3>Security Review</h3>
        <p>
          Identify potential vulnerabilities and unsafe coding patterns.
        </p>
        <span className="feature-status">Analysis not configured</span>
      </div>

      <div className="panel quality-card">
        <span className="card-label">Dependencies</span>
        <h3>Dependency Review</h3>
        <p>
          Review project dependencies and identify outdated packages.
        </p>
        <span className="feature-status">Analysis not configured</span>
      </div>

      <div className="panel quality-card">
        <span className="card-label">Recommendations</span>
        <h3>Improvement Suggestions</h3>
        <p>
          Explore opportunities to improve code reliability and maintainability.
        </p>
        <span className="feature-status">Analysis not configured</span>
      </div>
    </div>
  </section>
)}
        {activePage === "settings" && (
  <section className="settings-page">
    <div className="page-intro">
      <span className="section-label">PREFERENCES</span>
      <h2>Workspace Settings</h2>
      <p>Configure your development environment and manage your CodeSense AI preferences.</p>
    </div>

    <div className="settings-grid">
      <div className="panel settings-card">
        <div className="settings-card-header">
          <div>
            <span className="card-label">DISPLAY</span>
            <h3>Appearance</h3>
          </div>
        </div>
        <p>Choose the appearance that works best for you.</p>
        <div className="settings-control">
          <div>
            <strong>Interface theme</strong>
            <small>Current theme: {darkMode ? "Dark" : "Light"}</small>
          </div>
          <button type="button" className="secondary-button" onClick={() => setDarkMode((previous) => !previous)}>
            Switch Theme
          </button>
        </div>
      </div>

      <div className="panel settings-card">
        <div className="settings-card-header">
          <div>
            <span className="card-label">SOURCE CODE</span>
            <h3>Repository Configuration</h3>
          </div>
        </div>
        <p>Manage the local repository used for indexing and code search.</p>
        <div className="settings-control">
          <div>
            <strong>Repository status</strong>
            <small>{indexed ? "Repository indexed in this session" : "Repository not indexed"}</small>
          </div>
          <button type="button" className="secondary-button" onClick={() => setActivePage("repository")}>
            Open Repository
          </button>
        </div>
      </div>

      <div className="panel settings-card">
        <div className="settings-card-header">
          <div>
            <span className="card-label">AI CONFIGURATION</span>
            <h3>AI Services</h3>
          </div>
        </div>
        <p>CodeSense AI uses your configured local backend for code intelligence.</p>
        <div className="settings-info-row">
          <span>Backend endpoint</span>
          <code>127.0.0.1:8000</code>
        </div>
        <div className="settings-info-row">
          <span>Explanation model</span>
          <strong>Qwen 2.5 Coder</strong>
        </div>
        <div className="settings-info-row">
          <span>Code retrieval</span>
          <strong>Sentence-BERT / ChromaDB</strong>
        </div>
      </div>

      <div className="panel settings-card">
        <div className="settings-card-header">
          <div>
            <span className="card-label">QUICK ACCESS</span>
            <h3>Developer Workspace</h3>
          </div>
        </div>
        <p>Open the tools you use most often.</p>
        <div className="settings-actions">
          <button type="button" className="secondary-button" onClick={() => { setActivePage("assistant"); setMode("explain"); }}>
            Open AI Assistant
          </button>
          <button type="button" className="secondary-button" onClick={() => { setActivePage("search"); setMode("search"); }}>
            Open Semantic Search
          </button>
        </div>
      </div>
    </div>
  </section>
)}

{activePage === "dashboard" && (
  <section className="page-intro">
    <h2>Welcome to CodeSense AI </h2>
    <p>
      Your intelligent workspace for understanding, searching,
      and analyzing code.
    </p>
  </section>
)}
  
    {activePage === "dashboard" && (
  <>
    

    <section className="dashboard-cards">
      <div className="panel dashboard-card">
        <div className="card-heading">
          <span className="card-label">Repository Status</span>
          <span className={`status-indicator ${indexed ? "status-ready" : "status-pending"}`}>
            {indexed ? "Indexed" : "Not Indexed"}
          </span>
        </div>
        <h3>{indexed ? "Ready to Explore" : "Awaiting Indexing"}</h3>
        <p>
          {indexed
            ? "Your repository is ready for code search and AI-assisted explanations."
            : "Index your repository to enable code search and AI-assisted explanations."}
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setActivePage("repository")}
        >
          Open Repository
        </button>
      </div>

      <div className="panel dashboard-card">
        <div className="card-heading">
          <span className="card-label">AI Code Assistant</span>
        </div>
        <h3>Understand Your Code</h3>
        <p>
          Ask questions about your codebase and receive explanations
          with relevant source snippets.
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setActivePage("assistant");
            setMode("explain");
          }}
        >
          Open Assistant
        </button>
      </div>

      <div className="panel dashboard-card">
        <div className="card-heading">
          <span className="card-label">Semantic Search</span>
        </div>
        <h3>Find Relevant Code</h3>
        <p>
          Search your repository using natural-language queries
          instead of exact keywords.
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setActivePage("search");
            setMode("search");
          }}
        >
          Search Repository
        </button>
      </div>

      <div className="panel dashboard-card">
        <div className="card-heading">
          <span className="card-label">Code Quality</span>
        </div>
        <h3>Review Your Codebase</h3>
        <p>
          Access the code quality and security analysis workspace.
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setActivePage("quality")}
        >
          Open Analysis
        </button>
      </div>
    </section>
  </>
)}
{activePage === "dashboard" && (
        <section className="stats">
          <div className="stat-card">
            <span className="stat-icon purple">⌘</span>
            <p>ENGINE</p>
            <h3>Sentence-BERT</h3>
            <small>Semantic embeddings</small>
          </div>

          <div className="stat-card">
            <span className="stat-icon blue">▤</span>
            <p>VECTOR STORE</p>
            <h3>ChromaDB</h3>
            <small>Repository context</small>
          </div>

          <div className="stat-card">
            <span className="stat-icon green">✧</span>
            <p>LANGUAGE MODEL</p>
            <h3>Qwen 2.5 Coder</h3>
            <small>Local AI model</small>
          </div>
        </section>
)}
        {(activePage === "repository" ||
  activePage === "assistant" ||
  activePage === "search") && (
    <section className="workspace">
      {activePage === "repository" && (
          <div className="panel repository-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">STEP 01</span>
                <h2>Repository</h2>
              </div>

              <span className="icon-box">⌘</span>
            </div>

            <p className="muted">
              Index your codebase to give the copilot project context.
            </p>

            <label htmlFor="repo">PROJECT FOLDER PATH</label>

            <input
              id="repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="C:\path\to\your\project"
            />

            <button
              className="primary-button"
              disabled={loading || !repo.trim()}
              onClick={indexRepository}
            >
              {loading ? "Working..." : "↗  Index Repository"}
            </button>

            <div className="repo-status">
              <span
                className={`status-dot ${indexed ? "" : "idle"}`}
              />

              {indexed
                ? "Repository indexed in this session"
                : "Waiting for repository"}
            </div>
          </div>
)}
{(activePage === "assistant" || activePage === "search") && (
          <div className="panel assistant-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">STEP 02</span>
                <h2>Ask your copilot</h2>
              </div>

              <span className="icon-box">✧</span>
            </div>

            <p className="muted">
              Ask questions about your code in natural language.
            </p>

            <div className="mode-switch">
  <button
    className={mode === "explain" ? "selected" : ""}
    onClick={() => {
      setMode("explain");
      setActivePage("assistant");
    }}
  >
    Explain Code
  </button>

  <button
    className={mode === "search" ? "selected" : ""}
    onClick={() => {
      setMode("search");
      setActivePage("search");
    }}
  >
    Search Code
  </button>
</div>

                            <div className="example-prompts">
              <span>TRY ASKING</span>

              <button
                type="button"
                onClick={() =>
                  setQuery("Explain the overall architecture of this project")
                }
              >
                Explain project architecture
              </button>

              <button
                type="button"
                onClick={() =>
                  setQuery("Find the main API endpoints in this repository")
                }
              >
                Find API endpoints
              </button>

              <button
                type="button"
                onClick={() =>
                  setQuery("Explain how error handling works in this codebase")
                }
              >
                Explain error handling
              </button>
            </div>
            <form onSubmit={askCopilot}>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  mode === "search"
                    ? "e.g. Where is repository indexing implemented?"
                    : "e.g. Explain how semantic search works..."
                }
                rows="3"
              />

              <div className="prompt-footer">
                <span>↳ Natural language query</span>

                <button
                  className="primary-button ask-button"
                  disabled={loading || !query.trim()}
                >
                  {loading ? "Thinking..." : "Ask Copilot  →"}
                </button>
              </div>
            </form>
          </div>
          )}
        </section>
)}
{(activePage === "assistant" || activePage === "search") && (
        <section className="panel results-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">OUTPUT</span>
              <h2>Copilot response</h2>
            </div>

            <span className="result-tag">LIVE RESULTS</span>
          </div>

          {error && (
            <div className="error-box">
              ⚠ {error}
            </div>
          )}

          {!result && !error && (
            <div className="empty-state">
              <div className="empty-icon">✧</div>

              <h3>Your next insight starts here</h3>

              <p>
                Index a repository, then ask a question to see
                code insights and source references.
              </p>
            </div>
          )}

          {result?.type === "index" && (
            <div className="response-content">
              <h3>✓ Repository indexing result</h3>

              <pre>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}

                    {result?.type === "explain" && (
            <div className="response-content">
              <h3>✧ AI Explanation</h3>

              <div className="response-toolbar">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        result.data.explanation || ""
                      );
                    } catch (err) {
                      setError(
                        "Could not copy the explanation. Try selecting and copying it manually."
                      );
                    }
                  }}
                >
                  📋 Copy Explanation
                </button>
              </div>

              <p>{result.data.explanation}</p>

              <SourceList sources={result.data.sources} />
            </div>
          )}

          {result?.type === "search" && (
            <div className="response-content">
              <h3>⌕ Search results</h3>

              <SourceList sources={result.data.results} />
            </div>
          )}
        </section>
)}
        <footer>
          CodeSense AI · AI Developer Copilot
          <span>Built for developers, powered by local AI.</span>
        </footer>
      </main>
    </div>
  );
}

function SourceList({ sources = [] }) {
    useEffect(() => {
    Prism.highlightAll();
  }, [sources]);
  if (!sources.length) {
    return (
      <p className="muted">
        No source snippets returned.
      </p>
    );
  }

  return (
    <div className="sources">
      {sources.map((source, index) => (
        <details
          className="source-card"
          key={`${source.file}-${source.start_line}-${index}`}
          open={index === 0}
        >
          <summary>
            <span>▤ &nbsp;{source.file}</span>

            <small>
              Lines {source.start_line}–{source.end_line}
            </small>
          </summary>

          <div className="code-toolbar">
  <button
    type="button"
    className="copy-code-button"
    onClick={async () => {
      try {
        await navigator.clipboard.writeText(source.code || "");
      } catch (err) {
        console.error("Could not copy code:", err);
      }
    }}
  >
    📋 Copy
  </button>
</div>

<pre>
  <code
    className={`language-${getLanguage(source.file)}`}
  >
    {source.code}
  </code>
</pre>
        </details>
      ))}
    </div>
  );
  function getLanguage(filename = "") {
  const extension = filename.split(".").pop().toLowerCase();

  const languages = {
    py: "python",
    java: "java",
    js: "javascript",
    jsx: "jsx",
    ts: "javascript",
    tsx: "jsx",
    html: "markup",
    xml: "markup",
    css: "css",
    json: "javascript",
    c: "clike",
    cpp: "clike",
  };

  return languages[extension] || "javascript";
}
}

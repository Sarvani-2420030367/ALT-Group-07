
import { useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

export default function App() {
  const [repo, setRepo] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("explain");
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

        <button className="nav-item active">
          ⌘ &nbsp; Code Assistant
        </button>

        <button
          className={`nav-item ${mode === "search" ? "active" : ""}`}
          onClick={() => setMode("search")}
        >
          ◉ &nbsp; Semantic Search
        </button>

        <button
          className={`nav-item ${mode === "explain" ? "active" : ""}`}
          onClick={() => setMode("explain")}
        >
          ✧ &nbsp; Code Explanation
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
              Workspace / <b>AI Assistant</b>
            </div>

            <h1>Your code, understood.</h1>

            <p>
              Search your repository and understand code with AI.
            </p>
          </div>

          <div className="local-badge">
            <span />
            LOCAL ENVIRONMENT
          </div>
        </header>

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

        <section className="workspace">
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
                onClick={() => setMode("explain")}
              >
                ✧ Explain code
              </button>

              <button
                className={mode === "search" ? "selected" : ""}
                onClick={() => setMode("search")}
              >
                ⌕ Search code
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
        </section>

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

        <footer>
          CodeSense AI · AI Developer Copilot
          <span>Built for developers, powered by local AI.</span>
        </footer>
      </main>
    </div>
  );
}

function SourceList({ sources = [] }) {
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

          <pre>{source.code}</pre>
        </details>
      ))}
    </div>
  );
}

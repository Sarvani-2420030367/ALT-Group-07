
import os
import requests

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from code_engine import CodeIntelligenceEngine


app = FastAPI(title="CodeSense AI")

# Allow the React frontend to communicate with the backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = None

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2.5-coder:3b"


class IndexRequest(BaseModel):
    repository_path: str


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    limit: int = Field(default=5, ge=1, le=10)


class ExplainRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    limit: int = Field(default=3, ge=1, le=10)


@app.on_event("startup")
def startup():
    global engine
    engine = CodeIntelligenceEngine()


@app.get("/")
def home():
    return {"message": "CodeSense AI is running!"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/index")
def index_repository(request: IndexRequest):
    if not os.path.isdir(request.repository_path):
        raise HTTPException(
            status_code=400,
            detail="Repository directory does not exist.",
        )

    try:
        return engine.index_repository(request.repository_path)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Indexing failed: {str(exc)}",
        )


@app.post("/search")
def search_code(request: SearchRequest):
    try:
        results = engine.search_code(request.query, request.limit)

        return {
            "query": request.query,
            "results": results,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(exc)}",
        )


@app.post("/explain")
def explain_code(request: ExplainRequest):
    try:
        # Step 1: Retrieve relevant code from the indexed repository.
        results = engine.search_code(request.query, request.limit)

        if not results:
            return {
                "query": request.query,
                "explanation": (
                    "No relevant code was found. "
                    "Please index your repository first."
                ),
                "sources": [],
            }

        # Step 2: Prepare the retrieved code as context for Qwen.
        code_context = "\n\n".join(
            [
                (
                    f"File: {item['file']}\n"
                    f"Lines: {item['start_line']}-{item['end_line']}\n"
                    f"Code:\n{item['code']}"
                )
                for item in results
            ]
        )

        prompt = f"""
You are CodeSense AI, an expert software development assistant.

Answer the user's question using the retrieved source code below.

User question:
{request.query}

Retrieved source code:
{code_context}

Instructions:
- Explain the relevant code clearly and accurately.
- Use simple language.
- Refer to filenames and line numbers when useful.
- If the retrieved code does not contain enough information,
  clearly state that limitation.
- Do not invent functions or code that are not shown.
"""

        # Step 3: Ask the local Qwen model to generate an explanation.
        try:
            response = requests.post(
                OLLAMA_URL,
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                },
                timeout=180,
            )
            response.raise_for_status()
            ai_result = response.json()
            explanation = ai_result.get("response", "").strip()

            if not explanation:
                raise HTTPException(
                    status_code=502,
                    detail="The AI model returned an empty response.",
                )

        except requests.RequestException as exc:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Could not connect to Ollama. "
                    "Check that Ollama is running and the model is installed. "
                    f"Details: {str(exc)}"
                ),
            )

        # Step 4: Return the AI explanation and source references.
        sources = [
            {
                "file": item["file"],
                "start_line": item["start_line"],
                "end_line": item["end_line"],
                "code": item["code"],
            }
            for item in results
        ]

        return {
            "query": request.query,
            "explanation": explanation,
            "sources": sources,
            "model": OLLAMA_MODEL,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Code explanation failed: {str(exc)}",
        )

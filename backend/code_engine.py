import os
import hashlib
import chromadb
from sentence_transformers import SentenceTransformer


class CodeIntelligenceEngine:
    def __init__(self):
        print("Loading Sentence-BERT model...")

        self.model = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2"
        )

        self.client = chromadb.PersistentClient(
            path="./chroma_db"
        )

        self.collection = self.client.get_or_create_collection(
            name="code_chunks"
        )

        print("Code Intelligence Engine initialized!")

    def _split_into_chunks(self, lines, chunk_size=30, overlap=5):
        """
        Split source code into overlapping chunks.
        Line numbers remain one-based and inclusive.
        """
        chunks = []
        start = 0

        while start < len(lines):
            end = min(start + chunk_size, len(lines))
            code = "".join(lines[start:end])

            if code.strip():
                chunks.append({
                    "code": code,
                    "start_line": start + 1,
                    "end_line": end
                })

            if end == len(lines):
                break

            start = end - overlap

        return chunks

    def index_repository(self, repository_path):
        repository_path = os.path.abspath(repository_path)

        if not os.path.isdir(repository_path):
            return {
                "message": "Repository directory does not exist.",
                "chunks_indexed": 0
            }

        extensions = {".py", ".java", ".js", ".ts", ".jsx", ".tsx"}

        ignored_dirs = {
            "venv",
            ".venv",
            "env",
            ".git",
            "node_modules",
            "__pycache__",
            "chroma_db",
            "dist",
            "build",
            ".next",
            ".idea",
            ".vscode"
        }

        documents = []
        metadatas = []
        ids = []

        for root, dirs, files in os.walk(repository_path):
            dirs[:] = [
                directory
                for directory in dirs
                if directory not in ignored_dirs
                and not directory.startswith(".")
            ]

            for filename in files:
                if os.path.splitext(filename)[1].lower() not in extensions:
                    continue

                filepath = os.path.join(root, filename)
                relative_path = os.path.relpath(
                    filepath, repository_path
                ).replace("\\", "/")

                try:
                    with open(
                        filepath,
                        "r",
                        encoding="utf-8",
                        errors="ignore"
                    ) as source_file:
                        lines = source_file.readlines()

                except OSError:
                    continue

                chunks = self._split_into_chunks(lines)

                for chunk in chunks:
                    code = chunk["code"]

                    # Stable IDs allow existing chunks to be updated.
                    chunk_hash = hashlib.sha1(
                        (
                            relative_path
                            + ":"
                            + str(chunk["start_line"])
                        ).encode("utf-8")
                    ).hexdigest()

                    documents.append(code)

                    metadatas.append({
                        "file": relative_path,
                        "repository": repository_path,
                        "start_line": chunk["start_line"],
                        "end_line": chunk["end_line"]
                    })

                    ids.append(chunk_hash)

        if not documents:
            return {
                "message": "No supported source files found.",
                "chunks_indexed": 0
            }

        # Embed the collected chunks in batches.
        for start in range(0, len(documents), 100):
            batch_documents = documents[start:start + 100]
            batch_ids = ids[start:start + 100]
            batch_metadatas = metadatas[start:start + 100]

            embeddings = self.model.encode(
                batch_documents,
                normalize_embeddings=True,
                show_progress_bar=False
            ).tolist()

            self.collection.upsert(
                ids=batch_ids,
                documents=batch_documents,
                metadatas=batch_metadatas,
                embeddings=embeddings
            )

        return {
            "message": "Repository indexed successfully!",
            "chunks_indexed": len(documents)
        }

    def search_code(self, query, limit=5):
        total_chunks = self.collection.count()

        if total_chunks == 0:
            return []

        query_embedding = self.model.encode(
            [query],
            normalize_embeddings=True
        ).tolist()

        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=min(limit, total_chunks),
            include=[
                "documents",
                "metadatas",
                "distances"
            ]
        )

        matches = []

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for code, metadata, distance in zip(
            documents, metadatas, distances
        ):
            matches.append({
                "file": metadata["file"],
                "start_line": metadata["start_line"],
                "end_line": metadata["end_line"],
                "code": code,
                "distance": distance
            })

        return matches

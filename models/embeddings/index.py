"""
Lot 2: Build FAISS index from compliance documents.

Loads markdown files from the knowledge base, splits them into chunks,
generates embeddings using sentence-transformers, and saves a FAISS index
for fast vector similarity search.

Dependencies (Lot 2):
    pip install sentence-transformers faiss-cpu
"""

# import os
# import glob
# from sentence_transformers import SentenceTransformer
# import faiss
# import numpy as np
# import json

CHUNK_SIZE = 512
CHUNK_OVERLAP = 64
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
INDEX_PATH = "models/embeddings/compliance.index"
METADATA_PATH = "models/embeddings/metadata.json"


def load_documents(docs_dir: str = "data/knowledge-base"):
    """Load all markdown files from the knowledge base directory.

    Args:
        docs_dir: Path to the directory containing .md files.

    Returns:
        List of (filename, content) tuples.
    """
    # TODO: Lot 2 implementation
    # documents = []
    # for filepath in sorted(glob.glob(os.path.join(docs_dir, "**/*.md"), recursive=True)):
    #     with open(filepath, "r") as f:
    #         documents.append((filepath, f.read()))
    # print(f"Loaded {len(documents)} documents")
    # return documents
    raise NotImplementedError("Lot 2: document loading not yet implemented")


def split_into_chunks(documents: list, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP):
    """Split documents into overlapping text chunks.

    Args:
        documents: List of (filename, content) tuples.
        chunk_size: Number of characters per chunk.
        overlap: Number of overlapping characters between chunks.

    Returns:
        List of (filename, chunk_text, chunk_index) tuples.
    """
    # TODO: Lot 2 implementation
    # chunks = []
    # for filename, content in documents:
    #     for i in range(0, len(content), chunk_size - overlap):
    #         chunk = content[i:i + chunk_size]
    #         chunks.append((filename, chunk, len(chunks)))
    # print(f"Created {len(chunks)} chunks")
    # return chunks
    raise NotImplementedError("Lot 2: chunking not yet implemented")


def build_index(chunks: list):
    """Generate embeddings and build a FAISS index.

    Args:
        chunks: List of (filename, chunk_text, chunk_index) tuples.
    """
    # TODO: Lot 2 implementation
    # model = SentenceTransformer(EMBEDDING_MODEL)
    # texts = [chunk[1] for chunk in chunks]
    # embeddings = model.encode(texts, show_progress_bar=True)
    # dimension = embeddings.shape[1]
    # index = faiss.IndexFlatIP(dimension)
    # faiss.normalize_L2(embeddings)
    # index.add(embeddings)
    # faiss.write_index(index, INDEX_PATH)
    #
    # metadata = [{"source": c[0], "chunk_index": c[2], "text": c[1]} for c in chunks]
    # with open(METADATA_PATH, "w") as f:
    #     json.dump(metadata, f)
    #
    # print(f"Index saved to {INDEX_PATH} ({len(chunks)} vectors, dim={dimension})")
    raise NotImplementedError("Lot 2: index building not yet implemented")


def main():
    """End-to-end indexing pipeline."""
    print("Lot 2: Compliance document indexing pipeline")
    print("This is a stub — implementation pending Lot 2 delivery.")

    # documents = load_documents()
    # chunks = split_into_chunks(documents)
    # build_index(chunks)


if __name__ == "__main__":
    main()

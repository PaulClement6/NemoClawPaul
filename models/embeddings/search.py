"""
Lot 2: Vector search API for RAG.

Serves a REST endpoint that performs vector similarity search against
the FAISS index built from compliance documents. Used by the compliance
agent for retrieval-augmented generation.

Dependencies (Lot 2):
    pip install flask sentence-transformers faiss-cpu
"""

# from flask import Flask, request, jsonify
# from sentence_transformers import SentenceTransformer
# import faiss
# import json
# import numpy as np

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
INDEX_PATH = "models/embeddings/compliance.index"
METADATA_PATH = "models/embeddings/metadata.json"


def create_app():
    """Create and configure the Flask application."""
    # TODO: Lot 2 implementation
    # app = Flask(__name__)
    # model = SentenceTransformer(EMBEDDING_MODEL)
    # index = faiss.read_index(INDEX_PATH)
    # with open(METADATA_PATH, "r") as f:
    #     metadata = json.load(f)
    #
    # @app.route("/api/v1/embeddings/search", methods=["POST"])
    # def search():
    #     """Search for similar compliance document chunks.
    #
    #     Expects JSON body:
    #         {
    #             "query": "flood coverage exclusions",
    #             "top_k": 5
    #         }
    #
    #     Returns:
    #         {
    #             "results": [
    #                 {
    #                     "text": "...",
    #                     "source": "knowledge-base/flood-policy.md",
    #                     "score": 0.87
    #                 }
    #             ]
    #         }
    #     """
    #     data = request.get_json()
    #     query = data.get("query", "")
    #     top_k = data.get("top_k", 5)
    #
    #     query_embedding = model.encode([query])
    #     faiss.normalize_L2(query_embedding)
    #     scores, indices = index.search(query_embedding, top_k)
    #
    #     results = []
    #     for score, idx in zip(scores[0], indices[0]):
    #         if idx < len(metadata):
    #             entry = metadata[idx]
    #             results.append({
    #                 "text": entry["text"],
    #                 "source": entry["source"],
    #                 "score": round(float(score), 4)
    #             })
    #
    #     return jsonify({"results": results})
    #
    # return app
    raise NotImplementedError("Lot 2: vector search API not yet implemented")


if __name__ == "__main__":
    print("Lot 2: Vector search API for RAG")
    print("This is a stub — implementation pending Lot 2 delivery.")
    # app = create_app()
    # app.run(host="0.0.0.0", port=5003)

## Converis AI Knowledge Base (Local)

Drop M&A / PMI reference material here to power the in-app RAG system.

### Supported file types

- **PDF** (`.pdf`)
- **Text** (`.txt`)
- **Markdown** (`.md`)

### How it works

- The server automatically indexes this folder into a local vector database stored in `/.rag`.
- The AI will retrieve relevant chunks from these documents and only answer using:
  - this knowledge base, plus
  - buyer/seller documents uploaded per deal.

### Privacy

Everything stays local to this machine. No external APIs are used.
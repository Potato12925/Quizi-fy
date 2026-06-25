# Embedding Retrieval Manual Test

1. Run the migrations that add `document_chunks.embedding vector(1536)` and the `match_document_chunks` RPC.
2. Start the API and the existing Celery worker on queue `teacher_ai_generation`.
3. Upload a PDF, DOCX, or TXT document through the current teacher document flow.
4. Confirm `document_chunks` rows exist for the uploaded document.
5. Confirm embeddings are populated immediately, or remain null if embedding generation fails.
6. Create an AI request with `content_scope = "Chương 1"`.
7. Watch worker logs and confirm one of these modes appears:
   - `retrieval_mode=embedding`
   - `retrieval_mode=keyword_fallback`
   - `retrieval_mode=whole_document`
8. If embeddings were initially null, confirm the worker lazily backfills them before retrieval.
9. Verify selected chunks are relevant to `Chương 1`.
10. Verify generated questions are inserted with:
    - `ai_request_id`
    - `question_sources`
11. Temporarily break embeddings, for example by removing the API key or using an unsupported embedding model, then create another request and confirm:
    - worker does not crash
    - retrieval switches to `keyword_fallback`
12. Test a scope with page ranges such as `trang 5-10` and confirm page overlap influences chunk ranking on top of embedding retrieval.

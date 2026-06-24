# RAG Architecture Explanation Report

## 1. Problem Statement

The original AI question generation flow in Quizi-fy was simple and functional for small documents, but it had clear architectural limitations when applied to real educational materials.

The main problems were:

- The extracted document text was truncated using `document_text[:16000]`.
- Large documents such as long lecture notes, textbooks, and multi-chapter materials lost substantial content before reaching the AI model.
- Question generation was biased toward the beginning of the document, because only the first portion of the text was included in the prompt.
- There was no traceability between a generated question and the exact source content that produced it.
- There was no reusable retrieval layer; extraction and prompting were tightly coupled.
- The architecture could not scale well to large educational documents or future semantic retrieval.

In practice, this meant the system could generate acceptable questions for short notes, but it became unreliable for bigger teaching files. A teacher might request questions for "Chương 4" or "trang 20-30", but the old architecture had no internal mechanism to isolate that scope from the document. As a result, the generated output was less controllable and less auditable.

From a software engineering perspective, the old design treated the document as one large string instead of structured knowledge. That created issues in scalability, maintainability, and correctness.

## 2. Previous Architecture

### Old Flow

The previous architecture can be summarized as:

`Teacher Upload -> AI Request -> Extract Text -> Truncate -> OpenAI -> Questions`

Step-by-step:

1. The teacher uploaded a document file.
2. The teacher created an AI request with:
   - document topic
   - total number of questions
   - difficulty distribution
   - optional `content_scope`
3. The Celery worker loaded the document and extracted text.
4. The extracted text was converted into one long string.
5. The string was truncated to the first 16,000 characters.
6. The truncated content was sent to OpenAI with the difficulty and quantity requirements.
7. The returned questions were validated and inserted into:
   - `questions`
   - `question_options`

### Strengths of the Old Architecture

- Simple to implement.
- Low number of moving parts.
- Easy to reason about for small files.
- Fast to prototype.
- Good enough for early proof-of-concept functionality.

### Weaknesses of the Old Architecture

- Document knowledge was not structured.
- Content retrieval was not explicit.
- `content_scope` could only influence prompting indirectly, not data selection.
- Large files were unfairly represented because only the beginning was used.
- There was no provenance layer to explain where a question came from.
- Repeated generations had to re-extract and reprocess the full document each time.

### Scalability Limitations

The main scalability bottleneck was prompt size. If the document grew from 10 pages to 100 or 500 pages, the system still only used the first slice of text. That means increasing document size did not increase useful model context; it only increased discarded data.

This architecture also did not prepare the system for:

- embeddings
- semantic search
- section-level retrieval
- content citation
- chunk-level analytics

In other words, the old system was a direct prompt pipeline, not an information retrieval architecture.

## 3. New RAG Architecture

### New Flow

The new architecture is:

`Teacher Upload -> Text Extraction -> Chunking -> document_chunks -> Retrieval -> OpenAI -> Questions -> question_sources`

### Responsibility of Each Component

#### Teacher Upload

The upload flow still stores the original teaching file in the `documents` table. This preserves the original source artifact and remains the canonical file reference.

#### Text Extraction

The extraction layer reads PDF, DOCX, or TXT content and converts it into normalized text. For PDFs, the extraction logic can also preserve page-aware segments, which is useful for later chunk metadata and page-range retrieval.

#### Chunking

Instead of treating the document as one giant string, the system transforms it into meaningful chunks. Each chunk becomes a reusable unit of retrieval and prompting.

Chunking turns a document from "unstructured raw prompt input" into "indexed retrieval-ready knowledge."

#### `document_chunks`

This table stores the chunked representation of each document. It acts as the retrieval cache for RAG generation.

This brings two key benefits:

- The document only needs to be chunked once per active version.
- Later AI requests can reuse existing chunks instead of reprocessing the entire file.

#### Retrieval

The retrieval layer selects only the chunks relevant to the teacher’s requested `content_scope`.

Examples:

- whole document -> use active chunks across the document
- `"Chương 1"` -> prioritize chunks whose title or text matches Chapter 1
- `"React Hook"` -> prioritize chunks containing this phrase or related keywords
- `"trang 5-10"` -> prioritize chunks whose page range overlaps pages 5 to 10

#### OpenAI

OpenAI no longer receives a naive truncated document. It receives a curated chunk set that represents the relevant knowledge for the current request.

This makes prompting more focused, more explainable, and more scalable.

#### Questions

Validated questions are still persisted into the existing:

- `questions`
- `question_options`

This preserves compatibility with the rest of the system.

#### `question_sources`

This new table captures provenance by linking each generated question to one or more source chunks.

That makes the architecture auditable. A reviewer can trace a question back to the exact chunk(s) that influenced it.

## 4. Database Design Changes

### 4.1 `document_chunks`

#### Purpose

`document_chunks` stores reusable text chunks derived from uploaded documents. It is the core persistence layer for RAG retrieval.

#### Columns

- `chunk_id`: primary key
- `document_id`: parent document
- `chunk_index`: chunk order within the active document version
- `chunk_title`: inferred section heading if available
- `chunk_text`: actual chunk content
- `chunk_hash`: optional content hash
- `start_char`, `end_char`: character offsets inside extracted text
- `page_from`, `page_to`: page range when known
- `token_count`: approximate chunk size
- `created_at`: creation timestamp
- `deleted_at`: soft delete marker

#### Relationships

- `document_chunks.document_id -> documents.document_id`
- `question_sources.chunk_id -> document_chunks.chunk_id`

#### Indexes

- index on `document_id`
- partial unique index on `(document_id, chunk_index)` where `deleted_at IS NULL`
- optional index on `chunk_hash`

#### Why Soft Delete Was Chosen

Soft delete was chosen because document content can change over time. If a teacher replaces a file, the old chunks should stop being used for new retrieval, but they may still be referenced by historical provenance rows in `question_sources`.

This means old chunks remain valuable as historical evidence even after a new document version becomes active.

### 4.2 `question_sources`

#### Purpose

`question_sources` stores provenance relationships between generated questions and source chunks.

#### Columns

- `question_source_id`: primary key
- `question_id`: generated question
- `chunk_id`: source chunk used during generation
- `relevance_score`: retrieval score at generation time
- `created_at`: timestamp

#### Relationships

- `question_sources.question_id -> questions.question_id`
- `question_sources.chunk_id -> document_chunks.chunk_id`

#### Indexes

- index on `question_id`
- index on `chunk_id`
- unique `(question_id, chunk_id)`

#### Why Soft-Delete-Friendly Provenance Was Chosen

The system must preserve historical traceability. If a document is replaced, the old chunks become soft-deleted, but existing provenance should still be readable. Therefore, provenance reads must not require `document_chunks.deleted_at IS NULL`.

This supports auditability and thesis/demo explanations such as:

"This question came from an older version of the document, and here is the exact chunk that originally generated it."

## 5. Chunking Strategy

The chunking strategy is hybrid, not naive fixed-length splitting.

### 5.1 Heading Detection

The system first tries to detect meaningful section boundaries using common educational headings such as:

- `Chương`, `chapter`
- `Bài`, `lesson`
- `unit`, `topic`, `module`
- numeric patterns like `1.`, `1.1`, `1.1.1`
- roman patterns like `I.`, `II.`, `III.`
- alphabetical patterns like `A.`, `B.`, `C.`

This approach is important because educational documents are usually organized by lessons, chapters, or numbered sections.

### 5.2 Paragraph Fallback

Not all documents follow formal heading conventions. Some files are loose notes, copied materials, or plain text exports.

If heading detection is weak, the system falls back to paragraph grouping. This ensures chunking still works even for messy or unstructured documents.

### 5.3 Sliding Window

Sometimes a single section or paragraph is too large. In that case, the system re-splits the content using a sliding window.

This prevents oversized prompt blocks and makes retrieval more precise.

### 5.4 Overlap

Chunks include overlap of around 500-800 characters. Overlap is important because knowledge boundaries are often fuzzy. The last sentence of one concept may connect strongly to the first sentence of the next concept.

Without overlap, boundary information would be lost. With overlap, retrieval keeps more context continuity.

### 5.5 Chunk Metadata

Each chunk stores metadata such as:

- title
- character offsets
- page range
- approximate token count
- content hash

This metadata supports:

- retrieval scoring
- provenance display
- debugging
- future semantic indexing

### Why Simple Fixed-Length Chunking Was Rejected

Fixed-length chunking was rejected because it ignores document structure.

If the system split every 2,000 characters blindly, it could:

- break a definition in half
- separate question-relevant context from its explanation
- destroy semantic continuity
- reduce retrieval quality

For educational content, structure-aware chunking is much more appropriate than raw length-based slicing.

## 6. Retrieval Strategy

The retrieval layer interprets `content_scope` and selects the most relevant active chunks.

### Whole-Document Cases

If `content_scope` is:

- empty
- null
- `"toàn bộ tài liệu"`
- `"toàn bộ file"`
- equivalent whole-document wording

then the system uses active chunks across the document.

### Scoped Cases

If `content_scope` contains focused text, the system uses heuristic scoring.

Examples:

#### `"Chương 1"`

Chunks with matching titles such as Chapter 1 get higher priority.

#### `"React Hook"`

Chunks containing this phrase in title or content receive a high score.

#### `"phần REST API"`

Chunks with overlapping keywords such as `REST`, `API`, or matching section titles are prioritized.

#### `"trang 5-10"`

If page metadata exists, chunks whose page range overlaps 5-10 receive a page-range bonus.

### Retrieval Scoring

Current scoring uses:

- strong score if `content_scope` appears in `chunk_title`
- medium score if it appears in `chunk_text`
- additive score for overlapping keywords
- page overlap bonus for page-based scope

If no strong match exists, the system falls back gracefully to top-ranked chunks, then to all active chunks instead of failing immediately.

### Why This Design Matters

This retrieval layer is intentionally simple but structurally correct. It provides immediate practical value while remaining easy to replace later with:

- embeddings
- pgvector similarity search
- hybrid lexical + semantic retrieval

## 7. AI Generation Flow

The new AI generation flow is no longer "full document prompt in, questions out." It is a multi-stage generation pipeline.

### 7.1 Chunk Selection

For each request, the worker ensures active chunks exist. If not, it lazily creates them from the current document file.

Then it retrieves relevant chunks using `content_scope`.

### 7.2 Prompt Construction

The prompt is constructed using explicit chunk blocks:

```text
[Chunk 1]
Title: ...
Content:
...

[Chunk 2]
Title: ...
Content:
...
```

This is better than raw concatenation because:

- the model sees clear boundaries
- the model can return `source_chunk_indexes`
- debugging becomes easier

### 7.3 Difficulty Distribution

The system still honors `ai_request_difficulty_distribution`.

For each difficulty:

- recognition
- comprehension
- application
- advanced

the worker generates questions in separate batches so the output remains aligned with the request.

### 7.4 Validation

Each returned question is validated to ensure:

- non-empty content
- exactly 4 options
- valid correct option `A/B/C/D`
- difficulty exactly matches the current batch

### 7.5 Deduplication

Deduplication occurs at two levels:

- against existing questions already stored for the same topic
- against questions already accepted in the current worker run

This avoids generating repeated question content.

### 7.6 Retry Mechanism

If duplicates or invalid items reduce the usable count, the worker retries only the missing amount.

Each difficulty batch uses controlled retries, up to 3 attempts, and requests 10-20% extra items per attempt to absorb filtering loss.

This makes generation more robust without causing runaway cost or infinite loops.

## 8. Question Provenance

`question_sources` was introduced because the old system had no answer to an important academic question:

"Which exact part of the document produced this generated question?"

With `question_sources`, each generated question can be linked back to one or more chunks. For example:

- `question_id = 501`
- linked to `chunk_id = 2101` and `chunk_id = 2102`

This means the system can explain:

- which section of the document supported the question
- whether the question came from one chunk or combined context
- whether a later document version changed the source content

This is important for:

- teacher review
- debugging hallucinations
- auditability
- thesis/demo explanation

In a defense setting, provenance is a strong argument that the system is not just "calling OpenAI," but is implementing a more accountable retrieval-based architecture.

## 9. Celery Architecture

### Why Generation Remains Asynchronous

Question generation involves:

- document extraction
- chunk creation
- retrieval
- multiple OpenAI calls
- validation
- insertion
- retries

This is too heavy for a synchronous HTTP request-response cycle. If performed inline, the API could:

- timeout
- block the user
- degrade responsiveness

Celery solves this by moving generation into background workers.

### Why Task Name and Queue Were Preserved

The implementation deliberately kept:

- task name: `workers.ai_generation_worker.process_ai_request_task`
- queue: `teacher_ai_generation`

This preserves compatibility with:

- existing worker routing
- deployment configuration
- retry calls from the service layer
- operational scripts like `run_worker.bat`

### Worker Responsibilities

The worker now handles:

1. loading the request
2. marking it `processing`
3. validating teacher access
4. ensuring chunks exist
5. retrieving scope-relevant chunks
6. generating per difficulty batch
7. validating and deduplicating results
8. inserting questions, options, and provenance
9. marking request `completed` or `failed`

The worker therefore becomes the orchestration boundary of the entire RAG generation lifecycle.

## 10. Benefits

### Scalability

The new architecture scales much better for large files because it no longer depends on the first 16,000 characters. It can support very large educational documents through chunk reuse and focused retrieval.

### Maintainability

Responsibilities are clearer:

- extraction
- chunking
- retrieval
- prompting
- provenance

This separation makes the system easier to extend and debug.

### Traceability

The addition of `question_sources` creates a real audit trail from AI output back to source chunks.

### Future Extensibility

The retrieval layer is now a replaceable abstraction. Today it uses keyword scoring; tomorrow it can use semantic search without redesigning the whole pipeline.

## 11. Future Improvements

This architecture is intentionally designed as a strong intermediate step toward more advanced RAG.

### 11.1 Embeddings

Each chunk could later store vector embeddings so retrieval becomes semantic, not only lexical.

### 11.2 pgvector

Using PostgreSQL with `pgvector`, the project could support nearest-neighbor similarity search directly inside the database.

### 11.3 Semantic Search

Instead of keyword overlap only, the system could retrieve chunks based on conceptual similarity. This would improve cases where the teacher uses different wording from the document.

### 11.4 AI-as-Judge

An AI-as-Judge step could evaluate generated questions for:

- faithfulness to chunk source
- clarity
- difficulty correctness
- distractor quality

### 11.5 Hybrid Retrieval

The best long-term retrieval model is likely hybrid:

- lexical scoring for exact chapter names and page ranges
- semantic similarity for concept-level matching

This would give better precision and recall than either method alone.

## 12. Presentation Script

Below is a 5-10 minute Vietnamese presentation script suitable for demo or defense use.

---

Xin chào thầy cô, trong phần này em xin trình bày kiến trúc mới của chức năng sinh câu hỏi trắc nghiệm bằng AI trong hệ thống Quizi-fy.

Trước đây, hệ thống của em sử dụng một luồng xử lý khá trực tiếp. Sau khi giáo viên tải tài liệu lên và tạo yêu cầu sinh câu hỏi, worker sẽ trích xuất toàn bộ văn bản từ file, sau đó cắt chuỗi văn bản bằng `document_text[:16000]`, rồi gửi phần nội dung đó vào OpenAI để sinh câu hỏi.

Ưu điểm của cách làm cũ là đơn giản, dễ triển khai, phù hợp cho giai đoạn prototype. Tuy nhiên, khi áp dụng với tài liệu giáo dục thực tế, đặc biệt là tài liệu dài nhiều chương hoặc nhiều trang, mô hình này bộc lộ nhiều hạn chế.

Hạn chế lớn nhất là hệ thống chỉ sử dụng phần đầu của tài liệu. Điều đó dẫn tới việc những nội dung nằm ở phía sau, ví dụ Chương 3, Chương 4 hoặc các phần cuối tài liệu, hoàn toàn có thể không được đưa vào prompt. Vì vậy, nếu giáo viên yêu cầu sinh câu hỏi theo phạm vi như "Chương 4" hoặc "trang 20 đến 30", hệ thống cũ không có khả năng chọn đúng phần nội dung đó một cách rõ ràng. Ngoài ra, hệ thống cũ cũng chưa có cơ chế truy vết, tức là sau khi sinh xong một câu hỏi thì mình không biết chính xác câu đó được sinh từ phần nào của tài liệu.

Để giải quyết vấn đề đó, em nâng cấp kiến trúc sang hướng RAG, tức là Retrieval-Augmented Generation.

Luồng mới gồm các bước chính như sau: giáo viên tải tài liệu lên, hệ thống trích xuất văn bản, sau đó chia văn bản thành các chunk, lưu các chunk này vào bảng `document_chunks`, rồi khi có yêu cầu sinh câu hỏi thì hệ thống sẽ truy hồi các chunk phù hợp theo `content_scope`, chỉ gửi các chunk liên quan vào OpenAI, sau đó lưu câu hỏi vào bảng `questions` và lưu quan hệ truy vết vào bảng `question_sources`.

Điểm quan trọng ở đây là tài liệu không còn được xem như một chuỗi văn bản lớn duy nhất, mà được tổ chức lại thành các đơn vị tri thức nhỏ hơn, có thể tái sử dụng.

Về thiết kế cơ sở dữ liệu, em bổ sung hai bảng mới.

Bảng thứ nhất là `document_chunks`. Bảng này lưu các đoạn nội dung đã được tách ra từ tài liệu, bao gồm thứ tự chunk, tiêu đề nếu suy luận được, nội dung chunk, vị trí ký tự, khoảng trang, số token ước lượng, và cột `deleted_at` để hỗ trợ soft delete.

Em chọn soft delete vì khi giáo viên thay thế file tài liệu, các chunk cũ không nên tiếp tục dùng cho sinh câu hỏi mới, nhưng vẫn cần được giữ lại cho mục đích lịch sử và truy vết.

Bảng thứ hai là `question_sources`. Bảng này lưu mối quan hệ giữa một câu hỏi được sinh ra và các chunk nguồn đã được dùng để sinh câu hỏi đó. Nhờ vậy, từ một câu hỏi trong hệ thống, ta có thể truy ngược lại xem nó đến từ phần nào của tài liệu.

Về chiến lược chunking, em không chia cố định theo số ký tự, vì cách đó rất dễ cắt ngang nội dung quan trọng. Thay vào đó, em dùng hybrid chunking. Đầu tiên hệ thống cố gắng phát hiện heading như Chương, Bài, Chapter, Unit, các tiêu đề dạng 1.1, I., A. Nếu phát hiện được cấu trúc hợp lý thì sẽ chia theo section. Nếu tài liệu không có heading rõ ràng thì sẽ fallback sang chia theo paragraph. Nếu một section hoặc paragraph quá dài thì tiếp tục chia bằng sliding window, đồng thời giữ overlap khoảng 500 đến 800 ký tự để không làm mất ngữ cảnh ở ranh giới giữa các chunk.

Về retrieval, khi giáo viên nhập `content_scope`, hệ thống sẽ dùng các luật scoring đơn giản nhưng hiệu quả. Nếu `content_scope` là rỗng hoặc mang nghĩa toàn bộ tài liệu, hệ thống dùng các chunk đang active trên toàn bộ file. Nếu `content_scope` là "Chương 1", "React Hook", "phần REST API" hoặc "trang 5 đến 10", hệ thống sẽ chấm điểm các chunk dựa trên việc cụm này có xuất hiện trong tiêu đề chunk hay trong nội dung chunk hay không, mức độ overlap từ khóa, và nếu có dữ liệu trang thì sẽ cộng điểm cho chunk có khoảng trang phù hợp.

Sau khi chọn được chunk phù hợp, worker sẽ tạo prompt theo từng block, ví dụ `[Chunk 1]`, `Title`, `Content`, để mô hình dễ hiểu ranh giới ngữ cảnh. OpenAI được yêu cầu chỉ sử dụng các chunk cung cấp, không bịa thêm thông tin ngoài tài liệu, và nếu có thể thì trả về thêm `source_chunk_indexes` để hệ thống biết câu hỏi đó gắn với chunk nào.

Worker vẫn chạy bằng Celery, tức là bất đồng bộ. Em giữ nguyên task name và queue cũ để không làm ảnh hưởng tới luồng đang có sẵn của hệ thống. Điều này giúp việc nâng cấp kiến trúc không phá vỡ phần vận hành cũ.

Lợi ích của kiến trúc mới là rõ ràng hơn ở bốn điểm. Thứ nhất là scalability, vì tài liệu lớn không còn bị giới hạn bởi 16.000 ký tự đầu tiên. Thứ hai là maintainability, vì các phần extraction, chunking, retrieval, generation, provenance đã được tách trách nhiệm rõ ràng. Thứ ba là traceability, vì mỗi câu hỏi đều có thể truy ngược về chunk nguồn. Và cuối cùng là extensibility, vì sau này em có thể thay retrieval hiện tại bằng embeddings, pgvector hoặc hybrid retrieval mà không cần thiết kế lại toàn bộ hệ thống.

Trong tương lai, em dự định mở rộng theo hướng semantic search bằng embeddings và pgvector, kết hợp với AI-as-Judge để chấm chất lượng câu hỏi và kiểm tra độ bám sát nguồn.

Tóm lại, thay vì chỉ gọi OpenAI trên một phần cắt ngắn của tài liệu, hệ thống mới đã chuyển sang mô hình RAG có chunking, retrieval, provenance và worker orchestration rõ ràng hơn. Đây là một bước nâng cấp quan trọng để hệ thống có thể xử lý tài liệu giáo dục dài, tăng khả năng kiểm soát đầu ra, và phù hợp hơn với yêu cầu của một hệ thống phần mềm thực tế.

Em xin hết phần trình bày.

---

## 13. Interview / Defense Questions

### 1. Why use chunking?

Chunking makes long documents retrievable and promptable in smaller, meaningful units. Without chunking, large files cannot be selectively used in generation.

### 2. Why not store the entire document in the prompt?

LLM context windows are limited and expensive. Sending the full document is inefficient and scales poorly, especially for long teaching materials.

### 3. Why was `document_text[:16000]` a bad idea?

It biased question generation toward the first part of the document and ignored the rest of the content.

### 4. Why not use fixed-length chunking only?

Fixed-length chunking ignores document semantics and can split important concepts across boundaries, reducing retrieval quality.

### 5. Why soft delete chunks?

Because old chunks may still be referenced by historical provenance rows even after a document file is replaced.

### 6. Why not hard delete old chunks when a file changes?

Hard delete would break historical traceability. Soft delete preserves evidence of what previously generated a question.

### 7. Why introduce `question_sources`?

To support provenance, debugging, auditability, and teacher trust in generated content.

### 8. Why not use pgvector immediately?

Keyword-based retrieval is simpler, cheaper, and easier to validate first. The architecture is now prepared for pgvector later.

### 9. How does `content_scope` work now?

It is used by retrieval logic to choose relevant chunks before prompting the AI model, instead of only influencing instruction text.

### 10. How does the system handle `"toàn bộ tài liệu"`?

It interprets that as a whole-document request and retrieves active chunks across the document.

### 11. How does the system handle `"Chương 1"`?

It scores chunks based on title and content matches to the scope phrase and prioritizes chunks likely belonging to Chapter 1.

### 12. How does the system handle page ranges like `"trang 5-10"`?

If page metadata exists, chunks whose page ranges overlap those pages receive a score bonus.

### 13. Why keep Celery?

Generation is computationally expensive and network-dependent. Celery keeps the API responsive and isolates long-running jobs.

### 14. Why preserve the task name and queue?

To avoid breaking the current deployment, routing, retry calls, and worker startup configuration.

### 15. How is duplicate detection handled?

The worker normalizes question content and checks duplicates against both stored questions and already accepted questions in the same run.

### 16. What happens if the AI returns too few valid questions?

The system retries only the missing amount, with controlled retries and small over-generation buffers.

### 17. What happens if upload-time chunking fails?

The document upload still succeeds, and lazy chunk creation in the worker acts as the guaranteed fallback.

### 18. Why not make chunking mandatory at upload time?

Because upload should remain robust. A temporary extraction or chunking issue should not necessarily block document persistence.

### 19. How can this architecture scale to 500-page documents?

Because the document is chunked once and only relevant chunks are retrieved per request, the AI prompt size remains bounded even when the source document is very large.

### 20. How does provenance improve system quality?

It enables auditing, debugging, and future teacher-facing explanations of why a question was generated.

### 21. Why is retrieval separated from prompting?

Because retrieval is a reusable concern. This separation supports future upgrades like semantic search without rewriting generation logic.

### 22. What is the main software engineering benefit of this redesign?

The system moved from a monolithic prompt pipeline to a layered architecture with clearer responsibilities and better long-term extensibility.

### 23. Why use a partial unique index on `(document_id, chunk_index)`?

Because only active chunks must have unique ordering. Historical soft-deleted chunk versions should not block insertion of a new active version.

### 24. Why do provenance reads ignore `document_chunks.deleted_at IS NULL`?

Because historical provenance must remain readable even if the related chunk belongs to an older document version.

### 25. How can this architecture evolve into full RAG?

By adding embeddings per chunk, storing them with pgvector, and replacing or augmenting the current lexical scoring with semantic similarity.

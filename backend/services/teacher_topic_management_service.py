from middlewares.auth_middleware import CurrentUser
from repositories.teacher_topic_management_repository import (
    create_document_topic_relation,
    create_topic,
    delete_document_topic_relation,
    find_document_topic_relation,
    find_teacher_document,
    find_topic_by_id,
    find_topic_by_name_and_class_subject,
    get_class_subject_ids_of_document,
    list_document_topics_with_topic,
    list_teacher_documents_with_subjects,
    teacher_has_topic,
    update_topic_name,
)
from schemas.teacher_topic_management_schema import (
    TeacherAddDocumentTopicRequest,
    TeacherUpdateTopicRequest,
)


class TeacherTopicAuthorizationError(ValueError):
    pass


class TeacherTopicValidationError(ValueError):
    pass


async def get_teacher_subject_documents_topics(current_user: CurrentUser) -> list[dict]:
    documents = await list_teacher_documents_with_subjects(current_user.user_id)
    document_ids = [int(item["document_id"]) for item in documents if item.get("document_id") is not None]
    relations = await list_document_topics_with_topic(document_ids)
    document_title_by_id = {
        int(item["document_id"]): item["title"]
        for item in documents
        if item.get("document_id") is not None
    }

    subjects_map: dict[int, dict] = {}

    for relation in relations:
        document_id = int(relation["document_id"])
        topic = relation.get("topics") or {}
        class_subject = topic.get("class_subjects") or {}
        subject = class_subject.get("subjects") or {}
        if topic.get("deleted_at") is not None:
            continue
        if class_subject.get("subject_id") is None or class_subject.get("status") != "active" or class_subject.get("deleted_at") is not None:
            continue

        subject_id = int(class_subject["subject_id"])
        if subject_id not in subjects_map:
            subjects_map[subject_id] = {
                "subject_id": subject_id,
                "subject_name": subject.get("subject_name") or "Unknown subject",
                "documents": [],
            }

        document_entry = next(
            (
                item
                for item in subjects_map[subject_id]["documents"]
                if int(item["document_id"]) == document_id
            ),
            None,
        )
        if document_entry is None:
            document_entry = {
                "document_id": document_id,
                "title": document_title_by_id.get(document_id, ""),
                "topics": [],
            }
            subjects_map[subject_id]["documents"].append(document_entry)

        topic_id = topic.get("topic_id")
        if topic_id is None:
            continue
        if any(int(item["topic_id"]) == int(topic_id) for item in document_entry["topics"]):
            continue
        document_entry["topics"].append(
            {
                "topic_id": topic_id,
                "topic_name": topic.get("topic_name"),
            }
        )

    return list(subjects_map.values())


async def add_topic_to_teacher_document(document_id: int, payload: TeacherAddDocumentTopicRequest, current_user: CurrentUser) -> dict:
    teacher_document = await find_teacher_document(document_id=document_id, teacher_id=current_user.user_id)
    if not teacher_document:
        raise TeacherTopicAuthorizationError("You can only manage topics for your own documents")

    class_subject_ids = await get_class_subject_ids_of_document(document_id)
    if not class_subject_ids:
        raise TeacherTopicValidationError("Document has no class subject context; update document topics first")
    if len(class_subject_ids) > 1:
        raise TeacherTopicValidationError("Document has inconsistent class subjects across topics")

    class_subject_id = class_subject_ids[0]
    topic = await find_topic_by_name_and_class_subject(payload.topic_name, class_subject_id)
    if not topic:
        topic = await create_topic(payload.topic_name, class_subject_id)

    relation = await find_document_topic_relation(document_id=document_id, topic_id=int(topic["topic_id"]))
    if relation:
        raise TeacherTopicValidationError("Topic already exists in this document")

    await create_document_topic_relation(document_id=document_id, topic_id=int(topic["topic_id"]))

    return {
        "document_id": document_id,
        "topic": {
            "topic_id": int(topic["topic_id"]),
            "topic_name": topic["topic_name"],
        },
    }


async def update_teacher_topic(topic_id: int, payload: TeacherUpdateTopicRequest, current_user: CurrentUser) -> dict:
    topic = await find_topic_by_id(topic_id)
    if not topic:
        raise ValueError("Topic not found")

    has_access = await teacher_has_topic(topic_id=topic_id, teacher_id=current_user.user_id)
    if not has_access:
        raise TeacherTopicAuthorizationError("You can only update topics linked to your own documents")

    existing = await find_topic_by_name_and_class_subject(payload.topic_name, int(topic["class_subject_id"]))
    if existing and int(existing["topic_id"]) != topic_id:
        raise TeacherTopicValidationError("Topic name already exists in this class subject")

    updated = await update_topic_name(topic_id=topic_id, topic_name=payload.topic_name)
    if not updated:
        raise ValueError("Topic not found")

    return updated


async def remove_topic_from_teacher_document(document_id: int, topic_id: int, current_user: CurrentUser) -> dict:
    teacher_document = await find_teacher_document(document_id=document_id, teacher_id=current_user.user_id)
    if not teacher_document:
        raise TeacherTopicAuthorizationError("You can only manage topics for your own documents")

    relation = await find_document_topic_relation(document_id=document_id, topic_id=topic_id)
    if not relation:
        raise ValueError("Topic relation not found in this document")

    deleted = await delete_document_topic_relation(document_id=document_id, topic_id=topic_id)
    if not deleted:
        raise ValueError("Topic relation not found in this document")

    return {
        "document_id": document_id,
        "topic_id": topic_id,
        "deleted": True,
    }

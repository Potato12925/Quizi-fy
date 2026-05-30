from math import ceil

from repositories.class_repository import (
    create_class_record,
    create_class_student_mapping,
    create_class_subject_mapping,
    create_class_teacher_mapping,
    find_any_active_class_of_student,
    find_class_by_code,
    find_class_by_id,
    find_class_student_mapping,
    find_class_subject_mapping,
    find_class_subject_by_record_id,
    find_class_teacher_mapping,
    has_any_class_links,
    list_class_student_counts,
    list_class_students,
    list_class_teachers,
    list_class_subject_counts,
    list_class_subjects,
    list_class_teacher_counts,
    list_classes,
    list_subject_profiles,
    list_user_profiles,
    soft_delete_class_by_id,
    soft_delete_class_student_mapping,
    soft_delete_class_subject_mapping,
    soft_delete_class_subject_mapping_by_record_id,
    soft_delete_class_teacher_mapping,
    update_class_by_id,
    update_class_student_mapping,
    update_class_subject_mapping,
    update_class_teacher_mapping,
)
from repositories.subject_repository import find_subject_by_id
from repositories.user_repository import find_role_codes_by_user_id, find_user_by_id
from schemas.class_schema import (
    AssignTeacherToClassRequest,
    AssignStudentToClassRequest,
    AssignSubjectToClassRequest,
    ClassCreateRequest,
    ClassListQueryParams,
    ClassUpdateRequest,
    UpdateClassSubjectRequest,
)


def _map_class_row(
    row: dict,
    teacher_map: dict[int, dict],
    student_counts: dict[int, int],
    teacher_counts: dict[int, int],
    subject_counts: dict[int, int],
) -> dict:
    class_id = int(row["class_id"])
    teacher_id = int(row["teacher_id"])
    teacher = teacher_map.get(teacher_id) or {}
    teacher_name = teacher.get("full_name") or teacher.get("username") or "Unknown"
    assigned_teacher_count = teacher_counts.get(class_id, 0)
    if assigned_teacher_count == 0:
        assigned_teacher_count = 1

    return {
        "class_id": class_id,
        "class_code": row.get("class_code"),
        "class_name": row.get("class_name"),
        "description": row.get("description"),
        "teacher_id": teacher_id,
        "teacher_name": teacher_name,
        "status": row.get("status"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "student_count": student_counts.get(class_id, 0),
        "teacher_count": assigned_teacher_count,
        "subject_count": subject_counts.get(class_id, 0),
    }


async def _ensure_teacher_exists(teacher_id: int) -> None:
    teacher = await find_user_by_id(teacher_id)
    if not teacher:
        raise ValueError("Teacher does not exist")
    roles = await find_role_codes_by_user_id(teacher_id)
    if "teacher" not in roles:
        raise ValueError("teacher_id must be a teacher")


async def _ensure_student_exists(student_id: int) -> None:
    student = await find_user_by_id(student_id)
    if not student:
        raise ValueError("Student does not exist")
    roles = await find_role_codes_by_user_id(student_id)
    if "student" not in roles:
        raise ValueError("student_id must be a student")


async def _sync_owner_teacher_mapping(class_id: int, teacher_id: int) -> None:
    current_mapping = await find_class_teacher_mapping(
        class_id=class_id,
        teacher_id=teacher_id,
        include_deleted=True,
    )
    if current_mapping is None:
        await create_class_teacher_mapping({"class_id": class_id, "teacher_id": teacher_id})
        return
    if current_mapping.get("deleted_at") is not None:
        await update_class_teacher_mapping(
            int(current_mapping["class_teacher_id"]),
            {"deleted_at": None},
        )


async def _build_class_view_payload(class_rows: list[dict]) -> list[dict]:
    if not class_rows:
        return []

    class_ids = [int(item["class_id"]) for item in class_rows]
    teacher_ids = sorted({int(item["teacher_id"]) for item in class_rows if item.get("teacher_id") is not None})

    teacher_map = await list_user_profiles(teacher_ids)
    student_counts = await list_class_student_counts(class_ids)
    teacher_counts = await list_class_teacher_counts(class_ids)
    subject_counts = await list_class_subject_counts(class_ids)

    return [
        _map_class_row(
            row=item,
            teacher_map=teacher_map,
            student_counts=student_counts,
            teacher_counts=teacher_counts,
            subject_counts=subject_counts,
        )
        for item in class_rows
    ]


async def create_class(payload: ClassCreateRequest) -> dict:
    existing_class = await find_class_by_code(payload.class_code)
    if existing_class:
        raise ValueError("Class code already exists")

    await _ensure_teacher_exists(payload.teacher_id)

    created = await create_class_record(
        {
            "class_code": payload.class_code,
            "class_name": payload.class_name,
            "description": payload.description,
            "teacher_id": payload.teacher_id,
            "status": "active",
        }
    )
    await _sync_owner_teacher_mapping(class_id=int(created["class_id"]), teacher_id=payload.teacher_id)

    mapped = await _build_class_view_payload([created])
    return mapped[0]


async def get_class_by_id(class_id: int) -> dict:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")
    mapped = await _build_class_view_payload([class_data])
    return mapped[0]


async def get_classes(params: ClassListQueryParams) -> dict:
    items, total = await list_classes(
        page=params.page,
        limit=params.limit,
        search=params.search,
        teacher_id=params.teacher_id,
        status=params.status,
        sort_by=params.sort_by,
        sort_order=params.sort_order,
    )
    mapped_items = await _build_class_view_payload(items)
    total_pages = ceil(total / params.limit) if total > 0 else 1
    return {
        "items": mapped_items,
        "pagination": {
            "page": params.page,
            "limit": params.limit,
            "total": total,
            "total_pages": total_pages,
        },
    }


async def update_class(class_id: int, payload: ClassUpdateRequest) -> dict:
    existing_class = await find_class_by_id(class_id)
    if not existing_class:
        raise ValueError("Class not found")

    update_payload: dict = {}

    if payload.class_code is not None:
        class_code_exists = await find_class_by_code(payload.class_code, exclude_class_id=class_id)
        if class_code_exists:
            raise ValueError("Class code already exists")
        update_payload["class_code"] = payload.class_code

    if payload.class_name is not None:
        update_payload["class_name"] = payload.class_name
    if payload.description is not None:
        update_payload["description"] = payload.description
    if payload.teacher_id is not None:
        await _ensure_teacher_exists(payload.teacher_id)
        update_payload["teacher_id"] = payload.teacher_id
    if payload.status is not None:
        update_payload["status"] = payload.status

    if not update_payload:
        raise ValueError("No fields to update")

    updated = await update_class_by_id(class_id, update_payload)
    if not updated:
        raise ValueError("Class not found")

    if payload.teacher_id is not None:
        await _sync_owner_teacher_mapping(class_id=class_id, teacher_id=payload.teacher_id)

    mapped = await _build_class_view_payload([updated])
    return mapped[0]


async def delete_class(class_id: int) -> dict:
    existing_class = await find_class_by_id(class_id)
    if not existing_class:
        raise ValueError("Class not found")

    if await has_any_class_links(class_id):
        updated = await update_class_by_id(class_id, {"status": "inactive"})
        if not updated:
            raise ValueError("Class not found")
        return {"class_id": class_id, "deleted": False, "status": "inactive"}

    deleted = await soft_delete_class_by_id(class_id)
    if not deleted:
        raise ValueError("Class not found")

    return {"class_id": class_id, "deleted": True}


async def get_class_subjects(class_id: int) -> list[dict]:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")

    rows = await list_class_subjects(class_id)
    subject_ids = sorted({int(item["subject_id"]) for item in rows if item.get("subject_id") is not None})
    teacher_ids = sorted(
        {int(item["assigned_teacher_id"]) for item in rows if item.get("assigned_teacher_id") is not None}
    )

    subject_map = await list_subject_profiles(subject_ids)
    teacher_map = await list_user_profiles(teacher_ids)

    results = []
    for item in rows:
        subject_id = int(item["subject_id"])
        assigned_teacher_id = int(item["assigned_teacher_id"]) if item.get("assigned_teacher_id") is not None else None
        subject = subject_map.get(subject_id) or {}
        teacher = teacher_map.get(assigned_teacher_id) if assigned_teacher_id is not None else {}
        results.append(
            {
                "class_subject_id": int(item["class_subject_id"]),
                "class_id": int(item["class_id"]),
                "subject_id": subject_id,
                "subject_code": subject.get("subject_code"),
                "subject_name": subject.get("subject_name"),
                "assigned_teacher_id": assigned_teacher_id,
                "assigned_teacher_name": (
                    (teacher or {}).get("full_name") or (teacher or {}).get("username") or "Unknown"
                )
                if assigned_teacher_id is not None
                else None,
                "status": item.get("status"),
                "created_at": item.get("created_at"),
                "updated_at": item.get("updated_at"),
            }
        )
    return results


async def assign_subject_to_class(class_id: int, payload: AssignSubjectToClassRequest) -> dict:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")

    subject = await find_subject_by_id(payload.subject_id)
    if not subject:
        raise ValueError("Subject not found")

    await _ensure_teacher_exists(payload.assigned_teacher_id)
    teacher_mapping = await find_class_teacher_mapping(
        class_id=class_id,
        teacher_id=payload.assigned_teacher_id,
        include_deleted=False,
    )
    if teacher_mapping is None:
        await _sync_owner_teacher_mapping(class_id=class_id, teacher_id=payload.assigned_teacher_id)

    existing = await find_class_subject_mapping(
        class_id=class_id,
        subject_id=payload.subject_id,
        include_deleted=True,
    )
    if existing is None:
        await create_class_subject_mapping(
            {
                "class_id": class_id,
                "subject_id": payload.subject_id,
                "assigned_teacher_id": payload.assigned_teacher_id,
                "status": "active",
            }
        )
    else:
        await update_class_subject_mapping(
            int(existing["class_subject_id"]),
            {
                "assigned_teacher_id": payload.assigned_teacher_id,
                "status": "active",
                "deleted_at": None,
            },
        )

    rows = await get_class_subjects(class_id)
    for row in rows:
        if int(row["subject_id"]) == payload.subject_id:
            return row
    raise ValueError("Unable to assign subject to class")


async def remove_subject_from_class(class_id: int, subject_id: int) -> dict:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")

    existing = await find_class_subject_mapping(class_id=class_id, subject_id=subject_id, include_deleted=False)
    if not existing:
        raise ValueError("Class subject assignment not found")

    deleted = await soft_delete_class_subject_mapping(class_id=class_id, subject_id=subject_id)
    if not deleted:
        raise ValueError("Class subject assignment not found")
    return {"class_id": class_id, "subject_id": subject_id, "deleted": True}


async def update_class_subject(class_id: int, class_subject_id: int, payload: UpdateClassSubjectRequest) -> dict:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")

    class_subject = await find_class_subject_by_record_id(class_id, class_subject_id, include_deleted=False)
    if not class_subject:
        raise ValueError("Class subject assignment not found")

    update_payload: dict = {}
    if payload.assigned_teacher_id is not None:
        await _ensure_teacher_exists(payload.assigned_teacher_id)
        teacher_mapping = await find_class_teacher_mapping(
            class_id=class_id,
            teacher_id=payload.assigned_teacher_id,
            include_deleted=False,
        )
        if teacher_mapping is None:
            await _sync_owner_teacher_mapping(class_id=class_id, teacher_id=payload.assigned_teacher_id)
        update_payload["assigned_teacher_id"] = payload.assigned_teacher_id
    if payload.status is not None:
        update_payload["status"] = payload.status

    if not update_payload:
        raise ValueError("No fields to update")

    updated = await update_class_subject_mapping(class_subject_id, update_payload)
    if not updated:
        raise ValueError("Class subject assignment not found")

    rows = await get_class_subjects(class_id)
    for row in rows:
        if int(row["class_subject_id"]) == class_subject_id:
            return row
    raise ValueError("Class subject assignment not found")


async def remove_subject_from_class_by_record_id(class_id: int, class_subject_id: int) -> dict:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")

    existing = await find_class_subject_by_record_id(class_id=class_id, class_subject_id=class_subject_id, include_deleted=False)
    if not existing:
        raise ValueError("Class subject assignment not found")

    deleted = await soft_delete_class_subject_mapping_by_record_id(class_id=class_id, class_subject_id=class_subject_id)
    if not deleted:
        raise ValueError("Class subject assignment not found")
    return {"class_id": class_id, "class_subject_id": class_subject_id, "deleted": True}


async def get_class_students(class_id: int) -> list[dict]:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")

    rows = await list_class_students(class_id)
    student_ids = sorted({int(item["student_id"]) for item in rows if item.get("student_id") is not None})
    student_map = await list_user_profiles(student_ids)

    results = []
    for item in rows:
        student_id = int(item["student_id"])
        student = student_map.get(student_id) or {}
        results.append(
            {
                "class_student_id": int(item["class_student_id"]),
                "class_id": int(item["class_id"]),
                "student_id": student_id,
                "username": student.get("username"),
                "full_name": student.get("full_name"),
                "joined_at": item.get("joined_at"),
            }
        )
    return results


async def assign_student_to_class(class_id: int, payload: AssignStudentToClassRequest) -> dict:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")

    await _ensure_student_exists(payload.student_id)

    active_class = await find_any_active_class_of_student(payload.student_id)
    if active_class and int(active_class["class_id"]) != class_id:
        raise ValueError("Student is already assigned to another class")

    existing = await find_class_student_mapping(
        class_id=class_id,
        student_id=payload.student_id,
        include_deleted=True,
    )
    if existing is None:
        await create_class_student_mapping({"class_id": class_id, "student_id": payload.student_id})
    elif existing.get("deleted_at") is not None:
        await update_class_student_mapping(int(existing["class_student_id"]), {"deleted_at": None})
    else:
        raise ValueError("Student already assigned to class")

    rows = await get_class_students(class_id)
    for row in rows:
        if int(row["student_id"]) == payload.student_id:
            return row
    raise ValueError("Unable to assign student to class")


async def remove_student_from_class(class_id: int, student_id: int) -> dict:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")

    existing = await find_class_student_mapping(class_id=class_id, student_id=student_id, include_deleted=False)
    if not existing:
        raise ValueError("Class student assignment not found")

    deleted = await soft_delete_class_student_mapping(class_id=class_id, student_id=student_id)
    if not deleted:
        raise ValueError("Class student assignment not found")
    return {"class_id": class_id, "student_id": student_id, "deleted": True}


async def get_class_teachers(class_id: int) -> list[dict]:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")

    rows = await list_class_teachers(class_id)
    teacher_ids = sorted({int(item["teacher_id"]) for item in rows if item.get("teacher_id") is not None})
    teacher_map = await list_user_profiles(teacher_ids)

    results = []
    for item in rows:
        teacher_id = int(item["teacher_id"])
        teacher = teacher_map.get(teacher_id) or {}
        results.append(
            {
                "class_teacher_id": int(item["class_teacher_id"]),
                "class_id": int(item["class_id"]),
                "teacher_id": teacher_id,
                "username": teacher.get("username"),
                "full_name": teacher.get("full_name"),
                "is_active": teacher.get("is_active", True),
                "joined_at": item.get("joined_at"),
            }
        )
    return results


async def assign_teacher_to_class(class_id: int, payload: AssignTeacherToClassRequest) -> dict:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")
    await _ensure_teacher_exists(payload.teacher_id)

    existing = await find_class_teacher_mapping(class_id=class_id, teacher_id=payload.teacher_id, include_deleted=True)
    if existing is None:
        await create_class_teacher_mapping({"class_id": class_id, "teacher_id": payload.teacher_id})
    elif existing.get("deleted_at") is not None:
        await update_class_teacher_mapping(int(existing["class_teacher_id"]), {"deleted_at": None})
    else:
        raise ValueError("Teacher already assigned to class")

    rows = await get_class_teachers(class_id)
    for row in rows:
        if int(row["teacher_id"]) == payload.teacher_id:
            return row
    raise ValueError("Unable to assign teacher to class")


async def remove_teacher_from_class(class_id: int, teacher_id: int) -> dict:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")
    if int(class_data["teacher_id"]) == teacher_id:
        raise ValueError("Cannot remove homeroom teacher from class teachers")

    existing = await find_class_teacher_mapping(class_id=class_id, teacher_id=teacher_id, include_deleted=False)
    if not existing:
        raise ValueError("Class teacher assignment not found")

    deleted = await soft_delete_class_teacher_mapping(class_id=class_id, teacher_id=teacher_id)
    if not deleted:
        raise ValueError("Class teacher assignment not found")
    return {"class_id": class_id, "teacher_id": teacher_id, "deleted": True}


async def get_class_statistics(class_id: int) -> dict:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")

    student_counts = await list_class_student_counts([class_id])
    teacher_counts = await list_class_teacher_counts([class_id])
    subject_counts = await list_class_subject_counts([class_id])
    return {
        "total_students": student_counts.get(class_id, 0),
        "total_teachers": max(teacher_counts.get(class_id, 0), 1),
        "total_subjects": subject_counts.get(class_id, 0),
    }

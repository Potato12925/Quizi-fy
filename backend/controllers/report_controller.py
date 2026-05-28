import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.report_schema import ReportQueryParams, TopicCoverageQueryParams
from services.report_service import (
    ReportAuthorizationError,
    ReportValidationError,
    export_report_data,
    get_ai_summary_report,
    get_dashboard_report,
    get_data_quality_report,
    get_document_summary_report,
    get_question_summary_report,
    get_teacher_activity_report,
    get_topic_coverage_report,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


def _build_common_params(
    page: int,
    limit: int,
    search: str | None,
    sort_by: str,
    sort_order: str,
    teacher_id: int | None,
    subject_id: int | None,
    topic_id: int | None,
    status: str | None,
    difficulty: str | None,
    source: str | None,
    date_from: str | None,
    date_to: str | None,
) -> ReportQueryParams:
    try:
        return ReportQueryParams(
            page=page,
            limit=limit,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,  # type: ignore[arg-type]
            teacher_id=teacher_id,
            subject_id=subject_id,
            topic_id=topic_id,
            status=status,
            difficulty=difficulty,
            source=source,
            date_from=date_from,
            date_to=date_to,
        )
    except Exception as exc:
        raise ReportValidationError(str(exc)) from exc


@router.get("/dashboard", summary="Get dashboard report data")
async def get_dashboard_report_route(
    teacher_id: int | None = Query(default=None, ge=1),
    subject_id: int | None = Query(default=None, ge=1),
    topic_id: int | None = Query(default=None, ge=1),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        params = _build_common_params(
            page=1,
            limit=10,
            search=None,
            sort_by="created_at",
            sort_order="desc",
            teacher_id=teacher_id,
            subject_id=subject_id,
            topic_id=topic_id,
            status=None,
            difficulty=None,
            source=None,
            date_from=date_from,
            date_to=date_to,
        )
        result = await get_dashboard_report(current_user=current_user, params=params)
        return success_response(data=result, message="Dashboard report loaded successfully", status_code=200)
    except ReportAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="REPORT_FORBIDDEN")
    except ReportValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="REPORT_INVALID")
    except Exception:
        return error_response(message="Unable to load dashboard report", status_code=500, error_code="REPORT_DASHBOARD_FAILED")


@router.get("/question-summary", summary="Get question summary report")
async def get_question_summary_report_route(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=200),
    search: str | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    teacher_id: int | None = Query(default=None, ge=1),
    subject_id: int | None = Query(default=None, ge=1),
    topic_id: int | None = Query(default=None, ge=1),
    status: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    source: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        params = _build_common_params(
            page=page,
            limit=limit,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            teacher_id=teacher_id,
            subject_id=subject_id,
            topic_id=topic_id,
            status=status,
            difficulty=difficulty,
            source=source,
            date_from=date_from,
            date_to=date_to,
        )
        result = await get_question_summary_report(current_user=current_user, params=params)
        return success_response(
            data={
                "summary": result["summary"],
                "table": result["table"]["items"],
                "filter_options": result["filter_options"],
            },
            meta=result["table"]["meta"],
            message="Question summary report loaded successfully",
            status_code=200,
        )
    except ReportAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="REPORT_FORBIDDEN")
    except ReportValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="REPORT_INVALID")
    except Exception:
        return error_response(message="Unable to load question summary report", status_code=500, error_code="REPORT_QUESTION_SUMMARY_FAILED")


@router.get("/ai-summary", summary="Get AI summary report")
async def get_ai_summary_report_route(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=200),
    search: str | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    teacher_id: int | None = Query(default=None, ge=1),
    subject_id: int | None = Query(default=None, ge=1),
    topic_id: int | None = Query(default=None, ge=1),
    status: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        params = _build_common_params(
            page=page,
            limit=limit,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            teacher_id=teacher_id,
            subject_id=subject_id,
            topic_id=topic_id,
            status=status,
            difficulty=difficulty,
            source=None,
            date_from=date_from,
            date_to=date_to,
        )
        result = await get_ai_summary_report(current_user=current_user, params=params)
        return success_response(
            data={
                "summary": result["summary"],
                "table": result["table"]["items"],
                "filter_options": result["filter_options"],
            },
            meta=result["table"]["meta"],
            message="AI summary report loaded successfully",
            status_code=200,
        )
    except ReportAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="REPORT_FORBIDDEN")
    except ReportValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="REPORT_INVALID")
    except Exception:
        return error_response(message="Unable to load AI summary report", status_code=500, error_code="REPORT_AI_SUMMARY_FAILED")


@router.get("/document-summary", summary="Get document summary report")
async def get_document_summary_report_route(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=200),
    search: str | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    teacher_id: int | None = Query(default=None, ge=1),
    subject_id: int | None = Query(default=None, ge=1),
    topic_id: int | None = Query(default=None, ge=1),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        params = _build_common_params(
            page=page,
            limit=limit,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            teacher_id=teacher_id,
            subject_id=subject_id,
            topic_id=topic_id,
            status=None,
            difficulty=None,
            source=None,
            date_from=date_from,
            date_to=date_to,
        )
        result = await get_document_summary_report(current_user=current_user, params=params)
        return success_response(
            data={
                "summary": result["summary"],
                "table": result["table"]["items"],
                "missing_topic_mapping": result["missing_topic_mapping"],
                "topics_without_documents": result["topics_without_documents"],
                "filter_options": result["filter_options"],
            },
            meta=result["table"]["meta"],
            message="Document summary report loaded successfully",
            status_code=200,
        )
    except ReportAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="REPORT_FORBIDDEN")
    except ReportValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="REPORT_INVALID")
    except Exception:
        return error_response(message="Unable to load document summary report", status_code=500, error_code="REPORT_DOCUMENT_SUMMARY_FAILED")


@router.get("/teacher-activity", summary="Get teacher activity report")
async def get_teacher_activity_report_route(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=200),
    search: str | None = Query(default=None),
    sort_by: str = Query(default="teacher_name"),
    sort_order: str = Query(default="asc"),
    teacher_id: int | None = Query(default=None, ge=1),
    subject_id: int | None = Query(default=None, ge=1),
    topic_id: int | None = Query(default=None, ge=1),
    status: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    source: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        params = _build_common_params(
            page=page,
            limit=limit,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            teacher_id=teacher_id,
            subject_id=subject_id,
            topic_id=topic_id,
            status=status,
            difficulty=difficulty,
            source=source,
            date_from=date_from,
            date_to=date_to,
        )
        result = await get_teacher_activity_report(current_user=current_user, params=params)
        return success_response(
            data={
                "summary": result["summary"],
                "table": result["table"]["items"],
                "recent_activity": result["recent_activity"],
                "filter_options": result["filter_options"],
            },
            meta=result["table"]["meta"],
            message="Teacher activity report loaded successfully",
            status_code=200,
        )
    except ReportAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="REPORT_FORBIDDEN")
    except ReportValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="REPORT_INVALID")
    except Exception:
        return error_response(message="Unable to load teacher activity report", status_code=500, error_code="REPORT_TEACHER_ACTIVITY_FAILED")


@router.get("/topic-coverage", summary="Get topic coverage report")
async def get_topic_coverage_report_route(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=200),
    search: str | None = Query(default=None),
    sort_by: str = Query(default="topic_name"),
    sort_order: str = Query(default="asc"),
    teacher_id: int | None = Query(default=None, ge=1),
    subject_id: int | None = Query(default=None, ge=1),
    topic_id: int | None = Query(default=None, ge=1),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    min_questions: int = Query(default=5, ge=1, le=1000),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        try:
            params = TopicCoverageQueryParams(
                page=page,
                limit=limit,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order,  # type: ignore[arg-type]
                teacher_id=teacher_id,
                subject_id=subject_id,
                topic_id=topic_id,
                date_from=date_from,
                date_to=date_to,
                min_questions=min_questions,
            )
        except Exception as exc:
            raise ReportValidationError(str(exc)) from exc
        result = await get_topic_coverage_report(current_user=current_user, params=params)
        return success_response(
            data={
                "summary": result["summary"],
                "table": result["table"]["items"],
                "details": result["details"],
                "filter_options": result["filter_options"],
            },
            meta=result["table"]["meta"],
            message="Topic coverage report loaded successfully",
            status_code=200,
        )
    except ReportAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="REPORT_FORBIDDEN")
    except ReportValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="REPORT_INVALID")
    except Exception:
        return error_response(message="Unable to load topic coverage report", status_code=500, error_code="REPORT_TOPIC_COVERAGE_FAILED")


@router.get("/data-quality", summary="Get data quality report")
async def get_data_quality_report_route(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=200),
    search: str | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    teacher_id: int | None = Query(default=None, ge=1),
    subject_id: int | None = Query(default=None, ge=1),
    topic_id: int | None = Query(default=None, ge=1),
    status: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    source: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        params = _build_common_params(
            page=page,
            limit=limit,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            teacher_id=teacher_id,
            subject_id=subject_id,
            topic_id=topic_id,
            status=status,
            difficulty=difficulty,
            source=source,
            date_from=date_from,
            date_to=date_to,
        )
        result = await get_data_quality_report(current_user=current_user, params=params)
        return success_response(
            data={
                "summary": result["summary"],
                "table": result["table"]["items"],
                "filter_options": result["filter_options"],
            },
            meta=result["table"]["meta"],
            message="Data quality report loaded successfully",
            status_code=200,
        )
    except ReportAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="REPORT_FORBIDDEN")
    except ReportValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="REPORT_INVALID")
    except Exception:
        return error_response(message="Unable to load data quality report", status_code=500, error_code="REPORT_DATA_QUALITY_FAILED")


@router.get("/{report_key}/export", summary="Export report data")
async def export_report_route(
    report_key: str,
    format: str = Query(...),
    search: str | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    teacher_id: int | None = Query(default=None, ge=1),
    subject_id: int | None = Query(default=None, ge=1),
    topic_id: int | None = Query(default=None, ge=1),
    status: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    source: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        params = _build_common_params(
            page=1,
            limit=200,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            teacher_id=teacher_id,
            subject_id=subject_id,
            topic_id=topic_id,
            status=status,
            difficulty=difficulty,
            source=source,
            date_from=date_from,
            date_to=date_to,
        )
        file_bytes, media_type, filename = await export_report_data(
            report_key=report_key,
            export_format=format,
            current_user=current_user,
            params=params,
        )
        headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
        return StreamingResponse(io.BytesIO(file_bytes), media_type=media_type, headers=headers)
    except ReportAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="REPORT_FORBIDDEN")
    except ReportValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="REPORT_INVALID")
    except RuntimeError as exc:
        return error_response(message=str(exc), status_code=500, error_code="REPORT_EXPORT_DEPENDENCY_MISSING")
    except Exception:
        return error_response(message="Unable to export report", status_code=500, error_code="REPORT_EXPORT_FAILED")

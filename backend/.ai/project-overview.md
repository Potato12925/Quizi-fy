# PROJECT OVERVIEW

## Stack

- Python 3.12
- FastAPI
- Supabase (include build ORM of tables)
- PostgreSQL
- Pydantic v2
- Redis
- Celery

## Architecture

- Controller
- Service
- Repository
- Schema
- Model

## Goal

AI-powered MCQ generation system for teachers/students.

## Main Features

- Google Login
- Multi-role authorization
- Upload document
- AI generate questions
- Practice sets
- Question bank
- Analytics

## Roles

- admin
- teacher
- student

## Folder Structure

/controllers = API layer
/services = business logic
/repositories = database access
/models = ORM
/schemas = request/response
/workers = async AI jobs

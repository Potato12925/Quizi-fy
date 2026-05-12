from core.supabase import supabase
from models.table_names import USERS


class UserRepository:

    @staticmethod
    def get_by_email(email: str):

        response = (
            supabase
            .table(USERS)
            .select("*")
            .eq("email", email)
            .single()
            .execute()
        )

        return response.data

    @staticmethod
    def create(data: dict):

        response = (
            supabase
            .table(USERS)
            .insert(data)
            .execute()
        )

        return response.data
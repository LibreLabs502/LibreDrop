from rest_framework import status
from rest_framework.authentication import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .serializers import RegisterSerializers, LoginSerializer, UserSerializer
from .agreement import CURRENT_AGREEMENT_VERSION

User = get_user_model()

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializers(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """Datos del usuario autenticado (incluye is_superuser)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class AcceptAgreementView(APIView):
    """Records the authenticated user's acceptance of the current agreement."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.data.get("version") != CURRENT_AGREEMENT_VERSION:
            return Response(
                {"version": "La versión del acuerdo cambió. Actualizá la página y revisala de nuevo."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = request.user
        user.agreement_version = CURRENT_AGREEMENT_VERSION
        user.agreement_accepted_at = timezone.now()
        user.save(update_fields=["agreement_version", "agreement_accepted_at"])
        return Response(UserSerializer(user).data)

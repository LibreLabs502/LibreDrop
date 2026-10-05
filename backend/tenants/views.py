from rest_framework import viewsets
from .serializers import TenantSerializer
from .models import Tenant
from rest_framework.permissions import IsAuthenticated

class TenantViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self): # type: ignore
        return Tenant.objects.all()

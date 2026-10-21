"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import os

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

def health(request):
    return JsonResponse({"status": "ok"})

def version(request):
    """Commit desplegado, para verificar qué versión está corriendo.

    Render expone `RENDER_GIT_COMMIT`/`RENDER_GIT_BRANCH` en el entorno; en local
    se puede setear `GIT_COMMIT` a mano. No expone secretos.
    """
    commit = os.getenv("RENDER_GIT_COMMIT") or os.getenv("GIT_COMMIT") or ""
    branch = os.getenv("RENDER_GIT_BRANCH", "")
    return JsonResponse({
        "commit": commit or None,
        "short": commit[:7] or None,
        "branch": branch or None,
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('tenants/', include("tenants.urls")),
    path('auth/', include("accounts.urls")),
    path('catalog/', include("catalog.urls")),
    path('', include("payments.urls")),
    path('health/', health, name="health"),
    path('version/', version, name="version"),
    path("public/", include("storefront.urls")),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui",
    ),
]

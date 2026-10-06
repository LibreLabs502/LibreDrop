from django.urls import path

from .views import PublicStoreView


urlpatterns = [
    path(
        "<slug:slug>/",
        PublicStoreView.as_view(),
        name="public-store",
    ),
]

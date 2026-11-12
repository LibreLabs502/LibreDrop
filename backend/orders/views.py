from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from catalog.models import Product
from customers.models import Customer
from tenants.channels import effective_channels
from tenants.models import Tenant
from tenants.permissions import TenantSubscriptionAccess
from tenants.services import GRACE_PERIOD_DAYS
from .models import Order, OrderItem
from .serializers import (
    OrderReadSerializer,
    OrderStatusSerializer,
    PublicOrderCreateSerializer,
)


class PublicOrderCreateView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicOrderCreateSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_orders"

    def post(self, request, slug):
        cutoff = timezone.now() - timedelta(days=GRACE_PERIOD_DAYS)
        tenant = get_object_or_404(
            Tenant.objects.filter(
                Q(subscription__isnull=True)
                | Q(subscription__current_period_end__gt=cutoff)
            ),
            slug=slug,
        )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if data["channel"] not in effective_channels(tenant):
            return Response(
                {"channel": "Este medio de compra no está disponible para esta tienda."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        requested = data["items"]
        products = {
            product.id: product
            for product in Product.objects.filter(
                tenant=tenant, is_active=True, id__in=[item["product_id"] for item in requested]
            )
        }
        if len(products) != len(requested):
            return Response(
                {"items": "Uno o más productos ya no están disponibles."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer_data = data["customer"]
        now = timezone.now()
        with transaction.atomic():
            customer = Customer.objects.filter(
                tenant=tenant, phone_number=customer_data["phone_number"]
            ).order_by("id").first()
            if customer is None:
                customer = Customer.objects.create(tenant=tenant, **customer_data)
            else:
                for field in ("full_name", "address", "email"):
                    setattr(customer, field, customer_data[field])
                customer.save(update_fields=["full_name", "address", "email"])

            order = Order.objects.create(
                tenant=tenant,
                customer=customer,
                channel=data["channel"],
                notes=data.get("notes", "").strip(),
            )
            order_items = []
            for requested_item in requested:
                product = products[requested_item["product_id"]]
                discount = product.discount_percent
                offer_active = bool(
                    discount is not None
                    and 1 <= discount <= 99
                    and (product.offer_ends_at is None or product.offer_ends_at > now)
                )
                original_price = product.price if offer_active else None
                unit_price = product.price
                applied_discount = discount if offer_active else None
                if offer_active and product.price is not None:
                    unit_price = (product.price * (Decimal("100") - Decimal(discount)) / Decimal("100")).quantize(
                        Decimal("0.01"), rounding=ROUND_HALF_UP
                    )
                order_items.append(OrderItem(
                    order=order,
                    product=product,
                    product_name=product.name,
                    quantity=requested_item["quantity"],
                    unit_price=unit_price,
                    original_unit_price=original_price,
                    discount_percent=applied_discount,
                ))
            OrderItem.objects.bulk_create(order_items)

        return Response(OrderReadSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderReadSerializer
    permission_classes = [IsAuthenticated, TenantSubscriptionAccess]

    def get_queryset(self):
        queryset = Order.objects.select_related("customer", "tenant").prefetch_related("items").filter(
            tenant_id=self.kwargs["tenant_id"]
        )
        if self.request.user.is_superuser:
            return queryset
        return queryset.filter(tenant__memberships__user=self.request.user).distinct()

    def get_serializer_class(self):
        if self.action == "update_status":
            return OrderStatusSerializer
        return super().get_serializer_class()

    @action(detail=True, methods=["patch"], url_path="status")
    @transaction.atomic
    def update_status(self, request, tenant_id=None, pk=None):
        order = self.get_object()
        serializer = self.get_serializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderReadSerializer(order).data)

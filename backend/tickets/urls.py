from django.urls import path

from .views import (
    TicketClassifyView,
    TicketListCreateView,
    TicketPartialUpdateView,
    TicketStatsView,
)

urlpatterns = [
    path('', TicketListCreateView.as_view(), name='tickets-list-create'),
    path('stats/', TicketStatsView.as_view(), name='tickets-stats'),
    path('classify/', TicketClassifyView.as_view(), name='tickets-classify'),
    path('<int:pk>/', TicketPartialUpdateView.as_view(), name='tickets-update'),
]
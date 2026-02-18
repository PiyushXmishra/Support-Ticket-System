from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .llm import LLMClassifier
from .models import Ticket
from .serializers import (
    ClassificationRequestSerializer,
    ClassificationResponseSerializer,
    TicketSerializer,
)


class TicketListCreateView(generics.ListCreateAPIView):
    serializer_class = TicketSerializer

    def get_queryset(self):
        queryset = Ticket.objects.all().order_by('-created_at')

        category = self.request.query_params.get('category')
        priority = self.request.query_params.get('priority')
        status_value = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if category:
            queryset = queryset.filter(category=category)
        if priority:
            queryset = queryset.filter(priority=priority)
        if status_value:
            queryset = queryset.filter(status=status_value)
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))

        return queryset


class TicketPartialUpdateView(generics.UpdateAPIView):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    http_method_names = ['patch']


class TicketStatsView(APIView):
    def get(self, request):
        base = Ticket.objects.all()
        daily_counts = base.annotate(day=TruncDate('created_at')).values('day').annotate(count=Count('id'))
        avg_tickets_per_day = daily_counts.aggregate(avg=Avg('count'))['avg'] or 0

        stats = base.aggregate(
            total_tickets=Count('id'),
            open_tickets=Count('id', filter=Q(status='open')),
            low_count=Count('id', filter=Q(priority='low')),
            medium_count=Count('id', filter=Q(priority='medium')),
            high_count=Count('id', filter=Q(priority='high')),
            critical_count=Count('id', filter=Q(priority='critical')),
            billing_count=Count('id', filter=Q(category='billing')),
            technical_count=Count('id', filter=Q(category='technical')),
            account_count=Count('id', filter=Q(category='account')),
            general_count=Count('id', filter=Q(category='general')),
        )

        payload = {
            'total_tickets': stats['total_tickets'],
            'open_tickets': stats['open_tickets'],
            'avg_tickets_per_day': round(float(avg_tickets_per_day), 2),
            'priority_breakdown': {
                'low': stats['low_count'],
                'medium': stats['medium_count'],
                'high': stats['high_count'],
                'critical': stats['critical_count'],
            },
            'category_breakdown': {
                'billing': stats['billing_count'],
                'technical': stats['technical_count'],
                'account': stats['account_count'],
                'general': stats['general_count'],
            },
        }
        return Response(payload)


class TicketClassifyView(APIView):
    classifier = LLMClassifier()

    def post(self, request):
        serializer = ClassificationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        description = serializer.validated_data['description']

        result = self.classifier.classify(description)
        response = {
            'suggested_category': result.category,
            'suggested_priority': result.priority,
            'used_fallback': result.used_fallback,
        }
        validated = ClassificationResponseSerializer(data=response)
        validated.is_valid(raise_exception=True)
        return Response(validated.validated_data, status=status.HTTP_200_OK)
from rest_framework import serializers

from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            'id',
            'title',
            'description',
            'category',
            'priority',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ClassificationRequestSerializer(serializers.Serializer):
    description = serializers.CharField(required=True, allow_blank=False)


class ClassificationResponseSerializer(serializers.Serializer):
    suggested_category = serializers.CharField()
    suggested_priority = serializers.CharField()
    used_fallback = serializers.BooleanField()
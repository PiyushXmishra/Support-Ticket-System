from django.db import models
from django.db.models import Q

from .constants import CATEGORY_CHOICES, PRIORITY_CHOICES, STATUS_CHOICES


class Ticket(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=~Q(title=''),
                name='ticket_title_not_empty',
            ),
            models.CheckConstraint(
                condition=~Q(description=''),
                name='ticket_description_not_empty',
            ),
            models.CheckConstraint(
                condition=Q(category__in=[choice[0] for choice in CATEGORY_CHOICES]),
                name='ticket_category_valid',
            ),
            models.CheckConstraint(
                condition=Q(priority__in=[choice[0] for choice in PRIORITY_CHOICES]),
                name='ticket_priority_valid',
            ),
            models.CheckConstraint(
                condition=Q(status__in=[choice[0] for choice in STATUS_CHOICES]),
                name='ticket_status_valid',
            ),
        ]

    def __str__(self):
        return f'{self.title} ({self.status})'

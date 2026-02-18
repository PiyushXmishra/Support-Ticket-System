CATEGORY_CHOICES = [
    ('billing', 'Billing'),
    ('technical', 'Technical'),
    ('account', 'Account'),
    ('general', 'General'),
]

PRIORITY_CHOICES = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('critical', 'Critical'),
]

STATUS_CHOICES = [
    ('open', 'Open'),
    ('in_progress', 'In Progress'),
    ('resolved', 'Resolved'),
    ('closed', 'Closed'),
]

VALID_CATEGORIES = {choice[0] for choice in CATEGORY_CHOICES}
VALID_PRIORITIES = {choice[0] for choice in PRIORITY_CHOICES}
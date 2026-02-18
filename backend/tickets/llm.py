import json
import os
from dataclasses import dataclass
from typing import Any

import requests

from .constants import VALID_CATEGORIES, VALID_PRIORITIES

PROMPT_TEMPLATE = """
You are a support ticket classifier.
Given a user ticket description, classify it into one category and one priority.

Allowed categories: billing, technical, account, general
Allowed priorities: low, medium, high, critical

Return only valid JSON with this exact schema:
{{
  "category": "one_of_allowed_categories",
  "priority": "one_of_allowed_priorities"
}}

Description:
{description}
""".strip()


@dataclass
class ClassificationResult:
    category: str
    priority: str
    used_fallback: bool


class LLMClassifier:
    def __init__(self) -> None:
        self.api_key = os.getenv('GEMINI_API_KEY', '')
        self.model = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')

    def classify(self, description: str) -> ClassificationResult:
        if not self.api_key:
            return self._fallback()

        try:
            prompt = PROMPT_TEMPLATE.format(description=description)
            payload = {
                'contents': [
                    {
                        'parts': [{'text': prompt}],
                    }
                ],
                'generationConfig': {
                    'temperature': 0,
                },
            }
            headers = {'Content-Type': 'application/json'}
            response = requests.post(
                f'https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent',
                headers=headers,
                json=payload,
                params={'key': self.api_key},
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            content = self._extract_text(data)
            parsed = self._parse_json(content)
            category = parsed.get('category', '').strip().lower()
            priority = parsed.get('priority', '').strip().lower()
            if category not in VALID_CATEGORIES or priority not in VALID_PRIORITIES:
                return self._fallback()
            return ClassificationResult(category=category, priority=priority, used_fallback=False)
        except Exception:
            return self._fallback()

    def _extract_text(self, response_data: dict[str, Any]) -> str:
        candidates = response_data.get('candidates', [])
        if not candidates:
            raise ValueError('No model output found')
        parts = candidates[0].get('content', {}).get('parts', [])
        texts = [part.get('text', '') for part in parts if part.get('text')]
        if not texts:
            raise ValueError('No text parts found')
        return '\n'.join(texts)

    def _parse_json(self, raw_text: str) -> dict[str, Any]:
        cleaned = raw_text.strip()
        if cleaned.startswith('```'):
            cleaned = cleaned.replace('```json', '').replace('```', '').strip()
        return json.loads(cleaned)

    def _fallback(self) -> ClassificationResult:
        return ClassificationResult(category='general', priority='medium', used_fallback=True)

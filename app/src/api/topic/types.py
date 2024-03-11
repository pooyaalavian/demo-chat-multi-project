from dataclasses import dataclass
from typing import Optional, Literal


@dataclass
class Topic:
    topic_id: str
    type: Literal["topic"]
    name: str
    description: str
    created_at: str
    updated_at: str
    owner_user_id: str
    files: list[str]


@dataclass
class Conversation:
    conversation_id: str
    topic_id: str
    type: Literal["conversation"]
    owner_user_id: str
    created_at: str
    updated_at: str


@dataclass
class Message:
    message_id: str
    conversation_id: str
    topic_id: str
    type: Literal["message"]
    created_at: str
    role: str
    content: str
    metadata: Optional[dict] = None

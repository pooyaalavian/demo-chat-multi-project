from typing import Literal
from abc import ABC, abstractmethod
import re
from datetime import datetime


class Message(ABC):
    @abstractmethod
    def __init__(self, **kwargs):
        pass

    @abstractmethod
    def to_llm(self):
        """Converts the message to a dict for input to the LLM."""
        pass

    def to_dict(self):
        """Converts the message to adictionary to store in database.

        Contains enough information to recreate the message, but not the calculated properties.
        """
        pass

def get_now():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

class UserMessage(Message):
    def __init__(self, *, agent: str, name: str, content: str, userId: str, **kwargs):
        self.name = name
        self.agent = agent
        self.userId = userId
        if self.agent != "human":
            raise ValueError("Agent must be 'human'")
        self.role = "user"
        self.content = content
        self.timestamp = kwargs.get('timestamp', get_now())

    def clean_name(self, name):
        name = re.sub(r"[^a-zA-Z0-9\s_-]", "", name)
        name = re.sub(r"\s", "-", name)
        return name

    def to_llm(self):
        return {
            "role": "user",
            "name": self.clean_name(self.name),
            "content": self.content,
        }

    def to_dict(self):
        return {
            "role": self.role,
            "agent": self.agent,
            "name": self.name,
            "content": self.content,
            "userId": self.userId,
            "timestamp": self.timestamp,
        }


class SystemMessage:
    def __init__(self, *, content: str, **kwargs):
        self.role = "system"
        self.content = content
        self.timestamp = kwargs.get('timestamp', get_now())

    def to_llm(self):
        return {"role": "system", "content": self.content}

    def to_dict(self):
        return {"role": self.role, "content": self.content, "timestamp": self.timestamp}


class SourceMessage:
    def __init__(
        self,
        *,
        agent: str,
        input: str,
        search_type: Literal["vector", "semantic", "hybrid"],
        results: list,
        **kwargs,
    ):
        self.role = "user"
        self.agent = agent
        if self.agent != "search-assistant":
            raise ValueError("Agent must be 'search-assistant'")
        self.name = "search-assistant"
        self.search_type = search_type
        self.input = input
        self.results = results
        self.content = self.set_content()
        self.timestamp = kwargs.get('timestamp', get_now())

    def set_content(self):
        content = f"The results of performing a {self.search_type} search for '{self.input}' are:\n"
        for result in self.results:
            content += f"""<source id="{result['id']}" type="{result['type']}">{result['content']}</source>\n"""
        return content

    def to_llm(self):
        return {"role": "user", "name": self.name, "content": self.content}

    def to_dict(self):
        return {
            "role": self.role,
            "agent": self.agent,
            "search_type": self.search_type,
            "input": self.input,
            "results": self.results,
            "timestamp": self.timestamp,
        }


class AssistantMessage:
    def __init__(self, *, content: str, metadata, **kwargs):
        self.role = "assistant"
        self.content = content
        self.metadata = metadata
        self.timestamp = kwargs.get('timestamp', get_now())

    def to_llm(self):
        return {"role": self.role, "content": self.content}

    def to_dict(self):
        return {"role": self.role, "content": self.content, "metadata": self.metadata, "timestamp": self.timestamp}


def message_maker(data: dict):
    if data["role"] == "user":
        if data["agent"] == "human":
            return UserMessage(**data)
        elif data["agent"] == "search-assistant":
            return SourceMessage(**data)
        else:
            raise ValueError("Agent must be 'human' or 'search-assistant'")
    elif data["role"] == "system":
        return SystemMessage(**data)
    elif data["role"] == "assistant":
        return AssistantMessage(**data)
    else:
        raise ValueError("Role must be 'user', 'system', or 'assistant'")

import os
from portkey_ai import Portkey

portkey = Portkey(
    base_url = "https://portkey.bain.dev/v1",
    api_key = "HHQcufZrlv1LkKxu+jS6Rw/G5Nqb"
)

response = portkey.chat.completions.create(
    model = "@personal-openai/gpt-5.4",
    messages = [
        {"role":"system","content":"You are a helpful assistant"},
        {"role":"user","content":"What is Portkey"}
    ],
    max_completion_tokens = 512
)

print(response.choices[0].message.content)
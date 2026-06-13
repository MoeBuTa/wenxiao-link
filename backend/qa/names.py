"""Friendly anonymous-guest name generator.

Guests no longer type a name on the Q&A board — the server mints a
readable handle like "Curious Otter" and stores it on the comment so the
thread still reads like a conversation between distinct people.
"""

import secrets

ADJECTIVES = [
    "Curious", "Quiet", "Bright", "Clever", "Gentle", "Brave", "Witty",
    "Calm", "Eager", "Honest", "Humble", "Keen", "Lively", "Mellow",
    "Nimble", "Patient", "Swift", "Thoughtful", "Wandering", "Cheerful",
    "Daring", "Earnest", "Frosty", "Golden", "Hidden", "Jolly", "Lucky",
    "Mighty", "Noble", "Polished", "Quaint", "Rustic", "Serene", "Sunny",
]

ANIMALS = [
    "Otter", "Falcon", "Heron", "Lynx", "Panda", "Koala", "Raven",
    "Badger", "Beaver", "Dolphin", "Fox", "Gecko", "Hawk", "Ibis",
    "Jaguar", "Kestrel", "Lemur", "Magpie", "Newt", "Owl", "Penguin",
    "Quokka", "Robin", "Seal", "Tapir", "Urchin", "Vole", "Walrus",
    "Yak", "Wombat", "Marten", "Puffin", "Stoat", "Wren",
]


def generate_guest_name() -> str:
    return f"{secrets.choice(ADJECTIVES)} {secrets.choice(ANIMALS)}"

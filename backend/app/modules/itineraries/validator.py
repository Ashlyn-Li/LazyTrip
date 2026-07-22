from datetime import date, timedelta

from app.modules.itineraries.schemas import FixedEvent, GeneratedItinerary, ItineraryActivity


class ItineraryValidationError(ValueError):
    """Raised when generated itinerary output is unsafe to return."""


def _minutes(value: str) -> int:
    hour, minute = value.split(":")
    return (int(hour) * 60) + int(minute)


def validate_generated_itinerary(
    itinerary: GeneratedItinerary,
    *,
    start_date: date,
    return_date: date,
    fixed_events: list[FixedEvent] | None = None,
) -> None:
    trip_days = (return_date - start_date).days

    if len(itinerary.days) != trip_days:
        raise ItineraryValidationError("Itinerary day count does not match the trip dates.")

    expected_day_numbers = list(range(1, trip_days + 1))
    actual_day_numbers = [day.day_number for day in itinerary.days]

    if actual_day_numbers != expected_day_numbers:
        raise ItineraryValidationError("Itinerary day numbers must be ordered and unique.")

    seen_item_ids: set[str] = set()
    expected_fixed_events = {event.id: event for event in (fixed_events or [])}
    found_fixed_event_ids: set[str] = set()

    for day_index, day in enumerate(itinerary.days):
        day_date = date.fromisoformat(day.date)
        if day_date != start_date + timedelta(days=day_index):
            raise ItineraryValidationError(
                "Itinerary dates must be consecutive and match their day numbers."
            )

        activity_windows: list[tuple[int, int]] = []
        previous_activity_start = -1

        for item in day.items:
            if item.id in seen_item_ids:
                raise ItineraryValidationError("Itinerary item IDs must be unique.")

            seen_item_ids.add(item.id)

            if item.type == "travel":
                continue

            activity = item
            _validate_activity(activity)
            start_minutes = _minutes(activity.start_time)
            end_minutes = _minutes(activity.end_time)

            if start_minutes < previous_activity_start:
                raise ItineraryValidationError(
                    "Itinerary activities must be in chronological order."
                )
            previous_activity_start = start_minutes

            for existing_start, existing_end in activity_windows:
                if start_minutes < existing_end and end_minutes > existing_start:
                    raise ItineraryValidationError("Itinerary activities cannot overlap.")

            activity_windows.append((start_minutes, end_minutes))

            expected_event = expected_fixed_events.get(activity.id)
            if activity.is_fixed:
                if expected_event is None:
                    raise ItineraryValidationError(
                        "Generated fixed activities must be supplied as structured fixed events."
                    )
                if (
                    activity.title != expected_event.title
                    or day_date != expected_event.date
                    or activity.start_time != expected_event.start_time
                    or activity.end_time != expected_event.end_time
                    or (
                        expected_event.location is not None
                        and activity.location != expected_event.location
                    )
                ):
                    raise ItineraryValidationError("A structured fixed event was changed.")
                found_fixed_event_ids.add(activity.id)

    if found_fixed_event_ids != set(expected_fixed_events):
        raise ItineraryValidationError("Every structured fixed event must appear exactly once.")

    if itinerary.status == "mock":
        if itinerary.provider != "fake" or "mock" not in itinerary.data_status_label.lower():
            raise ItineraryValidationError("Fake itinerary must be clearly labelled as mock data.")
    elif itinerary.status == "generated":
        if itinerary.provider != "openai" or "ai-generated draft" not in (
            itinerary.data_status_label.lower()
        ):
            raise ItineraryValidationError("OpenAI itinerary must be labelled as an AI draft.")
    else:
        raise ItineraryValidationError("Unsupported itinerary status.")


def _validate_activity(activity: ItineraryActivity) -> None:
    if _minutes(activity.end_time) <= _minutes(activity.start_time):
        raise ItineraryValidationError("Activity end time must be after start time.")

    if activity.cost and not activity.cost.currency:
        raise ItineraryValidationError("Money values require currency codes.")

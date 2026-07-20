from datetime import date

from app.modules.itineraries.schemas import GeneratedItinerary, ItineraryActivity


class ItineraryValidationError(ValueError):
    """Raised when generated itinerary output is unsafe to return."""


def _minutes(value: str) -> int:
    hour, minute = value.split(":")
    return (int(hour) * 60) + int(minute)


def validate_generated_itinerary(
    itinerary: GeneratedItinerary, *, start_date: date, return_date: date
) -> None:
    trip_days = (return_date - start_date).days

    if len(itinerary.days) != trip_days:
        raise ItineraryValidationError("Itinerary day count does not match the trip dates.")

    expected_day_numbers = list(range(1, trip_days + 1))
    actual_day_numbers = [day.day_number for day in itinerary.days]

    if actual_day_numbers != expected_day_numbers:
        raise ItineraryValidationError("Itinerary day numbers must be ordered and unique.")

    seen_item_ids: set[str] = set()
    fixed_teamlab_found = False

    for day in itinerary.days:
        day_date = date.fromisoformat(day.date)
        if day_date < start_date or day_date >= return_date:
            raise ItineraryValidationError("Itinerary day falls outside trip range.")

        activity_windows: list[tuple[int, int]] = []

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

            for existing_start, existing_end in activity_windows:
                if start_minutes < existing_end and end_minutes > existing_start:
                    raise ItineraryValidationError("Itinerary activities cannot overlap.")

            activity_windows.append((start_minutes, end_minutes))

            if activity.id == "d2-teamlab" and activity.is_fixed:
                fixed_teamlab_found = True

    if trip_days >= 2 and not fixed_teamlab_found:
        raise ItineraryValidationError("Fixed teamLab sample event must remain fixed.")

    if itinerary.status != "mock" or "mock" not in itinerary.data_status_label.lower():
        raise ItineraryValidationError("Itinerary must be clearly labelled as mock data.")


def _validate_activity(activity: ItineraryActivity) -> None:
    if _minutes(activity.end_time) <= _minutes(activity.start_time):
        raise ItineraryValidationError("Activity end time must be after start time.")

    if activity.cost and not activity.cost.currency:
        raise ItineraryValidationError("Money values require currency codes.")

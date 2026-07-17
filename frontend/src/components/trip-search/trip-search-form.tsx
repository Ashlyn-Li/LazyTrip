"use client";

import { FormEvent, useState } from "react";

import { currencies } from "@/lib/constants/currencies";
import { validateTripSearch, type TripSearchErrors } from "@/lib/validation/trip-search";
import type { TripSearchFormValues } from "@/types/trip";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const initialValues: TripSearchFormValues = {
  origin: "London, United Kingdom",
  destination: "",
  departureDate: "",
  returnDate: "",
  adults: "2",
  children: "0",
  budget: "",
  currency: "GBP"
};

export const TripSearchForm = () => {
  const [values, setValues] = useState<TripSearchFormValues>(initialValues);
  const [errors, setErrors] = useState<TripSearchErrors>({});
  const [confirmation, setConfirmation] = useState("");

  const updateValue = (name: keyof TripSearchFormValues, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }));
    setConfirmation("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = validateTripSearch(values);
    setErrors(result.errors);

    if (!result.success) {
      setConfirmation("");
      return;
    }

    console.log("TripSearchData", result.data);
    setConfirmation("Trip details saved — preferences are coming next.");
  };

  return (
    <form
      className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-soft backdrop-blur sm:p-7 lg:p-8"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="origin" label="Travelling from" error={errors.origin}>
          <Input
            id="origin"
            name="origin"
            autoComplete="address-level2"
            value={values.origin}
            onChange={(event) => updateValue("origin", event.target.value)}
            aria-invalid={Boolean(errors.origin)}
            aria-describedby="origin-error"
          />
        </FormField>

        <FormField id="destination" label="Destination" error={errors.destination}>
          <Input
            id="destination"
            name="destination"
            placeholder="Tokyo, Japan"
            autoComplete="off"
            value={values.destination}
            onChange={(event) => updateValue("destination", event.target.value)}
            aria-invalid={Boolean(errors.destination)}
            aria-describedby="destination-error"
          />
        </FormField>

        <FormField id="departureDate" label="Departure date" error={errors.departureDate}>
          <Input
            id="departureDate"
            name="departureDate"
            type="date"
            value={values.departureDate}
            onChange={(event) => updateValue("departureDate", event.target.value)}
            aria-invalid={Boolean(errors.departureDate)}
            aria-describedby="departureDate-error"
          />
        </FormField>

        <FormField id="returnDate" label="Return date" error={errors.returnDate}>
          <Input
            id="returnDate"
            name="returnDate"
            type="date"
            value={values.returnDate}
            onChange={(event) => updateValue("returnDate", event.target.value)}
            aria-invalid={Boolean(errors.returnDate)}
            aria-describedby="returnDate-error"
          />
        </FormField>

        <FormField id="adults" label="Adults" error={errors.adults}>
          <Input
            id="adults"
            name="adults"
            type="number"
            min="1"
            inputMode="numeric"
            value={values.adults}
            onChange={(event) => updateValue("adults", event.target.value)}
            aria-invalid={Boolean(errors.adults)}
            aria-describedby="adults-error"
          />
        </FormField>

        <FormField id="children" label="Children" error={errors.children}>
          <Input
            id="children"
            name="children"
            type="number"
            min="0"
            inputMode="numeric"
            value={values.children}
            onChange={(event) => updateValue("children", event.target.value)}
            aria-invalid={Boolean(errors.children)}
            aria-describedby="children-error"
          />
        </FormField>

        <FormField id="budget" label="Approximate total budget" error={errors.budget}>
          <Input
            id="budget"
            name="budget"
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            placeholder="2500"
            value={values.budget}
            onChange={(event) => updateValue("budget", event.target.value)}
            aria-invalid={Boolean(errors.budget)}
            aria-describedby="budget-error"
          />
        </FormField>

        <FormField id="currency" label="Currency" error={errors.currency}>
          <Select
            id="currency"
            name="currency"
            value={values.currency}
            onChange={(event) => updateValue("currency", event.target.value)}
            aria-invalid={Boolean(errors.currency)}
            aria-describedby="currency-error"
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="mt-3 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm leading-6 text-slate-600">
          LazyTrip will not make bookings at this stage. You stay in control before anything is
          reserved.
        </p>
        <Button type="submit">Start planning</Button>
      </div>

      {confirmation ? (
        <p className="mt-5 rounded-2xl bg-coast-50 px-4 py-3 text-sm font-semibold text-coast-700">
          {confirmation}
        </p>
      ) : null}
    </form>
  );
};

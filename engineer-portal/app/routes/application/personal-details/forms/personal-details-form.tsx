import {useState} from "react";
import {Controller, useFormContext} from "react-hook-form";
import {CheckIcon, ChevronsUpDown} from "lucide-react";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "~/components/ui/field";
import {Input} from "~/components/ui/input";
import {NativeSelect, NativeSelectOption} from "~/components/ui/native-select";
import {BirthDatePicker} from "~/components/custom/birth-date-picker";
import {PhoneInput} from "~/components/custom/phone-input";
import type {PersonalDetailsFormType} from "./manage-personal-details-form";
import {useGetAllCountries} from "~/routes/application/personal-details/repository/useGetCountries";
import {Spinner} from "~/components/ui/spinner";
import {ImagePicker} from "~/components/custom/file-pickers/image-picker";
import PillRadioGroup from "~/components/custom/pill-radio-groups";
import {Button} from "~/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "~/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "~/components/ui/command";
import {ScrollArea} from "~/components/ui/scroll-area";
import {cn} from "~/lib/utils";
import type {TCountries} from "~/routes/application/personal-details/requests/get-countries";

const PersonalDetailsForm = () => {
    const {
        register,
        control,
        formState: {errors},
    } = useFormContext<PersonalDetailsFormType>();

    const {isLoading, isError, countries} = useGetAllCountries();


    const genderOptions = [
        {label: "Male", value: "MALE"},
        {label: "Female", value: "FEMALE"},
    ];

    return (
        <FieldGroup className={"grid grid-cols-1 md:grid-cols-2 gap-8"}>
            {/* Section: Profile Photo */}
            <div className="md:col-span-2 flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black uppercase tracking-[1.2px] text-[var(--iet-muted)]">Profile Photo</span>
                <div className="flex-1 h-px bg-[var(--iet-border)]" />
            </div>
            <Field className="md:col-span-2">
                <FieldLabel htmlFor="title">Upload a recent passport-size photo for official use.</FieldLabel>
                <Controller
                    name="profilePhotoUrl"
                    control={control}
                    render={({field}) => (
                        <ImagePicker
                            className="size-24"
                            placeholder="Upload Photo"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                        />
                    )}
                />
                {errors.profilePhotoUrl && (
                    <FieldError>{errors.profilePhotoUrl.message}</FieldError>
                )}
            </Field>
            {/* Section: Identity */}
            <div className="md:col-span-2 flex items-center gap-3 mt-2">
                <span className="text-[10px] font-black uppercase tracking-[1.2px] text-[var(--iet-muted)]">Identity</span>
                <div className="flex-1 h-px bg-[var(--iet-border)]" />
            </div>
            <Field>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <NativeSelect {...register("title")}>
                    <NativeSelectOption value="">Select title</NativeSelectOption>
                    <NativeSelectOption value="Eng.">Eng</NativeSelectOption>
                    <NativeSelectOption value="Prof.">Prof</NativeSelectOption>
                    <NativeSelectOption value="Dr.">Dr</NativeSelectOption>
                    <NativeSelectOption value="Mr.">Mr</NativeSelectOption>
                    <NativeSelectOption value="Mrs.">Mrs</NativeSelectOption>
                    <NativeSelectOption value="Ms.">Ms</NativeSelectOption>
                </NativeSelect>
                {errors.title && <FieldError>{errors.title.message}</FieldError>}
            </Field>

            <Field>
                <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                <Input id="firstName" placeholder="Enter your first name" {...register("firstName")} />
                {errors.firstName && <FieldError>{errors.firstName.message}</FieldError>}
            </Field>

            <Field>
                <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
                <Input id="middleName" placeholder="Enter your middle name" {...register("middleName")} />
                {errors.middleName && <FieldError>{errors.middleName.message}</FieldError>}
            </Field>

            <Field>
                <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                <Input id="lastName" placeholder="Enter your last name" {...register("lastName")} />
                {errors.lastName && <FieldError>{errors.lastName.message}</FieldError>}
            </Field>
            <Field>
                <FieldLabel>Gender</FieldLabel>
                <Controller
                    control={control}
                    name="gender"
                    render={({field}) => (
                        <PillRadioGroup
                            options={genderOptions}
                            value={String(field.value ?? "")}
                            onValueChange={(val) => field.onChange(val)}
                            idPrefix="gender"
                        />
                    )}
                />
                {errors.gender && <FieldError>{errors.gender.message}</FieldError>}
            </Field>
            <Field/>
            {/* Section: Contact Details */}
            <div className="md:col-span-2 flex items-center gap-3 mt-2">
                <span className="text-[10px] font-black uppercase tracking-[1.2px] text-[var(--iet-muted)]">Contact Details</span>
                <div className="flex-1 h-px bg-[var(--iet-border)]" />
            </div>
            <Field>
                <FieldLabel htmlFor="email">E-Mail</FieldLabel>
                <Input id="email" type="email" placeholder="Enter your email address" {...register("email")} />
                {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </Field>

            <Field>
                <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
                <Controller
                    name="phoneNumber"
                    control={control}
                    render={({field}) => (
                        <PhoneInput
                            {...field}
                            defaultCountry="TZ"
                        />
                    )}
                />
                {errors.phoneNumber && <FieldError>{errors.phoneNumber.message}</FieldError>}
            </Field>

            <Field>
                <FieldLabel htmlFor="nationality">Nationality</FieldLabel>
                <Controller
                    name="nationality"
                    control={control}
                    render={({field}) => (
                        <NationalityCombobox
                            value={field.value}
                            onChange={field.onChange}
                            countries={countries ?? []}
                            isLoading={isLoading}
                            isError={isError}
                        />
                    )}
                />
                {errors.nationality && <FieldError>{errors.nationality.message}</FieldError>}
            </Field>

            <Field>
                <FieldLabel htmlFor="dateOfBirth">Date of Birth</FieldLabel>
                <Controller
                    name="dateOfBirth"
                    control={control}
                    render={({field}) => (
                        <BirthDatePicker
                            value={field.value ? new Date(field.value) : undefined}
                            onChange={(date) => field.onChange(date?.toISOString())}
                        />
                    )}
                />
                {errors.dateOfBirth && <FieldError>{errors.dateOfBirth.message}</FieldError>}
            </Field>

            {/* Section: Professional Background */}
            <div className="md:col-span-2 flex items-center gap-3 mt-2">
                <span className="text-[10px] font-black uppercase tracking-[1.2px] text-[var(--iet-muted)]">Professional Background</span>
                <div className="flex-1 h-px bg-[var(--iet-border)]" />
            </div>
            <Field>
                <FieldLabel htmlFor="employer">Employer/Organization</FieldLabel>
                <Input id="employer" placeholder="Enter your employer" {...register("employer")} />
                {errors.employer && <FieldError>{errors.employer.message}</FieldError>}
            </Field>

            <Field>
                <FieldLabel htmlFor="position">Position/Designation</FieldLabel>
                <Input id="position" placeholder="Enter your position" {...register("position")} />
                {errors.position && <FieldError>{errors.position.message}</FieldError>}
            </Field>

        </FieldGroup>
    )
        ;
};

type NationalityComboboxProps = {
    value?: string;
    onChange: (value: string) => void;
    countries: TCountries[];
    isLoading: boolean;
    isError: boolean;
};

function NationalityCombobox({
                                value,
                                onChange,
                                countries,
                                isLoading,
                                isError,
                            }: NationalityComboboxProps) {
    const [open, setOpen] = useState(false);
    const selectedCountry = countries.find((country) => country.name === value);
    const isDisabled = isLoading || isError || countries.length === 0;

    const label = isLoading
        ? "Loading countries..."
        : isError
            ? "Unable to load countries"
            : countries.length === 0
                ? "No countries available"
                : selectedCountry?.name || "Search and select nationality";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={isDisabled}
                    className="h-11 w-full justify-between rounded-lg px-3 shadow-none"
                >
                    <span className={cn("truncate", !selectedCountry && "text-[var(--iet-muted)]")}>{label}</span>
                    {isLoading ? (
                        <Spinner/>
                    ) : (
                        <ChevronsUpDown className="size-4 shrink-0 opacity-50"/>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search nationality..."/>
                    <CommandList>
                        <ScrollArea className="h-72">
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                                {countries.map((country) => (
                                    <CommandItem
                                        key={country.iso2}
                                        value={country.name}
                                        onSelect={() => {
                                            onChange(country.name);
                                            setOpen(false);
                                        }}
                                    >
                                        <span className="flex-1 truncate">{country.name}</span>
                                        <span className="text-xs text-[var(--iet-muted)]">{country.iso2}</span>
                                        <CheckIcon
                                            className={cn(
                                                "ml-1 size-4",
                                                country.name === value ? "opacity-100" : "opacity-0",
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default PersonalDetailsForm;

import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const PillRadioGroup = ({
    options,
    value,
    onValueChange,
    idPrefix,
}: {
    options: { label: string; value: string }[];
    value: string;
    onValueChange: (val: string) => void;
    idPrefix: string;
}) => (
    <RadioGroup value={value} onValueChange={onValueChange} className="flex gap-2 mt-1">
        {options.map((opt) => (
            <Label
                key={opt.value}
                htmlFor={`${idPrefix}-${opt.value}`}
                className={`flex items-center gap-2 px-4 py-1 min-w-28 rounded-lg  cursor-pointer transition-colors text-sm font-medium
                    ${value === opt.value
                        ? "bg-[#E20C0A1A]"
                        : "border-[#3909091A]  bg-[#3909091A] hover:border-[#3909091A]"
                    }`}
            >
                <RadioGroupItem
                    value={opt.value}
                    id={`${idPrefix}-${opt.value}`}
                    className="bg-white data-[state=checked]:bg-transparent  data-[state=checked]:border-[#E20C0A] data-[state=checked]:text-[#E20C0A]!"
                />
                {opt.label}
            </Label>
        ))}
    </RadioGroup>
);


export default PillRadioGroup;
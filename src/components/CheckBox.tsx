import { useState } from "react";

interface CheckBoxProps {
  label?: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CheckBox({
  label = "",
  checked,
  onChange,
}: CheckBoxProps) {
  return (
    <section className={`flex gap-2`}>
      <label htmlFor="toggleGrid">{label}</label>
      <input
        type="checkbox"
        id="toggleGrid"
        checked={checked}
        onChange={onChange}
      />
    </section>
  );
}

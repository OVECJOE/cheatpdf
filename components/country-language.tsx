"use client";

import { countriesData, languagesData } from "@/lib/constants/countries-languages";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useMemo } from "react";

interface CountryLanguageFormProps {
  onSelectionChange: (field: string, value: string) => void;
  selectedCountry?: string;
  selectedLanguage?: string;
}

export default function CountryLanguageForm({
  onSelectionChange,
  selectedCountry = "",
  selectedLanguage = "",
}: CountryLanguageFormProps) {
  const availableLanguages = useMemo(() => {
    if (!selectedCountry) return [];

    const c = countriesData.find((c) => c.code === selectedCountry);
    return (
      c?.languages.map((langCode) => ({
        code: langCode,
        name: languagesData[langCode] || langCode,
      })) || []
    );
  }, [selectedCountry]);

  const handleCountryChange = (countryCode: string) => {
    onSelectionChange("country", countryCode);
    onSelectionChange("language", ""); // Reset language when country changes
  };

  const handleLanguageChange = (languageCode: string) => {
    onSelectionChange("language", languageCode);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select
          value={selectedCountry}
          onValueChange={handleCountryChange}
          autoComplete="on"
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countriesData.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select
          onValueChange={handleLanguageChange}
          autoComplete="on"
          value={selectedLanguage}
        >
          <SelectTrigger
            className="w-full"
            disabled={!availableLanguages.length}
          >
            <SelectValue
              placeholder="Select language"
            />
          </SelectTrigger>
          <SelectContent>
            {availableLanguages.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                {language.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

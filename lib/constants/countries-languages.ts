// lib/countries-languages.js
import { countries } from "countries-list";
import iso_639_1 from "iso-639-1";

// Pre-process data at build time
export const countriesData = Object.entries(countries).map((
    [code, country],
) => ({
    code,
    name: country.name,
    languages: country.languages || [],
})).sort((a, b) => a.name.localeCompare(b.name));

export const languagesData = iso_639_1.getLanguages(iso_639_1.getAllCodes())
    .reduce((acc, lang) => {
        acc[lang.code] = lang.name;
        return acc;
    }, {} as Record<string, string>);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// True when the text has the shape of a UUID, such as
// "3f2b8c1e-9d4a-4b7e-8a21-5c6d7e8f9a0b". It checks the format only, not whether a
// record with that id exists.
export const isUuid = (value: string) => UUID_RE.test(value);
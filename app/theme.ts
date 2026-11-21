import { Button, TextInput, createTheme } from "@mantine/core";


// Customize Mantine here: colors, fonts, radius, component defaults, etc.
export const theme = createTheme({
  fontFamily: "var(--font-geist-sans), sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), monospace",
  headings: { fontFamily: "var(--font-geist-sans), sans-serif", fontWeight: "600" },
  primaryColor: "indigo", // any built-in name, or your own palette
  defaultRadius: "md",
});

// export const theme = createTheme({
//   fontFamily: "var(--font-geist-sans), sans-serif",
//   fontFamilyMonospace: "var(--font-geist-mono), monospace",
//   primaryColor: "blue",
//   defaultRadius: "md",
//   components: {
//     Button: Button.extend({
//       defaultProps: { unstyled: true },
//       classNames: {
//         root: "inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700",
//       },
//     }),
//     TextInput: TextInput.extend({
//       defaultProps: { unstyled: true },
//       classNames: {
//         input: "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none",
//         label: "mb-1 block text-sm font-medium",
//       },
//     }),
//   },
// });
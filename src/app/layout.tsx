import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Точка — начало вашей идеи",
  description: "Студия сайтов: от первой идеи к понятной странице. Расскажите о вашей задаче.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

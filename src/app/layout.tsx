import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "../../components/NavBar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Hello Cube",
  description: "This app helps you to solve a cube",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="">
        <NavBar/>
        {children}
        <Footer/>
        </body>
    </html>
  );
}

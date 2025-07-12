"use client"
import { Navbar, NavbarBrand } from "@heroui/navbar";
import Image from "next/image";
import Link from "next/link";

export function NavBar() {
  return (
    <Navbar position="static" className="bg-gray-900 border-b border-gray-700 p-2">
      <NavbarBrand className="w-full flex justify-center items-center">
        <div className="flex items-center">
          <Image
            src="/RubiksCube_product_cubes.png"
            alt="Rubik's Cube product cubes"
            width={60}
            height={60}
            className="rounded-2xl shadow-md mx-0.5 animate-spin-slow"
          />
          <p
            className="text-4xl font-semibold text-white ml-2 animate-fade-in"
            style={{ fontSize: "2.20rem", lineHeight: "0.1rem" }}
          >
            <Link href = "/">
            HelloCube
            </Link>
          </p>
        </div>
      </NavbarBrand>
    </Navbar>
  );
}

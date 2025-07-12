"use client";

import Link from "next/link";
import { Typewriter } from "react-simple-typewriter";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[86vh] bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white px-4 text-center">
      {/* Animated Heading */}
      <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
        <Typewriter
          words={[
            "Rubik's Cube Solver",
            "Graph Algorithms in Action",
            "Solve with 3D Intuition",
          ]}
          loop={true}
          cursor
          cursorStyle="|"
          typeSpeed={70}
          deleteSpeed={40}
          delaySpeed={1800}
        />
      </h1>

      {/* Description */}
      <p className="text-lg md:text-xl text-gray-300 max-w-xl mb-10">
        Capture your Rubik's Cube in 3D using a Three.js model, and solve it instantly using advanced graph-based algorithms — no camera, no computer vision.
      </p>

      {/* Start Solving Button */}
      <Link href="/capture-state">
        <button className="bg-blue-700 hover:bg-blue-800 transition-all duration-300 text-white text-lg px-8 py-4 rounded-xl font-semibold shadow-lg hover:scale-105">
          Start Solving
        </button>
      </Link>

      {/* Footer */}
      <p className="mt-16 text-sm text-gray-500">
        Built with ❤️ using Three.js and Graph Theory
      </p>
    </main>
  );
}

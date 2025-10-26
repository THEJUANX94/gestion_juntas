import React from "react";
import { motion } from "framer-motion";


export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden bg-gradient-to-b from-white via-[#f4f7f5] to-[#e5efe8]">
      <div
        className="absolute top-0 left-0 w-full h-3"
        style={{
          backgroundImage:
            "linear-gradient(to right, #166534 0%, #ffffff 25%, #b91c1c 50%, #ffffff 75%, #166534 100%)",
        }}
      ></div>

      <img
        src="/logo.png"
        alt="Logo Gobernación de Boyacá"
        className="absolute inset-0 w-full h-full object-contain opacity-10 z-0"
      />

      <motion.div
        className="relative z-10 max-w-5xl px-8"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-6xl md:text-8xl font-extrabold text-gray-800 tracking-wide drop-shadow-sm mb-8 leading-tight">
          Gestión de Juntas de Acción Comunal
        </h1>

        <p className="text-2xl md:text-4xl text-gray-700 leading-relaxed mb-6 font-medium">
          Plataforma institucional para la administración, registro y seguimiento
          de las Juntas de Acción Comunal del departamento de Boyacá.
        </p>

        <p className="text-xl md:text-3xl italic text-gray-600 font-light">
          “Fortaleciendo la participación ciudadana desde el territorio.”
        </p>
      </motion.div>

      <div
        className="absolute bottom-0 left-0 w-full h-3"
        style={{
          backgroundImage:
            "linear-gradient(to right, #166534 0%, #ffffff 25%, #b91c1c 50%, #ffffff 75%, #166534 100%)",
        }}
      ></div>

      <div className="absolute bottom-0 left-0 w-full">

      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Empleado from "@/models/Empleado";

export async function GET() {
    try {
        await connectMongoDB();
        const empleados = await Empleado.find({});
        return NextResponse.json(empleados); // ✅ Aseguramos que devolvemos un array

    } catch (error) {
        console.error("❌ Error en la API de empleados:", error);
        return NextResponse.json({ error: "Error al obtener empleados" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await connectMongoDB();

    try {
        const { empresaId, nombre, documento } = await req.json();

        if (!empresaId || !nombre || !documento) {
            return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
        }

        const nuevoEmpleado = new Empleado({ empresaId, nombre, documento });
        await nuevoEmpleado.save();

        return NextResponse.json({ message: "Empleado agregado con éxito", empleado: nuevoEmpleado }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: "Error al agregar empleado" }, { status: 500 });
    }
}

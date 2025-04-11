import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Empleado from "@/models/Empleado";

export async function GET(req: Request) {
    try {
        await connectMongoDB();

        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get("empresaId");

        const filtro = empresaId ? { empresaId } : {};

        const empleados = await Empleado.find(filtro);

        return NextResponse.json(empleados);
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

import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Chofer from "@/models/Chofer";

export async function GET(req: Request) {
    try {
        await connectMongoDB();
        // Se usa populate para traer solo el campo 'nombre' de la empresa
        const choferes = await Chofer.find({}).populate("empresaId", "nombre");
        return NextResponse.json(choferes); // Devolvemos el array de choferes
    } catch (error) {
        console.error("❌ Error en la API de choferes:", error);
        return NextResponse.json({ error: "Error al obtener choferes" }, { status: 500 });
    }
}

// 📌 Agregar un nuevo chofer
export async function POST(req: Request) {
    await connectMongoDB();

    try {
        const { empresaId, nombre, documento } = await req.json();

        if (!empresaId || !nombre || !documento) {
            return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
        }

        const nuevoChofer = new Chofer({ empresaId, nombre, documento });
        await nuevoChofer.save();

        return NextResponse.json({ message: "Chofer agregado con éxito", chofer: nuevoChofer }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: "Error al agregar chofer" }, { status: 500 });
    }
}

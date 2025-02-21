import { NextResponse } from "next/server";
import Playero from "@/models/Playero";
import { connectMongoDB } from "@/lib/mongodb";

export async function GET(req: Request) {
    try {
        await connectMongoDB();
        const playeros = await Playero.find({}).lean();
        return NextResponse.json(playeros);
    } catch (error) {
        console.error("❌ Error obteniendo playeros:", error);
        return NextResponse.json({ error: "Error obteniendo playeros" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectMongoDB();
        const body = await req.json();
        const { nombre, documento } = body;

        if (!nombre || !documento) {
            return NextResponse.json(
                { error: "Se requiere nombre y documento" },
                { status: 400 }
            );
        }

        // Convertir el nombre a mayúsculas
        const nombreMayusculas = nombre.toUpperCase();

        // Crear y guardar el nuevo playero
        const nuevoPlayero = new Playero({ nombre: nombreMayusculas, documento });
        await nuevoPlayero.save();

        return NextResponse.json(nuevoPlayero);
    } catch (error) {
        console.error("❌ Error al crear playero:", error);
        return NextResponse.json(
            { error: "Error al crear el playero" },
            { status: 500 }
        );
    }
}

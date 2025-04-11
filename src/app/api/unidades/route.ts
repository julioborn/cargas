import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Unidad from "@/models/Unidad";

export async function GET(req: Request) {
    try {
        await connectMongoDB();

        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get("empresaId");

        const filtro = empresaId ? { empresaId } : {};

        const unidades = await Unidad.find(filtro);

        return NextResponse.json(unidades, { status: 200 });
    } catch (error) {
        console.error("❌ Error obteniendo unidades:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectMongoDB();
        const { empresaId, matricula, tipo } = await req.json();

        // Verificar si la matrícula ya existe
        const unidadExistente = await Unidad.findOne({ matricula });
        if (unidadExistente) {
            return NextResponse.json({ error: "Ya existe una unidad con esta matrícula" }, { status: 400 });
        }

        // Crear la nueva unidad asegurando que `choferAnexado` sea `null`
        const nuevaUnidad = new Unidad({ empresaId, matricula, tipo, choferAnexado: null });
        await nuevaUnidad.save();

        return NextResponse.json({ message: "Unidad registrada correctamente", unidad: nuevaUnidad }, { status: 201 });
    } catch (error) {
        console.error("❌ Error creando unidad:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectMongoDB();
        const url = new URL(req.url);
        const unidadId = url.pathname.split("/").pop(); // Obtener el ID desde la URL

        if (!unidadId) {
            return NextResponse.json({ error: "ID de unidad no proporcionado" }, { status: 400 });
        }

        const unidadEliminada = await Unidad.findByIdAndDelete(unidadId);

        if (!unidadEliminada) {
            return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ message: "Unidad eliminada correctamente", unidad: unidadEliminada }, { status: 200 });
    } catch (error) {
        console.error("❌ Error eliminando unidad:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}


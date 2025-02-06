import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Unidad from "@/models/Unidad";

export async function GET(req: Request) {
    try {
        await connectMongoDB();
        const unidades = await Unidad.find();
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

        const nuevaUnidad = new Unidad({ empresaId, matricula, tipo });
        await nuevaUnidad.save();

        return NextResponse.json({ message: "Unidad registrada correctamente", unidad: nuevaUnidad }, { status: 201 });
    } catch (error) {
        console.error("❌ Error creando unidad:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}



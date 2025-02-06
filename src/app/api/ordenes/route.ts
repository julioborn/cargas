import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Orden from "@/models/Orden";

export async function GET() {
    try {
        await connectMongoDB();
        const ordenes = await Orden.find().populate("empresaId", "nombre email"); // Traer también datos de la empresa
        return NextResponse.json({ ordenes }, { status: 200 });
    } catch (error) {
        console.error("❌ Error obteniendo órdenes:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectMongoDB();
        const { empresaId, unidadId, litros, precioPorLitro } = await req.json();
        const nuevaOrden = new Orden({ empresaId, unidadId, litros, precioPorLitro, estado: "pendiente" });
        await nuevaOrden.save();
        return NextResponse.json(nuevaOrden);
    } catch (error) {
        return NextResponse.json({ error: "Error creando orden" }, { status: 500 });
    }
}

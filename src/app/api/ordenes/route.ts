import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Orden from "@/models/Orden";
import { connectMongoDB } from "@/lib/mongodb";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get("empresaId");

        if (!empresaId) {
            return NextResponse.json({ error: "Falta el ID de la empresa" }, { status: 400 });
        }

        await connectMongoDB(); // Asegurarse de que la BD está conectada antes de consultar

        const ordenes = await Orden.find({ empresaId: new mongoose.Types.ObjectId(empresaId) })
            .populate("unidadId choferId");

        return NextResponse.json(ordenes);
    } catch (error) {
        console.error("❌ Error obteniendo órdenes:", error);
        return NextResponse.json({ error: "Error obteniendo órdenes" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("📥 Datos recibidos en la API:", body); // 🔥 Verifica si `empresaId` llega

        if (!body.empresaId) {
            return NextResponse.json({ error: "empresaId es requerido" }, { status: 400 });
        }

        const nuevaOrden = new Orden({
            empresaId: new mongoose.Types.ObjectId(body.empresaId), // ✅ Convertir a ObjectId
            unidadId: new mongoose.Types.ObjectId(body.unidadId),
            choferId: new mongoose.Types.ObjectId(body.choferId),
            producto: body.producto,
            litros: body.litros,
            monto: body.monto,
            fechaCarga: body.fechaCarga,
            estado: "PENDIENTE_AUTORIZACION",
        });

        await nuevaOrden.save();
        console.log("✅ Orden guardada en BD:", nuevaOrden); // 🔥 Verificar si empresaId se guardó

        return NextResponse.json(nuevaOrden);
    } catch (error) {
        console.error("❌ Error al crear orden:", error);
        return NextResponse.json({ error: "Error al crear la orden" }, { status: 500 });
    }
}


import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Orden from "@/models/Orden";
import Unidad from "@/models/Unidad";  // 👈 IMPORTA EL MODELO
import Chofer from "@/models/Chofer";  // 👈 IMPORTA EL MODELO
import { connectMongoDB } from "@/lib/mongodb";

export async function GET(req: Request) {
    try {
        await connectMongoDB(); // ✅ Asegurar conexión a BD

        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get("empresaId");

        console.log("📡 Recibiendo empresaId en API:", empresaId);

        if (!empresaId) {
            return NextResponse.json({ error: "Falta el ID de la empresa" }, { status: 400 });
        }

        // ✅ Verificar si empresaId es un ObjectId válido
        const query = mongoose.isValidObjectId(empresaId)
            ? { empresaId: new mongoose.Types.ObjectId(empresaId) }
            : { empresaId };

        console.log("🔍 Query de búsqueda en MongoDB:", query);

        // ✅ Asegurar que "unidadId" y "choferId" sean reconocidos
        const ordenes = await Orden.find(query)
            .populate({ path: "unidadId", model: Unidad }) // 👈 Registrar modelo antes de usarlo
            .populate({ path: "choferId", model: Chofer });

        console.log("✅ Órdenes encontradas:", ordenes.length);
        return NextResponse.json(ordenes);
    } catch (error: any) {
        console.error("❌ Error obteniendo órdenes:", error.message, error.stack);
        return NextResponse.json({ error: "Error obteniendo órdenes", details: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("📥 Datos recibidos en API:", body);

        if (!body.empresaId) {
            return NextResponse.json({ error: "empresaId es requerido" }, { status: 400 });
        }

        // Si empresaId ya se almacena como string, no lo conviertas a ObjectId
        const nuevaOrden = new Orden({
            empresaId: mongoose.isValidObjectId(body.empresaId)
                ? new mongoose.Types.ObjectId(body.empresaId)
                : body.empresaId,  // Si es string, usarlo directamente
            unidadId: mongoose.isValidObjectId(body.unidadId)
                ? new mongoose.Types.ObjectId(body.unidadId)
                : body.unidadId,
            choferId: mongoose.isValidObjectId(body.choferId)
                ? new mongoose.Types.ObjectId(body.choferId)
                : body.choferId,
            producto: body.producto,
            litros: body.litros,
            monto: body.monto,
            fechaCarga: body.fechaCarga,
            estado: "PENDIENTE_AUTORIZACION",
        });

        await nuevaOrden.save();
        console.log("✅ Orden guardada en BD:", nuevaOrden);

        return NextResponse.json(nuevaOrden);
    } catch (error) {
        console.error("❌ Error al crear orden:", error);
        return NextResponse.json({ error: "Error al crear la orden" }, { status: 500 });
    }
}

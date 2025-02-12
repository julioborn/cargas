import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Orden from "@/models/Orden";
import Unidad from "@/models/Unidad";  // 👈 IMPORTA EL MODELO
import Chofer from "@/models/Chofer";  // 👈 IMPORTA EL MODELO
import { connectMongoDB } from "@/lib/mongodb";

export async function GET(req: Request) {
    try {
        await connectMongoDB();
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get("empresaId");
        const estado = searchParams.get("estado");
        const fechaDesde = searchParams.get("fechaDesde");
        const fechaHasta = searchParams.get("fechaHasta");

        let query: any = {};

        if (empresaId) query.empresaId = empresaId;
        if (estado) query.estado = estado;
        if (fechaDesde || fechaHasta) {
            query.fechaEmision = {};
            if (fechaDesde) query.fechaEmision.$gte = new Date(fechaDesde);
            if (fechaHasta) query.fechaEmision.$lte = new Date(fechaHasta);
        }

        console.log("🔍 Filtro aplicado:", query);

        const ordenes = await Orden.find(query).populate("empresaId");
        return NextResponse.json(ordenes);
    } catch (error) {
        console.error("❌ Error obteniendo órdenes:", error);
        return NextResponse.json({ error: "Error obteniendo órdenes" }, { status: 500 });
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

export async function PATCH(req: Request) {
    try {
        await connectMongoDB();
        const { id, nuevoEstado } = await req.json();

        console.log(`🔄 Cambiando estado de orden ${id} a ${nuevoEstado}`);

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        // Verifica que el estado sea válido
        const estadosValidos = ["PENDIENTE_AUTORIZACION", "PENDIENTE_CARGA", "CARGADA"];
        if (!estadosValidos.includes(nuevoEstado)) {
            return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
        }

        // Actualiza la orden en la BD
        const ordenActualizada = await Orden.findByIdAndUpdate(
            id,
            { estado: nuevoEstado },
            { new: true }
        );

        if (!ordenActualizada) {
            return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
        }

        console.log("✅ Orden actualizada:", ordenActualizada);
        return NextResponse.json(ordenActualizada);
    } catch (error) {
        console.error("❌ Error actualizando orden:", error);
        return NextResponse.json({ error: "Error actualizando orden" }, { status: 500 });
    }
}

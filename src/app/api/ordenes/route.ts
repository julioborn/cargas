import mongoose from "mongoose";
import { nanoid } from "nanoid";
import Orden from "@/models/Orden";
import Unidad from "@/models/Unidad";
import Chofer from "@/models/Chofer";
import Empresa from "@/models/Empresa"; // Se importa el modelo Empresa
// Forzamos el registro del modelo Empresa
console.log("Empresa model registrado:", Empresa.modelName);

import { connectMongoDB } from "@/lib/mongodb";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        await connectMongoDB();

        // Obtiene el token para identificar al usuario
        const token = await getToken({
            req: req as any, // Cast a NextRequest si es necesario
            secret: process.env.NEXTAUTH_SECRET,
            secureCookie: process.env.NODE_ENV === "production",
        });

        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get("empresaId");
        const estado = searchParams.get("estado");
        const fechaDesde = searchParams.get("fechaDesde");
        const fechaHasta = searchParams.get("fechaHasta");

        let query: any = {};

        if (token?.role === "chofer") {
            query.choferId = token.id;
            query.estado = "AUTORIZADA";
        } else if (token?.role === "playero") {
            query.estado = "AUTORIZADA";
        } else {
            if (empresaId) query.empresaId = empresaId;
            if (estado) query.estado = estado;
            if (fechaDesde || fechaHasta) {
                query.fechaEmision = {};
                if (fechaDesde) query.fechaEmision.$gte = new Date(fechaDesde);
                if (fechaHasta) query.fechaEmision.$lte = new Date(fechaHasta);
            }
        }

        console.log("🔍 Filtro aplicado:", query);

        const ordenes = await Orden.find(query)
            .populate("empresaId")
            .populate("unidadId", "matricula")
            .populate("choferId", "nombre documento")
            .lean();

        return NextResponse.json(ordenes);
    } catch (error) {
        console.error("❌ Error obteniendo órdenes:", error);
        return NextResponse.json({ error: "Error obteniendo órdenes" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectMongoDB();
        const body = await req.json();

        if (!body.empresaId) {
            return NextResponse.json({ error: "empresaId es requerido" }, { status: 400 });
        }

        const idUnico = nanoid(6).replace(/[^A-Z0-9]/g, "");

        let unidadAsignada = null;
        if (!body.unidadId) {
            unidadAsignada = await Unidad.findOne({ empresaId: body.empresaId });
        }
        let choferAsignado = null;
        if (!body.choferId) {
            choferAsignado = await Chofer.findOne({ empresaId: body.empresaId });
        }

        const nuevaOrden = new Orden({
            idUnico,
            empresaId: mongoose.isValidObjectId(body.empresaId)
                ? new mongoose.Types.ObjectId(body.empresaId)
                : body.empresaId,
            unidadId: body.unidadId || unidadAsignada?._id,
            choferId: body.choferId || choferAsignado?._id,
            producto: body.producto,
            litros: body.litros,
            monto: body.monto,
            fechaCarga: body.fechaCarga,
            estado: "PENDIENTE",
        });

        await nuevaOrden.save();
        console.log("✅ Orden guardada con ID:", idUnico);

        return NextResponse.json(nuevaOrden);
    } catch (error) {
        console.error("❌ Error al crear orden:", error);
        return NextResponse.json({ error: "Error al crear la orden" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        await connectMongoDB();
        const { id, nuevoEstado, documento, litros } = await req.json();

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        if (nuevoEstado === "CARGADA" && documento && litros) {
            const orden = await Orden.findById(id);
            if (!orden) {
                return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
            }
            if (orden.estado !== "AUTORIZADA") {
                return NextResponse.json(
                    { error: "Solo se puede actualizar una orden autorizada" },
                    { status: 400 }
                );
            }
            const Playero = (await import("@/models/Playero")).default;
            const playero = await Playero.findOne({ documento: documento.trim() });
            if (!playero) {
                return NextResponse.json({ error: "Playero no encontrado" }, { status: 404 });
            }
            // Actualizamos la orden: asignamos litros y anulamos importe y tanqueLleno
            orden.estado = "CARGADA";
            orden.litros = litros;
            orden.importe = undefined;
            orden.tanqueLleno = false;
            orden.playeroId = playero._id;
            await orden.save();
            const ordenActualizada = await Orden.findById(id)
                .populate("unidadId", "matricula")
                .populate("choferId", "nombre documento")
                .populate("playeroId", "nombre documento")
                .lean();
            return NextResponse.json(ordenActualizada);
        } else {
            const estadosValidos = ["PENDIENTE", "AUTORIZADA", "CARGADA"];
            if (!estadosValidos.includes(nuevoEstado)) {
                return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
            }
            const ordenActualizada = await Orden.findByIdAndUpdate(
                id,
                { estado: nuevoEstado },
                { new: true }
            )
                .populate("unidadId", "matricula")
                .populate("choferId", "nombre documento")
                .lean();
            if (!ordenActualizada) {
                return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
            }
            return NextResponse.json(ordenActualizada);
        }
    } catch (error) {
        console.error("❌ Error actualizando orden:", error);
        return NextResponse.json({ error: "Error actualizando orden" }, { status: 500 });
    }
}

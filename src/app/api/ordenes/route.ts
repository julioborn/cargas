import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import Orden from "@/models/Orden";
import { connectMongoDB } from "@/lib/mongodb";
import { getToken } from "next-auth/jwt";

export async function GET(req: Request) {
    try {
        await connectMongoDB();

        // Castea el objeto `req` a NextRequest para que getToken lo acepte
        const token = await getToken({
            req: req as NextRequest,
            secret: process.env.NEXTAUTH_SECRET,
            secureCookie: process.env.NODE_ENV === "production",
        });
        const { searchParams } = new URL(req.url);
        let query: any = {};

        // Si el usuario es chofer, limitar a sus órdenes autorizadas
        if (token?.role === "chofer") {
            query.choferId = token.id;
            query.estado = "AUTORIZADA";
        } else {
            // Para otros roles se permiten filtros adicionales
            const empresaId = searchParams.get("empresaId");
            const estado = searchParams.get("estado");
            const fechaDesde = searchParams.get("fechaDesde");
            const fechaHasta = searchParams.get("fechaHasta");

            if (empresaId) query.empresaId = empresaId;
            if (estado) query.estado = estado;
            if (fechaDesde || fechaHasta) {
                query.fechaEmision = {};
                if (fechaDesde) query.fechaEmision.$gte = new Date(fechaDesde);
                if (fechaHasta) query.fechaEmision.$lte = new Date(fechaHasta);
            }
        }

        console.log("🔍 Query aplicada:", query);

        let ordenes = await Orden.find(query)
            .populate("empresaId")
            .populate("unidadId", "matricula")
            .populate("choferId", "nombre documento")
            .lean();

        // Si el tanque está lleno, eliminamos litros e importe de la respuesta
        ordenes = ordenes.map((orden) => {
            if (orden.tanqueLleno) {
                delete orden.litros;
                delete orden.importe;
            }
            return orden;
        });

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
        console.log("📥 Datos recibidos en API:", body);

        if (!body.empresaId) {
            return NextResponse.json({ error: "empresaId es requerido" }, { status: 400 });
        }

        if (!body.condicionPago) {
            return NextResponse.json({ error: "condicionPago es requerido" }, { status: 400 });
        }

        const idUnico = nanoid(6).replace(/[^A-Z0-9]/g, "");

        const nuevaOrden = new Orden({
            idUnico,
            empresaId: mongoose.isValidObjectId(body.empresaId)
                ? new mongoose.Types.ObjectId(body.empresaId)
                : body.empresaId,
            unidadId: body.unidadId || undefined,
            choferId: body.choferId || undefined,
            producto: body.producto,
            tanqueLleno: body.tanqueLleno || false,
            litros: body.tanqueLleno ? undefined : body.litros,
            importe: body.tanqueLleno ? undefined : body.importe,
            condicionPago: body.condicionPago, // ✅ Agregado
            fechaCarga: body.fechaCarga || undefined,
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
        const { id, nuevoEstado } = await req.json();

        console.log(`🔄 Cambiando estado de orden ${id} a ${nuevoEstado}`);

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        // Verifica que el estado sea válido
        const estadosValidos = ["PENDIENTE", "AUTORIZADA", "CARGADA"];
        if (!estadosValidos.includes(nuevoEstado)) {
            return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
        }

        // Actualiza la orden en la BD
        const ordenActualizada = await Orden.findByIdAndUpdate(
            id,
            { estado: nuevoEstado },
            { new: true }
        ).populate("unidadId", "matricula") // Asegura que se traiga la matrícula
            .populate("choferId", "nombre documento"); // Asegura que se traiga el nombre y DNI

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

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import Orden from "@/models/Orden";
import Unidad from "@/models/Unidad";
import Chofer from "@/models/Chofer";
import { connectMongoDB } from "@/lib/mongodb";
import { messaging } from "@/lib/firebaseAdmin"; // 🔥 Importamos Firebase Admin

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

        // ✅ SE POPULAN unidadId Y choferId PARA QUE NO APAREZCAN COMO "DESCONOCIDA"
        const ordenes = await Orden.find(query)
            .populate("empresaId")
            .populate("unidadId", "matricula") // Solo trae la matrícula
            .populate("choferId", "nombre documento"); // Solo trae nombre y documento

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

        // ✅ GENERACIÓN DE ID ÚNICO ALFANUMÉRICO DE 6 CARACTERES
        const idUnico = nanoid(6).replace(/[^A-Z0-9]/g, "");

        // ✅ ASIGNAR UNIDAD SI NO SE ENVÍA UNA
        let unidadAsignada = null;
        if (!body.unidadId) {
            unidadAsignada = await Unidad.findOne({ empresaId: body.empresaId });
        }

        // ✅ ASIGNAR CHOFER SI NO SE ENVÍA UNO
        let choferAsignado = null;
        if (!body.choferId) {
            choferAsignado = await Chofer.findOne({ empresaId: body.empresaId });
        }

        // ✅ CREAR LA ORDEN ASEGURANDO QUE TENGA UNIDAD Y CHOFER
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

        // 🔥 Enviar notificación al administrador (si el token está disponible)
        const adminToken = process.env.ADMIN_FCM_TOKEN;
        if (adminToken) {
            await messaging.send({
                token: adminToken,
                notification: {
                    title: "🚛 Nueva orden creada",
                    body: `Se ha generado una nueva orden para ${nuevaOrden.producto}.`,
                },
            });
            console.log("✅ Notificación enviada al administrador.");
        }

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
